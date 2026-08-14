# Wandr — F7 outline: Hardening

> **Outline only.** Expand after **F6** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F7.

**Do not implement F7 from this outline.** Do not batch a11y with unit tests — different proof types.

## Phase goal

Named error-code copy, unit + Playwright smoke, optional Sentry, keyboard/a11y and responsive passes. Guest-session-mismatch 403 stays a distinct toast/panel, not folded into generic `forbidden`.

## Expand after

F6 ship: edit path works for owners.

## Feature buildup (target)

| After | Exists | Notes |
|-------|--------|--------|
| 7.1 | Central error-code → copy map (`frontendGuide.md` §16) | Unknown codes → generic + dev log |
| 7.2 | Vitest + RTL | Parsers, SSE frames, readiness helper (3 tiers), clarification builder, abort |
| 7.3 | Playwright smoke | Happy path + mid-stream navigate-away proxy for F3.2 abort |
| 7.4 | Sentry optional | No-op without DSN; no tokens/PII |
| 7.5 | a11y pass | Keyboard + `aria-live` on SSE; focus on clarification |
| 7.6 | Responsive | 375 / 768 / desktop; map as sheet/tab under 768; no horizontal scroll at 375 |

## Failure modes to name when expanding

- Forced 429 / 404 / guest-mismatch-403 in mock → distinct UI
- Playwright must **fail clearly** if API is down — no flaky silent pass
- Keyboard-unreachable control is a bug, not polish

## Likely run batches

| Batch | Sub-steps |
|-------|-----------|
| F7a | 7.1 error-code map |
| F7b | 7.2 unit tests |
| F7c | 7.3 Playwright |
| F7d | 7.4 observability (optional; skip if no DSN) |
| F7e | 7.5 a11y |
| F7f | 7.6 responsive |

## Deferred beyond this phase

Full axe-core in CI; narrative cache cap; backend `session_mismatch` error code; OAuth `FRONTEND_URL` bounce.
