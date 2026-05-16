import React, { useEffect } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelDropdown } from '@/components/model-dropdown';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSettingsError, loadSettings, saveSettings, setModel, setOpenAIAPIKey } from '@/store/settings';

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { openAIAPIKey, model, isLoading, error } = useAppSelector((state) => state.settings);

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  function handleSave(): void {
    dispatch(saveSettings({ openAIAPIKey, model }));
  }

  function handleChangeOpenAIAPIKey(value: string): void {
    if (error) {
      dispatch(clearSettingsError());
    }

    dispatch(setOpenAIAPIKey(value));
  }

  function handleSelectModel(value: string): void {
    dispatch(setModel(value));
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
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
          <ThemedText type="smallBold">Model</ThemedText>
          <ModelDropdown apiKey={openAIAPIKey} value={model} onChange={handleSelectModel} />
        </ThemedView>
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
