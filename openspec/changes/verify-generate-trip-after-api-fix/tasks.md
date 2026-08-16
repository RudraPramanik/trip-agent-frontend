## 1. Prerequisites

- [ ] 1.1 Confirm sibling BE change `fix-planner-generate-sse-terminals` is applied locally or merged; API healthy at the same host as `NEXT_PUBLIC_API_URL`.
- [ ] 1.2 Confirm a ready destination (place_count above floor); note destination id ≠ trip id.

## 2. E2E verify

- [ ] 2.1 Guest compose → generate; confirm progress SSE then exactly one terminal.
- [ ] 2.2 On `itinerary_done`, confirm non-empty `trip_id` and UI navigates to `/trips/{trip_id}` in the same browser session; trip GET 200.
- [ ] 2.3 On intentional failure path (if still reproducible), confirm `generation_timeout` / error panel with no auto-retry.

## 3. Docs / optional UX

- [ ] 3.1 Update `docs/issues/issue.md` (resolved or remaining API blockers only).
- [ ] 3.2 Optional: clearer `generation_timeout` copy in compose (still no auto-retry; no FE LLM keys).
- [ ] 3.3 Stop — do not expand into Layla or mark F6 shipped from this change alone.
