# Frontend Implementation Plan — Rental Intelligence Platform (reference / fallback)

Another agent is already building the frontend. This doc exists so you can either (a) sanity-check what that agent produces against the spec, or (b) generate the whole frontend from scratch — e.g. with Codex — once the backend API surface in `ARCHITECTURE.md §4` exists, without re-deriving the screen list and rules from three separate docs.

**Read first:** `PRODUCT.md`, `ARCHITECTURE.md`. This plan assumes the backend described in `BACKEND_IMPLEMENTATION_PLAN.md` is being built in parallel or already exists.

---

## 0. Assumptions

- Single Next.js 14 App Router repo — frontend and API routes live together (ARCHITECTURE §1). Not a separately deployed frontend calling a remote API.
- Tailwind CSS, no design-system build. React state + URL params for client state — no Redux/Zustand (ARCHITECTURE §2).
- Single demo user, no auth flow to build.
- Every screen's data shape should match the backend's response shape exactly — don't invent a parallel frontend-only type for the same entity.

## 1. Shared types

Create (or reuse, if the backend already exports them) `/lib/ai/types.ts` and a general `/lib/api-types.ts` mirroring every route's response shape from ARCHITECTURE §3/§4/§7. Import these into components rather than re-declaring props ad hoc per screen.

## 2. Screen-by-screen plan

Each entry: route, API dependency, key components, the PRODUCT.md "Done when" line it must satisfy, and any hard UI rule.

### 2.1 Unified Dashboard — `/app/(dashboard)/page.tsx` (§6.10)
- Hub linking to every other feature: saved, shortlisted, cost info, comparisons, agreement analysis, roommate info, recommendations, copilot entry point.
- Deps: `GET /api/saved`, `GET /api/properties`, `GET /api/agreements`
- Done when: every other P0 feature's current state is reachable from here without hunting through nav.

### 2.2 Property Discovery — `/app/(dashboard)/properties/page.tsx` (§6.1)
- Search bar + filters (budget, bedrooms, furnishing, amenities). No pagination, no map for P0.
- Components: `PropertyCard`, `FilterBar` → `/components/features/discovery`
- Deps: `GET /api/properties`

### 2.3 Property Detail — `/app/(dashboard)/properties/[id]/page.tsx` (§6.1, §6.2)
- Full detail view, itemized `CostBreakdown`, one affordability signal, save button.
- Deps: `GET /api/properties/[id]`, `GET /api/properties/[id]/cost`, `POST /api/saved`
- **Hard rule:** any field with `isEstimated: true` must be visually distinguished from an actual figure (badge, asterisk, muted style) — never rendered as if it were a hard number.

### 2.4 Saved / Shortlist
- Surfaced on the dashboard and/or its own list; toggle save vs. shortlist (same underlying flag).
- Deps: `GET/POST/DELETE /api/saved`

### 2.5 Comparison — `/app/(dashboard)/compare/page.tsx` (§6.3)
- Pick 2+ saved/shortlisted properties → side-by-side table + at least one trade-off sentence per key difference.
- Component: `ComparisonTable` → `/components/features/comparison`
- Deps: `POST /api/compare`

### 2.6 Recommendations — `/app/(dashboard)/recommendations/page.tsx` (§6.4)
- Preference input (budget, location, bedrooms, furnishing, amenities, commute point) + ranked list with a visible, specific "why this matches" per property.
- Deps: `GET /api/recommendations`
- **Hard rule:** the match reason must reference specific attributes — no generic "great match!" badge.

### 2.7 Agreement Upload & Analysis — `/app/(dashboard)/agreements/page.tsx` + `[id]` (§6.5, §6.6)
- PDF upload, extracted fields (explicit "not found" — never blank/omitted for undetected fields), plain-language summary, per-clause explanations, a distinct "worth your attention" section with a reason per flagged item.
- Deps: `POST /api/agreements`, `GET /api/agreements/[id]`
- **Hard rule:** a visible "informational only, not legal advice" disclaimer directly on this view (not just a footer). No copy anywhere on this screen may phrase a flag as a legal conclusion.

### 2.8 Roommate Compatibility — `/app/(dashboard)/roommates/page.tsx` (§6.7)
- Two-profile input form → common preferences, potential conflicts, explainable score.
- Deps: `POST /api/roommates/compatibility`
- **Hard rule:** the score is never rendered without its explanation next to it.

### 2.9 Decision Assistant — surfaced from the shortlist / dashboard (§6.8)
- One synthesized narrative + per-property pros/cons, weighed against the user's stated preferences (not just a re-display of the comparison table).
- Deps: `POST /api/decision-assistant`

### 2.10 Copilot — persistent entry point (slide-over panel or `/app/(dashboard)/copilot/page.tsx`) (§6.9)
- Chat UI that must be able to answer, using the user's real data: "Can I afford this?", "Explain this clause", "Compare these properties", "What's my actual monthly cost?", "Why was this recommended?", "What should I pay attention to?"
- Deps: `POST /api/copilot`

## 3. Component structure (mirrors ARCHITECTURE §8)

```
/components
  /ui/        # Button, Card, Table, Badge, Disclaimer, LoadingSkeleton — generic, reusable
  /features/
    discovery/
    cost/
    comparison/
    recommendations/
    agreements/
    roommates/
    decision/
    copilot/
```

## 4. Cross-cutting UI rules (binding — apply on every screen, not just the ones listed above)

- Never render a score or recommendation without its explanation next to it (Product Principle 2).
- Distinguish estimated vs. actual numbers visually, everywhere a number appears, not just on the detail page.
- Every agreement-related view keeps the legal disclaimer visible.
- No feature auto-commits the user to an action — AI informs, a click by the user saves/shortlists/acts (Product Principle 5).
- Every AI-backed screen needs a loading state — these calls are synchronous and can be slow (ARCHITECTURE §9: no background job queue), so a blank screen during the wait is not acceptable.

## 5. Suggested build order

Lines up with the backend's phases so each screen lights up as its endpoint lands.

1. Dashboard shell + navigation (static, before any API exists)
2. Discovery + property detail + cost breakdown
3. Saved/shortlist state
4. Comparison + recommendations
5. Agreement upload/view
6. Roommate compatibility
7. Decision assistant + copilot

## 6. Testing

- If time allows, one Playwright e2e smoke test: search → view property → save → compare → view cost breakdown (AGENT_RULES §4's minimum demo path).

## 7. If generating this from scratch via Codex (or another agent)

Give it: `PRODUCT.md`, `ARCHITECTURE.md` §3/§4/§7/§8, and this file. Instruct it to build screen-by-screen in the order in §5, use the backend's exact response shapes rather than guessing new ones, and leave an `AGENT_QUESTION:` comment instead of guessing on anything ambiguous — same discipline as the backend agent follows.
