# rORE Stats Next.js 14 Migration PRD

## Goal
Complete migration from the legacy static dashboard (`index.html` + `app.js`) to a Next.js 14 App Router application with feature parity, preserving all existing user-visible behavior while improving maintainability.

## Scope
- Build dashboard UI in `src/app/page.tsx` with reusable components in `src/components/*.tsx`.
- Implement `src/app/layout.tsx` + `src/app/globals.css` using Tailwind 3 and DaisyUI 4.
- Implement `GET /api/stats` in `src/app/api/stats/route.ts` with:
  - Upstream data fetch from `api.rore.supply`
  - Normalization + dedupe
  - Derived analytics payload for charts
  - Supabase fallback path
- Use Recharts for all visualizations.
- Preserve existing features: theme toggle, time filters (`24H`, `7D`, `ALL`), loading/error/empty states, source and last updated metadata.

## Out Of Scope
- Redesigning data model in DB.
- Replacing existing cron/sync architecture.
- Adding auth/user accounts.
- Advanced analytics not present in legacy app.

## Legacy Feature Parity Requirements
1. Dashboard header with title, last updated timestamp, source label, and theme toggle.
2. Protocol stats cards:
- Motherlode (rORE)
- WETH (USD)
- rORE (USD)
3. Filters: `24H`, `7D`, `ALL`.
4. State handling:
- Loading indicator
- API error message
- Empty state when selected range has no rounds
5. Charts:
- Pie: winner type distribution (Winner Take All vs Split)
- Bar: wins per block (0-25)
- Line: motherlode running value (0.2 sawtooth reset on `motherlodeHit`)
6. Theme persistence in `localStorage`.

## Technical Architecture
### Frontend
- Next.js App Router with client dashboard page for interactive controls.
- DaisyUI theme switch via `data-theme` (`light` / `night`) on `<html>`.
- Recharts chart components in `src/components`.

### API Route
- Route handler fetches:
- `/api/prices`
- paginated `/api/explore?page=N`
- Normalizes rounds with broad field compatibility (`roundId`, `id`, `winnerType`, `winnerTakeAll`, `block`, `endTimestamp`, etc).
- Dedupe key: `id:endTimestamp:winnerBlock`.
- Sort rounds chronologically + numeric id fallback.
- Truncate to latest 1000 rounds for payload.
- Return envelope:
  - `ok`
  - `source`
  - `pagesFetched`
  - `lastUpdated`
  - `data` (stats + rounds + derived datasets)
- On upstream failure: fallback to Supabase rounds; if unavailable return HTTP 502.

## Data Contract
```ts
interface StatsApiResponse {
  ok: boolean;
  source: 'upstream' | 'supabase-fallback';
  pagesFetched: number;
  lastUpdated: string;
  data: {
    stats: { motherlode: number | null; weth: number | null; rore: number | null };
    roundsProcessed: number;
    rounds: Array<{
      id: string;
      winnerTakeAll: boolean;
      winnerBlock: number | null;
      motherlodeHit: boolean;
      endTimestamp: string | null;
    }>;
    pie: { winnerTakeAll: number; split: number };
    bar: Array<{ block: number; wins: number }>;
    line: Array<{ x: string; motherlodeValue: number }>;
  };
}
```

## Implementation Plan
1. Rewrite UI shell in App Router (`layout`, `globals`, `page`) with DaisyUI + responsive layout.
2. Create modular UI/chart components in `src/components/*.tsx`.
3. Implement client-side range filtering and chart derivation from canonical rounds payload.
4. Rebuild `/api/stats` route handler to mirror legacy behavior and response envelope.
5. Validate migration with lint + production build.
6. Commit to `feature/nextjs-migration` and deploy preview via Vercel CLI.

## Risks And Mitigations
- Upstream schema drift:
- Mitigation: tolerant normalizers and fallback field mapping.
- Missing Supabase env values:
- Mitigation: explicit fallback failure handling and `502` response with `ok:false`.
- Theme hydration mismatch:
- Mitigation: `suppressHydrationWarning` and client-side theme initialization.

## Acceptance Criteria
- App builds successfully with Next.js 14.
- Dashboard replicates legacy behavior with no feature regressions.
- Filters update chart datasets correctly.
- Theme persists across reloads.
- API route returns valid upstream payload and fallback behavior.
- Preview deployment command executed (`vercel deploy --yes`).
