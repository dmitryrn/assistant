import { Linking, Platform } from 'react-native';

import type { ClockInterface } from '@/lib/clock-interface';

type IntentExtra = {
  key: string;
  value: string | number | boolean;
};

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

export class Clock implements ClockInterface {
  async setAlarm({
    hour,
    minute,
    label,
    skipUI = false,
  }: {
    hour: number;
    minute: number;
    label?: string;
    skipUI?: boolean;
  }): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('Setting alarms is only implemented for Android.');
    }

    if (!isWholeNumber(hour) || hour < 0 || hour > 23) {
      throw new Error('Hour must be an integer between 0 and 23.');
    }

    if (!isWholeNumber(minute) || minute < 0 || minute > 59) {
      throw new Error('Minute must be an integer between 0 and 59.');
    }

    const extras: IntentExtra[] = [
      { key: 'android.intent.extra.alarm.HOUR', value: hour },
      { key: 'android.intent.extra.alarm.MINUTES', value: minute },
      { key: 'android.intent.extra.alarm.SKIP_UI', value: skipUI },
    ];

    if (label) {
      extras.push({ key: 'android.intent.extra.alarm.MESSAGE', value: label });
    }

    await Linking.sendIntent('android.intent.action.SET_ALARM', extras);
  }
}
