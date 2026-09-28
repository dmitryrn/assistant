import assert from 'node:assert/strict';
import test from 'node:test';

import { contiguousPhrases } from './contiguous-phrases';

test('contiguousPhrases returns every ordered adjacent phrase', (): void => {
  assert.deepEqual(contiguousPhrases('Set alarm at 15 for landlord'), [
    'Set',
    'Set alarm',
    'Set alarm at',
    'Set alarm at 15',
    'Set alarm at 15 for',
    'Set alarm at 15 for landlord',
    'alarm',
    'alarm at',
    'alarm at 15',
    'alarm at 15 for',
    'alarm at 15 for landlord',
    'at',
    'at 15',
    'at 15 for',
    'at 15 for landlord',
    '15',
    '15 for',
    '15 for landlord',
    'for',
    'for landlord',
    'landlord',
  ]);
});

test('contiguousPhrases returns no candidates for blank speech', (): void => {
  assert.deepEqual(contiguousPhrases('  '), []);
});
