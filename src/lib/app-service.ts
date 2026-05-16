import type { ResponseFunctionToolCall } from 'openai/resources/responses/responses';

import { OpenAIClient, type Model } from '@/lib/openai-client';
import { ToolsExecutor } from '@/lib/tools-executor';

export class AppService {
  constructor(
    private openAIClient: OpenAIClient,
    private toolsExecutor: ToolsExecutor,
  ) {}

  async request(apiKey: string, model: string, prompt: string): Promise<ResponseFunctionToolCall[]> {
    const response = await this.openAIClient.request(apiKey, {
      model,
      prompt,
      tools: this.toolsExecutor.tools,
    });

    return this.toolsExecutor.execute(response);
  }

  fetchModels(apiKey: string): Promise<Model[]> {
    return this.openAIClient.fetchModels(apiKey);
  }
}
