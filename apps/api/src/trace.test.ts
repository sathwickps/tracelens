import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTrace } from './trace.ts';

const ok = { model: 'claude-haiku-5-5', status: 'ok', latency_ms: 120, prompt: [{ role: 'user', content: 'hi' }] };

test('accepts a valid trace', () => assert.equal(validateTrace(ok), null));
test('rejects bad status', () => assert.match(validateTrace({ ...ok, status: 'meh' })!, /status/));
test('rejects negative latency', () => assert.match(validateTrace({ ...ok, latency_ms: -1 })!, /latency/));
test('rejects fractional tokens', () => assert.match(validateTrace({ ...ok, input_tokens: 1.5 })!, /input_tokens/));
test('rejects missing prompt', () => assert.match(validateTrace({ ...ok, prompt: undefined })!, /prompt/));
