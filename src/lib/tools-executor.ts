import type { FunctionTool, Response, ResponseFunctionToolCall } from 'openai/resources/responses/responses';

import type { ClockInterface } from '@/lib/clock-interface';

type SetAlarmArguments = {
  hour: number;
  minute: number;
  label?: string;
  skipUI?: boolean;
};

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
          label: { type: 'string' },
          skipUI: { type: 'boolean' },
        },
        required: ['hour', 'minute'],
        additionalProperties: false,
      },
    },
  ];

  constructor(private clock: ClockInterface) {}

  async execute(response: Response): Promise<void> {
    const toolCalls = this.getToolCalls(response);

    for (const toolCall of toolCalls) {
      await this.executeToolCall(toolCall);
    }
  }

  private getToolCalls(response: Response): ResponseFunctionToolCall[] {
    const toolCalls: ResponseFunctionToolCall[] = [];

    for (const item of response.output) {
      if (item.type === 'function_call') {
        toolCalls.push(item);
      }
    }

    return toolCalls;
  }

  private async executeToolCall(toolCall: ResponseFunctionToolCall): Promise<void> {
    if (toolCall.name === 'set_alarm') {
      await this.clock.setAlarm(this.parseSetAlarmArguments(toolCall.arguments));
      return;
    }

    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  private parseSetAlarmArguments(argumentsJSON: string): SetAlarmArguments {
    const parsedArguments: unknown = JSON.parse(argumentsJSON);

    if (!isObject(parsedArguments)) {
      throw new Error('Tool arguments must be a JSON object.');
    }

    return {
      hour: parsedArguments.hour as number,
      minute: parsedArguments.minute as number,
      label: parsedArguments.label as string | undefined,
      skipUI: parsedArguments.skipUI as boolean | undefined,
    };
  }
}
