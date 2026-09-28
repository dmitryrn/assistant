import type { FunctionTool, Response } from 'openai/resources/responses/responses';
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

import { getLocalLlamaContext } from '@/lib/local-llama';
import { contiguousPhrases } from '@/lib/contiguous-phrases';
import type { SetAlarmArguments, SetTimerArguments } from '@/lib/clock';
import { createJevFetch } from '@/lib/jev-fetch';
import { OpenAIClient, type Model } from '@/lib/openai-client';
import { formatTime } from '@/lib/time';
import { ToolsExecutor, type AppToolCall } from '@/lib/tools-executor';

const AUTO_EXECUTE_THRESHOLD = 0.8;
const NO_LABEL = '__no_label__';
const MAX_CHOICE_OPTIONS = 255;

type LocalTool = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: FunctionTool['parameters'];
  };
};

export type JevSuggestion = {
  tool: 'alarm' | 'timer' | 'other';
  hour: number;
  minute: number;
  timerMinutes: number;
  label?: string;
};

export type JevClockAction =
  | { tool: 'alarm'; hour: number; minute: number; label?: string }
  | { tool: 'timer'; minutes: number };

function createOptions(minimum: number, maximum: number): Record<string, null> {
  const options: Record<string, null> = {};

  for (let value = minimum; value <= maximum; value += 1) {
    options[String(value).padStart(2, '0')] = null;
  }

  return options;
}

function createLabelOptions(prompt: string): Record<string, string | null> {
  const candidates = contiguousPhrases(prompt);

  if (candidates.length + 1 > MAX_CHOICE_OPTIONS) {
    throw new Error('The speech request has too many label candidates for Jev.');
  }

  const options: Record<string, string | null> = {};

  for (const phrase of candidates) {
    options[phrase] = 'An exact contiguous phrase from the speech request.';
  }

  options[NO_LABEL] = 'No candidate is a meaningful alarm label.';

  return options;
}

function isHighConfidenceChoice<T extends string>(answer: {
  choice: T;
  confidence: number;
  probabilities: { [choice in T]: number };
}): boolean {
  return answer.confidence > AUTO_EXECUTE_THRESHOLD
    && answer.probabilities[answer.choice] > AUTO_EXECUTE_THRESHOLD;
}

function isNoLabelChoice(choice: string): boolean {
  const normalizedChoice = choice.trim().toLowerCase();

  return normalizedChoice === NO_LABEL
    || normalizedChoice === 'no label'
    || normalizedChoice === 'unknown';
}

function getMostProbableChoice<T extends string>(answer: {
  choice: T;
  probabilities: { [choice in T]: number };
}): T {
  let mostProbableChoice = answer.choice;
  let highestProbability = answer.probabilities[answer.choice];

  for (const [choice, probability] of Object.entries(answer.probabilities) as [T, number][]) {
    if (probability > highestProbability) {
      mostProbableChoice = choice;
      highestProbability = probability;
    }
  }

  return mostProbableChoice;
}

function getAlarmLabel(answer: {
  choice: string;
  confidence: number;
  probabilities: { [choice: string]: number };
}): string | undefined {
  if (isNoLabelChoice(answer.choice)) {
    return undefined;
  }

  let choice = answer.choice;
  if (!isHighConfidenceChoice(answer)) {
    choice = getMostProbableChoice(answer);
  }

  if (isNoLabelChoice(choice)) {
    return undefined;
  }

  return choice;
}

export type AppRequestResult = {
  text: string;
  toolCalls: AppToolCall[];
  jevDebug?: string;
  jevSuggestion?: JevSuggestion;
  executedJevAction?: JevClockAction;
};

export class AppService {
  constructor(
    private openAIClient: OpenAIClient,
    private toolsExecutor: ToolsExecutor,
    private clock: {
      setAlarm(arguments_: SetAlarmArguments): Promise<void>;
      setTimer(arguments_: SetTimerArguments): Promise<void>;
    },
  ) {}

  async requestOpenAI(apiKey: string, model: string, prompt: string): Promise<AppRequestResult> {
    const response = await this.openAIClient.request(apiKey, {
      model,
      prompt,
      systemPrompt: `Current time: ${this.getCurrentTime()}`,
      tools: this.toolsExecutor.tools,
    });
    const toolCalls = this.getOpenAIToolCalls(response);

    await this.toolsExecutor.execute(toolCalls);

    return {
      text: response.output_text,
      toolCalls,
    };
  }

