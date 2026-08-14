<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENT.md — Wandr Frontend Coding Guardrails

## Hard rules — never violate, never simplify away

### Architecture
- All HTTP to the API goes through `lib/api/client.ts` (+ domain modules). Never scatter raw `fetch` with ad-hoc URLs.
- Every cookie-scoped call MUST use `credentials: "include"`.
- Do NOT store access tokens in `localStorage`, sessionStorage, or readable JS cookies.
- Server/async state: TanStack Query. Ephemeral UI (wizard, map selection, session narrative cache): thin Zustand only — never Redux.
- Feature folders (`features/auth`, `destinations`, `planner`, `trips`) over dumping everything in `components/`.
- FastAPI owns auth. No Better Auth / NextAuth session ownership in MVP.
- Do NOT invent endpoints, DTO fields, or evaluation HTTP clients. Follow `docs/frontendGuide.md` + OpenAPI.
- 🆕 Hand-written types in `types/` are a thin domain layer ONLY. The source of truth for wire shapes is `types/generated/api.d.ts` (generated from OpenAPI — see F0.6). Never hand-edit generated files; regenerate instead.

### Resilience / UX (non-negotiable)
- Every API `fetch` MUST accept an `AbortSignal` (or equivalent timeout abort).
- Mutations: no blind automatic retries. Idempotent GETs may use at most one bounded retry on network blip.
- Map `ErrorResponse.code` (and non-JSON failures) to user-visible toasts / panels — never infinite spinners.
- Rate limit `429` / `rate_limit_exceeded` → backoff messaging + brief CTA disable.
- Map tile / style failure MUST leave day list / trip detail usable (list-first).
- Missing GeoJSON LineStrings → render Point features only; never invent coordinates.
- 🆕 A 403 caused by guest-session mismatch (`wandr_session` cookie doesn't match `Trip.session_id`) MUST render distinct copy from a generic ownership 403 — see Failure Boundary Summary. Do not collapse both into one generic "forbidden" panel.

### Streaming (non-negotiable)
- Planner generate uses POST `fetch` + `ReadableStream` parsing of `event:` / `data:` frames.
- NEVER use browser `EventSource` for `/planner/generate` (GET-only).
- Abort the stream on unmount / navigate-away, using a real `AbortController` passed into `fetch` — this is what allows the backend's `request.is_disconnected()` poll to actually cancel the background task. A client that merely stops reading without aborting the underlying request leaves the server generating (and billing LLM tokens) needlessly.
- Do NOT auto-retry a full generate without explicit user action.
- Pre-stream HTTP 409 `destination_not_ready` is not SSE — route to readiness gate UI.
- Cache replay may omit `tool_*` events — treat as normal.
- After `itinerary_done`, navigate via `trip_id` then `GET /trips/{id}` (+ `/geojson`). Do not treat the full SSE blob as the long-term UI model.
- Narrative MVP (Option A): may cache day title/narrative from `itinerary_done` in session UI state keyed by `trip_id`; hard reload may lose prose. Do not invent a narrative API.
- 🆕 `clarification_needed` is terminal but NOT an error. On the user's answer, re-submit a **fresh** `POST /planner/generate` call with `raw_input` = original input + a newline + the answer. Do not attempt to "resume" the prior stream — there is no resume endpoint.

### Content rendering (non-negotiable) 🆕 v1.1
- LLM-authored day narrative (title/prose from `itinerary_done` / `GET /trips/{id}`) renders via `react-markdown` + `remark-gfm` ONLY.
- NEVER add `rehype-raw`, NEVER use `dangerouslySetInnerHTML` for narrative content, even for "just a little" custom formatting. Treat narrative text as untrusted.

### Code conventions
- TypeScript strict. Wire types generated from OpenAPI (`types/generated/`); domain types in `types/` compose/narrow them. Schemas win on drift — regenerate, don't patch by hand.
- FE env: only `NEXT_PUBLIC_*` (API URL, map style). Never `DATABASE_URL`, `REDIS_*`, `LLM_*`, OAuth secrets.
- No new packages without package.json justification and installing at the F-step that needs them.
- Envelope exceptions: bare `PaginatedResponse`, raw GeoJSON, SSE frames, HTTP 204 — branch parsers; do not force `ApiResponse`.

### When in doubt
- Check Resilience / UX Contracts in `docs/blueprint.md`.
- Check live auth matrix in `docs/frontendGuide.md` §8.
- Prefer empty/error UI over fake data.
