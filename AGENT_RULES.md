# Agent Rules — Rental Intelligence Platform

This doc is written for AI coding agents (Claude Code, Cursor, Codex, or any other agent working in this repo). It has near-zero value to a human reader — that's intentional. Follow it exactly; it's what keeps multiple agents from fighting each other in the same codebase.

## 0. Before you write any code

1. Read `PRODUCT.md` in full. It defines what exists, what's P0/P1/Future, and the legal-advice guardrail. Do not start a feature that isn't in it.
2. Read `ARCHITECTURE.md` in full. It defines the stack, data model, API surface, folder structure, and AI pipeline pattern. Do not deviate from it without flagging.
3. Check the current git branch / open PRs / recent commits for what's already in progress — don't duplicate work another agent (or human) already started.

## 1. Hard rules

- **Do not add a dependency** that isn't already in `ARCHITECTURE.md` §2 without stopping and flagging it first (`AGENT_QUESTION:` comment or explicit message to the team). This includes UI libraries, state managers, auth providers, and AI SDKs beyond the Anthropic client already in use.
- **Do not implement a feature outside `PRODUCT.md`'s P0 list** unless explicitly told P0 is complete and you're cleared to start P1. Do not build anything from the Future/out-of-scope list under any circumstances, including as a "quick stub."
- **Search `/lib` before writing a new utility, calculation, or AI prompt.** If cost calculation, an AI client wrapper, or a similar prompt already exists, extend or call it — do not write a second version. Duplicated logic (e.g., two different `estimatedMonthlyCost` formulas in different files) is the single worst outcome for this project and is treated as a bug, not a style issue.
- **Match existing patterns.** If a feature already has an established shape (e.g., how API routes return errors, how AI JSON output is typed), follow it for new features rather than introducing a different pattern for "your" feature.
- **Every AI-generated score or recommendation must ship with an explanation field**, per `PRODUCT.md` Principle 2 and `ARCHITECTURE.md` §7. A PR that adds a `score` without an `explanation` in the same response shape is incomplete.
- **Agreement-related prompts and UI copy must never state a legal conclusion.** See `PRODUCT.md` §7. If you're writing or editing anything in `/lib/ai/prompts/` related to agreements, re-read that section immediately before and after.
- **Never commit secrets.** `.env` is gitignored; only `.env.example` (placeholder values) is committed. If you ever need a new environment variable, add it to `.env.example` with a placeholder and a one-line comment, not a real value.
- **Don't touch files outside your assigned feature area** without checking they're not mid-edit by another agent/person. If you must (e.g., a shared `/lib` file), keep the change minimal and scoped to what your feature needs.

## 2. When a requirement is unclear

Do not guess and do not silently pick the "most common" interpretation from training data. Instead:

1. Leave a comment at the relevant spot: `// AGENT_QUESTION: <specific question>`
2. Implement the most conservative, smallest-scope interpretation that satisfies the feature's "Done when" line in `PRODUCT.md`, so the feature still works end-to-end.
3. Mention the open question in your PR description / handoff notes.

Do not expand a feature's scope to "cover the ambiguity" — narrow, flagged, and working beats broad, guessed, and wrong.

## 3. Definition of done (per feature)

A P0 feature is done when it meets its "Done when" line in `PRODUCT.md` §6 — not more, not less. Specifically:

- It does not need extra polish beyond what's needed to demo the core flow it's part of.
- It does not need to handle every edge case — it needs to handle the demo path correctly and fail visibly (not silently/incorrectly) on paths it doesn't handle.
- It does need a test if it touches cost calculation logic (`/lib/cost.ts`) or agreement extraction output shape (`/lib/ai/prompts/agreement*.ts` and its typed output) — these are the two places where a wrong-but-confident answer is the worst possible failure mode for this product.

## 4. Testing expectations

- Unit test `estimatedMonthlyCost` / `initialMoveInCost` calculations against known inputs (`/lib/cost.ts`).
- Unit test that agreement extraction always returns the full field set from `PRODUCT.md` §6.5 with `found: false`/`null` for anything not detected — never a silently omitted field.
- If time allows, one e2e smoke test covering: search → view property → save → compare → view cost breakdown. This is the minimum path a demo will walk through live.
- Do not write exhaustive test suites at the expense of finishing P0 features — this is a 24-hour build; tests exist to protect the two failure-prone areas above, not for coverage percentage.

## 5. Git hygiene

- Commit messages describe what changed and why in one line (`feat: add cost breakdown calculation` not `wip` or `fixes`).
- Keep commits scoped to one feature/fix where practical — this is what makes "meaningful git history" actually meaningful for the team reviewing it afterward.
- If you generate a large amount of code in one pass, still commit in logical chunks rather than one giant commit, so a human reviewer can follow what happened.

## 6. Handoff notes

At the end of a session, leave a short note (PR description, commit message, or a `NOTES.md` scratch file — not a new permanent doc) covering:
- What you built and where
- Any `AGENT_QUESTION:` comments you left
- Anything you explicitly did *not* build because it was out of scope, in case a teammate expected it
