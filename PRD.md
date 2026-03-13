# rORE Stats Next.js Migration - Product Requirements Document (PRD)

## Project Overview

### Project Name
rORE Stats Next.js Migration

### Why Next.js
- Standardize the app on a modern React framework with App Router, server components, and API routes.
- Improve reliability by moving data orchestration to server-side routes instead of fragile client-only fetches.
- Enable better performance through route-level rendering control, caching, and optimized bundles.
- Simplify deployment and environment management for Vercel-hosted releases.

### What We Are Building
A responsive analytics dashboard for rORE that includes:
- Header with title, last-updated timestamp, theme toggle, and time filters (`24H`, `7D`, `ALL`)
- Three stats cards for key protocol metrics
- Three charts (distribution, block performance, motherlode trend)
- Robust data access via Next.js API route with upstream source and Supabase fallback
- Clear loading and error states

## User Stories
1. As a player, I want to quickly see current headline stats so I can understand protocol status at a glance.
2. As a returning user, I want light/night theme preference remembered so I do not reset display settings every visit.
3. As an analyst, I want to filter data by `24H`, `7D`, or `ALL` so I can compare short-term and long-term behavior.
4. As a user, I want charts to load reliably even if the upstream API is unstable so the dashboard remains useful.
5. As a mobile user, I want the dashboard layout to adapt cleanly to smaller screens so all charts remain readable.

## Sequential Phases (Dependency-Ordered)

### Phase 1: Discovery, Scope Lock, and Baseline
Dependencies: None

Tasks with detailed test conditions:
- [x] Audit existing rORE Stats data sources, transforms, and UI sections.
  - Test: create an inventory checklist that names every data source endpoint, every transformed field, and every rendered widget; verify all existing dashboard sections map to at least one data source field.
- [x] Define canonical data contract for cards/charts/time filters.
  - Test: `src/types/dashboard.ts` (or equivalent) defines interfaces for cards/charts/filters; `npm run build` passes with no `any` in dashboard response typing and every rendered metric references typed fields.
- [x] Confirm migration success metrics (performance, reliability, feature parity).
  - Test: PRD includes numeric targets for page load, API success/fallback behavior, and parity scope; each target includes a measurement method and pass/fail threshold.

### Phase 2: Next.js Foundation Setup
Dependencies: Phase 1

Tasks with detailed test conditions:
- [x] Set up Next.js 14 app structure with TypeScript and App Router.
  - Test: run `npm run dev`, open `/`, confirm page renders; run `npm run build`, confirm no TypeScript/App Router compile errors.
- [x] Configure Tailwind 3 and DaisyUI 4 theme scaffolding.
  - Test: add a Tailwind utility class and DaisyUI component on a test page, confirm styles are applied in browser and no missing plugin warnings appear in build output.
- [x] Establish shared types and utility modules for stats/chart transforms.
  - Test: at least one API route and one UI component import shared transform/types module; `npm run build` succeeds and IDE/typecheck reports no unresolved imports.

### Phase 3: Data Layer and API Resilience
Dependencies: Phase 2

Tasks with detailed test conditions:
- [x] Implement Next.js API route for dashboard data aggregation.
  - Test: run `curl -i /api/dashboard?range=24H`, `7D`, and `ALL`; each returns HTTP 200 with JSON containing `stats`, `charts`, `lastUpdated`, and `range`.
- [x] Add upstream-first fetch strategy with Supabase fallback.
  - Test: simulate upstream timeout/500 (mock or env toggle), call `/api/dashboard`; verify fallback source is used, response still returns HTTP 200, and dashboard renders without runtime errors.
- [x] Normalize and validate payload before returning to UI.
  - Test: compare successful upstream and fallback payloads against one schema validator; both pass with identical key set and value types.
- [x] Add route-level error handling and logging metadata.
  - Test: force both upstream and fallback failures; verify API returns non-200 with stable error JSON (`error.code`, `error.message`, `requestId`) and server logs include request id plus source failure reason.

### Phase 4: Dashboard UI Migration
Dependencies: Phase 3

Tasks with detailed test conditions:
- [x] Build dashboard header with app title, last updated timestamp, theme toggle, and time filters.
  - Test: open dashboard, confirm title/timestamp/toggle/filter buttons render; click `24H`, `7D`, `ALL` and verify each click triggers one API request with matching `range` query param.
- [x] Implement three stats cards using normalized API response.
  - Test: cards render expected labels and formatted numbers (currency/integers); switching time range updates all card values and no stale value remains.
- [x] Implement three Recharts visualizations.
  - Test: each chart renders at least one data series with tooltip labels; resize from desktop to mobile widths and confirm charts rerender without overlap or console errors.
- [x] Add dedicated loading and error states for data requests.
  - Test: throttle network to `Slow 3G`, confirm loading indicator appears until response resolves; force API failure, confirm error state appears with retry button, click retry and verify successful recovery path.

