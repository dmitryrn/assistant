import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { OpenAIClient, type Model } from '@/lib/openai-client';

type ModelDropdownProps = {
  apiKey: string;
  value: string;
  onChange(value: string): void;
};

export function ModelDropdown({ apiKey, value, onChange }: ModelDropdownProps): React.JSX.Element {
  const theme = useTheme();
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchModels = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const openAIClient = new OpenAIClient();
      const fetchedModels = await openAIClient.fetchModels(apiKey);
      setModels(fetchedModels);
    } catch (fetchError) {
      const message = fetchError instanceof Error && fetchError.message
        ? fetchError.message
        : 'Could not load models.';
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey.trim()) {
      void fetchModels();
    } else {
      setModels([]);
    }
  }, [fetchModels, apiKey]);

  if (!apiKey.trim()) {
    return <ThemedText>Enter API key to load models</ThemedText>;
  }

  if (isLoading) {
    return <ActivityIndicator color={theme.text} style={styles.loader} />;
  }

  return (
    <View style={[styles.pickerContainer, { borderColor: theme.backgroundSelected }]}>
      <Picker
        selectedValue={value || ''}
        onValueChange={(itemValue: string) => onChange(itemValue)}
        style={[styles.picker, { color: theme.text }]}
        dropdownIconColor={theme.text}
      >
        <Picker.Item label="Select a model..." value="" enabled={false} />
        {models.map((model) => (
          <Picker.Item key={model.id} label={model.id} value={model.id} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  picker: {
    minHeight: 52,
  },
  loader: {
    paddingVertical: Spacing.three,
  },
});
