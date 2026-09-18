# Teammate 2 README
## Ownership: Comparison + Personalized Recommendations

You own the backend for:
1. Property Comparison
2. Personalized Property Recommendations

Do not build frontend pages. The project owner owns the central UI.
Do not create another Anthropic client.

## Before starting

The project owner must have merged:
- `lib/db.ts`
- Prisma schema + migrations
- seed data
- `lib/ai/client.ts`
- `lib/ai/types.ts`

You may start the two prompt tasks as soon as the AI foundation is merged.
Wait for Teammate 1's relevant property/cost APIs before implementing the final comparison/recommendation routes.

```bash
git pull origin main
git checkout -b teammate-2-compare-recommend
```

Read:
- `PRODUCT.md`
- `ARCHITECTURE.md`
- `AGENT_RULES.md`
- `BACKEND_IMPLEMENTATION_PLAN.md`
- `TEAMMATE_2_README.md`

## Files you own

```text
/lib/ai/prompts/compare.ts
/lib/ai/prompts/recommend.ts
/app/api/compare/*
/app/api/recommendations/*
```

Feature-local tests may be added inside your track.

Do not modify:

```text
/lib/ai/client.ts
/lib/ai/types.ts
/lib/cost.ts
/lib/db.ts
/prisma/*
/app/api/properties/*
/app/api/saved/*
/app/api/agreements/*
/app/api/roommates/*
/app/api/decision-assistant/*
/app/api/copilot/*
```

## Execution method

```text
I am teammate two. Read TEAMMATE_2_README.md, PRODUCT.md, ARCHITECTURE.md,
AGENT_RULES.md, and BACKEND_IMPLEMENTATION_PLAN.md.
Find the next incomplete task in this README and implement only that task.
Use the existing lib/ai/client.ts and lib/ai/types.ts.
Do not modify files outside my ownership.
After coding, run the required tests and directly verify the output/endpoint.
Stop when the acceptance check passes.
Show changed files, tests run, and AGENT_QUESTION comments before committing.
```

## Task order

### Task 1 — Comparison prompt

Create:

```text
/lib/ai/prompts/compare.ts
```

The model receives real property data and produces specific trade-off statements that name the comparison dimension and both properties. fileciteturn2file2L98-L103

Acceptance:
- output matches shared types
- trade-offs are specific
- no invented property facts
- no cost formula is duplicated here

Commit:

```text
feat: add property comparison prompt
```

### Task 2 — Recommendation prompt

Create:

```text
/lib/ai/prompts/recommend.ts
```

Use explicit user preferences only. Each item needs a specific `reason`. fileciteturn2file1L81-L84

Acceptance:
- reason references actual matched attributes
- no generic "great match" output
- no guessed preferences

Commit:

```text
feat: add property recommendation prompt
```

### Task 3 — Comparison API

Implement:

```text
POST /api/compare
```

Wait until Teammate 1's property/cost APIs are available if your implementation needs them for complete comparison data.

Acceptance:
- 2+ valid property IDs work
- response contains comparison data + trade-offs
- trade-offs reference actual properties and dimensions
- invalid/insufficient IDs fail visibly

Commit:

```text
feat: add property comparison api
```

### Task 4 — Recommendation API

Implement:

```text
GET /api/recommendations
```

Use the seeded properties and explicit user preferences.

Acceptance:
- ranked list returned
- each item has a specific `reason`
- no inferred preference is used
- invalid/missing preference input fails visibly or uses the smallest interpretation allowed by PRODUCT.md

Commit:

```text
feat: add property recommendations api
```

## Verification after every task

```text
1. Run feature tests.
2. Call the endpoint directly with seeded data.
3. Test a valid case and an invalid case.
4. Inspect actual AI JSON, not only TypeScript types.
5. Confirm score/ranking never appears without its explanation/reason.
6. Inspect diff for ownership violations.
```

## Final handoff

```text
Teammate 2 complete.
Built: comparison prompt/API and recommendation prompt/API.
Tests: <list>
AI output verified: yes/no
AGENT_QUESTION: <none or list>
Not built: agreements, roommate, decision assistant, copilot, frontend.
```
