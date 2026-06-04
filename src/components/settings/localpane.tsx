import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { loadLlamaModelInfo } from 'llama.rn';

export function LocalPane(): React.JSX.Element {
  const theme = useTheme();

  const handlePickModelFile = useCallback(async (): Promise<void> => {
    try {
      const { File } = await import('expo-file-system');
      const { copyAsync, documentDirectory } = await import('expo-file-system/legacy');

      const file = await File.pickFileAsync();

      if (!file) {
        return;
      }

      if (Array.isArray(file)) {
        const pickedFile = file[0];

        if (!pickedFile) {
          return;
        }

        const destPath = documentDirectory + pickedFile.name;

        await copyAsync({ from: pickedFile.uri, to: destPath });

        const info = (await loadLlamaModelInfo(destPath)) as Record<string, unknown>;
        console.log('Model info:', JSON.stringify(info, null, 2));

        return;
      }

      const destPath = documentDirectory + file.name;

      await copyAsync({ from: file.uri, to: destPath });

      const info = (await loadLlamaModelInfo(destPath)) as Record<string, unknown>;
      console.log('Model info:', JSON.stringify(info, null, 2));
    } catch (err) {
      let message = String(err);

      if (err instanceof Error) {
        message = err.message;
      }

      console.log('Model info error:', message);
    }
  }, []);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        onPress={handlePickModelFile}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.backgroundSelected,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
        <ThemedText style={[styles.buttonText, { color: theme.text }]}>Load model file</ThemedText>
      </Pressable>
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
