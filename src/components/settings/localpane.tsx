import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadLocalModel, setLocalModelPath } from '@/store/settings';

import { loadLlamaModelInfo } from 'llama.rn';

type PickedFile = {
  name: string;
  uri: string;
};

function getPickedFile(file: PickedFile | PickedFile[] | null): PickedFile | null {
  if (!file) {
    return null;
  }

  if (Array.isArray(file)) {
    const pickedFile = file[0];

    if (!pickedFile) {
      return null;
    }

    return pickedFile;
  }

  return file;
}

export function LocalPane(): React.JSX.Element {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { localModelPath, localModelStatus, localModelError, provider } = useAppSelector((state) => state.settings);

  const handlePickModelFile = useCallback(async (): Promise<void> => {
    try {
      const { File } = await import('expo-file-system');
      const { copyAsync, documentDirectory } = await import('expo-file-system/legacy');

      const file = await File.pickFileAsync();
      const pickedFile = getPickedFile(file);

      if (!pickedFile) {
        return;
      }

      const destPath = documentDirectory + pickedFile.name;

      await copyAsync({ from: pickedFile.uri, to: destPath });

      const info = (await loadLlamaModelInfo(destPath)) as Record<string, unknown>;
      console.log('Model info:', JSON.stringify(info, null, 2));

      dispatch(setLocalModelPath(destPath));

      if (provider === 'local') {
        dispatch(loadLocalModel(destPath));
      }
    } catch (err) {
      let message = String(err);

      if (err instanceof Error) {
        message = err.message;
      }

      console.log('Model info error:', message);
    }
  }, [dispatch, provider]);

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
      {localModelPath ? <ThemedText type="small">{localModelPath}</ThemedText> : null}
      <ThemedText type="small">Local model: {localModelStatus}</ThemedText>
      {localModelError ? <ThemedText type="small">{localModelError}</ThemedText> : null}
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
