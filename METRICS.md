# Metrics

Every number here was measured, never estimated. Machine unless noted: Intel i7-1270P (16 threads), 29 GB RAM,
Linux, Node 24.14, Postgres 16.14 in Docker.

| Date | What | How | Result |
|---|---|---|---|
| 2026-10-29 | Seed 100k traces | `npm run seed -w api` (TRUNCATE + one `INSERT … SELECT generate_series` + ANALYZE), single run | 1675 ms; table + indexes 34 MB |
