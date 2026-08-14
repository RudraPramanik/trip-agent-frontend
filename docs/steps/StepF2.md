# Wandr — F2 outline: Destinations search + readiness

> **Outline only.** Expand after **F1** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F2. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §8 destinations.

**Do not implement F2 from this outline.**

## Phase goal

Search destinations and show readiness. Guest can reach generate. Never invent `search_available`. Never hard-block `sparse`.

## Expand after

F1 ship: guest chrome + `/auth/me`.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 2.1 | `GET /destinations/search?q=`; q min 2; debounce ~300ms; 429 backoff toast | No SSE / compose form |
| 2.2 | Readiness card: `tier` / `score` / `place_count` / `enriched_pct` / `indexed_pct` / `message`; generate enabled at every tier | No hard-block on `sparse`; no invented fields |

## Failure modes to name when expanding

- `q` < 2 → no request
- 429 / `rate_limit_exceeded` (live 20/min/IP) → toast + brief CTA disable
- Empty list → empty UI
- 404 destination → not-found
- `ready` / `limited` / `sparse`: generate still enabled; `sparse` warning more prominent

## Likely run batches

| Batch | Sub-steps |
|-------|-----------|
| F2a | 2.1 search (+ RHF/Zod if installing here) |
| F2b | 2.2 readiness gate |

## LLD

Domain module + Query. Null / empty UI. Packages: `react-hook-form`, `zod`, `@hookform/resolvers` at 2.1 or 3.1 (once).
