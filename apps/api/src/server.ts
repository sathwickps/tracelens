import Fastify from 'fastify';
import pg from 'pg';
import { validateTrace, type TraceInput } from './trace.ts';

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

app.get('/healthz', async () => ({ ok: true }));

await app.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
