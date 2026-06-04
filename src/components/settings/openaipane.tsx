import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ModelDropdown } from '@/components/model-dropdown';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OpenAIPaneProps = {
  apiKey: string;
  savedApiKey: string;
  model: string;
  onChangeApiKey(value: string): void;
  onChangeModel(value: string): void;
};

export function OpenAIPane({
  apiKey,
  savedApiKey,
  model,
  onChangeApiKey,
  onChangeModel,
}: OpenAIPaneProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">OpenAI API key</ThemedText>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeApiKey}
        placeholder="sk-..."
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.backgroundSelected,
            backgroundColor: '#fff',
          },
        ]}
        value={apiKey}
      />

      <ThemedText type="smallBold">Model</ThemedText>
      <ModelDropdown apiKey={savedApiKey} value={model} onChange={onChangeModel} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
