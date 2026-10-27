import type Anthropic from '@anthropic-ai/sdk';

type CreateParams = Anthropic.MessageCreateParamsNonStreaming;

// Wraps messages.create: times the call, then ships a trace to the TraceLens API.
// Trace delivery is fire-and-forget so a down collector never breaks the caller.
export function traced(client: Anthropic, url = process.env.TRACELENS_URL ?? 'http://localhost:4000') {
  const send = (trace: object) =>
    fetch(`${url}/v1/traces`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(trace) })
      .catch(() => {}); // ponytail: silent drop, add a retry buffer when traces must not be lost

  return {
    async create(params: CreateParams) {
      const start = performance.now();
      try {
        const res = await client.messages.create(params);
        send({
          model: params.model, status: 'ok', latency_ms: Math.round(performance.now() - start),
          input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens,
          prompt: params.messages, response: res.content,
        });
        return res;
      } catch (e) {
        send({ model: params.model, status: 'error', latency_ms: Math.round(performance.now() - start), prompt: params.messages, error: String(e) });
        throw e;
      }
    },
  };
}
