# Phase 1: Discovery & Data Contract Lock

Date: 2026-03-06

## Upstream probe status
- Live probing of `https://api.rore.supply` failed in this environment due DNS resolution errors (`Could not resolve host`).
- Implementation includes normalization against key variants observed across prior versions and expected API patterns.

## Canonical internal round schema
```json
{
  "id": "string",
  "timestamp": "string|null",
  "winnerType": "winner_take_all|split",
  "winnerBlock": "number|null",
  "motherlodeHit": "boolean"
}
```

## Expected field map (normalized)
- Prices:
  - `weth`: `weth | WETH | prices.weth | data.weth`
  - `rore`: `ore | rore | rORE | prices.ore | data.ore`
- Motherlode (wei):
  - `protocolStats.motherlode` (preferred), with fallbacks:
  - `motherlode | stats.motherlode`
  - converted to rORE as `wei / 1e18`
- Explore rounds list:
  - `rounds | items | results | data.rounds | data.items`
- Pagination:
  - supports `hasNext`, `nextPage`, or `totalPages`

## Motherlode running formula
- `runningMotherlode = roundsSinceLastHit * 0.2`
- If `motherlodeHit=true` on a round:
  - that round is recorded as `0.0`
  - subsequent round restarts at `0.2`

Example over six rounds with hits at rounds 3 and 6:
- round 1: `0.2`
- round 2: `0.4`
- round 3 (hit): `0.0`
- round 4: `0.2`
- round 5: `0.4`
- round 6 (hit): `0.0`
