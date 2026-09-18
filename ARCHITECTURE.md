# Architecture — Rental Intelligence Platform

This document is the source of truth for **how** the product in `PRODUCT.md` is built. If you're about to make a structural decision (new dependency, new pattern, new module boundary), check here first — if it's not decided here, propose it before building it, don't decide it silently mid-feature.

## 1. System overview

```
┌─────────────────────────────┐
│   Next.js App (frontend)    │
│  React components, Tailwind │
└──────────────┬──────────────┘
               │ same-repo API routes
┌──────────────▼──────────────┐
│  Next.js API routes (BFF)   │
│  /app/api/*                 │
└──────┬───────────────┬──────┘
       │                │
┌──────▼──────┐  ┌──────▼───────────┐
│  Prisma ORM  │  │  AI layer (/lib) │
│  → Postgres  │  │  Claude API      │
│  (SQLite dev)│  │  calls + prompts │
└──────────────┘  └──────────────────┘
```

One deployable app. No separate backend service, no microservices — this is a hackathon-scale monolith by design (see Product Principle 7: avoid unnecessary complexity).

## 2. Tech stack decisions

| Decision | Choice | Why (one line) |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript | One repo, one deploy, built-in API routes |
| Styling | Tailwind CSS | No design-system build cost |
| ORM | Prisma | Type-safe queries, fast migrations |
| DB | SQLite (dev) / Postgres (prod, via Neon or Vercel Postgres) | Zero local setup, trivial prod swap |
| AI provider | Anthropic Claude (Messages API) | Structured JSON output support, used for all AI features |
| PDF parsing | `pdf-parse` | Lightweight, no external service |
| State (client) | React state + URL params; no global state library | App is not complex enough to need Redux/Zustand — do not add one |
| Auth | Single demo user, no auth provider | Out of scope per `PRODUCT.md` §9; do not add NextAuth/Clerk/etc. unless scope changes |
| Testing | Vitest (unit) + Playwright (e2e, if time allows) | Fast, minimal config |

**Do not add a dependency not in this table without updating this table in the same PR.** If you think you need one, that's a flag-and-ask moment, not a silent-install moment.

## 3. Data model

Entities and their key fields. Full column-level detail lives in `prisma/schema.prisma` — this is the conceptual map, not a copy of the schema (don't let these two drift; if you change the schema, update this table's shape, not its exact types).

| Entity | Key fields | Notes |
|---|---|---|
| `User` | id, name, budget, preferences (JSON: location, bedrooms, furnishing, amenities, commute point) | Single demo user for MVP; structure supports multi-user later |
| `Property` | id, title, location, rent, deposit, brokerage, furnishing, amenities[], bedrooms, description | Seed data for demo — see §6 |
| `CostBreakdown` | id, propertyId, maintenance, electricity, water, internet, transport, otherRecurring, estimatedMonthlyCost, initialMoveInCost | Computed from Property + defaults/user input; see §5 for calculation logic |
| `SavedProperty` | id, userId, propertyId, isShortlisted (bool) | One table drives both "saved" and "shortlisted" — shortlisted is a flag, not a separate entity |
| `Agreement` | id, userId, propertyId (nullable), fileName, uploadedAt, extractedFields (JSON), summary, flaggedClauses (JSON) | `extractedFields` stores the §6.5 fields; missing fields are explicit `null`, never omitted |
| `RoommateProfile` | id, userId, budget, sleepSchedule, workSchedule, cleanliness, noiseTolerance, guests, smoking, foodPreferences, pets, socialPreferences | One per person being compared |
| `CompatibilityResult` | id, profileAId, profileBId, commonPreferences[], potentialConflicts[], explanation, score | `score` is always accompanied by `explanation` — never displayed alone (Principle 2) |
| `ChatMessage` | id, userId, role (user/assistant), content, contextRefs (JSON — which properties/agreements were in context) | Backs the copilot; `contextRefs` is what makes answers grounded, not generic |

## 4. API surface

Internal API routes under `/app/api/`, consumed only by this app's frontend (not a public API for MVP).

| Route | Method | Purpose |
|---|---|---|
| `/api/properties` | GET | List/search/filter properties |
| `/api/properties/[id]` | GET | Property detail |
| `/api/properties/[id]/cost` | GET | Cost breakdown for a property |
| `/api/saved` | GET/POST/DELETE | Manage saved/shortlisted properties |
| `/api/compare` | POST | Given property IDs, return comparison + trade-offs |
| `/api/recommendations` | GET | Ranked properties + "why this matches" per property |
| `/api/agreements` | POST | Upload + trigger extraction |
| `/api/agreements/[id]` | GET | Extracted fields, summary, flagged clauses |
| `/api/roommates/compatibility` | POST | Given two profiles, return compatibility result |
| `/api/decision-assistant` | POST | Given shortlisted property IDs, return synthesized narrative |
| `/api/copilot` | POST | Chat message in, grounded answer out |

