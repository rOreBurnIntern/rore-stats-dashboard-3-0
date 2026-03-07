# rORE Stats Next.js Migration Plan

## 1. Project Overview (Why Next.js)

rORE Stats is currently a plain HTML/JS dashboard with client-side rendering and custom API wiring. Moving to Next.js provides a production-ready framework for a faster, safer, and easier-to-maintain app while preserving all existing functionality.

### Why this migration matters
- Consolidates frontend, API routes, and scheduled sync workflows in one typed codebase.
- Improves performance using server rendering, route-level caching, and better bundle splitting.
- Reduces runtime risk through stricter architecture (App Router conventions, shared types, central data layer).
- Simplifies long-term iteration (feature flags, incremental UI upgrades, analytics, auth-ready foundation).
- Keeps Vercel deployment model aligned with current operations.

### Migration objective
Deliver a Next.js app that is functionally equivalent to the current site on day one (no feature regression), then incrementally unlock improvements.

## 2. Tech Stack (Next.js, Tailwind, DaisyUI, Recharts)

### Core stack
- `Next.js` (App Router, TypeScript preferred)
- `React` + `React Server Components` where useful
- `Tailwind CSS` for utility-first styling
- `DaisyUI` for themed UI primitives/components
- `Recharts` to replace Chart.js chart rendering

### Data + backend
- Next.js Route Handlers under `app/api/*`
- Shared data service layer for upstream fetch/normalization
- `Supabase` as backup/fallback historical source
- Scheduled sync job every 10 minutes (Vercel Cron -> sync route)

### Quality + ops
- `Vitest` or `Jest` + Testing Library for unit/component tests
- ESLint + Prettier (or Biome) for lint/format consistency
- Vercel deployment previews + production
- Optional Sentry/observability for API and sync failures

## 3. Features To Port (All Current Features)

All existing behavior should be carried into the Next.js version before introducing major UX changes.

### Existing features to preserve
- API route(s) that aggregate rORE data and normalize upstream payloads.
- Three analytics charts:
  - Pie: Winner Take All vs Split
  - Bar: Wins by block
  - Line: Motherlode progression
- Theme toggle (dark/light), persisted client-side.
- Time filters:
  - `24H`
  - `7D`
  - `ALL`
- Supabase backup/fallback when upstream is unavailable.
- Automated data sync every 10 minutes.
- Current core dashboard stats:
  - Motherlode
  - WETH price
  - rORE price
- Loading/error/empty states and source/last-updated metadata.

## 4. New Improvements Possible With Next.js

### Product improvements
- Faster first paint and better mobile performance with server-rendered shell.
- Cleaner SEO/social previews (metadata + OpenGraph).
- Better UX resilience via route-level error/loading boundaries.
- Improved data freshness control using `revalidate` and cache tags.

### Engineering improvements
- Strong typing across API, transforms, and UI models.
- Shared utilities between sync/API/UI without duplicate logic.
- Easier chart component isolation and testing.
- Safer refactors with modular domain-driven folder structure.

### Operations improvements
- Predictable cron endpoint for 10-minute sync with idempotent writes.
- Structured logs for upstream failures and fallback activation.
- Clear staging/preview validation before production release.

## 5. Step-by-Step Implementation Plan

### Phase 0: Foundations
1. Create branch `feature/nextjs-migration`.
2. Initialize Next.js app in `rore-stats` (App Router + TypeScript).
3. Add Tailwind + DaisyUI + Recharts dependencies.
4. Set up lint/test scripts and baseline CI checks.

### Phase 1: Domain and Data Contracts
1. Define shared TypeScript types for prices, rounds, derived chart datasets, and API response envelopes.
2. Port and centralize current normalization logic (winner type, block parsing, timestamp parsing, dedupe).
3. Add unit tests for transformation parity with existing behavior.

### Phase 2: API Route Migration
1. Implement `GET /api/stats` as Next.js route handler.
2. Integrate upstream fetch with timeout/retry behavior.
3. Integrate Supabase fallback with source labeling.
4. Add cache headers/revalidation strategy.
5. Validate response shape matches frontend expectations.

### Phase 3: Sync Pipeline Migration
1. Implement `GET /api/cron/sync` (or `POST` with secret) for scheduled sync.
2. Port current sync/backfill logic and make writes idempotent.
3. Configure Vercel cron to run every 10 minutes.
4. Add sync result logging (pages fetched, rows upserted, fallback status).

### Phase 4: UI Shell + Theme System
1. Build App Router layout (`app/layout.tsx`) with DaisyUI themes.
2. Implement header, stat cards, and global loading/error boundaries.
3. Port theme toggle with localStorage persistence and SSR-safe hydration behavior.

### Phase 5: Chart Migration (Chart.js -> Recharts)
1. Build `WinnerTypePieChart` in Recharts.
2. Build `WinsByBlockBarChart` in Recharts.
3. Build `MotherlodeHistoryLineChart` in Recharts.
4. Ensure tooltips, legends, colors, and responsive sizing match current UX goals.

### Phase 6: Filters + Client Interactions
1. Implement `24H / 7D / ALL` filter controls as client component state.
2. Reuse existing filtering semantics for timestamp windows.
3. Validate chart/stat updates across filter switches.

### Phase 7: Hardening + QA
1. Add unit tests for data transforms and filter logic.
2. Add integration tests for `/api/stats` fallback scenarios.
3. Add UI tests for theme toggle and filter behavior.
4. Run performance and mobile checks (Lighthouse/manual smoke).

### Phase 8: Release
1. Deploy to staging preview.
2. Run parity checklist versus current production site.
3. Cut production release after acceptance criteria pass.
4. Monitor first 24-48 hours for upstream errors/sync health.

## 6. File Structure

```text
rore-stats/
  app/
    layout.tsx
    page.tsx
    globals.css
    api/
      stats/
        route.ts
      cron/
        sync/
          route.ts
  components/
    dashboard/
      StatsHeader.tsx
      StatsCards.tsx
      FilterTabs.tsx
      DashboardShell.tsx
    charts/
      WinnerTypePieChart.tsx
      WinsByBlockBarChart.tsx
      MotherlodeHistoryLineChart.tsx
    theme/
      ThemeToggle.tsx
  lib/
    api/
      upstream.ts
      stats-service.ts
      sync-service.ts
    data/
      supabase.ts
    transforms/
      normalize-rounds.ts
      derive-metrics.ts
      filters.ts
    types/
      stats.ts
    utils/
      format.ts
      time.ts
  tests/
    unit/
      transforms.test.ts
      filters.test.ts
    integration/
      api-stats.test.ts
      sync-route.test.ts
    e2e/
      dashboard.spec.ts
  public/
    icons/
  .env.example
  next.config.ts
  tailwind.config.ts
  postcss.config.js
  package.json
  vercel.json
```

## 7. Acceptance Criteria

### Functional parity
- `/api/stats` returns valid normalized payloads and supports upstream + fallback behavior.
- Dashboard shows Motherlode, WETH, and rORE values correctly.
- Recharts pie/bar/line charts render with accurate derived data.
- `24H`, `7D`, `ALL` filters match current semantics.
- Theme toggle works and persists dark/light preference.

### Data reliability
- Supabase fallback is used automatically when upstream fails.
- Sync job executes every 10 minutes and upserts without duplicate corruption.
- Last-updated/source labels are visible and accurate.

### Quality and release readiness
- Unit/integration/UI tests pass in CI.
- No critical console/runtime errors in staging and production smoke tests.
- Mobile and desktop layouts are usable and responsive.
- Migration is complete without regression of any current feature listed above.
