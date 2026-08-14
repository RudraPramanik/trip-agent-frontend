# Wandr — F4 outline: Trip detail + MapLibre

> **Outline only.** Expand after **F3** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F4. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §8 trips, §15 GeoJSON.

**Do not implement F4 from this outline.**

## Phase goal

Trip is the durable artifact: `GET /trips/{id}` + GeoJSON map. Degrade the map, don’t blank the trip. Narrative is untrusted markdown only.

## Expand after

F3 ship: generate navigates with `trip_id`; abort proof noted.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 4.1 | Trip detail from `TripOut`; Option A narrative overlay if cached; two distinct 403 panels | No `rehype-raw` / `dangerouslySetInnerHTML` |
| 4.2 | MapLibre + MapTiler style; points if no LineStrings; tile fail → list-first | OSM tiles **dev only**; never invent lat/lng |

## Failure modes to name when expanding

- 404 trip → not-found panel
- 403 ownership (logged-in) vs 403 guest-session-mismatch — **distinct copy**; backend currently same `forbidden` body — distinguish by viewer context (guest vs authed)
- Missing narrative after reload → omit prose, no fake text
- Tile/style failure → collapse map, day list remains

## Likely run batches

| Batch | Sub-steps |
|-------|-----------|
| F4a | 4.1 trip detail (+ `react-markdown` + `remark-gfm`) |
| F4b | 4.2 GeoJSON + MapLibre |

## LLD

List-first degrade. Query keys `["trips", id]` and `["trips", id, "geojson"]`.
