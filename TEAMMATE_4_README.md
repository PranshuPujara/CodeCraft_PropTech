# Teammate 4 README
## Ownership: Roommate Compatibility

You own the backend for:
1. Roommate profile validation / input handling
2. Compatibility analysis
3. Compatibility API

The project owner owns the central UI, shared foundation, final AI features and integration.
Do not build frontend pages.

## Before starting

The project owner must have merged:
- Prisma schema + migrations
- `lib/db.ts`
- seed data
- `lib/ai/client.ts`
- `lib/ai/types.ts`

Then:

```bash
git pull origin main
git checkout -b teammate-4-roommates
```

Read:
- `PRODUCT.md`
- `ARCHITECTURE.md`
- `AGENT_RULES.md`
- `BACKEND_IMPLEMENTATION_PLAN.md`
- `TEAMMATE_4_README.md`

## Files you own

```text
/lib/ai/prompts/compatibility.ts
/app/api/roommates/compatibility/*
```

Feature-local tests are allowed.

Do not modify:

```text
/prisma/*
/lib/db.ts
/lib/ai/client.ts
/lib/ai/types.ts
/lib/cost.ts
/app/api/properties/*
/app/api/saved/*
/app/api/compare/*
/app/api/recommendations/*
/app/api/agreements/*
/app/api/decision-assistant/*
/app/api/copilot/*
```

## Execution method

```text
I am teammate four. Read TEAMMATE_4_README.md, PRODUCT.md, ARCHITECTURE.md,
AGENT_RULES.md, and BACKEND_IMPLEMENTATION_PLAN.md.
Find the next incomplete task in this README and implement only that task.
Use the existing AI client and shared types. Do not recreate shared infrastructure.
Do not modify files outside my ownership.
Run tests after implementation, call the API directly, and verify the response shape.
Stop when the acceptance check passes.
Show changed files, tests run, and AGENT_QUESTION comments before committing.
```

## Task order

### Task 1 — Compatibility prompt

Create:

```text
/lib/ai/prompts/compatibility.ts
```

Inputs must cover:
- budget
- sleep schedule
- work/study schedule
- cleanliness
- noise tolerance
- guests
- smoking
- food preferences
- pets
- social preferences

Output:

```text
common[]
conflicts[]
explanation
score
```

The score must never exist without an explanation. fileciteturn2file2L98-L105

Acceptance:
- specific alignments
- specific conflicts
- score + explanation together
- no invented preferences

Commit:

```text
feat: add roommate compatibility prompt
```

### Task 2 — Compatibility API

Implement:

```text
POST /api/roommates/compatibility
```

Input: two profiles.

Acceptance:
- valid profiles return structured compatibility
- common preferences present
- conflicts present
- score + explanation present
- invalid/incomplete input fails visibly

Commit:

```text
feat: add roommate compatibility api
```

### Task 3 — Verification tests

Test:

```text
1. mostly aligned profiles
2. strongly conflicting profiles
3. incomplete profile
```

Acceptance:
- structured response stays valid
- score never lacks explanation
- no silent failure
- no changes outside track

Commit:

```text
test: verify roommate compatibility api
```

## Verification after every task

```text
1. Run feature tests.
2. Call the API with realistic profiles.
3. Call it again with a conflicting pair.
4. Try incomplete input.
5. Verify score and explanation travel together.
6. Inspect actual AI output for specific common/conflict statements.
7. Inspect diff for ownership violations.
```

## Final handoff

```text
Teammate 4 complete.
Built: roommate compatibility prompt, API, verification tests.
Tests: <list>
AGENT_QUESTION: <none or list>
Not built: frontend, recommendations, agreements, decision assistant, copilot.
```
