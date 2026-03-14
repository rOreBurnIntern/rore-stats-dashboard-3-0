# P5: Block Performance Bar Chart

**Task ID:** P5  
**Date:** 2026-03-14  
**Status:** Ready for implementation  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Dependencies:** P3-2 (getDbStatsData) ✅

## Problem Statement

Create interactive bar chart showing win frequency across blocks 1–25 (all historical rounds).

## Required Behavior

1. **Component file:** `src/app/components/BlockPerformanceBar.tsx`
2. **Chart library:** `react-chartjs-2` with Chart.js (Bar chart)
3. **Data source:** `blockPerformance` from `getDbStatsData()` (all rounds)
4. **Display:**
   - Title: "Block Performance (All Rounds)"
   - X-axis: Block numbers (1–25)
   - Y-axis: Number of wins
   - One bar per block (25 bars total)
   - Color: rORE primary (blue)
   - Interactive tooltips showing exact win count
5. **Responsive:** Scales to container width
6. **No DaisyUI:** Pure Tailwind/Chart.js styling

## Acceptance Criteria

- [ ] Component file exists: `src/app/components/BlockPerformanceBar.tsx`
- [ ] Uses `react-chartjs-2` (Bar chart type)
- [ ] Data from `getDbStatsData()` > `blockPerformance`
- [ ] X-axis shows blocks 1–25
- [ ] Y-axis shows win counts
- [ ] 25 bars rendered (one per block)
- [ ] Bar color is rORE primary (blue)
- [ ] Tooltips show exact win count
- [ ] Title displays "Block Performance (All Rounds)"
- [ ] Responsive
- [ ] No console errors
- [ ] Build succeeds
- [ ] All tests passing

## Test Plan

**TDD approach: Write failing tests first, then implement.**

Create `tests/BlockPerformanceBar.test.tsx`:

```javascript
describe('BlockPerformanceBar Component', () => {
  test('renders bar chart with 25 bars', () => {
    const { container } = render(<BlockPerformanceBar />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('x-axis displays block numbers 1-25', async () => {
    const { getByText } = render(<BlockPerformanceBar />)
    // Chart.js renders block labels; verify presence
    await waitFor(() => {
      expect(getByText('1')).toBeInTheDocument()
      expect(getByText('25')).toBeInTheDocument()
    })
  })

  test('title displays correct text', () => {
    const { getByText } = render(<BlockPerformanceBar />)
    expect(getByText('Block Performance (All Rounds)')).toBeInTheDocument()
  })

  test('bar color is rORE primary (blue)', () => {
    // Verify chart backgroundColor matches rORE blue
  })

  test('all blocks 1-25 have data points', async () => {
    // Verify Chart.js data array has exactly 25 entries
  })
})
```

**Build & Test Verification:**
```bash
npm test                      # All BlockPerformanceBar tests pass
npm run build                # Build succeeds
grep -n "BlockPerformanceBar" src/ -r  # Component correctly imported
```

## Implementation Notes

**Example structure:**
```tsx
import { Bar } from 'react-chartjs-2';

export default async function BlockPerformanceBar() {
  const data = await getDbStatsData();
  
  const chartData = {
    labels: Array.from({ length: 25 }, (_, i) => (i + 1).toString()),
    datasets: [{
      label: 'Wins',
      data: data.blockPerformance.map(b => b.wins),
      backgroundColor: '#3b82f6', // rORE primary (blue)
      borderColor: '#1f2937',
      borderWidth: 1
    }]
  };
  
  return <Bar data={chartData} options={...} />;
}
```

## Deliverables

- [ ] `src/app/components/BlockPerformanceBar.tsx` — Component
- [ ] `tests/BlockPerformanceBar.test.tsx` — Tests
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] PR created on `feat/p5-block-bar`
- [ ] Commit: `feat(p5): add Block Performance bar chart with win counts`

---

**Owner:** Codex subagent (Stepfun)  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Expected Duration:** 2–3 hours
