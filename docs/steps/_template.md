# StepFN template (fill when expanding a phase)

Copy this when turning an outline (`StepF1.md`–`StepF7.md`) into a full playbook after the previous phase ships. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Runner rules: [`README.md`](README.md).

Do not invent endpoints, DTO fields, or packages. Cite LLD patterns from the blueprint table. Every sub-step names a failure boundary it can actually prove.

---

# Wandr — F{N} Cursor prompts: {phase title}

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F{N}
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md)
> Guardrails: [`AGENTS.md`](../../AGENTS.md)
> Built-so-far: [`docs/app/system.md`](../app/system.md) (after F0 ships)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run the listed batch file.
> Do not start the next prompt until the current ✅ validation passes.

## How to use these prompts

1. Open this repo (`guideagent-frontend`) as the workspace root.
2. Run one batch file **or** paste one fenced prompt — not the whole file.
3. Run the listed validation after the agent finishes.
4. If the agent deviates (extra packages, skipped failure UI, wrong layer), stop and correct.

## Prerequisites (F{N-1} must be complete)

- {proof from previous ship checklist}

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F{N} locks below.
- **Extend, don't replace** previous-phase code unless the step says replace.
- **Packages at point of use** — install only what this step lists.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.

## F{N} architecture

```
{ascii or mermaid of what this phase adds}
```

## Locked decisions

### {Topic} — LOCKED

- {decision}

### Failure-mode table — LOCKED

| Failure | Response this phase must implement |
|---------|-------------------------------------|
| {failure} | {UI / throw / toast} |

### Forward locks (design-only — do not implement in F{N})

- {later phase concern}

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| {N}.{x} | {what landed} | {what must not exist yet} |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| {pattern from blueprint} | {path} |

## Recommended run batches

| Batch file | Sub-steps | Proof before next |
|------------|-----------|-------------------|
| `batches/F{N}a.md` | {…} | {…} |

## Step {N}.{x} — {title}

```
Read AGENTS.md and docs/steps/StepF{N}.md (locks + this step) before writing any file.

TASK: …

This is step {N}.{x}. Do NOT …

─── FEATURE BUILDUP ───
After this step:
  EXISTS: …
  STILL EMPTY: …

─── FAILURE MODE ───
…

─── LLD / BEST PRACTICE ───
Pattern: …

─── WHAT TO CREATE ───
…

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step {N}.{x+1}.

─── VALIDATION ───
{PowerShell proofs}
```

## F{N} ship checklist

Before expanding or starting F{N+1}, every item below is green:

- [ ] {proof}
