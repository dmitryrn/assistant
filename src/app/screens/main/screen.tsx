import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendRequest } from '@/store/request';
import { loadSettings } from '@/store/settings';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [prompt, setPrompt] = useState('');
  const [listening, setListening] = useState(false);
  const [permError, setPermError] = useState('');
  const { isLoading, error, toolCallsDebug } = useAppSelector((state) => state.request);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript;
    if (text) setPrompt(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech error:', event.error, event.message);
  });

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  async function handleMicPress() {
    setPermError('');

    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (status.granted) {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
      return;
    }

    if (!status.canAskAgain) {
      setPermError('Microphone permission denied. Enable it in system settings.');
      return;
    }

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn('Speech permissions not granted');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }

  function handleSend() {
    dispatch(sendRequest({ prompt }));
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
          <TextInput
            multiline
            onChangeText={setPrompt}
            placeholder="Your request"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.backgroundSelected,
              },
            ]}
            value={prompt}
          />
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleMicPress}
              style={({ pressed }) => [
                styles.micButton,
                {
                  backgroundColor: listening
                    ? theme.backgroundSelected
                    : theme.backgroundElement,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <SymbolView
                name={{
                  ios: listening ? 'pause.fill' : 'play.fill',
                  android: listening ? 'pause' : 'play_arrow',
                  web: listening ? 'pause' : 'play_arrow',
                }}
                size={18}
                weight="medium"
                tintColor={theme.text}
              />
            </Pressable>
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: theme.text,
                  opacity: pressed || isLoading ? 0.75 : 1,
                },
              ]}
              disabled={isLoading}>
              <ThemedText style={[styles.buttonText, { color: theme.background }]}>
                {isLoading ? 'Sending...' : 'Send request'}
              </ThemedText>
            </Pressable>
          </View>
          {permError ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {permError}
            </ThemedText>
          ) : null}
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
          {toolCallsDebug ? (
            <ThemedView
              style={[
                styles.output,
                {
                  borderColor: theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="code" style={[styles.outputText, { color: theme.text }]}>
                {toolCallsDebug}
              </ThemedText>
            </ThemedView>
          ) : null}
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
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  output: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  outputText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    flex: 1,
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
