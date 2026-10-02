import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Picker } from '@react-native-picker/picker';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { JevSuggestion } from '@/lib/app-service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { executeJevAction, sendRequest } from '@/store/request';
import { loadSettings } from '@/store/settings';

function getSearchParamValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getAlarmCountdown(hour: string, minute: string, now: Date): string {
  const alarmTime = new Date(now);
  alarmTime.setHours(Number(hour), Number(minute), 0, 0);

  if (alarmTime.getTime() <= now.getTime()) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const minutesUntilAlarm = Math.ceil((alarmTime.getTime() - now.getTime()) / 60_000);
  const hours = Math.floor(minutesUntilAlarm / 60);
  const minutes = minutesUntilAlarm % 60;
  const duration: string[] = [];

  if (hours > 0) {
    let unit = 'hours';
    if (hours === 1) {
      unit = 'hour';
    }
    duration.push(`${hours} ${unit}`);
  }

  if (minutes > 0 || duration.length === 0) {
    let unit = 'minutes';
    if (minutes === 1) {
      unit = 'minute';
    }
    duration.push(`${minutes} ${unit}`);
  }

  return `in ${duration.join(' ')}`;
}

type JevSuggestionCardProps = {
  suggestion: JevSuggestion;
  disabled: boolean;
};

function JevSuggestionCard({ suggestion, disabled }: JevSuggestionCardProps): React.JSX.Element {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [alarmHour, setAlarmHour] = useState(String(suggestion.hour).padStart(2, '0'));
  const [alarmMinute, setAlarmMinute] = useState(String(suggestion.minute).padStart(2, '0'));
  const [alarmLabel, setAlarmLabel] = useState(suggestion.label ?? '');
  const [timerMinutes, setTimerMinutes] = useState(String(suggestion.timerMinutes));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);

    return () => clearInterval(interval);
  }, []);

  function handleSetAlarm(): void {
    const trimmedLabel = alarmLabel.trim();
    let label: string | undefined;
    if (trimmedLabel) {
      label = trimmedLabel;
    }

    dispatch(
      executeJevAction({
        tool: 'alarm',
        hour: Number(alarmHour),
        minute: Number(alarmMinute),
        label,
      }),
    );
  }

  function handleSetTimer(): void {
    dispatch(executeJevAction({ tool: 'timer', minutes: Number(timerMinutes) }));
  }

  return (
    <ThemedView type="backgroundElement" style={styles.suggestionCard}>
      {suggestion.tool === 'alarm' ? (
        <>
          <View style={styles.suggestionHeader}>
            <ThemedText type="smallBold">Alarm</ThemedText>
            <TextInput
              accessibilityLabel="Alarm label"
              editable={!disabled}
              onChangeText={setAlarmLabel}
              placeholder="Alarm label (optional)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.alarmLabelInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
              value={alarmLabel}
            />
          </View>
          <View style={styles.actionRow}>
            <View style={styles.pickerField}>
              <Picker
                selectedValue={alarmHour}
                onValueChange={(value: string) => setAlarmHour(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
                accessibilityLabel="Alarm hour">
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = String(hour).padStart(2, '0');
                  return <Picker.Item key={value} label={value} value={value} />;
                })}
              </Picker>
            </View>
            <View style={styles.pickerField}>
              <Picker
                selectedValue={alarmMinute}
                onValueChange={(value: string) => setAlarmMinute(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
                accessibilityLabel="Alarm minute">
                {Array.from({ length: 60 }, (_, minute) => {
                  const value = String(minute).padStart(2, '0');
                  return <Picker.Item key={value} label={value} value={value} />;
                })}
              </Picker>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Set alarm"
              onPress={handleSetAlarm}
              disabled={disabled}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.text, opacity: pressed || disabled ? 0.65 : 1 },
              ]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={22}
                tintColor={theme.background}
              />
            </Pressable>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {getAlarmCountdown(alarmHour, alarmMinute, now)}
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText type="smallBold">Timer</ThemedText>
          <View style={styles.actionRow}>
            <View style={[styles.pickerField, styles.timerPickerField]}>
              <Picker
                selectedValue={timerMinutes}
                onValueChange={(value: string) => setTimerMinutes(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
                accessibilityLabel="Timer duration in minutes">
                {Array.from({ length: 60 }, (_, index) => {
                  const value = String(index + 1);
                  return <Picker.Item key={value} label={`${value} minutes`} value={value} />;
                })}
              </Picker>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start timer"
              onPress={handleSetTimer}
              disabled={disabled}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.text, opacity: pressed || disabled ? 0.65 : 1 },
              ]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={22}
                tintColor={theme.background}
              />
            </Pressable>
          </View>
        </>
      )}
    </ThemedView>
  );
}

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { assistIntentId, listen } = useLocalSearchParams<{
    assistIntentId?: string;
    listen?: string;
  }>();
  const handledAssistIntentId = useRef<string | undefined>(undefined);
  const [prompt, setPrompt] = useState('');
  const [listening, setListening] = useState(false);
  const provider = useAppSelector((state) => state.settings.provider);
  const { isExecuting, isLoading, jevDebug, jevSuggestion, toolCallsDebug } = useAppSelector(
    (state) => state.request,
  );

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript;
    if (text) setPrompt(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    const message = event.message || event.error;
    Toast.show({ type: 'error', text1: 'Speech Error', text2: message });
  });

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  const startSpeech = useCallback(async (): Promise<void> => {
    if (listening) {
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
  }, [listening]);

  useEffect(() => {
    const listenParam = getSearchParamValue(listen);
    const assistIntentIdParam = getSearchParamValue(assistIntentId);

    if (listenParam !== '1') {
      return;
    }

    if (!assistIntentIdParam) {
      return;
    }

    if (handledAssistIntentId.current === assistIntentIdParam) {
      return;
    }

    handledAssistIntentId.current = assistIntentIdParam;
    void startSpeech();
  }, [assistIntentId, listen, startSpeech]);

  async function handleMicPress(): Promise<void> {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    await startSpeech();
  }

  function handleSend(): void {
    dispatch(sendRequest({ prompt }));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.three,
          },
        ]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
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

            {toolCallsDebug && provider !== 'jev' ? (
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
          {jevSuggestion && jevSuggestion.tool !== 'other' ? (
            <JevSuggestionCard
              key={`${jevSuggestion.tool}-${jevSuggestion.hour}-${jevSuggestion.minute}-${jevSuggestion.timerMinutes}-${jevSuggestion.label ?? ''}`}
              suggestion={jevSuggestion}
              disabled={isLoading || isExecuting}
            />
          ) : null}
          {jevDebug ? (
            <ThemedView type="backgroundElement" style={styles.debugCard}>
              <ThemedText type="smallBold">Jev debug</ThemedText>
              <ScrollView
                nestedScrollEnabled
                scrollEnabled
                showsVerticalScrollIndicator
                onStartShouldSetResponderCapture={() => true}
                style={[
                  styles.debugOutput,
                  {
                    borderColor: theme.backgroundSelected,
                  },
                ]}>
                <ThemedText type="code" style={[styles.outputText, { color: theme.text }]}>
                  {jevDebug}
                </ThemedText>
              </ScrollView>
            </ThemedView>
          ) : null}
        </ScrollView>
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
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingBottom: Spacing.three,
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
  debugCard: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  suggestionCard: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  suggestionHeader: {
    gap: Spacing.one,
  },
  alarmLabelInput: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pickerField: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#80808055',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  timerPickerField: {
    flex: 1,
  },
  picker: {
    height: 56,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugOutput: {
    height: 280,
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
