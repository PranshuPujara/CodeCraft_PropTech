# Backend Implementation Plan — Rental Intelligence Platform

**Read first:** `PRODUCT.md`, `ARCHITECTURE.md`, `AGENT_RULES.md`. This plan sequences those specs into an ordered backend build — it does not override them. If anything here conflicts with those docs, the docs win.

**Scope of this plan:** backend only — Prisma schema/migrations/seed, `/lib` business logic, `/app/api` routes, the AI pipeline. Frontend is covered separately in `FRONTEND_IMPLEMENTATION_PLAN.md` and consumes these contracts as-is.

---

## 0. Environment setup

- Next.js 14, App Router, TypeScript (single repo, per ARCHITECTURE §1)
- Install: `prisma`, `@prisma/client`, `pdf-parse`, `@anthropic-ai/sdk`, `vitest` (unit), `playwright` (e2e, optional)
- `.env.example`: `DATABASE_URL`, `ANTHROPIC_API_KEY` — real values go only in `.env` (gitignored)
- **Do not add any dependency outside ARCHITECTURE §2's table without flagging first** (`AGENT_QUESTION:` comment or a message to the team)

---

## 1. Build order

Work phase by phase, in order. Each phase should land as its own commit or small set of commits (AGENT_RULES §5). Don't start a phase's AI prompt work before Phase 3 exists — every AI route depends on it.

### Phase 0 — Foundation
1. `prisma/schema.prisma` — implement all 7 entities from ARCHITECTURE §3 (`User`, `Property`, `CostBreakdown`, `SavedProperty`, `Agreement`, `RoommateProfile`, `CompatibilityResult`, `ChatMessage`)
2. `lib/db.ts` — Prisma client singleton
3. `npx prisma migrate dev`
4. `prisma/seed.ts` — 15–20 realistic properties, spread of price points/amenities (ARCHITECTURE §6)

**Acceptance:** `npx prisma studio` shows seeded properties.

### Phase 1 — Cost engine (P0 §6.2)
5. `lib/cost.ts`: `estimatedMonthlyCost`, `initialMoveInCost`, `affordabilityRatio`, per the formulas in ARCHITECTURE §5. Mark any non-listing-provided component `isEstimated: true`.
6. Unit tests for `lib/cost.ts` against known inputs — **required**, not optional (AGENT_RULES §4)
7. `GET /api/properties/[id]/cost`

### Phase 2 — Discovery & saves (P0 §6.1)
8. `GET /api/properties` (search/filter: budget, bedrooms, furnishing, amenities)
9. `GET /api/properties/[id]`
10. `GET/POST/DELETE /api/saved` (also drives shortlisting via `isShortlisted` flag — one table, not two)

### Phase 3 — AI pipeline foundation (blocks everything below)
11. `lib/ai/client.ts` — one wrapped Anthropic client (model/params changed in exactly one place)
12. `lib/ai/types.ts` — typed output shape for every AI feature (see table in ARCHITECTURE §7)
13. `lib/ai/prompts/` — one file per feature (scaffold now, fill in per phase below)

### Phase 4 — Comparison & recommendations (P0 §6.3, §6.4)
14. `lib/ai/prompts/compare.ts` + `POST /api/compare` — output: trade-off statements naming the specific dimension and both properties
15. `lib/ai/prompts/recommend.ts` + `GET /api/recommendations` — output: ranked list, `reason` per item referencing specific matched attributes (never a generic "great match!")

### Phase 5 — Agreement intelligence (P0 §6.5, §6.6) — highest-risk phase
16. PDF text extraction helper using `pdf-parse`, in `/lib`
17. `lib/ai/prompts/agreementExtract.ts` — must return the **full field set** from PRODUCT §6.5, each with `found: boolean`; never silently omit a field
18. `lib/ai/prompts/agreementFlags.ts` — **re-read PRODUCT §7 immediately before and after writing this file.** The system prompt must explicitly instruct the model never to state a clause is legal/illegal/enforceable or tell the user whether to sign. Every flag needs a `reason`.
19. `POST /api/agreements`, `GET /api/agreements/[id]`
20. **Required unit test:** extraction always returns the complete field set with `found:false`/`null` for anything undetected — never a silently missing field (AGENT_RULES §4)

### Phase 6 — Roommate compatibility (P0 §6.7)
21. `lib/ai/prompts/compatibility.ts` + `POST /api/roommates/compatibility` — output: `{ common: [], conflicts: [], explanation, score }`. `score` is never returned without `explanation` in the same response.

### Phase 7 — Decision assistant & copilot (P0 §6.8, §6.9)
22. `lib/ai/prompts/decisionAssistant.ts` + `POST /api/decision-assistant` — one synthesized narrative + per-property pros/cons, weighed against the user's actual stated preferences
23. `lib/ai/prompts/copilot.ts` + `POST /api/copilot` — uses `contextRefs` to ground answers in the user's real saved/shortlisted/cost/agreement data; if an answer would need data the user doesn't have, say so rather than inventing it

### Phase 8 — Hardening
24. Confirm every route follows the same error-response shape (whichever the first route establishes)
25. If time allows: one e2e smoke test — search → view property → save → compare → view cost breakdown (AGENT_RULES §4)

---

## 2. Response-shape conventions (apply to every route)

- Response shapes mirror the ARCHITECTURE §3 entity table — don't invent a parallel shape for the same data in a different route.
- Any AI-generated score/recommendation ships with its `explanation`/`reason` field in the *same* response — a route returning one without the other is incomplete (Product Principle 2).
- Any estimated (non-actual) number carries `isEstimated: true`.
- Pick one error JSON shape on the first route you write and reuse it everywhere.

## 3. Testing recap (AGENT_RULES §4)

- Must-test: `lib/cost.ts` calculations; agreement-extraction output always has the full field set.
- E2E smoke test is nice-to-have, not required, if time is short.
- Don't spend the 24 hours chasing coverage — these two areas are the ones where a wrong-but-confident answer is the worst failure mode; everything else needs to work on the demo path and fail visibly elsewhere.

## 4. Standing guardrails while building

- Search `/lib` before writing a new utility, calculation, or prompt — a duplicated `estimatedMonthlyCost` in two files is treated as a bug.
- Don't build anything from PRODUCT §8 (P1) or §9 (Future) — not even as a stub.
- Ambiguous requirement → leave `// AGENT_QUESTION: <question>`, implement the smallest interpretation that satisfies the feature's "Done when" line, note it in the handoff.
- End of session: short handoff note (PR description or `NOTES.md`) — what was built, `AGENT_QUESTION` comments left, anything explicitly skipped as out of scope.

## 5. Handing this to Antigravity (or any agentic coding tool)

1. Add `PRODUCT.md`, `ARCHITECTURE.md`, `AGENT_RULES.md`, and this file to the tool's context/docs.
2. Assign phases in order — don't let it jump to Phase 5 before Phase 3 exists, since every AI route depends on the pipeline foundation.
3. Prompt it explicitly with something like: *"Follow BACKEND_IMPLEMENTATION_PLAN.md phase by phase. Stop at each phase's acceptance criteria — don't build past it. Leave `AGENT_QUESTION:` comments for anything ambiguous instead of guessing. Check `/lib` before adding a new utility or prompt file."*
4. Review each phase's diff before moving to the next — this is what keeps two agents (or an agent and a human) from duplicating logic in the same repo (AGENT_RULES §0.3).