Response shapes should mirror the entity table in §3 as closely as possible — don't invent parallel shapes for the same data in different routes.

## 5. Cost calculation logic

Lives in `/lib/cost.ts`, not scattered across routes/components. Single source of truth so the dashboard, comparison, and copilot never disagree on a number.

```
estimatedMonthlyCost = rent + maintenance + electricity + water + internet + transport + otherRecurring
initialMoveInCost   = deposit + brokerage + rent  (first month)
affordabilityRatio  = estimatedMonthlyCost / user.budget
```

Where a component isn't provided by listing data, use a clearly-labeled estimate (e.g., city-average utility estimate) and mark it as `isEstimated: true` in the response — the UI must visually distinguish estimated vs. actual figures. Never silently treat an estimate as a hard number.

## 6. Data seeding (no live listings integration in MVP)

Property data is seeded (JSON fixture → Prisma seed script), not pulled from a live listings API — building/maintaining a scraper or integration is out of scope for 24 hours and not in `PRODUCT.md`. Seed file lives at `/prisma/seed.ts`, ~15-20 realistic properties covering a spread of price points and amenities so comparison/recommendation features have something meaningful to work with.

## 7. AI pipeline design

All LLM calls go through `/lib/ai/client.ts` (one wrapped client, one place to change model/params) and `/lib/ai/prompts/` (one prompt file per feature). Every call requests structured JSON output matching a defined TypeScript type in `/lib/ai/types.ts` — the frontend never parses free-text AI output.

| Feature | Input to model | Required output shape | Explainability requirement |
|---|---|---|---|
| Recommendations (§PRODUCT 6.4) | User preferences + candidate properties | Ranked list + `reason: string` per item | `reason` must reference specific matched attributes, not be generic |
| Comparison trade-offs (§6.3) | 2+ properties' data | List of `tradeoff: string` statements | Each trade-off names the specific dimension and both properties |
| Agreement extraction (§6.5) | Parsed PDF text | Structured fields per `PRODUCT.md` §6.5, each `found: boolean` | Missing fields explicit, not omitted |
| Agreement clause flags (§6.6) | Extracted fields + full text | `flags: [{ clause, reason }]` | Reason required per flag; language checked against the legal-advice guardrail (§PRODUCT 7) |
| Roommate compatibility (§6.7) | Two profiles | `{ common: [], conflicts: [], explanation, score }` | `score` never returned without `explanation` |
| Decision assistant (§6.8) | Shortlist + preferences | One narrative string + per-property pros/cons | Must reference the user's actual stated preferences |
| Copilot (§6.9) | User message + relevant grounded data (via `contextRefs`) | Text answer | Must be answerable by pointing to §3 entities — if the answer would require data not in the user's account, say so rather than inventing it |

**Rule for every prompt:** system prompts for §6.5/§6.6 must explicitly instruct the model not to give legal conclusions (mirrors `PRODUCT.md` §7). This is a correctness requirement, not a style preference — treat a violation as a bug.

## 8. Folder structure

```
/app
  /api/...              # API routes (one folder per resource, matches §4)
  /(dashboard)/...      # dashboard + feature pages
/components
  /ui/                  # generic, reusable (Button, Card, Table...)
  /features/            # feature-specific (CostBreakdown, ComparisonTable, AgreementViewer...)
/lib
  /ai/
    client.ts
    types.ts
    prompts/
  cost.ts
  db.ts                 # Prisma client singleton
/prisma
  schema.prisma
  seed.ts
/docs
  PRODUCT.md
  ARCHITECTURE.md
  AGENT_RULES.md
```

Feature-specific logic goes in `/lib`, not inline in API routes or components — this is what lets multiple agents work on different features without duplicating the same calculation or prompt in two places. **Before writing a new function, check `/lib` for one that already does it.**

## 9. What's explicitly NOT built yet (don't add it preemptively)

- No caching layer (React Query/SWR optional but not required for MVP data volumes)
- No background job queue — AI calls are synchronous request/response
- No file storage service (S3 etc.) — uploaded PDFs are processed in-memory/temp and not persisted long-term beyond their extracted data
- No real-time updates (websockets/polling) anywhere
- No design system beyond Tailwind + a small shared `/components/ui` set

If a feature seems to need one of these, that's a signal to simplify the feature, not to add the infrastructure — flag it instead (per `AGENT_RULES.md`).
