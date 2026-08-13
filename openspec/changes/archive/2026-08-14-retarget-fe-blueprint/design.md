## Context

See `proposal.md` for why. This change edits one file: `docs/blueprint.md` (currently titled v1.1). The Next.js scaffold already exists at the repo root (`package.json` has Next 16, React 19, Tailwind 4). Cross-links inside the blueprint still name `docs/FE_guide.md`, `docs/blueprint_frontend.md`, and `docs/blueprint_final.md`, which are not the filenames in this repo.

Constraint: conflict rule for wire shapes stays (live OpenAPI → FE guide → this blueprint). This patch must not pick winners for `itinerary_done.trip_id` or `POST /trips/{id}/claim`.

## Goals / Non-Goals

**Goals:**
- Make F0.1 impossible to read as “run create-next-app again.”
- Make doc lookups resolve to files that exist in this repo.
- Keep v1.1 phase order, stack, proofs, and failure contracts intact.

**Non-Goals:**
- Filling `docs/steps/StepF*.md`.
- Editing `docs/frontendGuide.md`, `docs/impSpec.md`, or application code.
- Writing `AGENTS.md` content in this change (F0.1 of a later apply does that).
- Redesigning F0.2–F7 or inventing API fields.

## Decisions

### 1. Version this as v1.1.1 (patch), not v1.2

Keep the v1.1 changelog table. Add a short “What changed vs v1.1 (this repo)” table with the retarget rows only. A v1.2 label would imply product/contract changes that are not happening.

**Alternative considered:** Silent in-place edit with no version bump. Rejected — later readers would not know F0.1 was rewritten on purpose.

### 2. Mapping box + path aliases, not a prose rewrite

Add a **This repo** box immediately after the title block:

| In the original FE docs | File in this repo |
|---|---|
| `docs/FE_guide.md` | `docs/frontendGuide.md` |
| `docs/blueprint_frontend.md` | `docs/blueprint.md` (this file) |
| `docs/blueprint_final.md` | `docs/impSpec.md` (backend half) |

Then mechanically replace those three path strings everywhere in `docs/blueprint.md` (doc-relationship table, conflict rule, AGENT “when in doubt”, package-table footer, footer source line). Do not rewrite surrounding sentences.

**Alternative considered:** Mapping box only, leave old paths in the body. Rejected — agents grep for the path in the sentence they are executing and would still 404.

**Alternative considered:** Also patch `docs/frontendGuide.md` the same way. Out of scope for this slice; the blueprint is the F-step SSOT. Note the leftover pointer as a known leftover, not a task here.

### 3. Guardrail file is `AGENTS.md`

This repo already has `AGENTS.md` (Next.js / Cursor). F0.1 and the AGENT section intro must say: paste the guardrail block into **`AGENTS.md`**. Do not create a second `AGENT.md`. The fenced paste-block itself can keep the heading `# AGENT.md — Wandr Frontend Coding Guardrails` as document identity; the on-disk file is `AGENTS.md`.

**Alternative considered:** Keep `AGENT.md` as the blueprint filename to match the backend repo. Rejected — two guardrail files in one Cursor project is the exact footgun this patch is meant to close.

### 4. F0.1 becomes “retarget existing scaffold”

Replace the current “Create Next.js App Router repo” bullets with:

- This directory **is** the FE app. Do not run `create-next-app`. Do not add a nested `wandr-web/` folder.
- Replace the default `app/page.tsx` / README later (still F0.1 *when implementing F0*; this docs change only *describes* that). For the blueprint text: “existing create-next-app tree is the starting point; add the feature-folder skeleton (`features/`, `lib/api/`, `types/generated/`, `scripts/`) as empty modules.”
- Write FE guardrails into `AGENTS.md` from the paste-block **before** feature screens.
- Proof: folder tree present; `AGENTS.md` contains the Wandr FE hard rules (not only the Next.js stub); `npm run dev` still boots. Do **not** require a fresh `create-next-app` proof.

The project-structure tree may keep `wandr-web/` as an illustrative name with one line: “name illustrative — this repo is `guideagent-frontend`.”

### 5. Package table: annotate, don’t delete rows

Mark step 0.1 (Next.js, React, TypeScript, ESLint) and the Tailwind v4 portion of 0.5 as **already present in this repo — do not reinstall**. Leave shadcn/ui + Lucide as still-to-install at 0.5. Do not remove rows; later readers still need the intended stack.

### 6. Deferred verify line only — no wire-shape edits

Add one row to **Deferred / known gaps**:

- Confirm `POST /api/v1/trips/{id}/claim` and `itinerary_done` `trip_id` against live OpenAPI during F0.6. Do not invent fields in FE docs.

Leave SSE examples and the trips auth matrix as they are.

## Risks / Trade-offs

- [Agents still follow a cached “create sibling repo” sentence] → Mitigation: F0.1 title + first bullet are explicit negatives (“do not create-next-app”); this-repo box is the first thing after the title.
- [`frontendGuide.md` still says `blueprint_frontend.md`] → Mitigation: accepted leftover; blueprint is the F-step entry point. A later docs hygiene slice can mirror the mapping.
- [Mechanical path replace misses a variant (`FE_guide` without `docs/`)] → Mitigation: apply replace for both `docs/FE_guide.md` and bare `FE_guide.md` where it means the wire-contract file; do not touch historical “v1.0 gap” wording that quotes the old name as history.
- [F0.1 blueprint text could be read as “implement the scaffold in this docs change”] → Mitigation: this change’s tasks.md edits `docs/blueprint.md` only. Applying F0 is a different change.

## Migration Plan

1. Edit `docs/blueprint.md` in place (single file, no deploy).
2. Rollback: revert that file; no runtime impact.
3. After merge, the next OpenSpec change that implements F0.1 must follow the rewritten bullets, not v1.1’s create-repo bullets.

## Open Questions

None. Claim/SSE field confirmation is deferred to F0.6 by Decision 6 and does not change this patch’s tasks.
