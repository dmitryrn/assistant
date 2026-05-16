import { AppService } from '@/lib/app-service';
import { Clock } from '@/lib/clock';
import { OpenAIClient } from '@/lib/openai-client';
import { ToolsExecutor } from '@/lib/tools-executor';

let appServiceSingleton: AppService | undefined;

export function getAppService(): AppService {
  if (appServiceSingleton) {
    return appServiceSingleton;
  }

  const clock = new Clock();
  const toolsExecutor = new ToolsExecutor(clock);
  const openAIClient = new OpenAIClient();

  appServiceSingleton = new AppService(openAIClient, toolsExecutor);

  return appServiceSingleton;
}
