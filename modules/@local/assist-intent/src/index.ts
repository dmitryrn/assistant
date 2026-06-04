import { requireNativeModule } from 'expo-modules-core';

type AssistIntentEvents = {
  assistIntent: () => void;
};

type EventSubscription = {
  remove(): void;
};

type AssistIntentModule = {
  consumePendingAssistIntent(): Promise<boolean>;
  addListener<EventName extends keyof AssistIntentEvents>(
    eventName: EventName,
    listener: AssistIntentEvents[EventName],
  ): EventSubscription;
};

export default requireNativeModule<AssistIntentModule>('AssistIntent');
