import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { addAssistIntentListener, consumePendingAssistIntent } from '@/lib/assist-intent';
import { store } from '@/store';

function openAssistantCapture(): void {
  const assistIntentId = String(Date.now());

  router.navigate(`/main?listen=1&assistIntentId=${assistIntentId}`);
}

function AssistIntentHandler(): null {
  useEffect(() => {
    async function openPendingAssistantCapture(): Promise<void> {
      const hasPendingAssistIntent = await consumePendingAssistIntent();

      if (hasPendingAssistIntent) {
        openAssistantCapture();
      }
    }

    openPendingAssistantCapture();

    const subscription = addAssistIntentListener(openPendingAssistantCapture);

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

export default function TabLayout(): React.JSX.Element {
  const colorScheme = useColorScheme();
  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AssistIntentHandler />
        <AnimatedSplashOverlay />
        <AppTabs />
        <Toast />
      </ThemeProvider>
    </Provider>
  );
}
