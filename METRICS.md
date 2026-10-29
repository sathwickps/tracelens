# Metrics

Every number here was measured, never estimated. Machine unless noted: Intel i7-1270P (16 threads), 29 GB RAM,
Linux, Node 24.14, Postgres 16.14 in Docker.

| Date | What | How | Result |
|---|---|---|---|
| 2026-10-29 | Seed 100k traces | `npm run seed -w api` (TRUNCATE + one `INSERT … SELECT generate_series` + ANALYZE), single run | 1675 ms; table + indexes 34 MB |
| 2026-10-29 | `/v1/stats` query, 1h window (426 of 100k rows) | `EXPLAIN (ANALYZE, BUFFERS)` in psql, 5 runs, only index `(created_at DESC, id DESC)` | median 2.8 ms (2.5–3.3); bitmap index scan |
| 2026-10-29 | `/v1/stats` query, 7d window (99,842 rows) | same, default `work_mem` 4MB | **baseline** median 106 ms (105–125); seq scan + sort spills to disk (external merge, 4.2 MB) |
