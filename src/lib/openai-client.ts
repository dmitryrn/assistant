import OpenAI from 'openai';
import type { FunctionTool, Response } from 'openai/resources/responses/responses';

type CreateResponseArgs = {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  tools?: FunctionTool[];
};

export interface Model {
  id: string;
  created: number;
  ownedBy: string;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  request({ model, prompt, systemPrompt, tools }: CreateResponseArgs): Promise<Response> {
    const input = [];

    if (systemPrompt) {
      input.push({
        role: 'system' as const,
        content: [{ type: 'input_text' as const, text: systemPrompt }],
      });
    }

    input.push({
      role: 'user' as const,
      content: [{ type: 'input_text' as const, text: prompt }],
    });

    return this.client.responses.create({
      model,
      input,
      tools,
    });
  }

  async fetchModels(): Promise<Model[]> {
    const resp = await this.client.models.list();

    return resp.data.map((model) => {
      return {
        id: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      };
    });
  }
}
