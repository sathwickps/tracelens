import Fastify from 'fastify';
import pg from 'pg';
import { parseWindow, validateTrace, type TraceInput } from './trace.ts';

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = Fastify({ logger: true, bodyLimit: 1_000_000 });

app.addHook('onSend', async (_req, reply) => {
  reply.header('access-control-allow-origin', process.env.WEB_ORIGIN ?? 'http://localhost:3000');
});

app.post('/v1/traces', async (req, reply) => {
  const err = validateTrace(req.body);
  if (err) return reply.code(400).send({ error: err });
  const t = req.body as TraceInput;
  const { rows } = await db.query(
    `INSERT INTO traces (model, status, latency_ms, input_tokens, output_tokens, prompt, response, error)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at`,
    [t.model, t.status, t.latency_ms, t.input_tokens ?? 0, t.output_tokens ?? 0,
     JSON.stringify(t.prompt), t.response === undefined ? null : JSON.stringify(t.response), t.error ?? null],
  );
  return reply.code(201).send(rows[0]);
});

// Keyset pagination: pass the last row's created_at + id as ?before=<iso>&beforeId=<uuid>.
app.get<{ Querystring: { limit?: string; before?: string; beforeId?: string } }>('/v1/traces', async (req) => {
  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  const { before, beforeId } = req.query;
  const { rows } = before && beforeId
    ? await db.query(
        `SELECT id, created_at, model, status, latency_ms, input_tokens, output_tokens, error FROM traces
         WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3`, [before, beforeId, limit])
    : await db.query(
        `SELECT id, created_at, model, status, latency_ms, input_tokens, output_tokens, error FROM traces
         ORDER BY created_at DESC, id DESC LIMIT $1`, [limit]);
  return { traces: rows };
});

// Per-model latency percentiles, error rate and token totals over a trailing window (?window=15m|1h|7d, default 1h).
app.get<{ Querystring: { window?: string } }>('/v1/stats', async (req, reply) => {
  const window = req.query.window ?? '1h';
  const secs = parseWindow(window);
  if (secs === null) return reply.code(400).send({ error: "window must look like '15m', '1h' or '7d' (max 30d)" });
  const { rows } = await db.query(
    `SELECT model, count(*)::int AS requests,
       avg((status = 'error')::int)::float8 AS error_rate,
       percentile_cont(0.5)  WITHIN GROUP (ORDER BY latency_ms) AS p50_ms,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_ms,
       percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_ms,
       sum(input_tokens)::float8 AS input_tokens, sum(output_tokens)::float8 AS output_tokens
     FROM traces WHERE created_at > now() - make_interval(secs => $1)
     GROUP BY model ORDER BY requests DESC`, [secs]);
  return { window, models: rows };
});

app.get('/healthz', async () => ({ ok: true }));

await app.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
