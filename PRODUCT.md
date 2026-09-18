# Product Specification — Rental Intelligence Platform

This document is the **scope authority** for the project. If a feature, requirement, or behavior is not written here, it does not exist yet — do not build it, and do not infer it from what "similar products" usually do. If something here is ambiguous, leave an `AGENT_QUESTION:` comment (see `AGENT_RULES.md`) rather than guessing.

## 1. Problem

First-time renters, students, and young professionals make one of the largest recurring financial decisions of their lives with almost no structured support: they can't easily see the *true* monthly cost of a property beyond rent, they don't understand what they're signing, and they have no principled way to compare shortlisted options or judge roommate fit. Listing sites optimize for discovery volume, not decision quality.

## 2. Who it's for

- First-time renters
- Students
- Young professionals renting independently, often for the first time in a new city

## 3. What it is *not*

- Not a generic property listing/search clone — discovery is a means to an end, not the product
- Not a legal advice tool — agreement analysis is informational only (see §7)
- Not a landlord-facing product in this MVP
- Not a payments or transactions platform

## 4. Product principles (binding constraints, not aspirations)

These constrain *how* every feature is implemented, not just what gets built:

1. **Decision over discovery** — every screen should move the user toward a decision, not just show more listings.
2. **Explainability over black-box AI** — every AI-generated score, recommendation, or flag must ship with a plain-language reason. A number with no explanation is not an acceptable output anywhere in this product.
3. **AI must solve a real problem** — do not bolt AI onto a feature that works fine without it.
4. **Structured data wherever possible** — AI outputs that feed the UI must be structured (JSON), not free text the frontend has to parse heuristically.
5. **User remains in control** — AI informs, the user decides. No feature should auto-commit the user to an action.
6. **P1 must never destabilize P0** — if a P1 feature requires changing P0 behavior, stop and flag it; do not proceed silently.
7. **Avoid unnecessary technology and complexity** — do not introduce a new library, service, or pattern to solve a problem an existing one already solves.
8. **No silent scope expansion** — if you think of a good idea that isn't in this doc, propose it, don't build it.

## 5. Core flow

```
Discover properties
      ↓
Understand true rental cost
      ↓
Compare properties
      ↓
Analyze rental agreement
      ↓
Evaluate roommate compatibility
      ↓
AI decision support
      ↓
Make an informed rental decision
```

The Unified Dashboard (§6.10) is the hub that ties these stages together; it is not a separate feature so much as the surface where all other features' outputs live.

## 6. P0 features — build these, and only these, first

Each feature below has a **definition of done**. An agent should treat "done" as the stopping point, not a floor to build past.

### 6.1 Property Discovery
- Search by keyword/location; filters (budget, bedrooms, furnishing, amenities)
- Property detail view
- Save / favorite a property
- **Done when:** a user can search, filter, open a property's full detail view, and save it to their list. No infinite-scroll pagination, no map view required for P0.

### 6.2 True Rental Cost Intelligence
For a given property, compute and display:
- Rent, maintenance, electricity, water, internet, transportation, other recurring expenses
- Security deposit, brokerage
- **Estimated monthly cost** = rent + maintenance + estimated utilities + estimated recurring expenses
- **Initial move-in cost** = security deposit + brokerage + first month rent (+ any one-time fees captured)
- Cost breakdown (itemized, not just a total)
- Affordability information relative to a user-entered budget/income (simple ratio-based signal, e.g. "this is ~38% of your stated budget" — not a credit/financial-advice product)
- **Done when:** every property detail view shows an itemized monthly cost, a move-in cost, and one affordability signal, each traceable to its inputs.

### 6.3 Property Comparison
- Select 2+ saved/shortlisted properties
- Side-by-side: rent, deposit, monthly cost, amenities, furnishing, location
- Trade-off callouts (plain language, e.g. "Property A is ₹3,000/mo cheaper but 15 min further from your commute point")
- **Done when:** a user can pick any set of their saved properties and see a side-by-side table plus at least one generated trade-off sentence per pair of key differences.

### 6.4 Personalized Property Recommendations
- Inputs: budget, location, bedrooms, furnishing, amenities, commute point, other stated preferences
- Output: ranked properties with a **"why this matches"** explanation per property
- **Done when:** recommendations are generated from explicit user-entered preferences (not inferred/guessed ones) and each has a visible, specific explanation — not a generic "great match!" label.

