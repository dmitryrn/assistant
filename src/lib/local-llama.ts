import { initLlama, type LlamaContext } from 'llama.rn';

let context: LlamaContext | null = null;
let modelPath: string | null = null;
let loadingModelPath: string | null = null;
let loadingPromise: Promise<void> | null = null;
let lifecycleToken = 0;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

export function getLocalLlamaContext(): LlamaContext | null {
  return context;
}

export async function loadLocalLlamaModel(nextModelPath: string): Promise<void> {
  if (context && modelPath === nextModelPath) {
    return;
  }

  if (loadingPromise && loadingModelPath === nextModelPath) {
    return loadingPromise;
  }

  lifecycleToken += 1;
  const token = lifecycleToken;

  loadingModelPath = nextModelPath;
  loadingPromise = loadLocalLlamaModelContext(nextModelPath, token);

  try {
    await loadingPromise;
  } finally {
    if (loadingPromise && loadingModelPath === nextModelPath) {
      loadingPromise = null;
      loadingModelPath = null;
    }
  }
}

async function loadLocalLlamaModelContext(nextModelPath: string, token: number): Promise<void> {
  const previousContext = context;
  context = null;
  modelPath = null;

  if (previousContext) {
    await previousContext.release();
  }

  let nextContext: LlamaContext | null = null;

  try {
    nextContext = await initLlama({
      model: nextModelPath,
      n_ctx: 2048,
      n_gpu_layers: 99,
      use_mlock: true,
    });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }

  if (token !== lifecycleToken) {
    await nextContext.release();
    return;
  }

  context = nextContext;
  modelPath = nextModelPath;
}

export async function unloadLocalLlamaModel(): Promise<void> {
  lifecycleToken += 1;
  loadingPromise = null;
  loadingModelPath = null;

  const previousContext = context;
  context = null;
  modelPath = null;

  if (previousContext) {
    await previousContext.release();
  }
}
