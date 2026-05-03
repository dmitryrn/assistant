import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPENAI_API_KEY_STORAGE_KEY = 'settings.openaiApiKey';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApiKey() {
      try {
        const storedValue = await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY);
        if (isMounted && storedValue) {
          setApiKey(storedValue);
        }
      } catch {
        if (isMounted) {
          setStatus('Could not load the saved API key.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadApiKey();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);

    try {
      const trimmedKey = apiKey.trim();

      if (trimmedKey.length === 0) {
        await SecureStore.deleteItemAsync(OPENAI_API_KEY_STORAGE_KEY);
        setApiKey('');
        setStatus('Saved empty value and cleared secure storage.');
        return;
      }

      await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
      setApiKey(trimmedKey);
      setStatus('API key saved to secure storage.');
    } catch {
      setStatus('Could not save the API key.');
    } finally {
      setIsSaving(false);
    }
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
          {isLoading ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setApiKey}
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
                value={apiKey}
              />
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.text, opacity: pressed || isSaving ? 0.75 : 1 },
                ]}
                disabled={isSaving}>
                <ThemedText style={[styles.buttonText, { color: theme.background }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </ThemedText>
              </Pressable>
            </>
          )}
          {status ? <ThemedText type="small">{status}</ThemedText> : null}
        </ThemedView>
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
