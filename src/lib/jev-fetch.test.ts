import assert from 'node:assert/strict';
import test from 'node:test';

import { createJevFetch } from './jev-fetch';

test('Jev fetch leaves response text readable while disabling stream cloning', async (): Promise<void> => {
  const fetchJev = createJevFetch();
  const response = await fetchJev('data:application/json,%7B%22ok%22%3Atrue%7D');
  const clone = response.clone();

  assert.equal(clone.body, null);
  assert.deepEqual(await response.json(), { ok: true });
});
