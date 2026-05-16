import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTime } from './time.ts';

test('formatTime formats time as HH:mm:ss', (): void => {
  const date = new Date(2026, 0, 1, 5, 7, 9);

  assert.equal(formatTime(date), '05:07:09');
});
