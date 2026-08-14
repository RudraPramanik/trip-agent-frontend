# F1b — CLI session: shell chrome

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF1.md`.
> Prompt bodies live in [`../StepF1.md`](../StepF1.md). This file is the session gate.

## Prerequisites

- **F1a green** (`getMe`, `useAuthMe`, login navigation, logout mutation, `/dev/ui` proof).
- No new packages. Search is a **placeholder** — do not call `GET /destinations/search`.

## Read first

1. [`../StepF1.md`](../StepF1.md) — locks (modular layers, search placeholder, guest browsing)
2. Execute the fenced prompt in `StepF1.md`:
   - **Step 1.3** — Shell chrome

## Session rules

- Compose only: `session-chip.tsx` + `session-header.tsx` use `useAuthMe` / `startGoogleLogin` / `useLogout`.
- `session-header.tsx` must not contain `fetch`, `getJson`, `sendJson`, or `getMe`.
- Search control is visible and enabled for guests. It does not typeahead or hit the destinations API.
- Do not wrap routes in required-auth. Do not start F2.

## Hard stop

When 1.3 validation passes, run the **F1 ship checklist** at the bottom of `StepF1.md`. Then **stop**. Do not expand or implement F2 in this session.

## Proofs (F1 ship)

```powershell
Select-String -Path app\layout.tsx -Pattern "SessionHeader"
Select-String -Path features\auth\session-header.tsx -Pattern "fetch\(|getJson|getMe"   # Expected: no matches
Select-String -Path features\auth\session-header.tsx -Pattern "Search"
Select-String -Path lib\api\destinations.ts -Pattern "search"   # Expected: still stub
Select-String -Path package.json -Pattern "next-auth|better-auth"   # Expected: no matches
# Browser: http://localhost:3000 header visible as guest; Search not login-gated; no destinations/search request

# Full F1 checklist: see StepF1.md "F1 ship checklist"
```

Next (separate planning pass): expand [`../StepF2.md`](../StepF2.md) from outline into full prompts, then run F2 batches.
