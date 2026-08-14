# Wandr — F6 outline: Day edit

> **Outline only.** Expand after **F5** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F6. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §8 trips edit + places.

**Do not implement F6 from this outline.**

## Phase goal

Owner edit mutations (reorder / add / remove / reoptimize) plus places picker. No blind mutation retries.

## Expand after

F5 ship: list/claim/delete for authed users.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 6.2 | Places picker: `GET /places?destination_id=`; 404 unknown destination; empty page OK | Prefer picker **before** or with add-stop |
| 6.1 | Edit mutations; invalidate trip + geojson keys; 403/409/422/429 toasts; rollback if optimistic | No LLM/planner on the edit path |

## Failure modes to name when expanding

- 403 owner mismatch
- 409 conflict / duplicate stop
- 422 validation
- 429 trip-edit rate limit
- Mutations: **no** automatic retry

## Likely run batches

| Batch | Sub-steps | Notes |
|-------|-----------|--------|
| F6a | 6.2 | Places picker first so add-stop has a real source |
| F6b | 6.1 | Edit mutations |

If add-stop without picker is too fake, keep 6.2 before 6.1 (unlike blueprint numeric order).

## LLD

Query invalidation on `["trips", id]` + geojson. Bodies: `ReorderStopsIn`, `AddStopIn` from generated types.
