import type { FunctionTool, Response } from 'openai/resources/responses/responses';
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

import { getLocalLlamaContext } from '@/lib/local-llama';
import { createJevFetch } from '@/lib/jev-fetch';
import { OpenAIClient, type Model } from '@/lib/openai-client';
import { formatTime } from '@/lib/time';
import { ToolsExecutor, type AppToolCall } from '@/lib/tools-executor';

const AUTO_EXECUTE_THRESHOLD = 0.8;

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
};

export type JevClockAction =
  | { tool: 'alarm'; hour: number; minute: number }
  | { tool: 'timer'; minutes: number };

function createOptions(minimum: number, maximum: number): Record<string, null> {
  const options: Record<string, null> = {};

  for (let value = minimum; value <= maximum; value += 1) {
    options[String(value).padStart(2, '0')] = null;
  }

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

export type AppRequestResult = {
  text: string;
  toolCalls: AppToolCall[];
  jevDebug?: string;
  jevSuggestion?: JevSuggestion;
};

export class AppService {
  constructor(
    private openAIClient: OpenAIClient,
    private toolsExecutor: ToolsExecutor,
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

    const { tool, hour, minute, timerMinutes } = response.answers;
    const suggestion: JevSuggestion = {
      tool: tool.choice,
      hour: Number(hour.choice),
      minute: Number(minute.choice),
      timerMinutes: Number(timerMinutes.choice),
    };

    if (tool.choice === 'alarm' && isHighConfidenceChoice(tool)
      && isHighConfidenceChoice(hour) && isHighConfidenceChoice(minute)) {
      const toolCall = await this.executeJevAction({
        tool: 'alarm',
        hour: suggestion.hour,
        minute: suggestion.minute,
      });

      return { text: '', toolCalls: [toolCall], jevDebug };
    }

    if (tool.choice === 'timer' && isHighConfidenceChoice(tool) && isHighConfidenceChoice(timerMinutes)) {
      const toolCall = await this.executeJevAction({ tool: 'timer', minutes: suggestion.timerMinutes });

      return { text: '', toolCalls: [toolCall], jevDebug };
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
        arguments: JSON.stringify({ hour: action.hour, minute: action.minute, skipUI: true }),
      };
    } else {
      toolCall = {
        id: 'jev-timer',
        name: 'set_timer',
        arguments: JSON.stringify({ seconds: action.minutes * 60, skipUI: true }),
      };
    }

    await this.toolsExecutor.execute([toolCall]);

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
