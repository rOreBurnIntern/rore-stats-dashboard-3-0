# rORE Stats Persistent Historical Database - PRD

## Project Overview
- **Type:** Data reliability and resilience upgrade
- **Core functionality:** Add a persistent Supabase PostgreSQL store for historical round data, sync new rounds hourly from the rORE API, and use database reads as a fallback source when the live API is unavailable.
- **Goal:** Prevent historical data loss and keep rORE Stats usable during API outages or schema disruptions while preserving the current API-first behavior.
- **Design Goal:** Site must look **clean, smooth, modern, and professional** — polished UI with smooth animations, consistent spacing, and professional color choices.

---

## User Stories
| # | Story |
|---|-------|
| 1 | As a rORE Stats user, I want to see historical rounds even if the rORE API is down, so the app remains reliable. |
| 2 | As a rORE Stats user, I want round records (round number, block, winnerTakeAll, timestamp, and related fields) to remain consistent over time, so trend analysis is trustworthy. |
| 3 | As an operator, I want hourly automated syncing from the rORE API into Supabase, so historical data stays current without manual intervention. |
| 4 | As a developer, I want API as primary and database as fallback, so current behavior is preserved and resiliency is added with minimal regression risk. |
| 5 | As an operator, I want observable sync outcomes (success/failure counts and last sync time), so I can detect and fix ingestion issues quickly. |

---

## Design Checklist (MUST REVIEW)

### Must-Have
- [x] Clear labeled numbers (e.g., "17.2 rORE" not "17.2")
- [x] Right chart types (line=time, bar=categories, pie=parts)
- [x] Time context ("Last 24 hours")
- [x] Loading state ("Loading..." while fetching)
- [x] Error state (friendly message on failure)
- [x] Mobile works (at minimum, scrolls)

### Nice-to-Have (ADD TO SCOPE)
- [x] Interactive charts (hover for details) — Add Chart.js tooltip configuration
- [x] Time filters [24H] [7D] [30D] — Add filter buttons that filter displayed data by time range
- [x] Dark/Light mode toggle — Add theme switcher, persist preference in localStorage
- [ ] Trend indicators (green up = good, red = bad) — Future enhancement
- [x] "Last updated" timestamp — Already implemented

### Layout Priority
1. Most important number (top-left)
2. 2-3 key supporting numbers
3. Main chart
4. Supporting charts

---

## Sequential Phases
### Phase 1: Data Model and Supabase Foundation
- [ ] Create Supabase project and environment wiring
- [ ] Define and apply `round_history` schema and indexes
- [ ] Add idempotent upsert path and data validation

### Phase 2: Backfill and Hourly Sync Pipeline
- [ ] Build historical backfill script for all available rounds
- [ ] Build incremental hourly sync job
- [ ] Deploy scheduled cron execution on Vercel

### Phase 3: API-First + Database Fallback Read Path
- [ ] Add fallback read service in app/API layer
- [ ] Implement failure detection and graceful switchover
- [ ] Add source indicator and last sync metadata to UI

### Phase 4: Hardening, Observability, and Rollout
- [ ] Add logging/metrics and alerting hooks
- [ ] Add regression and outage simulation tests
- [ ] Document runbook and production rollout steps

---

