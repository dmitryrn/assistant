import type { FunctionTool, Response, ResponseFunctionToolCall } from 'openai/resources/responses/responses';

import type { SetAlarmArguments } from '@/lib/clock';

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
  ];

  constructor(
    private clock: {
      setAlarm(arguments_: SetAlarmArguments): Promise<void>;
    },
  ) {}

  async execute(response: Response): Promise<ResponseFunctionToolCall[]> {
    const toolCalls = this.getToolCalls(response);

    for (const toolCall of toolCalls) {
      await this.executeToolCall(toolCall);
    }

    return toolCalls;
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
}
