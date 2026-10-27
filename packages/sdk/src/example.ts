import Anthropic from '@anthropic-ai/sdk';
import { traced } from './index.ts';

const claude = traced(new Anthropic());
const res = await claude.create({
  model: 'claude-haiku-5-5',
  max_tokens: 200,
  messages: [{ role: 'user', content: 'Explain p95 latency in one sentence.' }],
});
console.log(res.content);
