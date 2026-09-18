# Rental Intelligence Platform

An AI-powered rental decision platform for first-time renters, students, and young professionals. It is **not** a property listing clone — the product exists to help someone go from "here are some apartments" to "here is the one I should pick, and why," by making true cost, agreement risk, and roommate fit explainable rather than hidden.

Read `PRODUCT.md` before building any feature. Read `ARCHITECTURE.md` before writing any code. If you are an AI coding agent, read `AGENT_RULES.md` before doing either.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | Single repo, single deploy target, API routes = no separate backend service to stand up in 24h |
| Styling | Tailwind CSS | Fast, consistent, no design-system build cost |
| ORM / DB | Prisma + SQLite (dev) → Postgres (deploy) | Zero-config local dev, one-line swap to Postgres for deployment |
| AI | Anthropic Claude API (Messages API, structured JSON outputs) | Used for agreement extraction, cost/compatibility explanations, and the copilot |
| File parsing | `pdf-parse` (or equivalent) for agreement uploads | Lightweight, no external service dependency |
| Deployment | Vercel (app) + Vercel Postgres or Neon (DB) | Fastest path to a public demo URL |
| Auth | Minimal — single demo user / local-storage session, no real auth provider | Out of scope for a 24h MVP; see `PRODUCT.md` Future list |

> If the team changes any of these before/during the build, update this table in the same commit. This table is the source of truth for stack decisions — do not let it drift from what's actually in `package.json`.

## Getting started

```bash
git clone <repo-url>
cd rental-intelligence-platform
npm install
cp .env.example .env        # fill in ANTHROPIC_API_KEY and DATABASE_URL
npx prisma migrate dev
npm run dev
```

App runs at `http://localhost:3000`.

### Required environment variables

See `.env.example` for the full list and short descriptions. **Never commit `.env`.** Only `.env.example` (with placeholder values, no real secrets) is checked in.

## Running tests

```bash
npm test          # unit tests (cost calculation, clause extraction shape, compatibility scoring)
npm run test:e2e  # (if time allows) core flow smoke test
```

Per `AGENT_RULES.md`, cost calculation logic and agreement-extraction output shape must have tests — these are the two places where a silently wrong answer is worst.

## Deployment / demo

- **Live demo:** `<add Vercel URL here once deployed>`
- **Demo video / walkthrough:** `<add link here>`

## Project structure

```
/app              # Next.js routes (pages + API routes)
/components       # UI components
/lib              # business logic: cost calc, AI clients, prompts, scoring
/prisma           # schema + migrations
/docs             # PRODUCT.md, ARCHITECTURE.md, AGENT_RULES.md
```

Full breakdown and conventions are in `ARCHITECTURE.md`.

## AI usage disclosure

This project was built with heavy use of AI coding agents (Claude Code / Cursor / similar) working from the specs in `PRODUCT.md` and `ARCHITECTURE.md`, under the operating rules in `AGENT_RULES.md`. All AI-generated code was reviewed by the team before merge. The product itself also uses an LLM (Anthropic Claude) at runtime for: rental agreement clause extraction/explanation, cost and recommendation explanations, roommate compatibility reasoning, and the in-app copilot chat — all clearly surfaced to the user as AI-generated, explainable output rather than opaque scores.

## Team

`<names / roles>`

## License

`<if applicable>`
