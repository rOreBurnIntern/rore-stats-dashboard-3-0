# rORE Stats V4 Runbook

## Local checks
1. Run tests: `npm test`
2. Run lint/syntax checks: `npm run lint`

## API behavior
- Endpoint: `/api/stats`
- Cache policy: `public, s-maxage=30, stale-while-revalidate=60`
- Controlled failure response: HTTP `502` with JSON error envelope

## Troubleshooting
1. If `/api/stats` returns 502:
   - check function logs for `[/api/stats] upstream fetch failed`
   - verify DNS and outbound connectivity to `api.rore.supply`
2. If chart data looks empty:
   - verify upstream explore payload still includes expected list fields (`rounds/items/results`)
   - inspect normalized payload in `/api/stats` response
3. If motherlode appears incorrect:
   - verify upstream field exists at `protocolStats.motherlode` and is wei
   - confirm conversion divides by `1e18`

## Rollback
1. In GitHub, revert the deployment commit.
2. Redeploy prior commit in Vercel.
3. Validate `/api/stats` and dashboard render after rollback.
