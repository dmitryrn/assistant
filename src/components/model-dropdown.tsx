import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(): void {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (models.length === 0) {
      void fetchModels();
    }
  }

  async function fetchModels(): Promise<void> {
    if (!apiKey.trim()) {
      setError('OpenAI API key is required to load models.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const openAIClient = new OpenAIClient(apiKey);
      const fetchedModels = await openAIClient.fetchModels();
      setModels(fetchedModels);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.message) {
        setError(fetchError.message);
      } else {
        setError('Could not load models.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(model: string): void {
    onChange(model);
    setIsOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.selectButton,
          {
            borderColor: theme.backgroundSelected,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
        <ThemedText>{value || 'Select model'}</ThemedText>
      </Pressable>
      {isOpen ? (
        <ThemedView style={[styles.optionsList, { borderColor: theme.backgroundSelected }]}>
          {isLoading ? <ActivityIndicator color={theme.text} style={styles.optionsLoader} /> : null}
          {error ? <ThemedText style={styles.optionMessage}>{error}</ThemedText> : null}
          {!isLoading && !error && models.length === 0 ? (
            <ThemedText style={styles.optionMessage}>No models found.</ThemedText>
          ) : null}
          <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
            {models.map((modelOption) => (
              <Pressable
                key={modelOption.id}
                accessibilityRole="button"
                accessibilityState={{ selected: value === modelOption.id }}
                onPress={() => handleSelect(modelOption.id)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: value === modelOption.id ? theme.backgroundSelected : 'transparent',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <ThemedText>{modelOption.id}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  optionsList: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  optionsScroll: {
    maxHeight: 280,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionMessage: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  optionsLoader: {
    paddingVertical: Spacing.three,
  },
});