### 6.5 Rental Agreement Intelligence
- Upload agreement (PDF)
- Extract: rent, deposit, lease duration, lock-in period, notice period, rent escalation, maintenance responsibility, utility responsibility, penalties, termination conditions
- Agreement summary (plain-language)
- Clause explanation (plain-language explanation of what a clause means)
- **Done when:** uploading a PDF produces a structured extraction of the fields above (fields not found are explicitly marked "not found," never guessed) plus a summary and per-clause explanations for the clauses that were found.

### 6.6 Agreement Awareness
- Highlight clauses that deserve attention (not just list all clauses)
- Flag missing/unclear information where detectable
- Explain *why* something deserves attention
- **Hard constraint:** this feature surfaces information and explains clauses — it must never state a legal conclusion (e.g. never "this clause is illegal" or "you should not sign this"). Language must stay in the register of "this is worth reviewing because X," not legal judgment. Every AI-generated flag must carry a visible "informational only, not legal advice" disclaimer in the UI, not just in a footer.
- **Done when:** the agreement view shows a distinct "worth your attention" section with a reason per flagged item, and the disclaimer is visible on that view.

### 6.7 Roommate Compatibility
- Inputs (per person): budget, sleep schedule, work/study schedule, cleanliness, noise tolerance, guests, smoking, food preferences, pets, social preferences
- Output: compatibility analysis — common preferences, potential conflicts, explainable score
- **Done when:** given two people's inputs, the system produces a compatibility result that names specific areas of alignment and specific areas of friction, not just a single number.

### 6.8 Multi-Property Decision Assistant
- Analyze the user's shortlisted properties together
- Compare trade-offs across all of them (extends §6.3 beyond pairwise to full-shortlist)
- Factor in the user's stated preferences
- Explain advantages/disadvantages per property
- Provide decision-support insight — a synthesis, not just a re-display of comparison data
- **Done when:** given a shortlist of 2+ properties, the system produces one synthesized narrative (not just a table) that weighs them against the user's stated preferences.

### 6.9 AI Rental Copilot
A chat interface answering questions grounded in the user's own data, e.g.:
- "Can I afford this apartment?"
- "Explain this agreement clause."
- "Compare these properties."
- "What is my actual monthly cost?"
- "Why was this property recommended?"
- "What should I pay attention to?"
- **Done when:** the copilot can answer each of the six example questions above using the user's actual saved/shortlisted property, cost, and agreement data — not generic answers unconnected to their data.

### 6.10 Unified Dashboard
- Surfaces: saved properties, shortlisted properties, cost information, comparisons, agreement analysis, roommate information, recommendations, AI assistant entry point
- **Done when:** a user can reach every other P0 feature's current state from this one screen without hunting through navigation.

## 7. Legal-advice guardrail (applies to §6.5 and §6.6 everywhere in the product)

The system provides **informational assistance about rental agreements, not legal advice.** It must never:
- State whether a clause is enforceable, legal, or illegal
- Tell the user whether they should or should not sign
- Predict legal outcomes

It may:
- Extract and summarize what a clause says
- Explain what a clause means in plain language
- Flag that a clause is worth paying attention to and explain why (e.g., "this clause has no cap on rent escalation," stated as a fact about the clause, not a legal judgment)

This constraint applies to every prompt, every UI copy string, and every test involving agreement features.

## 8. P1 — do not build until P0 is stable and you are explicitly told to

Natural-language property search, rental scam warning signals, property inspection assistant, AI maintenance assistant, rent negotiation assistant, important-date reminders, basic location intelligence, rental budget planner, maintenance issue tracking, commute optimization, move-in planner, tenant checklist, basic document management, rent/payment tracking.

If you're an agent and P0 is done with time remaining, confirm with the team before starting any of these — don't assume priority order among them.

## 9. Future / explicitly out of scope — do not build, scaffold, or leave TODOs for

Voice rental assistant, full landlord dashboard, full property management system, integrated rental payments, advanced rent prediction, neighborhood sentiment analysis, automated rental applications, social roommate platform, advanced property analytics, full rental marketplace.

If a P0 or P1 feature seems to require one of these to "really" work well, that's a sign to scope down the P0/P1 implementation, not to build the Future item.
