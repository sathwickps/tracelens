# TraceLens

Portfolio project for Sathwik P S (frontend/full-stack engineer: React, Next.js, TypeScript).
**Purpose:** close specific resume gaps that came up across ~27 frontend/full-stack job descriptions:
Node.js backend, observability/OpenTelemetry, AWS, and performance work with *measured* numbers.
Every feature should serve one of those gaps; skip anything that doesn't.

## Roadmap
`PLAN.md` is the source of truth: 3 weeks with checkboxes. Check items off as they land.
Before starting work, read PLAN.md and pick the first unchecked item in the current week.

## Stack
- `apps/api`: Fastify 5 + `pg` (Postgres 16), TypeScript run via `tsx` (no build step). Schema in `apps/api/schema.sql`.
- `apps/web`: Next.js 15 App Router, React 19.
- `packages/sdk`: `traced(anthropicClient)` wraps `messages.create` and ships a trace to the API. Fire-and-forget.
- npm workspaces. Node 22+ (local is 24).

## Commands
```bash
docker compose up -d           # Postgres on host port 5433 (5432 is taken locally)
npm run dev:api                # :4000
npm run dev:web                # :3000
npm run seed -w api [-- N]     # replaces ALL traces with N synthetic ones (default 100k)
npm test                       # node:test via tsx
npm run typecheck
npm run example -w @tracelens/sdk   # needs ANTHROPIC_API_KEY in .env
```
Schema changes: `schema.sql` only runs on a fresh volume, so use `docker compose down -v && docker compose up -d`.

## Conventions
- Keep it small: no abstractions without a second user, stdlib/native first, no new dependency for a few lines.
- Validate all ingest input at the API boundary (`src/trace.ts`); keep validators pure and unit-tested.
- Tests: `node:test` + `node:assert`, files named `*.test.ts` next to the code.
- Pagination is keyset (`created_at, id`), never OFFSET.
- Claude model IDs: default `claude-haiku-5-5` for cheap calls, `claude-sonnet-5-5` for the agent.
- Commits: small, imperative subject line.

## Metrics: the point of this project
Record every performance measurement in `METRICS.md` (create it on first measurement):
what was measured, how (tool, data size, machine), before → after, and the date.
**Never invent or estimate a number.** CV bullets are written only from METRICS.md entries.
The candidate's CV lives in a separate repo (`~/Downloads/career-ops/cv.md`); don't edit it from here.
