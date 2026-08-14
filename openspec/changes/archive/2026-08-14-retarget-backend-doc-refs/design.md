## Context

See `proposal.md` for why. `docs/impSpec.md` is already deleted. Live pointers in `docs/blueprint.md` (header, this-repo mapping row, doc-relationship table, footer) and identity leftovers in `docs/frontendGuide.md` still name files that are not in this repo.

Constraint: conflict rule for wire shapes stays (live OpenAPI → `frontendGuide.md` → this blueprint). This patch must not rewrite F0–F7, stack, SSE examples, or pick winners for unverified fields.

## Goals / Non-Goals

**Goals:**
- Every live “backend bible / checkpoint” pointer resolves to the API repo, not a path under this `docs/`.
- `frontendGuide.md` no longer claims this directory is `guideagent`.
- Keep v1.1.1 phase order, stack, proofs, and failure contracts intact.

**Non-Goals:**
- Recreating or archiving a copy of `impSpec.md` in this repo.
- Filling `docs/steps/StepF*.md`.
- Writing `AGENTS.md` Wandr guardrails (F0.1 of a later change).
- Editing application code, `openspec/config.yaml`, or archived OpenSpec history.

## Decisions

### 1. Version this as v1.1.2 (patch), not v1.2

Keep the v1.0 and v1.1.1 changelog tables. Add a short “What changed vs v1.1.1” row: vendored `impSpec.md` removed; backend pointers go to the API repo. A v1.2 label would imply product/contract changes that are not happening.

**Alternative considered:** Silent in-place edit. Rejected — v1.1.1 explicitly mapped `blueprint_final.md` → `impSpec.md`; readers need to see that mapping was withdrawn on purpose.

### 2. Name the API repo, do not hard-code a filesystem path

Write backend pointers as **In the API repo (`guideagent`):** `docs/blueprint_final.md` / `docs/context.md`. Do not use `../guideagent/...` or `G:\projects\...` — those 404 on other machines and look like files to create here.

**Alternative considered:** Relative `../guideagent/docs/blueprint_final.md`. Rejected — checkout layout is not part of the contract.

**Alternative considered:** Keep a stub `docs/impSpec.md` that only says “see the API repo.” Rejected — another file for agents to open; the user already deleted the dump to stop that.

### 3. Rewrite the mapping row and doc-relationship table; leave v1.1.1 history alone

**This repo** mapping table, third row: `docs/blueprint_final.md` → **not in this repo** — API repo (`guideagent`) `docs/blueprint_final.md`. Do not vendor.

**Doc relationship:** drop the `docs/impSpec.md` and `docs/context.md` rows as if they were local files. Replace with one row: backend bible / checkpoint live in the API repo (`guideagent`): `docs/blueprint_final.md`, `docs/context.md`. Do not copy them here.

v1.1.1 changelog row that says the map was `… / impSpec.md` stays as **history**.

**Alternative considered:** Mechanical string replace `impSpec.md` → `blueprint_final.md` everywhere. Rejected — that would make agents look for `docs/blueprint_final.md` **in this repo**.

### 4. `frontendGuide.md` identity pass (now in scope)

The previous change deferred this. This slice does it:

- Header: phased bible → `docs/blueprint.md` (this repo). Drop `docs/blueprint_frontend.md` and `docs/fe_suggestins.md` as if they lived here.
- Live-routes / conflict-table `docs/context.md` lines: qualify as API repo (`guideagent`) `docs/context.md`.
- §1 repo table: **this repo** is `guideagent-frontend` (Next.js). Sibling API is `guideagent`.
- Non-goals: stop saying “scaffolding the Next.js app inside this API repo.”

Do not rewrite §§2–16 stack, envelopes, SSE, DTOs, or auth matrix.

**Alternative considered:** Blueprint-only again. Rejected — `@docs/frontendGuide.md` is a common F0 entry and still says “this repo (`guideagent`)”.

### 5. Confirm deletion only — do not recreate

A task checks `docs/impSpec.md` is absent. If someone re-adds it, delete it again as part of apply. Do not add a replacement file.

## Risks / Trade-offs

- [Agents still grep `docs/impSpec.md` from v1.1.1 history] → Mitigation: live header, mapping row, doc-relationship, and footer are the sentences they execute; changelog is labeled history.
- [Sibling repo not checked out] → Mitigation: Decision 2 names the repo + in-repo path, not a relative path that must exist.
- [frontendGuide §10 still says “seed from context.md scripts”] → Mitigation: qualify as API-repo `docs/context.md`; do not copy scripts into FE.
- [Patch read as “implement F0”] → Mitigation: tasks touch only the two markdown files (+ confirm impSpec stays gone).

## Migration Plan

1. Edit `docs/blueprint.md` and `docs/frontendGuide.md` in place (no deploy).
2. Confirm `docs/impSpec.md` is absent.
3. Rollback: revert those two files; no runtime impact.

## Open Questions

None. F0.6 claim/`trip_id` verify stays deferred from v1.1.1 and does not change this patch’s tasks.
