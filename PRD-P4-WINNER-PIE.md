# P4: Winner Types Pie Chart

**Task ID:** P4  
**Date:** 2026-03-14  
**Status:** Ready for implementation  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Dependencies:** P3-2 (getDbStatsData) ✅

## Problem Statement

Create interactive pie/doughnut chart showing distribution of "Winner Take All" vs "Split Evenly" outcomes from the last 1,044 rounds.

## Required Behavior

1. **Component file:** `src/app/components/WinnerTypesPie.tsx`
2. **Chart library:** `react-chartjs-2` with Chart.js (Doughnut chart)
3. **Data source:** `winnerTypesDistribution` from `getDbStatsData()` (last 1,044 rounds only)
4. **Display:**
   - Title: "Winner Types (Last 1,044 Rounds)"
   - Two segments:
     - "Winner Take All": Blue color (#3b82f6 / rORE primary)
     - "Split Evenly": Purple color (#a855f7 / rORE secondary)
   - Interactive tooltips showing count + percentage
5. **Responsive:** Scales to container width
6. **No DaisyUI:** Pure Tailwind/Chart.js styling

## Acceptance Criteria

- [ ] Component file exists: `src/app/components/WinnerTypesPie.tsx`
- [ ] Uses `react-chartjs-2` (Doughnut chart type)
- [ ] Data from `getDbStatsData()` > `winnerTypesDistribution`
- [ ] Two segments: "Winner Take All" (blue), "Split Evenly" (purple)
- [ ] Tooltip shows count + percentage (e.g., "Winner Take All: 600 (57.4%)")
- [ ] Title displays "Winner Types (Last 1,044 Rounds)"
- [ ] Responsive
- [ ] No console errors
- [ ] Build succeeds
- [ ] All tests passing

## Test Plan

**TDD approach: Write failing tests first, then implement.**

Create `tests/WinnerTypesPie.test.tsx`:

```javascript
describe('WinnerTypesPie Component', () => {
  test('renders pie chart canvas', () => {
    const { container } = render(<WinnerTypesPie />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('title displays correct text', () => {
    const { getByText } = render(<WinnerTypesPie />)
    expect(getByText('Winner Types (Last 1,044 Rounds)')).toBeInTheDocument()
  })

  test('chart has two segments (Winner Take All, Split Evenly)', async () => {
    // Verify Chart.js labels match the two winner types
    const { container } = render(<WinnerTypesPie />)
    await waitFor(() => {
      // Check chart data has exactly 2 datasets/segments
    })
  })

  test('colors are rORE blue and purple', () => {
    // Verify backgroundColor array contains rORE colors
  })

  test('tooltip shows count and percentage', () => {
    // Verify tooltip callback returns formatted string
  })

  test('segments sum to 1,044 (last 1,044 rounds)', () => {
    // Verify WINNER_TAKE_ALL + SPLIT_EVENLY === 1044
  })
})
```

**Build & Test Verification:**
```bash
npm test                      # All WinnerTypesPie tests pass
npm run build                # Build succeeds
grep -n "WinnerTypesPie" src/ -r  # Component correctly imported
```

## Implementation Notes

**Example structure:**
```tsx
import { Doughnut } from 'react-chartjs-2';

export default async function WinnerTypesPie() {
  const data = await getDbStatsData();
  const { WINNER_TAKE_ALL, SPLIT_EVENLY } = data.winnerTypesDistribution;
  
  const chartData = {
    labels: ['Winner Take All', 'Split Evenly'],
    datasets: [{
      data: [WINNER_TAKE_ALL, SPLIT_EVENLY],
      backgroundColor: ['#3b82f6', '#a855f7'], // blue, purple
      borderColor: '#1f2937',
      borderWidth: 2
    }]
  };
  
  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = WINNER_TAKE_ALL + SPLIT_EVENLY;
            const percent = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percent}%)`;
          }
        }
      }
    }
  };
  
  return (
    <div>
      <h3 className="text-xl font-bold">Winner Types (Last 1,044 Rounds)</h3>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
```

## Deliverables

- [ ] `src/app/components/WinnerTypesPie.tsx` — Component
- [ ] `tests/WinnerTypesPie.test.tsx` — Tests
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] PR created on `feat/p4-winner-pie`
- [ ] Commit: `feat(p4): add Winner Types pie chart with distribution analysis`

---

**Owner:** Codex subagent (Stepfun)  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Expected Duration:** 2–3 hours
