## 1. Write the issue log

- [x] 1.1 Replace empty `docs/issues/issue.md` with a dated log (2026-08-15). Lead with: backend Docker is currently down; live generate repro waits on `http://127.0.0.1:8000`. Do not paste secrets.
- [x] 1.2 Document **generate timeout**: destination `458854b1-4d2a-4d02-8901-e26ed59c0c8b`, 132 places, readiness `limited`, guest SSE progress then `generation_timeout`. State FE already shows a terminal panel and does not auto-retry. Owner is API `PLANNER_GENERATION_TIMEOUT_SECONDS` / LLM path in sibling repo `guideagent` — not missing `NEXT_PUBLIC_*` keys, not F6, not “wait longer.”
- [x] 1.3 Document **related traps**: that UUID is a destination (trip GET 404); unclaimed trip `39566c35-…` is 403 guest-mismatch; claimed trip `797b76ee-…` needs owner login; do not spoof `wandr_session`; FE `.env` backend secrets are unused by Next.js.
- [x] 1.4 Document the **API-first investigation order** from design.md Decision 3 (health → readiness → API timeout/LLM settings → logs/cache vs cold → distinguish 503/`llm_unavailable`). Record cache-warm as an accelerator, not the diagnosis.
- [x] 1.5 Document **F6 workarounds** (login as owner of `797b76ee-…`, or same-session generate after timeout is fixed). Do not mark `implement-fe-step-f6` 3.1–3.2 done. Optional FE copy is later — do not edit `compose-form.tsx`.

## 2. Guardrails

- [x] 2.1 Confirm apply touched only `docs/issues/issue.md` (no `app/`, `features/`, `lib/`, `.env*`, specs).