  async requestJev(apiKey: string, prompt: string, onDebug?: (debug: string) => void): Promise<AppRequestResult> {
    const client = new TypeSafeClient({ apiKey, dangerouslyAllowBrowser: true, fetch: createJevFetch() });
    const response = await client.systemOne({
      state: {
        request: prompt,
        currentLocalTime: this.getCurrentTime(),
      },
      questions: {
        tool: choice('What clock action is the user asking for?', {
          alarm: 'Set an alarm for a specific time.',
          timer: 'Start a timer for a duration.',
          other: 'The request does not ask to set an alarm or start a timer.',
        }),
        hour: choice('For an alarm, which hour in local 24-hour time?', createOptions(0, 23)),
        minute: choice('For an alarm, which minute?', createOptions(0, 59)),
        timerMinutes: choice('For a timer, how many minutes?', createOptions(1, 60)),
        alarmLabel: choice(
          'Which candidate is the descriptive label for the alarm? Exclude alarm command words, time expressions, and connector words such as "for". Choose __no_label__ when no meaningful label is present.',
          createLabelOptions(prompt),
        ),
      },
    });
    const jevDebug = JSON.stringify(
      {
        model: response.model,
        answers: response.answers,
        usage: response.usage,
      },
      null,
      2,
    );
    if (onDebug) {
      onDebug(jevDebug);
    }

    const { tool, hour, minute, timerMinutes, alarmLabel } = response.answers;
    const label = getAlarmLabel(alarmLabel);

    const suggestion: JevSuggestion = {
      tool: tool.choice,
      hour: Number(hour.choice),
      minute: Number(minute.choice),
      timerMinutes: Number(timerMinutes.choice),
      label,
    };

    if (tool.choice === 'alarm' && isHighConfidenceChoice(tool)
      && isHighConfidenceChoice(hour) && isHighConfidenceChoice(minute)
      && isHighConfidenceChoice(alarmLabel)) {
      const action: JevClockAction = {
        tool: 'alarm',
        hour: suggestion.hour,
        minute: suggestion.minute,
        label: suggestion.label,
      };
      const toolCall = await this.executeJevAction(action);

      return { text: '', toolCalls: [toolCall], jevDebug, executedJevAction: action };
    }

    if (tool.choice === 'timer' && isHighConfidenceChoice(tool) && isHighConfidenceChoice(timerMinutes)) {
      const action: JevClockAction = { tool: 'timer', minutes: suggestion.timerMinutes };
      const toolCall = await this.executeJevAction(action);

      return { text: '', toolCalls: [toolCall], jevDebug, executedJevAction: action };
    }

    return {
      text: '',
      toolCalls: [],
      jevDebug,
      jevSuggestion: suggestion,
    };
  }

  async executeJevAction(action: JevClockAction): Promise<AppToolCall> {
    let toolCall: AppToolCall;

    if (action.tool === 'alarm') {
      toolCall = {
        id: 'jev-alarm',
        name: 'set_alarm',
        arguments: JSON.stringify({ hour: action.hour, minute: action.minute, label: action.label ?? null, skipUI: true }),
      };
      await this.clock.setAlarm({ hour: action.hour, minute: action.minute, label: action.label, skipUI: true });
    } else {
      toolCall = {
        id: 'jev-timer',
        name: 'set_timer',
        arguments: JSON.stringify({ seconds: action.minutes * 60, skipUI: true }),
      };
      await this.clock.setTimer({ seconds: action.minutes * 60, skipUI: true });
    }

    return toolCall;
  }

  async requestLocal(prompt: string): Promise<AppRequestResult> {
    const context = getLocalLlamaContext();

    if (!context) {
      throw new Error('Local model is not loaded.');
    }

    const response = await context.completion({
      messages: [
        {
          role: 'system',
          content: `Current time: ${this.getCurrentTime()}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: this.getLocalTools(),
      tool_choice: 'auto',
      n_predict: 512,
      stop: ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', '<|end_of_turn|>', '<|endoftext|>'],
    });
    const toolCalls = response.tool_calls.map((toolCall, index) => {
      let id = `local-tool-call-${index}`;

      if (toolCall.id) {
        id = toolCall.id;
      }

      return {
        id,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      };
    });

    await this.toolsExecutor.execute(toolCalls);

    return {
      text: response.content,
      toolCalls,
    };
  }

  private getOpenAIToolCalls(response: Response): AppToolCall[] {
    const toolCalls: AppToolCall[] = [];

    for (const item of response.output) {
      if (item.type === 'function_call') {
        toolCalls.push({
          id: item.call_id,
          name: item.name,
          arguments: item.arguments,
        });
      }
    }

    return toolCalls;
  }

  private getLocalTools(): LocalTool[] {
    return this.toolsExecutor.tools.map((tool) => {
      let description: string | undefined;

      if (tool.description) {
        description = tool.description;
      }

      return {
        type: 'function',
        function: {
          name: tool.name,
          description,
          parameters: tool.parameters,
        },
      };
    });
  }

  private getCurrentTime(): string {
    return formatTime(new Date());
  }

  fetchOpenAIModels(apiKey: string): Promise<Model[]> {
    return this.openAIClient.fetchModels(apiKey);
  }
}
