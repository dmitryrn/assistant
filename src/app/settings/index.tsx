import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalPane } from '@/components/settings/localpane';
import { JevPane } from '@/components/settings/jevpane';
import { OpenAIPane } from '@/components/settings/openaipane';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loadSettings,
  saveSettings,
  selectProvider,
  setJevAPIKey,
  setOpenAIModel,
  type SettingsProvider,
} from '@/store/settings';

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { openAIAPIKey, jevAPIKey, openAIModel, localModelPath, provider, isLoading } = useAppSelector(
    (state) => state.settings,
  );
  const [localOpenAIAPIKey, setLocalOpenAIAPIKey] = useState<string | null>(null);
  const openAIAPIKeyValue = localOpenAIAPIKey ?? openAIAPIKey;

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  function handleSave(): void {
    dispatch(saveSettings({ openAIAPIKey: openAIAPIKeyValue, jevAPIKey, openAIModel, localModelPath, provider }));
  }

  function handleSelectModel(value: string): void {
    dispatch(setOpenAIModel(value));
  }

  function handleSelectProvider(value: SettingsProvider): void {
    dispatch(selectProvider(value));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Provider</ThemedText>
          <SelectDropdown value={provider} onChange={handleSelectProvider}>
            <Picker.Item label="OpenAI" value="openai" />
            <Picker.Item label="Jev" value="jev" />
            <Picker.Item label="Local" value="local" />
          </SelectDropdown>
        </ThemedView>

        {provider === 'openai' && (
          <OpenAIPane
            apiKey={openAIAPIKeyValue}
            savedApiKey={openAIAPIKey}
            model={openAIModel}
            onChangeApiKey={setLocalOpenAIAPIKey}
            onChangeModel={handleSelectModel}
          />
        )}
        {provider === 'local' && <LocalPane />}
        {provider === 'jev' && (
          <JevPane apiKey={jevAPIKey} onChangeApiKey={(value) => dispatch(setJevAPIKey(value))} />
        )}

        <ThemedView style={styles.spacer} />

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.text, opacity: pressed || isLoading ? 0.75 : 1 },
          ]}
          disabled={isLoading}>
          <ThemedText style={[styles.buttonText, { color: theme.background }]}>Save</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  spacer: {
    flex: 1,
  },
  button: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonText: {
    fontWeight: 600,
  },
});
