import type { FunctionTool, Response } from 'openai/resources/responses/responses';

import { getLocalLlamaContext } from '@/lib/local-llama';
import { OpenAIClient, type Model } from '@/lib/openai-client';
import { formatTime } from '@/lib/time';
import { ToolsExecutor, type AppToolCall } from '@/lib/tools-executor';

type LocalTool = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: FunctionTool['parameters'];
  };
};

export type AppRequestResult = {
  text: string;
  toolCalls: AppToolCall[];
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
