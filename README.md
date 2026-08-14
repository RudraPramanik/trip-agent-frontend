# Wandr frontend

Next.js client for the Wandr API (sibling repo `guideagent`). This directory **is** the app — do not run `create-next-app` or add a nested `wandr-web/` folder.

## Requirements

- **Node** 20+ (`engines.node`)
- **npm** (`package-lock.json`) — do not add `yarn.lock` or `pnpm-lock.yaml`

## Local dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` (never commit `.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_MAP_STYLE_URL=
```

Do not put `DATABASE_URL`, Redis, LLM, or OAuth secrets in this repo — those belong on the API.

Health smoke: `GET {API}/api/v1/health`.

## Type-lock

Whenever backend DTOs or routes change, start the API and regenerate wire types (same discipline as `alembic upgrade head`):

```bash
npm run gen:types
```

Commit the diff in `types/generated/api.d.ts`. Never hand-edit that file.

Notes from the current OpenAPI snapshot (do not invent missing fields):

- `POST /api/v1/trips/{trip_id}/claim` is present.
- `GET /api/v1/health` 200 schema is empty in OpenAPI (`response_model=None`); the client parses a generic `ApiResponse`.
- `itinerary_done` appears in the planner generate description, not as a typed schema with `trip_id`.

## Docs

- [`docs/blueprint.md`](docs/blueprint.md) — FE build bible (phases, guardrails, proofs)
- [`docs/frontendGuide.md`](docs/frontendGuide.md) — wire contract (endpoints, envelopes, DTOs)
