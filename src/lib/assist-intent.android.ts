import AssistIntent from '../../modules/@local/assist-intent/src';

type AssistIntentSubscription = {
  remove(): void;
};

export async function consumePendingAssistIntent(): Promise<boolean> {
  return AssistIntent.consumePendingAssistIntent();
}

export function addAssistIntentListener(listener: () => void): AssistIntentSubscription {
  return AssistIntent.addListener('assistIntent', listener);
}
