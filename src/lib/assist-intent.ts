type AssistIntentSubscription = {
  remove(): void;
};

export async function consumePendingAssistIntent(): Promise<boolean> {
  return false;
}

export function addAssistIntentListener(_listener: () => void): AssistIntentSubscription {
  return {
    remove(): void {},
  };
}
