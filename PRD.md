# rORE Stats V4 - Product Requirements Document (PRD)

## Project Overview

### Product Name
rORE Stats V4

### Purpose
rORE Stats V4 is a public analytics dashboard for the rORE lottery protocol. It provides transparent, real-time protocol visibility for players and treasury stakeholders.

### Background
- The rORE protocol runs lottery-style rounds where users pick blocks.
- Each round contributes fees toward a motherlode pool.
- Motherlode growth rule: starts at `0.2 rORE` and increases by `+0.2 rORE` per round until a motherlode hit, then resets.
- Core upstream APIs are available at `api.rore.supply`:
  - `GET /api/prices`
  - `GET /api/explore`
- V3 is deployed but has known reliability and data-consistency issues that V4 must address.

### Primary Goals
1. Provide correct and continuously updating top-level protocol stats:
   - Current motherlode
   - WETH price
   - rORE price
2. Provide decision-support charts from recent and historical rounds:
   - Winner type distribution (Winner Take All vs Split, last ~1000 rounds)
   - Wins per block (`1-25`)
   - Motherlode running history
3. Improve correctness, resilience, and deployment reliability versus V3.
4. Ship with Burncoin-aligned dark visual system using fire accents:
   - `#ff6b00`
   - `#ff3d00`
5. Deploy on Vercel with API proxy to avoid client CORS/data-shape issues.

### Non-Goals (V4)
- Wallet connect or transaction execution
- User authentication
- Betting strategy recommendations
- Multi-chain expansion

## User Stories (5)
1. As a rORE participant, I want to see the current motherlode value so I can gauge round risk/reward.
2. As a trader or watcher, I want to see WETH and rORE prices so I can contextualize payout value.
3. As a player, I want to see Winner Take All vs Split frequency in recent rounds so I can understand game behavior.
4. As a player, I want to see win frequency per block (1-25) so I can compare block performance.
5. As a treasury/community operator, I want a motherlode history line that reflects true running value (`rounds since last hit × 0.2`) so protocol growth/reset cycles are transparent.

## Sequential Phases (Dependency-Ordered, 8 Phases)

### Phase 1: Discovery & Data Contract Lock
Dependencies: none

Tasks with test conditions:
- [ ] Confirm live payload shape for `GET /api/prices` from `api.rore.supply`.
  - Test condition: sample response captured and fields mapped (`weth`, `ore` or equivalent).
- [ ] Confirm live payload shape and pagination behavior for `GET /api/explore`.
  - Test condition: at least 2 pages fetched and merged without duplicates.
- [ ] Define canonical internal field map for round records.
  - Test condition: schema doc includes block number, winner type, hit indicator, motherlode/hit value, round id/timestamp.
- [ ] Document motherlode calculation rule for implementation.
  - Test condition: rule text and example validated by known hit rounds.

### Phase 2: API Proxy Architecture (Vercel)
Dependencies: Phase 1

Tasks with test conditions:
- [ ] Implement serverless proxy endpoint(s) on Vercel (e.g., `/api/stats`).
  - Test condition: local and preview calls return HTTP 200 with JSON envelope.
- [ ] Add upstream timeout/retry handling.
  - Test condition: simulated timeout returns controlled error payload, not crash.
- [ ] Normalize response shape for frontend consumption.
  - Test condition: frontend receives stable keys even if upstream keys vary.
- [ ] Add cache headers and short TTL strategy.
  - Test condition: response headers include intended cache policy.

### Phase 3: Core Data Pipeline & Derived Metrics
Dependencies: Phase 2

Tasks with test conditions:
- [ ] Build aggregation for latest ~1000 rounds.
  - Test condition: count of processed rounds is between 950-1050 when data available.
- [ ] Compute winner-type totals: Winner Take All vs Split.
  - Test condition: sum of both categories equals processed round count.
- [ ] Compute wins per block for all blocks `1-25`.
  - Test condition: output always has 25 bins, including zero-count bins.
- [ ] Compute motherlode running history per round.
  - Test condition: sawtooth pattern appears (increment by `0.2`, reset on hit).

### Phase 4: UI Shell & Top Stats Cards
Dependencies: Phase 3

Tasks with test conditions:
- [ ] Build top stat cards for current motherlode, WETH, rORE.
  - Test condition: three cards render with non-placeholder values when API succeeds.
- [ ] Add loading, empty, and error UI states.
  - Test condition: each state can be triggered and is visually distinct.
- [ ] Add “last updated” timestamp and source label.
  - Test condition: timestamp updates on refresh cycle.
- [ ] Ensure number formatting consistency.
  - Test condition: decimals/commas/currency symbols match product spec.

### Phase 5: Charting Layer Implementation
Dependencies: Phase 4

Tasks with test conditions:
- [ ] Implement pie chart for Winner Take All vs Split (last ~1000 rounds).
  - Test condition: labels + values + percentages align with computed totals.
