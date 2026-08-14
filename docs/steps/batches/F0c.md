# F0c — CLI session: shadcn then providers

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF0.md`.
> Prompt bodies live in [`../StepF0.md`](../StepF0.md). This file is the session gate.

## Prerequisites

- **F0a and F0b green** (config, generated types, gateway, health smoke).
- Tailwind v4 is already in the repo — **do not reinstall** it.
- Read `node_modules/next/dist/docs/` and current shadcn guidance for Tailwind v4 + this Next line before init.

## Read first

1. [`../StepF0.md`](../StepF0.md) — locks (packages, forward locks)
2. Execute the fenced prompts in `StepF0.md` in this order only:
   - **Step 0.5** — shadcn/ui + Tailwind baseline
   - **Step 0.4** — Providers — Query + toaster

## Session rules

- 0.5 before 0.4 so the scratch page can render a Button before providers wrap the tree.
- Do not invent a second design system.
- Do not implement F1 (`GET /auth/me`, header chrome, login CTA).
- Do not add Zustand, destination search, or SSE.

## Hard stop

When 0.5 and 0.4 validations pass, run the **F0 ship checklist** at the bottom of `StepF0.md`. Then **stop**. Do not start F1 and do not expand `StepF1.md` prompts in this session.

## Proofs (F0 ship)

```powershell
# 0.5
Test-Path components.json
Get-ChildItem components\ui
# Browser: http://localhost:3000/dev/ui shows Button

# 0.4
Select-String -Path app\layout.tsx -Pattern "Provider"
# Browser: scratch toast control shows Sonner; no unhandledrejection on load

# Full F0 checklist: see StepF0.md "F0 ship checklist"
```

Next (separate planning pass): expand [`../StepF1.md`](../StepF1.md) from outline into full prompts, then run F1 batches.
