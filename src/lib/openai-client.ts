import OpenAI from 'openai';
import type { FunctionTool } from 'openai/resources/responses/responses';

const DEFAULT_MODEL = 'gpt-4.1-mini';

type CreateResponseArgs = {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  tools?: FunctionTool[];
};

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  request({ model = DEFAULT_MODEL, prompt, systemPrompt, tools }: CreateResponseArgs) {
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
}