## Tasks per Phase
### Phase 1
| Task | Action | Test |
|------|--------|------|
| 1.1 | Create Supabase free-tier project and store `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars. | `vercel env ls` shows required keys in Preview/Production; local startup fails fast with clear error if missing env vars. |
| 1.2 | Design `round_history` table with fields: `round_number` (unique), `block_number`, `winner_take_all`, `round_timestamp`, `raw_payload`, `created_at`, `updated_at`. | SQL migration applies without error; unique constraint prevents duplicate `round_number`; sample insert/select succeeds. |
| 1.3 | Add indexes on `round_number DESC` and `round_timestamp DESC`; add input schema guard for numeric/date normalization. | Query plan uses indexes for latest-round reads; malformed payload test is rejected with structured error log. |

### Phase 2
| Task | Action | Test |
|------|--------|------|
| 2.1 | Build one-time backfill command that paginates rORE API history and upserts rows into Supabase. | Backfill completes with no duplicate rows; row count matches source round count for sampled checkpoints. |
| 2.2 | Build hourly incremental sync job that fetches newest rounds since max stored `round_number`. | Running job twice without new rounds results in zero new writes; adding new round produces exactly one insert/upsert. |
| 2.3 | Configure Vercel cron to trigger sync endpoint/script hourly. | Cron invocation appears in Vercel logs every hour; forced manual invocation returns success and updates `last_sync_at`. |

### Phase 3
| Task | Action | Test |
|------|--------|------|
| 3.1 | Keep existing live API fetch as primary path; wrap with timeout and retry budget. | Healthy API returns live data path; no regression in existing response shape. |
| 3.2 | On primary failure (timeout/5xx/schema mismatch), query Supabase for equivalent historical set and serve fallback payload. | Simulated API outage still returns valid historical data from DB with HTTP 200 and fallback marker. |
| 3.3 | Add frontend status text: `Source: Live API` or `Source: Database Fallback` and show `Last synced` timestamp. | UI displays correct source label per scenario and renders timestamp on desktop/mobile. |
| 3.4 | Add interactive charts with Chart.js tooltips (hover shows exact values). | Hovering over chart data points shows tooltip with round number and value. |
| 3.5 | Add time filter buttons [24H] [7D] [ALL] that filter displayed data by time range. | Clicking filter buttons updates charts and stats to show only data from that time period. |
| 3.6 | Add Dark/Light mode toggle with localStorage persistence. | Clicking toggle switches theme; preference persists on page reload. |

### Phase 4
| Task | Action | Test |
|------|--------|------|
| 4.1 | Add structured logs for sync runs (`started_at`, `completed_at`, `rows_inserted`, `rows_updated`, `errors`). | Log events emitted on every run; error case includes reason and round context. |
| 4.2 | Add automated tests for mapper logic, fallback selection, and DB query paths. | Test suite passes in CI; outage simulation test proves no blank-state regression. |
| 4.3 | Publish runbook: backfill, re-sync, incident steps, and rollback toggle to disable fallback if needed. | New team member can execute runbook in staging and recover from a forced sync failure scenario. |

---

## Acceptance Criteria
- [ ] Supabase PostgreSQL (free tier) is provisioned and connected to rORE Stats via environment variables.
- [ ] Historical rounds are persisted in `round_history` with required fields.
- [ ] One-time backfill imports all currently available historical rounds without duplicates.
- [ ] Hourly cron sync runs automatically on Vercel and upserts newly available rounds.
- [ ] Existing API path remains primary for reads under normal conditions.
- [ ] Automatic fallback to Supabase occurs when primary API read fails.
- [ ] Frontend clearly indicates active data source and displays `Last synced` timestamp.
- [ ] **Interactive charts** — Hovering shows tooltip with exact round number and value.
- [ ] **Time filters** — [24H] [7D] [ALL] buttons filter displayed data by time range.
- [ ] **Dark/Light mode** — Toggle switch changes theme, persists in localStorage.
- [ ] Outage simulation verifies users still get historical round data when rORE API is unavailable.
- [ ] Documentation exists for setup, sync operations, and failure recovery.

---

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: rORE Stats                          Last synced: t │
├─────────────────────────────────────────────────────────────┤
│ Source Badge: [Live API] or [Database Fallback]            │
├─────────────────────────────────────────────────────────────┤
│ Key Metric (Top-left): Current Round / WinnerTakeAll       │
│ Supporting Metrics: Block, Timestamp, Round Count          │
├─────────────────────────────────────────────────────────────┤
│ Main Historical Chart (time-series by round/timestamp)     │
├─────────────────────────────────────────────────────────────┤
│ Supporting Table: Recent historical rounds                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Stack
- Supabase PostgreSQL (free tier): persistent historical storage and query fallback
- Vercel (existing deployment): frontend/API hosting and scheduled function runtime
- Vercel Cron: hourly sync trigger
- rORE API: primary real-time source and sync ingestion source

---

## Development Workflow (ALWAYS FOLLOW)

### Branch Structure
- `master` = Production
- `staging` = Test environment  
- `feature/xyz` = New work

### Process for Every Feature/Bug
1. Create feature branch from staging: `git checkout -b feature/name staging`
2. Work and commit
3. Push: `git push origin feature/name`
4. Vercel auto-deploys to preview URL
5. Test on preview
6. Run code review: `codex review --base staging`
7. Merge to staging: `git checkout staging && git merge feature/name`
8. Verify staging works
9. Merge to master: `git checkout master && git merge staging`
10. Master auto-deploys to production

### Never push directly to master!

### Why
- Prevents bugs from going live instantly
- Allows testing in staging
- Code review catches issues early

