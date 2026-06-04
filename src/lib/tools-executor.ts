import type { FunctionTool } from 'openai/resources/responses/responses';

import type { SetAlarmArguments, SetTimerArguments } from '@/lib/clock';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class ToolsExecutor {
  readonly tools: FunctionTool[] = [
    {
      type: 'function',
      name: 'set_alarm',
      description: 'Set an alarm in the device clock app.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          hour: { type: 'number' },
          minute: { type: 'number' },
          label: { type: ['string', 'null'] },
          skipUI: { type: ['boolean', 'null'] },
        },
        required: ['hour', 'minute', 'label', 'skipUI'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'set_timer',
      description: 'Start a timer in the device clock app.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          seconds: { type: 'number' },
          skipUI: { type: ['boolean', 'null'] },
        },
        required: ['seconds', 'skipUI'],
        additionalProperties: false,
      },
    },
  ];

  constructor(
    private clock: {
      setAlarm(arguments_: SetAlarmArguments): Promise<void>;
      setTimer(arguments_: SetTimerArguments): Promise<void>;
    },
  ) {}

  async execute(toolCalls: AppToolCall[]): Promise<void> {
    for (const toolCall of toolCalls) {
      await this.executeToolCall(toolCall);
    }
  }

  private async executeToolCall(toolCall: AppToolCall): Promise<void> {
    if (toolCall.name === 'set_alarm') {
      await this.clock.setAlarm(this.parseSetAlarmArguments(toolCall.arguments));
      return;
    }

    if (toolCall.name === 'set_timer') {
      await this.clock.setTimer(this.parseSetTimerArguments(toolCall.arguments));
      return;
    }

    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  private parseSetAlarmArguments(argumentsJSON: string): SetAlarmArguments {
    const parsedArguments: unknown = JSON.parse(argumentsJSON);

    if (!isObject(parsedArguments)) {
      throw new Error('Tool arguments must be a JSON object.');
    }

    let label: string | undefined;
    if (typeof parsedArguments.label === 'string') {
      label = parsedArguments.label;
    }

    let skipUI: boolean | undefined;
    if (typeof parsedArguments.skipUI === 'boolean') {
      skipUI = parsedArguments.skipUI;
    }

    return {
      hour: parsedArguments.hour as number,
      minute: parsedArguments.minute as number,
      label,
      skipUI,
    };
  }

  private parseSetTimerArguments(argumentsJSON: string): SetTimerArguments {
    const parsedArguments: unknown = JSON.parse(argumentsJSON);

    if (!isObject(parsedArguments)) {
      throw new Error('Tool arguments must be a JSON object.');
    }

    let skipUI: boolean | undefined;
    if (typeof parsedArguments.skipUI === 'boolean') {
      skipUI = parsedArguments.skipUI;
    }

    return {
      seconds: parsedArguments.seconds as number,
      skipUI,
    };
  }
}

export type AppToolCall = {
  id: string;
  name: string;
  arguments: string;
};
