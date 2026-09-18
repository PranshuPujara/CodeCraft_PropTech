# Project Owner README
## Ownership: Base Backend + Central UI + Final Integration

You are the project owner and central integrator.

Your responsibilities are:
1. Shared backend foundation
2. Central product UI / frontend architecture
3. Shared AI infrastructure
4. Decision Assistant + Copilot
5. Integration, deployment, final testing and demo stability

The four teammates work only on their assigned backend feature tracks. They do not own the central UI.

---

## 0. Read before coding

Read these in this order:

```text
PRODUCT.md
ARCHITECTURE.md
AGENT_RULES.md
BACKEND_IMPLEMENTATION_PLAN.md
```

`PRODUCT.md` is the scope authority. `ARCHITECTURE.md` is the structural source of truth. Do not silently change either one during implementation. fileciteturn2file1L1-L3 fileciteturn2file2L1-L3

---

## 1. Shared files you own

Build and protect these before feature agents start:

```text
/prisma/schema.prisma
/prisma/seed.ts
/lib/db.ts
/lib/ai/client.ts
/lib/ai/types.ts
/lib/ai/prompts/        # create the shared prompt folder only; teammates own feature prompts
```

You also own all central frontend files under:

```text
/app/(dashboard)/*
/components/ui/*
/components/features/*
```

and later:

```text
/lib/ai/prompts/decisionAssistant.ts
/lib/ai/prompts/copilot.ts
/app/api/decision-assistant/*
/app/api/copilot/*
```

Do not let teammates modify these shared areas without explicit approval.

---

# 2. Base backend build order

Do these first. Every step must work before moving to the next.

## Task 1 — Project / dependency bootstrap

Make sure the project matches the architecture:

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Prisma
- SQLite for development
- Anthropic SDK
- pdf-parse
- Vitest
- Playwright only if time allows

Do not add packages outside the architecture without flagging first. fileciteturn2file2L27-L41

### Antigravity prompt

```text
I am the project owner. Read PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md,
BACKEND_IMPLEMENTATION_PLAN.md.

Set up only the shared project foundation required by the architecture.
Do not build product features or frontend pages yet.
Check the existing package.json before installing anything.
Use only dependencies already allowed by ARCHITECTURE.md.
Do not modify teammate feature files.

After setup, run the project locally and verify it starts successfully.
Show changed files, commands run, and any AGENT_QUESTION comments.
Stop after the foundation works.
```

### Acceptance

```text
npm install        -> succeeds
npm run dev        -> app starts
no unapproved dependency added
```

Commit:

```text
chore: bootstrap project foundation
```

---

## Task 2 — Prisma schema + migration

Implement all entities defined by the architecture:

```text
User
Property
CostBreakdown
SavedProperty
Agreement
RoommateProfile
CompatibilityResult
ChatMessage
```

The backend plan explicitly sequences the Prisma schema before feature work. fileciteturn2file4L18-L28

### Antigravity prompt

```text
I am the project owner. Read PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md,
BACKEND_IMPLEMENTATION_PLAN.md.

Implement only the Prisma database foundation.
Create/update prisma/schema.prisma using the entities and key fields defined
in ARCHITECTURE.md. Then create the development migration.
Do not build API routes, AI features, or frontend code.
Do not invent extra entities or relationships unless required by the existing spec.

Run the migration and verify Prisma can generate the client.
Show the final schema summary, migration result, tests/checks run,
and any AGENT_QUESTION comments.
Stop when the DB foundation is working.
```

### Acceptance

```text
npx prisma migrate dev   -> succeeds
Prisma client generation -> succeeds
schema matches ARCHITECTURE.md
```

Commit:

```text
feat: add prisma schema and initial migration
```

---

## Task 3 — Prisma client singleton + seed data

Create:

```text
/lib/db.ts
/prisma/seed.ts
```

Seed approximately 15–20 realistic properties with varied prices, amenities and furnishing so comparison/recommendation flows have useful data. fileciteturn2file2L90-L92

### Antigravity prompt

```text
I am the project owner. Read PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md,
BACKEND_IMPLEMENTATION_PLAN.md.

Implement only the shared database runtime and seed foundation.
Create lib/db.ts as the Prisma client singleton required by the architecture.
Create prisma/seed.ts with about 15-20 realistic demo properties covering
useful price, bedroom, furnishing, amenity and location variation.
Do not implement feature APIs or modify frontend code.
Reuse the schema exactly; do not add fields just to make seeding easier.

Run the seed and verify the database contains the expected demo properties.
Show changed files, verification commands, and any AGENT_QUESTION comments.
Stop when seeded data is confirmed.
```

### Acceptance

```text
npx prisma db seed          -> succeeds
npx prisma studio           -> shows seeded properties
lib/db.ts                   -> one Prisma singleton
```

