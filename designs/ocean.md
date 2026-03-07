# OCEAN NIGHT — DESIGN.md

## 1. Theme Name
OCEAN NIGHT

## 2. Color Palette
- Background (page): `#0a192f`
- Background (surface/card): `#112240`
- Text (primary): `#e6f1ff`
- Text (secondary): `#9fb3c8`
- Accent 1 (cyan): `#00d4ff`
- Accent 2 (teal-green): `#00ff9d`
- Border/divider: `#1d3557`
- Chart line 1: `#00d4ff`
- Chart line 2: `#00ff9d`
- Chart line 3: `#64ffda`
- Chart grid: `#24486b`

## 3. Layout Description
- Two-column desktop shell.
- Left fixed/sticky sidebar (`280px`) contains: current motherlode, 24h delta, holder stats, quick filters.
- Main content on the right is a vertical stack of chart panels (full-width cards), prioritized by importance.
- Mobile collapses to single column: sidebar converts to top summary strip, charts remain stacked.

## 4. Key CSS Changes Needed
```css
:root {
  --bg: #0a192f;
  --surface: #112240;
  --text: #e6f1ff;
  --text-muted: #9fb3c8;
  --accent-cyan: #00d4ff;
  --accent-teal: #00ff9d;
  --border: #1d3557;
  --chart-grid: #24486b;
}

body {
  background: radial-gradient(circle at 20% -10%, #14335f 0%, var(--bg) 55%);
  color: var(--text);
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

.dashboard {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.sidebar {
  position: sticky;
  top: 16px;
  height: max-content;
  background: linear-gradient(180deg, #13325a 0%, var(--surface) 100%);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.chart-card {
  background: rgba(17, 34, 64, 0.88);
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-bottom: 16px;
  padding: 14px;
}

.metric-value {
  color: var(--accent-teal);
}

.link, .tab.is-active {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
}

@media (max-width: 900px) {
  .dashboard { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
```

## 5. Optional Additional Chart Features
- Add glowing hover dots on key datapoints (`box-shadow: 0 0 0 6px rgba(0, 212, 255, 0.15)`).
- Use area fill gradient from `#00d4ff33` to transparent for trend charts.
- Enable mini-sparkline in sidebar next to each headline metric.
