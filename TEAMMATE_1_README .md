# Teammate 1 README
## Ownership: Property Discovery + True Rental Cost + Saves

You own the backend for:
1. Property Discovery
2. True Rental Cost Intelligence
3. Saved / Shortlisted Properties

Do not build frontend pages. The project owner owns the central UI.
Do not build AI features.

## Before starting

Wait until the project owner has merged:
- `prisma/schema.prisma`
- `lib/db.ts`
- `prisma/seed.ts`

Then pull latest main:

```bash
git pull origin main
git checkout -b teammate-1-discovery-cost
```

Read:
- `PRODUCT.md`
- `ARCHITECTURE.md`
- `AGENT_RULES.md`
- `BACKEND_IMPLEMENTATION_PLAN.md`
- `TEAMMATE_1_README.md`

## Files you own

```text
/lib/cost.ts
/lib/__tests__/cost*                 # cost tests only
/app/api/properties/*
/app/api/properties/[id]/*
/app/api/properties/[id]/cost/*
/app/api/saved/*
```

Do not modify:

```text
/prisma/*
/lib/db.ts
/lib/ai/*
/app/api/compare/*
/app/api/recommendations/*
/app/api/agreements/*
/app/api/roommates/*
/app/api/decision-assistant/*
/app/api/copilot/*
```

## Execution method

Use this small prompt in Antigravity for every task:

```text
I am teammate one. Read TEAMMATE_1_README.md, PRODUCT.md, ARCHITECTURE.md,
AGENT_RULES.md, and BACKEND_IMPLEMENTATION_PLAN.md.
Find the next incomplete task in this README and implement only that task.
Do not modify files outside my ownership. Reuse existing utilities and patterns.
After coding, run the required tests and directly verify the endpoint/logic.
Stop when the acceptance check passes. Show changed files, tests run,
and AGENT_QUESTION comments before committing.
```

## Task order

### Task 1 — Cost engine

Implement `/lib/cost.ts`:
- `estimatedMonthlyCost`
- `initialMoveInCost`
- `affordabilityRatio`
- `isEstimated: true` for estimated values

Use the exact formulas in `ARCHITECTURE.md`. fileciteturn2file2L78-L88

Required unit tests.

Acceptance:
- formulas match the architecture
- itemized inputs are preserved
- estimated values are clearly marked
- tests pass

Commit:

```text
feat: add rental cost calculation engine
```

### Task 2 — Property list API

Implement:

```text
GET /api/properties
```

Support:
- keyword/location
- budget
- bedrooms
- furnishing
- amenities

Acceptance:
- seeded properties are returned
- filters actually affect results
- invalid input fails visibly

Commit:

```text
feat: add property discovery api
```

### Task 3 — Property detail API

Implement:

```text
GET /api/properties/[id]
```

Acceptance:
- valid ID returns the required property data
- unknown ID uses the same error-response pattern established by the first route

Commit:

```text
feat: add property detail api
```

### Task 4 — Cost endpoint

Implement:

```text
GET /api/properties/[id]/cost
```

Use `/lib/cost.ts`; do not duplicate the formulas.

Acceptance:
- itemized monthly cost
- move-in cost
- affordability information when budget is available
- `isEstimated` present where applicable

Commit:

```text
feat: add property cost api
```

### Task 5 — Saved / shortlisted API

Implement:

```text
GET /api/saved
POST /api/saved
DELETE /api/saved
```

Use `isShortlisted` on `SavedProperty`; do not create a second shortlist model. fileciteturn2file2L47-L56

Acceptance:
- save works
- delete works
- shortlist state works
- DB state persists across requests

Commit:

```text
feat: add saved property api
```

## Verification after every task

```text
1. Run relevant tests.
2. Start the app.
3. Call the endpoint directly with seeded data.
4. Test one normal case and one invalid case.
5. Inspect the diff for ownership violations.
6. Commit only after acceptance passes.
```

The main end-to-end smoke path in the project rules starts with search → property → save → compare → cost, so make sure your discovery/cost pieces support that path. fileciteturn2file3L40-L44

## Final handoff

```text
Teammate 1 complete.
Built: cost engine, discovery/filter API, property detail API,
property cost API, saved/shortlist API.
Tests: <list>
AGENT_QUESTION: <none or list>
Not built: comparison, recommendations, agreements, roommate, decision assistant,
copilot, frontend.
```
