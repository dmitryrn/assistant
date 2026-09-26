import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type JevPaneProps = {
  apiKey: string;
  onChangeApiKey(value: string): void;
};

export function JevPane({ apiKey, onChangeApiKey }: JevPaneProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Jev API key</ThemedText>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeApiKey}
        placeholder="Enter Jev API key"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.backgroundSelected,
            backgroundColor: theme.backgroundSelected,
          },
        ]}
        value={apiKey}
      />
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
