## Context

See proposal.md — Why. Panic log root cause is Turbopack failing `get_next_server_import_map` with `Next.js package not found` during HMR for `/generate/page`, while `node_modules/next@16.2.6` resolves from this package via Node. BE at `NEXT_PUBLIC_API_URL` is healthy. Canonical compose entry today reads only `searchParams.destination` in `app/generate/page.tsx`; readiness links already use that shape.

## Goals / Non-Goals

**Goals:**

- Stop recurring Turbopack FATAL on `/generate` during local `next dev` by pinning project root.
- Give a recoverable local path (clean `.next`, optional webpack) if panic persists.
- Align query seeding with PlanRequest field name without changing POST SSE behavior.

**Non-Goals:**

- Changing planner SSE client, clarification, or trip navigation.
- Inventing endpoints/DTOs or parent-workspace OpenSpec work.
- Completing `verify-generate-trip-after-api-fix` (separate; run after this is green).
- Guaranteeing zero Turbopack bugs on all Windows setups — webpack is the escape hatch.

## Decisions

1. **`turbopack.root` = this package directory**  
   Set in `next.config.ts` to the directory that contains `package.json` / `node_modules/next` (typically `__dirname` / `import.meta` equivalent for the config file).  
   *Why:* Matches Next’s guidance when Turbopack’s root inference fails even if Node resolves `next`.  
   *Alt considered:* Only delete `.next` — necessary but insufficient if root keeps misfiring.  
   *Alt considered:* Always force webpack — works but slower and hides Turbopack regressions; keep as fallback script only.

2. **Query precedence: `destination` then `destination_id`**  
   Parse both as optional string/array (first element if array); trim; first non-empty wins.  
   *Why:* Preserves readiness links; accepts accidental PlanRequest-shaped URLs.  
   *Alt considered:* Prefer `destination_id` — would break documented canonical param. Rejected.

3. **Optional `dev:webpack` script**  
   Add `next dev --webpack` (or current Next 16 equivalent flag) as a named script if Turbopack still panics after root pin + clean `.next`.  
   *Why:* Isolates toolchain without changing default `npm run dev`.  
   *Alt considered:* Switch default to webpack — too blunt for the whole team.

4. **Compose form must not native-GET**  
   Default HTML form method is GET. If React `preventDefault` loses a race (slow hydration / automation), fields serialize into the query and wipe `?destination=`. Fix: `method="post"` + explicit `preventDefault` before `handleSubmit`; seed PlanRequest `destination_id` from the page prop (hidden input `value={destinationId}`), not RHF `register` (was landing empty in the DOM).  
   *Why:* Matches the observed `/generate?destination_id=&raw_input=…` loop that coincided with Turbopack panics.

## Risks / Trade-offs

- [Risk] Turbopack root pin does not fix a corrupted cache → Mitigation: task to delete `.next` before retest; reinstall only if resolve still fails.
- [Risk] Webpack fallback diverges from prod Turbopack builds → Mitigation: default remains Turbopack; fallback is local-only.
- [Risk] Alias encourages bookmarking `destination_id` → Mitigation: readiness CTA stays on `destination`; docs note canonical param.
- [Risk] Confusing with verify-after-api-fix change → Mitigation: tasks explicitly sequence stabilize → then verify.

## Migration Plan

1. Apply config + query parse; stop any running `next dev`.
2. Delete `.next`; restart `npm run dev`; open `/generate?destination=<ready-uuid>`.
3. If FATAL remains, use webpack script once to unblock smoke; file/note Turbopack version if still broken.
4. Rollback: revert `next.config.ts` / page parse / script; no data migration.
