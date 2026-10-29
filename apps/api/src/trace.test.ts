import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWindow, validateTrace } from './trace.ts';

const ok = { model: 'claude-haiku-5-5', status: 'ok', latency_ms: 120, prompt: [{ role: 'user', content: 'hi' }] };

test('accepts a valid trace', () => assert.equal(validateTrace(ok), null));
test('rejects bad status', () => assert.match(validateTrace({ ...ok, status: 'meh' })!, /status/));
test('rejects negative latency', () => assert.match(validateTrace({ ...ok, latency_ms: -1 })!, /latency/));
test('rejects fractional tokens', () => assert.match(validateTrace({ ...ok, input_tokens: 1.5 })!, /input_tokens/));
test('rejects missing prompt', () => assert.match(validateTrace({ ...ok, prompt: undefined })!, /prompt/));

test('parses windows to seconds', () => {
  assert.equal(parseWindow('15m'), 900);
  assert.equal(parseWindow('1h'), 3600);
  assert.equal(parseWindow('30d'), 30 * 86400);
});
test('rejects bad windows', () => {
  for (const w of ['0h', '31d', '1w', 'h', '1.5h', ' 1h', '1h; DROP TABLE traces', undefined, 1]) assert.equal(parseWindow(w), null, String(w));
});
