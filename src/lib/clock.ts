import { startActivityAsync } from 'expo-intent-launcher';
import { Platform } from 'react-native';

export type SetAlarmArguments = {
  hour: number;
  minute: number;
  label?: string;
  skipUI?: boolean;
};

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

export class Clock {
  async setAlarm({
    hour,
    minute,
    label,
    skipUI = false,
  }: SetAlarmArguments): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Setting alarms is only implemented for Android.');
    }

    if (!isWholeNumber(hour) || hour < 0 || hour > 23) {
      throw new Error('Hour must be an integer between 0 and 23.');
    }

    if (!isWholeNumber(minute) || minute < 0 || minute > 59) {
      throw new Error('Minute must be an integer between 0 and 59.');
    }

    const extra: Record<string, string | number | boolean> = {
      'android.intent.extra.alarm.HOUR': hour,
      'android.intent.extra.alarm.MINUTES': minute,
      'android.intent.extra.alarm.SKIP_UI': skipUI,
    };

    if (label) {
      extra['android.intent.extra.alarm.MESSAGE'] = label;
    }

    await startActivityAsync('android.intent.action.SET_ALARM', { extra });
  }
}