### Phase 5: UX Hardening and Responsive Behavior
Dependencies: Phase 4

Tasks with detailed test conditions:
- [x] Implement persisted light/night theme using `localStorage`.
  - Test: click theme toggle to `night`, confirm `localStorage` stores selected theme and UI updates; refresh page and verify `night` theme remains; repeat for `light`.
- [x] Complete responsive layout for mobile, tablet, and desktop breakpoints.
  - Test: validate layout at 390x844, 768x1024, and 1440x900; confirm no horizontal scroll, cards stack correctly, and chart axes/labels remain readable.
- [x] Add accessibility checks for keyboard navigation and color contrast.
  - Test: keyboard-tab through all controls and activate filters/toggle/retry with Enter/Space; run automated a11y scan (axe/Lighthouse) and confirm no critical contrast or missing-label violations.

### Phase 6: Verification and Release Readiness
Dependencies: Phase 5

Tasks with detailed test conditions:
- [x] Add unit tests for transform/filter logic and fallback selection behavior.
  - Test: unit suite covers transform outputs for `24H`, `7D`, `ALL`, empty input, malformed rows, and fallback selector decision tree; all tests pass in CI.
- [x] Add integration tests for API route and dashboard rendering states.
  - Test: integration tests call `/api/dashboard` with mocked sources and assert success payload, fallback payload, and failure payload; UI integration verifies loading-to-success and loading-to-error transitions.
- [x] Run production build validation and smoke test checklist.
  - Test: run `npm run build && npm run start`, open dashboard, verify cards/charts load on live path; simulate upstream outage and verify fallback path still serves usable dashboard.

## Acceptance Criteria
- [x] Dashboard includes header, three stats cards, and three charts.
- [x] Time filters (`24H`, `7D`, `ALL`) update cards and charts correctly.
- [x] Theme toggle supports `light` and `night`, persisted via `localStorage`.
- [x] Next.js API route returns data from upstream source and automatically falls back to Supabase when upstream fails.
- [x] Loading and error states are implemented and user-visible.
- [x] Responsive behavior works across mobile, tablet, and desktop without broken layout.
- [x] Codebase uses Next.js 14, TypeScript, Tailwind 3, DaisyUI 4, and Recharts for the migrated dashboard.

## UI Layout (ASCII)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ rORE Stats Next.js Migration     [24H] [7D] [ALL]   Theme: (Light/Night)   │
│ Last Updated: 2026-03-08 12:00 UTC                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Stat Card 1 ]            [ Stat Card 2 ]            [ Stat Card 3 ]       │
│ Current Motherlode         rORE Price                 Total Rounds           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌──────────────────────────────────────────┐ │
│ │ Chart 1                     │ │ Chart 2                                  │ │
│ │ Winner Type Distribution    │ │ Wins by Block                            │ │
│ │ (Pie/Donut)                 │ │ (Bar)                                    │ │
│ └─────────────────────────────┘ └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Chart 3: Motherlode Trend (Line)                                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Technical Stack
- Next.js 14
- TypeScript
- Tailwind CSS 3
- DaisyUI 4
- Recharts

## Out of Scope
- Wallet connectivity and transaction execution
- Authentication/authorization
- Non-dashboard pages beyond migration needs

## Test Specifications

### Unit Test Requirements (Transform/Filter Logic)
- Cover range filtering for `24H`, `7D`, and `ALL` with deterministic fixture timestamps.
- Validate card metric transforms for rounding/formatting edge cases (zero, null, negative, very large values).
- Validate chart series transforms preserve sort order and expected labels/keys.
- Verify malformed or partial rows are safely ignored or defaulted without throwing.
- Verify fallback selector chooses upstream when healthy and Supabase when upstream is unavailable or invalid.

### Integration Test Requirements (API Routes)
- Test `GET /api/dashboard?range=24H|7D|ALL` returns HTTP 200 and stable JSON contract on success.
- Test upstream failure path returns fallback-backed success payload with the same response shape.
- Test dual-source failure path returns stable error contract with status code, code, message, and request id.
- Assert response headers/content type and basic cache behavior are consistent with route policy.
- Ensure server logs include source selection and error metadata for failed requests.

### E2E Test Requirements (User Flows)
- Initial page load: header, cards, and three charts become visible with non-empty values.
- Time filter flow: switching `24H`, `7D`, `ALL` updates cards/charts and issues matching API requests.
- Theme flow: toggle light/night theme, refresh, and confirm persisted theme state.
- Loading flow: under throttled network, loading UI appears before data is rendered.
- Error recovery flow: force API failure, verify error UI and retry button, then restore API and confirm recovery.
- Responsive flow: verify key layouts and chart readability at mobile, tablet, and desktop viewports.
