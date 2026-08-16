## 1. Hostname helper

- [x] 1.1 Add a read-only page-vs-API hostname mismatch helper next to `getPublicApiUrl` in `lib/config.ts`. Undefined page hostname (SSR) MUST be treated as no mismatch. MUST NOT rewrite `NEXT_PUBLIC_API_URL`. MUST NOT read `wandr_session` from JavaScript.

## 2. Planner compose warning

- [x] 2.1 On compose, when the helper is true, show a visible host-mismatch warning that guest cookies may not stick on `GET /trips/{id}` and that app + API must use the same host. Do not block submit. Omit the warning when hosts match.

## 3. Trip forbidden copy

- [x] 3.1 Keep guest 403 title and no login CTA. Add generate-in-this-session guidance. When the helper is true, add the host-mismatch hint; omit that hint when hosts match. Authenticated 403 copy MUST stay unchanged.

## 4. Docs and stop

- [x] 4.1 Update `docs/issues/issue.md` with the guest-403-after-generate trap (`localhost` vs `127.0.0.1`, curl/other-session `trip_id`) and that backend ownership 403 is correct.
- [x] 4.2 Stop — do not edit `guideagent` CORS or `assert_can_access`, do not add FE env vars or packages, do not mark F6 shipped from this change.
