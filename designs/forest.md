# FOREST CRYPTO — DESIGN.md

## 1. Theme Name
FOREST CRYPTO

## 2. Color Palette
- Background (page): `#0a1a0a`
- Background (surface/card): `#102b14`
- Text (primary): `#ecfdf3`
- Text (secondary): `#9cc9ac`
- Accent 1 (emerald): `#10b981`
- Accent 2 (mint): `#34d399`
- Border/divider: `#1f4f2a`
- Chart line 1: `#34d399`
- Chart line 2: `#10b981`
- Chart line 3: `#6ee7b7`
- Chart grid: `#244f30`

## 3. Layout Description
- Header row with title + controls.
- Stats row directly beneath header: 4 compact metric cards across desktop.
- Charts section below as 2x2 responsive grid (`motherlode trend`, `transactions`, `holders`, `burn rate`).
- On tablet/mobile: stats become 2x2, charts become single column.

## 4. Key CSS Changes Needed
```css
:root {
  --bg: #0a1a0a;
  --surface: #102b14;
  --text: #ecfdf3;
  --text-muted: #9cc9ac;
  --accent-emerald: #10b981;
  --accent-mint: #34d399;
  --border: #1f4f2a;
  --chart-grid: #244f30;
}

body {
  background:
    radial-gradient(circle at 80% -20%, #1e4d2a 0%, transparent 40%),
    var(--bg);
  color: var(--text);
  font-family: "Manrope", "Segoe UI", sans-serif;
}

.dashboard {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0 20px;
}

.stat-card,
.chart-card {
  background: linear-gradient(160deg, #12331a 0%, var(--surface) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.kpi-positive {
  color: var(--accent-mint);
}

button.primary {
  background: var(--accent-emerald);
  color: #03220f;
}

@media (max-width: 1024px) {
  .stats-row,
  .charts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 680px) {
  .stats-row,
  .charts-grid { grid-template-columns: 1fr; }
}
```

## 5. Optional Additional Chart Features
- Overlay 7d moving average as dashed mint line.
- Add volume bars under price/motherlode line with `#10b98166` fill.
- Provide chart card toggles for `1D`, `7D`, `30D`, `ALL` with active emerald pill style.
