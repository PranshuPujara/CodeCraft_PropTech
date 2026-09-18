# Teammate 3 README
## Ownership: Rental Agreement Intelligence + Agreement Awareness

You own the backend for:
1. PDF text extraction
2. Structured agreement extraction
3. Agreement awareness flags
4. Agreement API routes

This is the highest-risk track. Accuracy, structured output and the legal-advice guardrail matter more than extra functionality.

Do not build frontend pages. The project owner owns the central UI.

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
git checkout -b teammate-3-agreements
```

Read:
- `PRODUCT.md`
- `ARCHITECTURE.md`
- `AGENT_RULES.md`
- `BACKEND_IMPLEMENTATION_PLAN.md`
- `TEAMMATE_3_README.md`

Re-read `PRODUCT.md` §7 immediately before and after modifying agreement prompts. The product explicitly forbids legal conclusions. fileciteturn2file1L127-L139

## Files you own

```text
/lib/agreement*                       # PDF/text helper files
/lib/ai/prompts/agreementExtract.ts
/lib/ai/prompts/agreementFlags.ts
/app/api/agreements/*
```

Tests for agreement extraction may live inside your feature area.

Do not modify:

```text
/lib/ai/client.ts
/lib/ai/types.ts
/lib/cost.ts
/lib/db.ts
/prisma/*
/app/api/properties/*
/app/api/saved/*
/app/api/compare/*
/app/api/recommendations/*
/app/api/roommates/*
/app/api/decision-assistant/*
/app/api/copilot/*
```

## Execution method

```text
I am teammate three. Read TEAMMATE_3_README.md, PRODUCT.md, ARCHITECTURE.md,
AGENT_RULES.md, and BACKEND_IMPLEMENTATION_PLAN.md.
Find the next incomplete task in this README and implement only that task.
Use the existing AI client and types. Do not recreate shared infrastructure.
For agreement work, follow PRODUCT.md §7 exactly. Never make legal conclusions.
Run the required tests and directly verify the result.
Stop when the acceptance check passes.
Show changed files, tests, and AGENT_QUESTION comments before committing.
```

## Task order

### Task 1 — PDF text extraction

Implement a small `/lib` helper using `pdf-parse`.

Acceptance:
- valid demo PDF returns usable text
- malformed/unreadable input fails visibly
- no storage service is introduced

Commit:

```text
feat: add agreement pdf text extraction
```

### Task 2 — Structured agreement extraction

Create:

```text
/lib/ai/prompts/agreementExtract.ts
```

Return the complete field set:

```text
rent
deposit
lease duration
lock-in period
notice period
rent escalation
maintenance responsibility
utility responsibility
penalties
termination conditions
```

Every field must indicate whether it was found. Missing information must be explicit, never silently omitted or guessed. fileciteturn2file1L86-L91

Write the required extraction-shape unit test.

Acceptance:
- every field always exists
- missing fields are `found: false` / `null`
- no guessed values
- test passes

Commit:

```text
feat: add structured agreement extraction
```

### Task 3 — Agreement awareness flags

Create:

```text
/lib/ai/prompts/agreementFlags.ts
```

Each flag requires:
- `clause`
- `reason`

The prompt must explicitly prohibit:
- legal / illegal conclusions
- enforceability claims
- telling the user whether to sign
- predicting legal outcomes

Use only language equivalent to "worth reviewing because X" based on the clause itself. fileciteturn2file1L93-L98

Commit:

```text
feat: add agreement awareness flags
```

### Task 4 — Agreement APIs

Implement:

```text
POST /api/agreements
GET /api/agreements/[id]
```

POST should:
- receive the PDF
- extract text
- generate structured fields
- generate summary/flags using the existing AI pipeline
- store the result

GET should return the stored analysis.

Acceptance:
- demo PDF completes the flow
- missing fields remain explicit
- every flag has a reason
- route errors are visible

Commit:

```text
feat: add agreement analysis api
```

## Verification after every task

```text
1. Run extraction-shape tests.
2. Test one valid PDF and one invalid input.
3. Inspect actual AI output.
4. Re-read PRODUCT.md §7 around prompt changes.
5. Confirm no legal conclusion appears.
6. Inspect diff for ownership violations.
```

## Final handoff

```text
Teammate 3 complete.
Built: PDF extraction, agreement extraction, awareness flags,
agreement POST/GET APIs.
Tests: <list>
Legal guardrail checked: yes/no
AGENT_QUESTION: <none or list>
Not built: frontend, roommate, recommendations, decision assistant, copilot.
```
