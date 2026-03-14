# P3-2: Refactor getDbStatsData() Helper

**Task ID:** P3-2  
**Date:** 2026-03-14  
**Status:** Ready for implementation  
**Model:** openrouter/stepfun/step-3.5-flash:free  

## Problem Statement

The `getDbStatsData()` function in `lib/db-stats.ts` needs to be verified/refactored to ensure it returns a complete, consistent object schema that all Phase 3–7 components depend on.

## Required Behavior

1. **Function signature:**
   ```typescript
   async function getDbStatsData(): Promise<{
     currentPrice: { rORE: number; WETH: number };
     motherlodeTotal: number;
     totalORELocked: number;
     blockPerformance: Array<{ block: number; wins: number; percentage: number }>;
     winnerTypesDistribution: { WINNER_TAKE_ALL: number; SPLIT_EVENLY: number };
     motherlodeHistory: Array<{ round_id: number; motherlode_running: number }>;
   } | null>
   ```

2. **Data sources (all from Supabase):**
   - `currentPrice.rORE`: Latest rORE price from `prices` table
   - `currentPrice.WETH`: Latest WETH price from `prices` table
   - `motherlodeTotal`: Latest `motherlode_running` from `rounds` table
   - `totalORELocked`: Sum of all `ore_amount` from `rounds` (or equivalent metric)
   - `blockPerformance`: Win count per block (1–25) from `rounds` (all historical rounds)
   - `winnerTypesDistribution`: Count of WINNER_TAKE_ALL vs SPLIT_EVENLY from **last 1,044 rounds only** (percentage summing to 100)
   - `motherlodeHistory`: All historical (round_id, motherlode_running) pairs **with no LIMIT** (full history)

3. **Numeric formatting:**
   - `rORE` price: 4 decimal places (e.g., 0.0781)
   - `WETH` price: 2 decimal places (e.g., 2087.40)
   - `motherlodeTotal`: 2 decimal places
   - `totalORELocked`: 2 decimal places
   - `blockPerformance.wins`: integer
   - `blockPerformance.percentage`: 1 decimal place
   - `winnerTypesDistribution.*`: integer counts (will be converted to % by client)

4. **Error handling:**
   - If Supabase is unreachable, return `null` (not error object)
   - Log error to console with timestamp
   - Allow caller to handle gracefully

5. **No hardcoded data:** All values must come from Supabase queries (not test doubles in production code)

## Acceptance Criteria

- [ ] Function returns object matching schema above
- [ ] All numeric values correctly formatted (decimals as specified)
- [ ] `blockPerformance` includes blocks 1–25 (all present, even if wins=0)
- [ ] `winnerTypesDistribution` calculated from last 1,044 rounds only
- [ ] `motherlodeHistory` includes ALL historical rounds (no LIMIT)
- [ ] Error handling: returns null on DB failure, logs error
- [ ] No console warnings
- [ ] Function is fast (< 500ms on typical network)
- [ ] All tests passing

## Test Plan

**TDD approach: Write failing tests first, then implement.**

Create `tests/getDbStatsData.integration.test.js` with these assertions:

```javascript
describe('getDbStatsData()', () => {
  test('returns object with required keys', async () => {
    const data = await getDbStatsData()
    expect(data).toHaveProperty('currentPrice')
    expect(data).toHaveProperty('motherlodeTotal')
    expect(data).toHaveProperty('totalORELocked')
    expect(data).toHaveProperty('blockPerformance')
    expect(data).toHaveProperty('winnerTypesDistribution')
    expect(data).toHaveProperty('motherlodeHistory')
  })

  test('currentPrice.rORE is a positive number', async () => {
    const data = await getDbStatsData()
    expect(typeof data.currentPrice.rORE).toBe('number')
    expect(data.currentPrice.rORE).toBeGreaterThan(0)
  })

  test('currentPrice.WETH is a positive number', async () => {
    const data = await getDbStatsData()
    expect(typeof data.currentPrice.WETH).toBe('number')
    expect(data.currentPrice.WETH).toBeGreaterThan(0)
  })

  test('motherlodeHistory is an array with length > 0', async () => {
    const data = await getDbStatsData()
    expect(Array.isArray(data.motherlodeHistory)).toBe(true)
    expect(data.motherlodeHistory.length).toBeGreaterThan(0)
  })

  test('blockPerformance array has exactly 25 blocks', async () => {
    const data = await getDbStatsData()
    expect(data.blockPerformance.length).toBe(25)
  })

  test('blockPerformance includes blocks 1–25', async () => {
    const data = await getDbStatsData()
    const blockNums = data.blockPerformance.map(b => b.block).sort((a, b) => a - b)
    expect(blockNums).toEqual([1, 2, 3, ..., 25])
  })

  test('winnerTypesDistribution.WINNER_TAKE_ALL + SPLIT_EVENLY sums correctly', async () => {
    const data = await getDbStatsData()
    const sum = data.winnerTypesDistribution.WINNER_TAKE_ALL + data.winnerTypesDistribution.SPLIT_EVENLY
    expect(sum).toBe(1044)  // Last 1,044 rounds
  })

  test('returns null on DB failure (graceful error)', async () => {
    // Mock Supabase to throw error
    // Expect null, not error
  })
})
```

**Build & Test Verification:**
```bash
npm test                     # All getDbStatsData tests pass
npm run build               # Build succeeds
grep -n "getDbStatsData" src/app/lib/db-stats.ts | head -1  # Function exists
```

## Implementation Notes

**Key SQL/logic points:**
- `blockPerformance`: GROUP BY block_number, COUNT(*) as wins, CAST(COUNT(*)*100.0/total AS DECIMAL) as percentage
- `winnerTypesDistribution`: WHERE round_id >= (max_round_id - 1043), GROUP BY winner_type
- `motherlodeHistory`: SELECT round_id, motherlode_running FROM rounds ORDER BY round_id ASC (no LIMIT)

## Deliverables

- [ ] Updated `src/app/lib/db-stats.ts` with refactored `getDbStatsData()` function
- [ ] `tests/getDbStatsData.integration.test.js` — Test file with all 8+ assertions
- [ ] Function returns schema matching P3-2 spec exactly
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] PR created on feature branch `feat/p3-2-dbstats`
- [ ] Commit message: `refactor(p3-2): complete getDbStatsData() schema and queries`

---

**Owner:** Codex subagent (Stepfun)  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Expected Duration:** 2–3 hours  
