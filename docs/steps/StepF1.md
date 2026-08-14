# Wandr — F1 outline: Session shell

> **Outline only.** Expand into full fenced prompts (copy [`_template.md`](_template.md)) after **F0 ship checklist** is green.
> Blueprint SSOT: [`docs/blueprint.md`](../blueprint.md) — F1. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §5, §8 auth.

**Do not implement F1 from this outline.** Do not treat these bullets as a paste-complete prompt.

## Phase goal

Cookie session probe + minimal chrome. Guest path stays unblocked. FastAPI owns auth; FE is a cookie client.

## Expand after

F0 ship: gateway, generated types, Query + toaster, Wandr `AGENTS.md`.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 1.1 | `lib/api/auth.ts` + `useAuthMe`; `GET /api/v1/auth/me`; 401/5xx → guest UI | No destination search |
| 1.2 | Login CTA → `{API}/api/v1/auth/google`; logout mutation; OAuth-gap helper text | Do not pretend bounce works (`frontendGuide.md` §11) |
| 1.3 | Header: brand, guest/user chip, login/logout; search entry reachable as guest | Do not block browsing while guest |

## Failure modes to name when expanding

- `/me` network blip: 1 retry then treat as guest + reconnect
- 401/5xx: guest UI, not crash
- OAuth success may land on API JSON page — document CTA, do not block guest generate

## Likely run batches (confirm when expanding)

| Batch | Sub-steps | Notes |
|-------|-----------|--------|
| F1a | 1.1 → 1.2 | Auth module + login/logout (tightly coupled) |
| F1b | 1.3 | Shell chrome only |

F1 is ~1 day; if prompts stay small, a single F1a session of 1.1–1.3 is acceptable — split if the agent starts stuffing DB-ish logic into components.

## LLD

Cookie session probe. Query key `["auth","me"]`. Invalidate on logout.
