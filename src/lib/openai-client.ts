import OpenAI from 'openai';
import type { FunctionTool, Response } from 'openai/resources/responses/responses';

type RequestArgs = {
  model: string;
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
  private createClient(apiKey: string): OpenAI {
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  request(apiKey: string, { model, prompt, systemPrompt, tools }: RequestArgs): Promise<Response> {
    const client = this.createClient(apiKey);
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

    return client.responses.create({
      model,
      input,
      tools,
    });
  }

  async fetchModels(apiKey: string): Promise<Model[]> {
    const client = this.createClient(apiKey);
    const resp = await client.models.list();

    return resp.data.map((model) => {
      return {
        id: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      };
    });
  }
}
