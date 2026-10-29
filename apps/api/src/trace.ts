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

const UNIT_SECS = { m: 60, h: 3600, d: 86400 } as const;

// Parses a ?window value like '15m', '1h' or '7d' into seconds (max 30d). Returns null when invalid.
export function parseWindow(w: unknown): number | null {
  const m = typeof w === 'string' ? /^(\d{1,4})([mhd])$/.exec(w) : null;
  if (!m) return null;
  const secs = Number(m[1]) * UNIT_SECS[m[2] as keyof typeof UNIT_SECS];
  return secs > 0 && secs <= 30 * 86400 ? secs : null;
}
