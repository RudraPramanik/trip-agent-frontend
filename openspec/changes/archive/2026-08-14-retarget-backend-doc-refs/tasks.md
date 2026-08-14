## 1. Blueprint v1.1.2 header and map

- [x] 1.1 Change the title line of `docs/blueprint.md` from v1.1.1 to v1.1.2 and note it is a repo-hygiene patch (impSpec removed), not a product redesign
- [x] 1.2 Replace live header lines that name `docs/impSpec.md` as the backend SSOT with: API repo (`guideagent`) `docs/blueprint_final.md`; do not vendor it here. Do not use a `../guideagent` filesystem path
- [x] 1.3 Update the **This repo** mapping table third row: `docs/blueprint_final.md` → not in this repo — API repo (`guideagent`) `docs/blueprint_final.md`. Do not vendor
- [x] 1.4 Add a short “What changed vs v1.1.1” table (impSpec removed; pointers go to the API repo). Keep the v1.0 and v1.1.1 changelog tables; leave the v1.1.1 row that mentions `impSpec.md` as history

## 2. Blueprint doc-relationship and remaining live pointers

- [x] 2.1 Rewrite the **Doc relationship** table: drop local `docs/impSpec.md` and `docs/context.md` rows; add one row that backend bible / checkpoint live in the API repo (`guideagent`): `docs/blueprint_final.md`, `docs/context.md`
- [x] 2.2 Retarget the footer source line (and any other **live** `docs/impSpec.md` pointer outside the v1.1.1 history table) the same way. Leave the local-verification “In **API** repo” line, naming `docs/context.md` as that repo’s file
- [x] 2.3 Confirm F0–F7 body, stack lock, failure contracts, and SSE/DTO examples were not rewritten

## 3. frontendGuide identity leftovers

- [x] 3.1 Point the `docs/frontendGuide.md` header phased-bible line at `docs/blueprint.md`. Drop `docs/blueprint_frontend.md` and `docs/fe_suggestins.md` as if they lived in this repo
- [x] 3.2 Qualify remaining `docs/context.md` mentions (header, conflict table, proxy note, §10 seed comment) as API repo (`guideagent`) `docs/context.md`
- [x] 3.3 Rewrite §1 repo table: this repo is `guideagent-frontend` (Next.js); sibling API is `guideagent`. Fix the non-goals line that still says scaffolding inside this API repo
- [x] 3.4 Confirm §§2–16 stack, envelopes, SSE, DTOs, and auth matrix were not rewritten

## 4. Confirm impSpec stays gone

- [x] 4.1 Confirm `docs/impSpec.md` is absent; if it was re-added, delete it. Do not create a stub or archive copy. Confirm no edits outside `docs/blueprint.md` and `docs/frontendGuide.md` (plus this deletion if needed)
