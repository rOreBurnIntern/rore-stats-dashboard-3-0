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

Tasks with test conditions:
- [ ] Audit existing rORE Stats data sources, transforms, and UI sections.
  - Test condition: inventory doc identifies current endpoints, fields, and all dashboard widgets.
- [ ] Define canonical data contract for cards/charts/time filters.
  - Test condition: TypeScript interface draft maps every rendered metric and chart series field.
- [ ] Confirm migration success metrics (performance, reliability, feature parity).
  - Test condition: measurable targets documented (e.g., render success rate, API error handling behavior).

### Phase 2: Next.js Foundation Setup
Dependencies: Phase 1

Tasks with test conditions:
- [ ] Set up Next.js 14 app structure with TypeScript and App Router.
  - Test condition: `npm run dev` starts and base route renders without TypeScript errors.
- [ ] Configure Tailwind 3 and DaisyUI 4 theme scaffolding.
  - Test condition: utility classes and DaisyUI components render correctly in local environment.
- [ ] Establish shared types and utility modules for stats/chart transforms.
  - Test condition: build succeeds with typed imports consumed by at least one route/component.

### Phase 3: Data Layer and API Resilience
Dependencies: Phase 2

Tasks with test conditions:
- [ ] Implement Next.js API route for dashboard data aggregation.
  - Test condition: `/api/dashboard?range=24H|7D|ALL` returns structured JSON with HTTP 200 on success.
- [ ] Add upstream-first fetch strategy with Supabase fallback.
  - Test condition: forced upstream failure returns fallback Supabase-backed payload without client crash.
- [ ] Normalize and validate payload before returning to UI.
  - Test condition: response schema remains stable across upstream/fallback sources.
- [ ] Add route-level error handling and logging metadata.
  - Test condition: API failures return consistent error shape and are visible in server logs.

### Phase 4: Dashboard UI Migration
Dependencies: Phase 3

Tasks with test conditions:
- [ ] Build dashboard header with app title, last updated timestamp, theme toggle, and time filters.
  - Test condition: all controls render and filters trigger data refresh for each range option.
- [ ] Implement three stats cards using normalized API response.
  - Test condition: cards show formatted values and update when time filter changes.
- [ ] Implement three Recharts visualizations.
  - Test condition: all charts render with non-empty data and remain stable on resize.
- [ ] Add dedicated loading and error states for data requests.
  - Test condition: loading UI appears during fetch; error UI appears with retry path on failed requests.

### Phase 5: UX Hardening and Responsive Behavior
Dependencies: Phase 4

Tasks with test conditions:
- [ ] Implement persisted light/night theme using `localStorage`.
  - Test condition: selected theme persists after full page reload.
- [ ] Complete responsive layout for mobile, tablet, and desktop breakpoints.
  - Test condition: no horizontal overflow and chart readability is maintained at common viewport sizes.
- [ ] Add accessibility checks for keyboard navigation and color contrast.
  - Test condition: interactive controls are keyboard reachable and labels/contrast pass baseline checks.

### Phase 6: Verification and Release Readiness
Dependencies: Phase 5

Tasks with test conditions:
- [ ] Add unit tests for transform/filter logic and fallback selection behavior.
  - Test condition: tests pass for all range values and fallback scenarios.
- [ ] Add integration tests for API route and dashboard rendering states.
  - Test condition: successful, loading, and error flows are all covered and passing.
- [ ] Run production build validation and smoke test checklist.
  - Test condition: `npm run build` succeeds and dashboard loads with live/fallback data paths.

## Acceptance Criteria
- [ ] Dashboard includes header, three stats cards, and three charts.
- [ ] Time filters (`24H`, `7D`, `ALL`) update cards and charts correctly.
- [ ] Theme toggle supports `light` and `night`, persisted via `localStorage`.
- [ ] Next.js API route returns data from upstream source and automatically falls back to Supabase when upstream fails.
- [ ] Loading and error states are implemented and user-visible.
- [ ] Responsive behavior works across mobile, tablet, and desktop without broken layout.
- [ ] Codebase uses Next.js 14, TypeScript, Tailwind 3, DaisyUI 4, and Recharts for the migrated dashboard.

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
