# TraceLens

Observability for LLM apps: capture every model call (latency, tokens, cost, errors) and explore it in a fast dashboard.

## Run locally
```bash
cp .env.example .env          # add ANTHROPIC_API_KEY to try the SDK example
docker compose up -d          # Postgres on :5433, schema auto-applied
npm install
npm run dev:api               # http://localhost:4000
npm run dev:web               # http://localhost:3000
npm run example -w @tracelens/sdk   # sends one real traced Claude call
```

## Layout
- `apps/api`: Fastify ingest + query API (Postgres)
- `apps/web`: Next.js dashboard
- `packages/sdk`: `traced(anthropicClient)` wrapper that ships traces to the API

See `PLAN.md` for the roadmap.
