## Why

Local `npm run dev` is panicking with Turbopack FATAL (`Next.js package not found` while writing `/generate/page`) even though `next@16.2.6` is installed and the sibling API health check is green. That blocks the guest compose → generate smoke path. Separately, some `/generate` hits use empty `destination_id=…` query shapes that never seed compose (`destination` is the canonical param), so generate never POSTs.

## What Changes

- Pin Turbopack’s project root to this package (where `node_modules/next` lives) so HMR/import-map resolution stops failing on `/generate`.
- Document a short local recovery path: stop dev, delete `.next`, restart; optional webpack fallback if Turbopack still panics.
- Harden `/generate` query parsing: prefer non-empty `destination`; if missing, accept non-empty `destination_id` as the same compose seed. Empty values still show pick-a-destination UI (no invented uuid).
- Stop compose from native-GET serializing fields into the URL (wipes `destination`); seed PlanRequest `destination_id` from the page prop.
- Keep readiness → Generate links on `?destination=` (canonical). No API, SSE, or auth changes.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `planner`: Compose entry MAY seed `destination_id` from `destination_id` query when `destination` is absent/empty; empty/missing still blocks generate without inventing an id.

## Impact

- `next.config.ts` (turbopack root); `app/generate/page.tsx` (query parse); optional `package.json` webpack fallback script; brief note in `docs/issues/issue.md` or AGENTS-adjacent ops only if needed.
- Orthogonal to `verify-generate-trip-after-api-fix` (that change verifies BE SSE terminals). Run this stabilize change first so verify can actually load compose.
- No `NEXT_PUBLIC_*` secrets; no OpenAPI/DTO inventing; no parent vault move.