- [ ] Implement bar chart for wins per block `1-25`.
  - Test condition: X-axis contains exactly 25 labeled blocks.
- [ ] Implement line chart for motherlode history.
  - Test condition: values follow `rounds since last hit × 0.2` and reset behavior.
- [ ] Add tooltip and legend behavior.
  - Test condition: hover values match source/derived data.

### Phase 6: Theming, Responsiveness & Accessibility
Dependencies: Phase 5

Tasks with test conditions:
- [ ] Apply dark theme with fire colors (`#ff6b00`, `#ff3d00`).
  - Test condition: visual audit confirms required palette usage.
- [ ] Build responsive layout for desktop/tablet/mobile.
  - Test condition: no overflow/cutoff at common breakpoints.
- [ ] Ensure contrast/readability on dark surfaces.
  - Test condition: key text and chart labels remain readable.
- [ ] Add keyboard-focus and semantic landmarks.
  - Test condition: tab navigation works and focus is visible.

### Phase 7: Quality, Regression, and V3 Fix Validation
Dependencies: Phase 6

Tasks with test conditions:
- [ ] Create validation checklist for known V3 failures.
  - Test condition: every known issue maps to at least one explicit test.
- [ ] Add unit/integration tests for transform logic.
  - Test condition: motherlode, winner-type, and block-bin tests pass.
- [ ] Perform manual browser regression pass.
  - Test condition: no console errors in target browsers.
- [ ] Verify proxy behavior under upstream degradation.
  - Test condition: graceful fallback/error UI, no white-screen failure.

### Phase 8: Release, Observability & Handover
Dependencies: Phase 7

Tasks with test conditions:
- [ ] Deploy production build to Vercel.
  - Test condition: production URL serves latest build successfully.
- [ ] Configure environment variables and secrets in Vercel.
  - Test condition: no secrets exposed client-side.
- [ ] Add lightweight telemetry/logging for proxy failures.
  - Test condition: failed upstream calls are observable in deployment logs.
- [ ] Publish release notes and runbook.
  - Test condition: documented rollback + troubleshooting steps exist.

## Acceptance Criteria
- [ ] Dashboard displays current `motherlode`, `WETH price`, and `rORE price` from live API data.
- [ ] Pie chart shows Winner Take All vs Split for approximately last 1000 rounds.
- [ ] Bar chart shows win counts for all blocks `1-25`.
- [ ] Line chart reflects motherlode running value with correct increment/reset behavior.
- [ ] API calls are made through Vercel proxy (frontend does not directly depend on cross-origin upstream calls).
- [ ] Page uses dark fire theme with `#ff6b00` and `#ff3d00` accents.
- [ ] Loading and error states are present and functional.
- [ ] No uncaught runtime errors or chart render failures in production smoke test.
- [ ] Data calculations are deterministic and validated by automated tests.

## UI Layout (ASCII)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ rORE Stats V4                                           Last Updated │
├──────────────────────────────────────────────────────────────────────┤
│ [ Motherlode ]              [ WETH Price ]              [ rORE Price ]
│   89.20 rORE                  $2,145.33                   $0.1942     │
├──────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐  ┌───────────────────────────────┐ │
│ │ Winner Type Distribution      │  │ Wins Per Block (1-25)         │ │
│ │ (Pie: WTA vs Split)           │  │ (Bar Chart)                    │ │
│ │ WTA: ###                      │  │ 1: ██                          │ │
│ │ Split: ###                    │  │ ...                            │ │
│ └───────────────────────────────┘  └───────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│ Motherlode History (Line)                                           │
│ Round Index →                                                        │
│   /\/\/\/\/\____/\/\/\/\____/\/\                                     │
│ (running motherlode value, +0.2 each round, reset on hit)           │
└──────────────────────────────────────────────────────────────────────┘
```

## Known Issues from V3 to Fix
1. Inconsistent motherlode history logic (hit-value-only or incorrect reset handling in some flows).
2. Partial round-window loading due to pagination/limit assumptions.
3. Intermittent CORS and direct-client fetch fragility instead of stable proxy-first access.
4. Data-shape drift causing front-end breakage when upstream field names differ.
5. Block win chart inconsistencies when block bins with zero wins are omitted.
6. Missing or weak loading/error states causing blank/ambiguous UI on failed fetches.
7. Occasional chart initialization race conditions during async render.
8. Production resiliency gaps (limited timeout/retry/logging for upstream API failures).

## Technical Notes
- Hosting: Vercel (frontend + serverless API proxy).
- Upstream API source: `api.rore.supply` (`/api/prices`, `/api/explore`).
- Motherlode formula (display series): `runningMotherlode = roundsSinceLastHit * 0.2` with reset after hit.
- Preferred architecture: normalized server response from proxy to keep frontend thin/stable.
