# P7: Page Integration & Real Data Wiring

**Task ID:** P7  
**Date:** 2026-03-14  
**Status:** Ready for implementation  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Dependencies:** P3-1, P3-2, P3-3, P4, P5, P6 ✅

## Problem Statement

Wire all completed dashboard components (StatCard, DashboardStats grid, Winner Types pie, Block Performance bar, Motherlode line) into `src/app/page.tsx` and verify real data flow from Supabase.

## Required Behavior

1. **Page file:** `src/app/page.tsx`
2. **Layout structure:**
   - Header: "rORE Stats Dashboard"
   - DashboardStats grid (4 stat cards): WETH, rORE, Motherlode Total, Locked rORE
   - 2-column grid for charts (responsive):
     - Left (col 1): Winner Types Pie + Block Performance Bar (stacked vertically)
     - Right (col 2): Motherlode History Line Chart (full height)
   - Motherlode full-width section below charts (if space/design requires)
3. **Data flow:**
   - All components call `getDbStatsData()` (server-side)
   - No hardcoded data
   - Real Supabase connection verified
   - Error handling: graceful fallback if any component fails to fetch
4. **Responsive design:**
   - Mobile: All components stack vertically
   - Tablet: Charts side-by-side (2 col)
   - Desktop: Full 2-col grid with stat cards above
5. **Styling:** Pure Tailwind, rORE color scheme (blue primary, purple secondary, golden motherlode accent)

## Acceptance Criteria

- [ ] `src/app/page.tsx` imports all 5 components (StatCard via DashboardStats, WinnerTypesPie, BlockPerformanceBar, MotherlodeLineChart)
- [ ] DashboardStats grid renders 4 stat cards (WETH, rORE, Motherlode, Locked)
- [ ] Winner Types Pie chart visible and functional
- [ ] Block Performance Bar chart visible and functional
- [ ] Motherlode Line chart visible and functional with zoom/pan
- [ ] Layout responsive on mobile/tablet/desktop
- [ ] All components render without console errors
- [ ] Real data from Supabase flows through (verify in browser)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Site deploys successfully to Vercel (no 500 errors)

## Layout Reference

```
┌─────────────────────────────────────────────────┐
│ rORE Stats Dashboard                            │
├─────────────────────────────────────────────────┤
│ [WETH] [rORE] [Motherlode] [Locked]             │
├──────────────────────┬──────────────────────────┤
│ Winner Types Pie     │                          │
│                     │ Motherlode Line Chart    │
├──────────────────────┤ (with zoom/pan)         │
│ Block Performance    │                          │
│ Bar                 │                          │
├─────────────────────────────────────────────────┤
│ (Optional: Full-width motherlode section)      │
└─────────────────────────────────────────────────┘
```

## Implementation Notes

**Page structure:**
```tsx
import DashboardStats from './components/DashboardStats';
import WinnerTypesPie from './components/WinnerTypesPie';
import BlockPerformanceBar from './components/BlockPerformanceBar';
import MotherlodeLineChart from './components/MotherlodeLineChart';

export default async function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">rORE Stats Dashboard</h1>
      
      {/* Stat Cards */}
      <DashboardStats />
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left column: Pie + Bar */}
        <div className="flex flex-col gap-8">
          <WinnerTypesPie />
          <BlockPerformanceBar />
        </div>
        
        {/* Right column: Line */}
        <MotherlodeLineChart />
      </div>
    </main>
  );
}
```

## Test Plan

**TDD approach: Write failing tests first, then implement.**

Create `tests/page.integration.test.tsx`:

```javascript
describe('Home Page Integration', () => {
  test('page renders header', async () => {
    const { getByRole } = render(await Home());
    expect(getByRole('heading', { name: /rORE Stats Dashboard/i })).toBeInTheDocument();
  });

  test('all four stat cards render', async () => {
    const { container } = render(await Home());
    const statCards = container.querySelectorAll('[data-testid="stat-card"]');
    expect(statCards.length).toBeGreaterThanOrEqual(4);
  });

  test('pie chart renders', async () => {
    const { container } = render(await Home());
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('bar chart renders', async () => {
    const { getByText } = render(await Home());
    expect(getByText(/Block Performance/i)).toBeInTheDocument();
  });

  test('line chart renders with zoom/pan button', async () => {
    const { getByRole } = render(await Home());
    expect(getByRole('button', { name: /Reset Zoom/i })).toBeInTheDocument();
  });

  test('no console errors on render', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    await render(await Home());
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('real data flows from getDbStatsData', async () => {
    const { container } = render(await Home());
    // Verify that stat cards display actual numbers (not "N/A" or empty)
    const statValues = container.querySelectorAll('[data-testid="stat-value"]');
    statValues.forEach(val => {
      expect(val.textContent).not.toBe('N/A');
      expect(val.textContent).not.toBe('');
    });
  });
});
```

## Deliverables

- [ ] `src/app/page.tsx` — Integrated page
- [ ] `tests/page.integration.test.tsx` — Tests
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Vercel deployment succeeds (no 500 errors)
- [ ] Commit: `feat(p7): integrate all dashboard components into page.tsx`

---

**Owner:** Codex subagent (Stepfun)  
**Model:** openrouter/stepfun/step-3.5-flash:free  
**Expected Duration:** 2–3 hours

## Success Criteria (Hard Stops)

- Build must succeed
- No 500 errors on Vercel deploy
- All components render without error
- Real data from Supabase visible on page
