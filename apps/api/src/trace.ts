export type TraceInput = {
  model: string;
  status: 'ok' | 'error';
  latency_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  prompt: unknown;
  response?: unknown;
  error?: string;
};

// Validates an untrusted ingest body. Returns an error message, or null when valid.
export function validateTrace(b: any): string | null {
  if (!b || typeof b !== 'object') return 'body must be an object';
  if (typeof b.model !== 'string' || !b.model) return 'model is required';
  if (b.status !== 'ok' && b.status !== 'error') return "status must be 'ok' or 'error'";
  if (!Number.isInteger(b.latency_ms) || b.latency_ms < 0) return 'latency_ms must be a non-negative integer';
  for (const k of ['input_tokens', 'output_tokens']) {
    if (b[k] !== undefined && (!Number.isInteger(b[k]) || b[k] < 0)) return `${k} must be a non-negative integer`;
  }
  if (b.prompt === undefined) return 'prompt is required';
  return null;
}
