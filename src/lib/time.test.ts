import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDuration, formatTime, getAlarmCountdown } from './time';

test('formatTime formats time as HH:mm:ss', (): void => {
  const date = new Date(2026, 0, 1, 5, 7, 9);

  assert.equal(formatTime(date), '05:07:09');
});

test('formatDuration formats hours and minutes', (): void => {
  assert.equal(formatDuration(1), 'in 1 minute');
  assert.equal(formatDuration(60), 'in 1 hour');
  assert.equal(formatDuration(125), 'in 2 hours 5 minutes');
});

test('getAlarmCountdown calculates the next alarm occurrence', (): void => {
  const now = new Date(2026, 0, 1, 5, 7, 9);

  assert.equal(getAlarmCountdown(6, 8, now), 'in 1 hour 1 minute');
  assert.equal(getAlarmCountdown(5, 0, now), 'in 23 hours 53 minutes');
});
