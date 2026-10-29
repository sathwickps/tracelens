# TraceLens: 3-week build plan

Goal: an observability dashboard for LLM apps that adds four things your CV is missing:
**Node.js backend, observability/OpenTelemetry, AWS, and performance work with measured numbers**,
on top of your React/TS strength. Aim for ~2 hrs on weekdays and ~5 hrs on weekends.

Rule: every CV bullet that comes out of this must come with a number you measured.
Keep `METRICS.md` updated as you go; that's where the CV bullets come from.

## Week 0: done (scaffold)
- [x] Monorepo: `apps/api` (Fastify + Postgres), `apps/web` (Next.js 15), `packages/sdk` (Claude wrapper)
- [x] `POST /v1/traces` with input validation + `GET /v1/traces` with keyset pagination
- [x] SDK `traced(client).create()` records latency, tokens and errors
- [x] CI: typecheck + tests on every push

## Week 1: real backend and a real data set
1. [x] **Seed script** (`apps/api/src/seed.ts`): generate 100k realistic traces (mixed models, a long latency tail, ~3% errors).
   You'll need this to measure performance later.
2. **Stats endpoint**: `GET /v1/stats?window=1h` returns p50/p95/p99 latency, error rate, tokens and cost per model.
   Use Postgres `percentile_cont` and check it with `EXPLAIN ANALYZE`. Write the query time into METRICS.md.
3. **Cost**: a per-model price table → `cost_usd` column computed at ingest.
4. **Trace detail**: `GET /v1/traces/:id` returns the full prompt and response.
5. **Integration tests**: run Fastify `inject()` against a test database (a GitHub Actions `services: postgres` block).
6. **OpenTelemetry on the API itself**: `@opentelemetry/sdk-node` with auto-instrumentation for http, pg and fastify,
   exported to a local Jaeger in docker-compose. Screenshot a trace waterfall for the README.

*Gives you:* Node.js, Postgres, SQL performance, OpenTelemetry.

## Week 2: frontend performance (your strength, now with numbers)
1. **Virtualized trace grid**: TanStack Table + TanStack Virtual over the 100k seed rows, with sort, filter (model/status)
   and infinite scroll on the keyset cursor. Measure scroll FPS and memory in the Chrome Performance panel, before and after virtualizing.
2. **Live tail**: a WebSocket (`@fastify/websocket`) pushes new traces; the grid prepends them without dropping frames.
   Batch updates in a `requestAnimationFrame` and note the FPS with 50 traces/sec arriving.
3. **Charts**: p95 latency over time and cost per model (Recharts or visx), from `/v1/stats`.
4. **Trace detail drawer**: prompt/response viewer, keyboard navigable (j/k), proper ARIA.
5. **Performance budget in CI**: Lighthouse CI on the built app, failing the build if LCP > 2.5s or the JS bundle > a fixed size.
6. **Playwright E2E**: ingest a trace through the API, then assert it appears in the grid.

*Gives you:* performance with numbers, real-time UI, testing, accessibility, data-heavy UI.

## Week 3: AI feature, AWS deploy, polish
1. **"Explain this failure" agent**: from a failed trace, call Claude with tool use (`get_trace`, `get_similar_traces`,
   `get_stats`) so it diagnoses the failure using real data. Trace the agent's own calls through the SDK
   (TraceLens tracing itself makes a good demo).
2. **Deploy on AWS**:
   - API → ECS Fargate (or App Runner if you want it simpler); Postgres → RDS (smallest instance) or Neon to stay free
   - Web → Amplify or Vercel; infra as code with a small CDK or Terraform file
   - GitHub Actions deploys on merge to main (OIDC role, no long-lived keys)
3. **Publish the SDK** to npm as `@<you>/tracelens` with a README.
4. **README**: a 30-second GIF, an architecture diagram, METRICS.md numbers, "how to run locally".
5. **Write it up**: one blog post ("Rendering 100k LLM traces at 60fps") → link it from your LinkedIn and CV.

*Gives you:* AWS, CI/CD deploy, agentic AI with tool calling, a published package.

## What goes on the CV (fill in real numbers once you've measured them)
- Built TraceLens, an open-source observability dashboard for LLM apps (Next.js, TypeScript, Fastify, Postgres, AWS ECS).
- Rendered 100k traces at __ fps with a virtualized TanStack grid and live WebSocket tail; LCP __s enforced by Lighthouse CI.
- Instrumented the Node.js API with OpenTelemetry; cut p95 stats-query time from __ms to __ms with composite indexes.
- Built a Claude tool-calling agent that diagnoses failed LLM calls from trace data.

## Stretch (only if a JD you want asks for it)
- Vue port of the grid (HighLevel, GitLab) · GraphQL read API · ClickHouse instead of Postgres for traces
