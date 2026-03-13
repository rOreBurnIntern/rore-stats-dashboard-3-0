# rORE Stats V4 Release Notes

Release date: 2026-03-06

## Highlights
- Added Vercel proxy API route at `/api/stats` that aggregates `api.rore.supply` upstream data.
- Added pagination walker for explore data to process a ~1000 round window reliably.
- Added top stats row:
  - Motherlode from `protocolStats.motherlode` (wei -> rORE)
  - WETH price
  - rORE price
- Added Chart.js analytics:
  - Pie chart (Winner Take All vs Split)
  - Bar chart (wins per block 1-25 with zero bins)
  - Line chart (motherlode running value)
- Added dark fire theme with `#ff6b00` and `#ff3d00`.
- Added loading, empty, and error states.
- Added transform and API tests via Node test runner.
