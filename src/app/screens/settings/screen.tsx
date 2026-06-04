import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadSettings, saveSettings, setModel, setOpenAIAPIKey } from '@/store/settings';

import { loadLlamaModelInfo } from 'llama.rn';

import { ModelDropdown } from './model-dropdown';

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { openAIAPIKey, model, isLoading } = useAppSelector((state) => state.settings);

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  function handleSave(): void {
    dispatch(saveSettings({ openAIAPIKey, model }));
  }

  function handleChangeOpenAIAPIKey(value: string): void {
    dispatch(setOpenAIAPIKey(value));
  }

  function handleSelectModel(value: string): void {
    dispatch(setModel(value));
  }

  const handlePickModelFile = useCallback(async (): Promise<void> => {
    try {
      const { File } = await import('expo-file-system');
      const { copyAsync, documentDirectory } = await import('expo-file-system/legacy');

      const file = await File.pickFileAsync();

      if (!file) {
        return;
      }

      const pickedFile = Array.isArray(file) ? file[0] : file;
      const destPath = documentDirectory + pickedFile.name;

      await copyAsync({ from: pickedFile.uri, to: destPath });

      const info = (await loadLlamaModelInfo(destPath)) as Record<string, unknown>;
      console.log('Model info:', JSON.stringify(info, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('Model info error:', message);
    }
  }, []);

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
          <ThemedText type="smallBold">OpenAI API key</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={handleChangeOpenAIAPIKey}
            placeholder="sk-..."
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.backgroundSelected,
              },
            ]}
            value={openAIAPIKey}
          />

          <ThemedText type="smallBold">Model</ThemedText>
          <ModelDropdown apiKey={openAIAPIKey} value={model} onChange={handleSelectModel} />
        </ThemedView>
        <Pressable
          onPress={handlePickModelFile}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.backgroundSelected,
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <ThemedText style={[styles.buttonText, { color: theme.text }]}>
            Load model file
          </ThemedText>
        </Pressable>
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
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
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
