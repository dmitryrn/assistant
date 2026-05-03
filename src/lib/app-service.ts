import type { Response } from 'openai/resources/responses/responses';

import { OpenAIClient } from '@/lib/openai-client';
import { ToolsExecutor } from '@/lib/tools-executor';

export class AppService {
  constructor(
    private openAIClient: OpenAIClient,
    private toolsExecutor: ToolsExecutor,
  ) {}

  async request(prompt: string): Promise<Response> {
    const response = await this.openAIClient.request({
      prompt,
      tools: this.toolsExecutor.tools,
    });

    await this.toolsExecutor.execute(response);

    return response;
  }
}
