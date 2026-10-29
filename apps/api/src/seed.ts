import pg from 'pg';

// Replaces all traces with N synthetic ones (default 100k) for performance work.
// Generated inside Postgres in one statement: no per-row round trips.
// Mix: haiku 50% / sonnet 35% / opus 15%, log-normal latency (long tail), ~3% errors.
const n = Number(process.argv[2]) || 100_000;

const SQL = `
WITH r AS MATERIALIZED (
  SELECT random() AS pm, random() < 0.03 AS err, random() AS pe, random() AS pt,
         sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) AS z,  -- standard normal (Box-Muller)
         now() - random() * interval '7 days' AS ts
  FROM generate_series(1, $1)
), m AS (
  SELECT *,
    CASE WHEN pm < 0.50 THEN 'claude-haiku-5-5' WHEN pm < 0.85 THEN 'claude-sonnet-5-5' ELSE 'claude-opus-5-5' END AS model,
    CASE WHEN pm < 0.50 THEN 800 WHEN pm < 0.85 THEN 2500 ELSE 6000 END AS median_ms
  FROM r
)
INSERT INTO traces (created_at, model, status, latency_ms, input_tokens, output_tokens, prompt, response, error)
SELECT
  ts, model,
  CASE WHEN err THEN 'error' ELSE 'ok' END,
  CASE WHEN NOT err THEN round(median_ms * exp(0.8 * z))
       WHEN pe < 0.5 THEN 200 + floor(random() * 1000)   -- overloaded: fails fast
       WHEN pe < 0.8 THEN 50 + floor(random() * 250)     -- rate limited: fails faster
       ELSE 60000 + floor(random() * 5000) END,          -- timeout
  round(exp(4 + 3 * pt)),
  CASE WHEN err THEN 0 ELSE round(exp(3 + 3 * random())) END,
  jsonb_build_array(jsonb_build_object('role', 'user', 'content', (ARRAY[
    'Summarize this support ticket in two sentences.',
    'Classify the sentiment of this review as positive, neutral or negative.',
    'Extract the order number and shipping address from this email.',
    'Write a SQL query that returns the top 10 customers by revenue.',
    'Translate this product description into Spanish.',
    'Explain why this unit test is failing.'
  ])[1 + floor(random() * 6)::int])),
  CASE WHEN err THEN NULL ELSE jsonb_build_array(jsonb_build_object('type', 'text', 'text', 'Synthetic response.')) END,
  CASE WHEN NOT err THEN NULL
       WHEN pe < 0.5 THEN 'overloaded_error: Overloaded'
       WHEN pe < 0.8 THEN 'rate_limit_error: Number of request tokens has exceeded your per-minute rate limit'
       ELSE 'APIConnectionTimeoutError: Request timed out.' END
FROM m`;

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const t0 = performance.now();
await db.query('TRUNCATE traces');
await db.query(SQL, [n]);
await db.query('ANALYZE traces');
console.log(`seeded ${n} traces in ${Math.round(performance.now() - t0)}ms`);
await db.end();