Commit:

```text
feat: add prisma client and demo seed data
```

---

## Task 4 — Shared AI foundation

This must exist before Teammates 2–4 implement their AI features.

Create:

```text
/lib/ai/client.ts
/lib/ai/types.ts
/lib/ai/prompts/
```

All LLM calls go through one shared client and structured outputs must match shared TypeScript types. fileciteturn2file2L94-L108

### Antigravity prompt

```text
I am the project owner. Read PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md,
BACKEND_IMPLEMENTATION_PLAN.md.

Implement only the shared AI pipeline foundation.
Create one Anthropic client wrapper at lib/ai/client.ts with the model/config
centralized there.
Create lib/ai/types.ts containing typed output structures required by the
AI features in ARCHITECTURE.md §7.
Create the lib/ai/prompts directory, but do not implement teammate feature
prompts for comparison, recommendations, agreements, or roommate compatibility.
Those files belong to their assigned teammates.
Do not build AI API routes or frontend code.

Add only the minimum validation/error handling needed for the shared client.
Run TypeScript/build checks and show the exported types and verification result.
Stop when the shared AI foundation compiles cleanly.
```

### Acceptance

```text
lib/ai/client.ts exists and is the only shared Anthropic wrapper
lib/ai/types.ts contains the required structured output types
project compiles
no teammate feature prompt was implemented
```

Commit:

```text
feat: add shared ai client and typed outputs
```

---

# 3. Release the tracks to teammates

Release teammates as soon as their dependencies are ready:

```text
After Tasks 2–3 -> Teammate 1 can start
After Task 4      -> Teammates 2, 3, 4 can start
```

Teammate 2 can prepare its two prompt files immediately after Task 4, then finish the API routes once Teammate 1 has exposed the property/cost data they need. This follows the backend dependency order in the implementation plan. fileciteturn2file4L30-L57

---

# 4. Central UI work

While teammates build backend features, use Claude as the primary UI agent.

Build the central frontend against mock/seeded data first, then connect the real APIs.

Your UI ownership includes:

```text
Dashboard shell
Navigation
Property discovery UI
Property detail UI
True-cost UI
Comparison UI
Recommendation UI
Agreement UI
Roommate UI
Decision Assistant UI
Copilot UI
Shared reusable components
Loading / empty / error states
```

Every feature should use the same visual language. Do not allow separate agents to create independent UI systems.

The product is decision-oriented rather than a generic listing clone, and the dashboard is intended to be the hub for the P0 flow. fileciteturn2file1L15-L32 fileciteturn2file1L123-L125

---

# 5. Your final backend features

After teammates' tracks are integrated, you own:

### Decision Assistant

```text
POST /api/decision-assistant
lib/ai/prompts/decisionAssistant.ts
```

It must synthesize a shortlist against the user's explicit preferences and include per-property pros/cons. fileciteturn2file2L105-L106

### Copilot

```text
POST /api/copilot
lib/ai/prompts/copilot.ts
```

Ground it with the user's actual saved/shortlisted/cost/agreement data through `contextRefs`. Do not let it invent unavailable information. fileciteturn2file2L105-L106

Use the same small Antigravity prompt pattern:

```text
I am the project owner. Read PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md,
BACKEND_IMPLEMENTATION_PLAN.md.

Implement only [Decision Assistant / Copilot].
Use the existing shared AI client and types.
Use real data from the existing database/API contracts.
Do not modify teammate-owned feature implementations unless strictly required
for integration; flag any required interface change first.
Test the endpoint with real seeded/demo data.
Verify the structured response and stop at PRODUCT.md's Done when line.
Show changed files, tests, API verification, and AGENT_QUESTION comments.
```

---

# 6. Integration rule

Before merging any teammate branch:

```text
1. Pull latest main
2. Review diff
3. Run tests
4. Call the endpoint directly
5. Check response shape against ARCHITECTURE.md
6. Confirm no out-of-scope files changed
7. Merge
```

The backend plan explicitly requires reviewing each phase's diff before moving forward. fileciteturn2file4L89-L94

---

# 7. Final verification checklist

Minimum:

```text
Search property
→ view property
→ save
→ see cost
→ compare
→ recommendations
→ agreement analysis
→ roommate compatibility
→ decision assistant
→ copilot
→ dashboard
```

Required tests especially protect:

```text
/lib/cost.ts
agreement extraction full-field output
```

The agent rules identify those as the highest-priority correctness tests. fileciteturn2file3L40-L44

---

# 8. Git rule

You are the integration owner, but every teammate must still make meaningful commits.

Use small, descriptive commits and keep `main` stable. fileciteturn2file3L47-L50

Do not merge a large unverified dump just because time is running out.
