## 1. Turbopack / local recover

- [x] 1.1 Set `turbopack.root` in `next.config.ts` to this package directory (where `node_modules/next` lives).
- [x] 1.2 Add optional `dev:webpack` script (`next dev --webpack` or current Next 16 equivalent) without changing default `npm run dev`.
- [x] 1.3 Stop running `next` processes; delete `.next`; restart `npm run dev` and confirm `/generate` loads without FATAL `Next.js package not found` panic (use `dev:webpack` only if Turbopack still panics).

## 2. Compose query seeding

- [x] 2.1 In `app/generate/page.tsx`, resolve compose id: first non-empty trimmed of `destination`, then `destination_id` (array → first element); pass through to `PlannerCompose`.
- [x] 2.2 Confirm empty/`destination_id=` alone still shows pick-a-destination UI and does not invent a uuid or POST generate.
- [x] 2.3 Confirm readiness “Generate” link still uses `/generate?destination=<id>` and that value wins when both params are present.

## 3. Smoke vs verify handoff

- [x] 3.1 With API healthy and a ready destination, open compose via canonical `?destination=`, submit generate, and confirm no Turbopack FATAL during the session (full trip landing is owned by `verify-generate-trip-after-api-fix`).
- [x] 3.2 If needed, add a one-line note in `docs/issues/issue.md` that local FATAL was Turbopack/root (not BE) and link this change — do not archive the verify change from here.
