# P6: Motherlode History Line Chart with Zoom/Pan

**Task ID:** P6  
**Date:** 2026-03-14  
**Status:** Ready for implementation  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Dependencies:** P3-2 (getDbStatsData) ✅

## Problem Statement

Create interactive line chart showing motherlode balance over time (all historical rounds) with zoom, pan, and reset capabilities.

## Required Behavior

1. **Component file:** `src/app/components/MotherlodeLineChart.tsx`
2. **Chart library:** `react-chartjs-2` with `chartjs-plugin-zoom`
3. **Data source:** `motherlodeHistory` from `getDbStatsData()` (all rounds, no limit)
4. **Display:**
   - Title: "Motherlode History (All Rounds)"
   - X-axis: Round ID
   - Y-axis: Motherlode balance (in WETH)
   - Line color: rORE motherlode accent (golden/highlight color, e.g., #ffb15c or similar bright warm tone)
   - Interactive features:
     - **Zoom:** Mouse wheel / pinch gesture zooms in/out
     - **Pan:** Click and drag to pan across chart
     - **Reset button:** Button below chart to reset zoom/pan to full history view
   - Tooltips: Show round ID + motherlode amount
5. **Responsive:** Scales to container width
6. **No DaisyUI:** Pure Tailwind/Chart.js styling

## Acceptance Criteria

- [ ] Component file exists: `src/app/components/MotherlodeLineChart.tsx`
- [ ] Uses `react-chartjs-2` (Line chart type) + `chartjs-plugin-zoom`
- [ ] Data from `getDbStatsData()` > `motherlodeHistory` (all rounds, no limit)
- [ ] X-axis displays round IDs
- [ ] Y-axis displays motherlode balance (WETH)
- [ ] Line color is rORE motherlode accent (warm/golden tone)
- [ ] Zoom enabled (mouse wheel / pinch)
- [ ] Pan enabled (click and drag)
- [ ] Reset button displays and functions correctly
- [ ] Tooltips show round ID + motherlode amount
- [ ] Title displays "Motherlode History (All Rounds)"
- [ ] Responsive
- [ ] No console errors
- [ ] Build succeeds
- [ ] All tests passing

## Test Plan

**TDD approach: Write failing tests first, then implement.**

Create `tests/MotherlodeLineChart.test.tsx`:

```javascript
describe('MotherlodeLineChart Component', () => {
  test('renders line chart canvas', () => {
    const { container } = render(<MotherlodeLineChart />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('title displays correct text', () => {
    const { getByText } = render(<MotherlodeLineChart />)
    expect(getByText('Motherlode History (All Rounds)')).toBeInTheDocument()
  })

  test('chart registers zoom plugin', async () => {
    const { container } = render(<MotherlodeLineChart />)
    // Verify plugin is registered (check chart instance)
    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  test('reset button exists and is clickable', () => {
    const { getByRole } = render(<MotherlodeLineChart />)
    const resetButton = getByRole('button', { name: /reset/i })
    expect(resetButton).toBeInTheDocument()
    expect(resetButton).not.toBeDisabled()
  })

  test('chart has motherlode data points', async () => {
    // Verify Chart.js data array contains all motherlode history
  })

  test('line color is rORE motherlode accent (warm/golden)', () => {
    // Verify borderColor matches rORE motherlode accent
  })

  test('tooltip shows round ID and motherlode amount', () => {
    // Verify tooltip callback returns formatted string
  })
})
```

**Build & Test Verification:**
```bash
npm test                      # All MotherlodeLineChart tests pass
npm run build                # Build succeeds
grep -n "MotherlodeLineChart" src/ -r  # Component correctly imported
```

## Implementation Notes

**Example structure:**
```tsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(...registerables, zoomPlugin);

export default async function MotherlodeLineChart() {
  const data = await getDbStatsData();
  
  const chartData = {
    labels: data.motherlodeHistory.map(m => m.round_id.toString()),
    datasets: [{
      label: 'Motherlode (WETH)',
      data: data.motherlodeHistory.map(m => m.motherlode_running),
      borderColor: '#ffb15c', // rORE motherlode accent (golden)
      backgroundColor: 'rgba(255, 177, 92, 0.1)',
      borderWidth: 2,
      pointRadius: 0, // No points for cleaner view
      tension: 0.3
    }]
  };
  
  const options = {
    responsive: true,
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true, speed: 0.1 },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: {
          enabled: true,
          mode: 'xy'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Motherlode: ${context.raw.toFixed(2)} WETH`;
          },
          title: (context) => {
            return `Round ${context[0].label}`;
          }
        }
      }
    }
  };
  
  const handleReset = () => {
    chartRef.current?.resetZoom?.();
  };
  
  return (
    <div>
      <h3 className="text-xl font-bold">Motherlode History (All Rounds)</h3>
      <Line ref={chartRef} data={chartData} options={options} />
      <button
        onClick={handleReset}
        className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Reset Zoom/Pan
      </button>
    </div>
  );
}
```

## Deliverables

- [ ] `src/app/components/MotherlodeLineChart.tsx` — Component
- [ ] `tests/MotherlodeLineChart.test.tsx` — Tests
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] PR created on `feat/p6-motherlode-line`
- [ ] Commit: `feat(p6): add Motherlode line chart with zoom, pan, and reset`

---

**Owner:** Codex subagent (Stepfun)  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Expected Duration:** 3–4 hours (most complex due to zoom/pan logic)
