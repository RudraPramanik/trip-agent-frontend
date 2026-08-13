## 1. Header retarget

- [ ] 1.1 Change the title line of `docs/blueprint.md` from v1.1 to v1.1.1 and note it is a repo-retarget patch, not a product redesign
- [ ] 1.2 Insert a **This repo** box immediately after the title block: this directory is the FE app; do not create another Next.js app; map `docs/FE_guide.md` → `docs/frontendGuide.md`, `docs/blueprint_frontend.md` → `docs/blueprint.md`, `docs/blueprint_final.md` → `docs/impSpec.md`
- [ ] 1.3 Add a short “What changed vs v1.1 (this repo)” table (retarget rows only); keep the existing v1.1 changelog table

## 2. Path aliases

- [ ] 2.1 Update the **Doc relationship** table to the filenames that exist in this repo (`frontendGuide.md`, `blueprint.md`, `impSpec.md`)
- [ ] 2.2 Mechanically replace remaining `docs/FE_guide.md` / `FE_guide.md` (wire-contract meaning), `docs/blueprint_frontend.md`, and `docs/blueprint_final.md` path strings in `docs/blueprint.md`; leave historical “v1.0 gap” quotes that mention the old name as history
- [ ] 2.3 Add one line above the project-structure tree: `wandr-web/` is illustrative — this repo is `guideagent-frontend`

## 3. F0.1 and guardrails filename

- [ ] 3.1 Rewrite F0.1: this directory is the FE app; do not run `create-next-app`; do not add a nested `wandr-web/`; start from the existing scaffold; add empty feature-folder modules (`features/`, `lib/api/`, `types/generated/`, `scripts/`)
- [ ] 3.2 Point F0.1 and the AGENT section intro at `AGENTS.md` (paste the existing fenced block into that file when F0 is implemented). Do not instruct creating a second `AGENT.md`. Leave the fenced paste-block heading as-is
- [ ] 3.3 Change F0.1 proof to: tree present; `AGENTS.md` holds Wandr FE hard rules (not only the Next.js stub); `npm run dev` still boots — not a fresh `create-next-app` proof

## 4. Install table and deferred verify

- [ ] 4.1 Annotate package install row 0.1 (Next.js, React, TypeScript, ESLint) and the Tailwind v4 portion of 0.5 as already present — do not reinstall. Keep shadcn/ui + Lucide as still-to-install at 0.5. Do not delete rows
- [ ] 4.2 Add one **Deferred / known gaps** row: confirm `POST /api/v1/trips/{id}/claim` and `itinerary_done` `trip_id` against live OpenAPI in F0.6; do not invent fields in this patch
- [ ] 4.3 Confirm F0.2–F7 body, stack lock, failure contracts, and SSE/DTO examples were not rewritten; confirm no edits outside `docs/blueprint.md`
