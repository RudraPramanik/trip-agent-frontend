## 1. Runner docs

- [x] 1.1 Write `docs/steps/README.md`: one batch file per CLI/agent session; paste one fence from `StepFN.md` for Chat; do not start the next batch until proofs pass; write grain vs run grain
- [x] 1.2 Write `docs/steps/_template.md`: required sections for a later phase bible (how to use, prerequisites, conventions, locks, failure table, feature buildup, fenced prompts, ship checklist, recommended batches)

## 2. F0 phase bible

- [x] 2.1 Write `docs/steps/StepF0.md` header: how to use, F0 locks (no create-next-app, `AGENTS.md` not `AGENT.md`, packages at point of use, types from OpenAPI), architecture, failure table, feature buildup, LLD patterns, recommended batches F0a/F0b/F0c
- [x] 2.2 Add fenced prompts for F0.1 then F0.2 (scaffold + env), each with TASK, feature buildup, failure mode, Do NOT jump ahead, PowerShell VALIDATION
- [x] 2.3 Add fenced prompts for F0.6 then F0.3 (type-lock then gateway client). F0.6 requires local API; fail loud on unreachable OpenAPI; Windows-safe `npm run gen:types`. F0.3 uses generated types, envelope adapters, AbortSignal, credentials include; no Vitest install
- [x] 2.4 Add fenced prompts for F0.5 then F0.4 (shadcn scratch page, then Query + toaster providers). Do not reinstall Tailwind/Next. End with F0 ship checklist

## 3. CLI batches

- [x] 3.1 Write `docs/steps/batches/F0a.md` (0.1 → 0.2): prerequisites, read pointers into StepF0.md, hard stop, proofs
- [x] 3.2 Write `docs/steps/batches/F0b.md` (0.6 → 0.3): API-up prerequisite, hard stop, proofs
- [x] 3.3 Write `docs/steps/batches/F0c.md` (0.5 → 0.4): hard stop, proofs, point at F0 ship checklist

## 4. Later-phase outlines

- [x] 4.1 Replace empty `docs/steps/StepF1.md`–`StepF7.md` with short outlines: phase goal, feature buildup, likely run batches, “expand after previous phase ships.” No full prompt bodies
