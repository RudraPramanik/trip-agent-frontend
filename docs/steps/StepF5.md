# Wandr — F5 outline: Claim & trip list

> **Outline only.** Expand after **F4** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F5. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §8 trips (Required auth).

**Do not implement F5 from this outline.**

## Phase goal

Authenticated trip list, claim, delete. Until `FRONTEND_URL` bounce works, claim is best-effort on local Option A cookies.

## Expand after

F4 ship: trip detail + map degrade.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 5.1 | `GET /trips` bare paginated; 401 → login CTA (OAuth gap); empty UI | No anonymous list |
| 5.2 | `POST /trips/{id}/claim`; distinct copy for session-mismatch / already-claimed / unauthenticated | Do not claim without login |
| 5.3 | `DELETE /trips/{id}` HTTP 204; drop from list cache | No anonymous delete |

## Failure modes to name when expanding

- 401 on list → login, don’t spin
- 403/409 on claim — not one generic toast
- 403/404 on delete
- Confirm claim path against generated OpenAPI (F0.6 verify line) — do not invent fields

## Likely run batches

| Batch | Sub-steps |
|-------|-----------|
| F5a | 5.1 list |
| F5b | 5.2 + 5.3 claim and delete |

## LLD

Invalidate `["trips","list"]` and `["trips", id]` on claim/delete.
