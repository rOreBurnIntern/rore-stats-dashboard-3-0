# Web Design Best Practices Report
## For rORE Stats Dashboard — How to Describe What You Want

---

## WHAT IS A DASHBOARD?

Think of a dashboard like a car's dashboard. It's meant to show you the most important information at a glance — at a quick glance, you should understand the situation without needing to dig. Your rORE Stats page is exactly this: a dashboard showing lottery/game data.

**Key principle:** Less is more. Show only what's critical. Users can click for more details if they want.

---

## LAYOUT TYPES (Plain English Explainers)

### 1. Single Column (Stacked)
**What it is:** Everything sits one thing after another, going down the page.
**Best for:** Simple sites, mobile phones, users who just want quick info.

### 2. Two-Column (Sidebar + Main)
**What it is:** A narrow column on the left with navigation or quick stats. Main content on the right.
**Best for:** Dashboard with lots of data points.
**Example:** Email — folders on left, messages on right.

### 3. Grid Layout
**What it is:** Everything arranged in boxes, like a tic-tac-toe board.
**Best for:** Comparing multiple things at once.
**Our "Forest Crypto" design** uses this: 4 stat cards in a row, then charts in 2x2 grid.

### 4. Hero + Details
**What it is:** One big prominent section at top, everything else below.
**Best for:** When you want one number to stand out.
**Our "Purple Nebula" design** uses this.

---

## WHERE TO PUT THINGS

**Golden rule:** Put the most important thing in the top-left corner (English readers look there first).

### Recommended Order (Top to Bottom):
1. The single most important number (Motherlode)
2. 2-3 key numbers (WETH, rORE prices)
3. Main chart
4. Supporting charts
5. Optional: links to more detail

---

## MUST-HAVE FEATURES

These are features users EXPECT on any data dashboard:

1. **Clear Numbers** — Big, bold, labeled ("17.2 rORE" not just "17.2")
2. **Charts That Make Sense** — Line for time, bar for categories, pie for parts of whole
3. **Time Context** — "Last 24 hours" so users know the timeframe
4. **Loading State** — Show "Loading..." while fetching
5. **Error State** — Friendly message if data fails
6. **Mobile Works** — At minimum, scrolls on phone

---

## NICE-TO-HAVE FEATURES

These differentiate good from great:

- **Interactive charts** — Hover to see exact numbers
- **Time filters** — Buttons: [24H] [7D] [30D]
- **Trend indicators** — Green up arrow = good
- **Dark mode** — Most crypto users prefer this
- **Real-time updates** — "Last updated: 2 min ago"

---

## HOW TO DESCRIBE WHAT YOU WANT

### Instead of:
> "I want a responsive grid layout with KPI BANs"

### Say:
> "I want the main number really big at top. Below that, 3 smaller numbers in a row. Then charts below. On phone, stack everything in one column."

### Instead of:
> "Use dark theme with cyan accents"

### Say:
> "Dark background, bright teal for important numbers and chart lines. Like a trading terminal."

---

## COLOR GUIDE

| Feeling | Use |
|---------|-----|
| Urgent/Warning | Red, Orange |
| Good/Growth | Green, Teal |
| Neutral/Info | Blue, Gray |
| Highlight | One accent color (pick one and use consistently) |

**Rule:** Don't use more than 3 main colors.

---

## RECOMMENDATIONS FOR rORE STATS

1. Keep layout simple (current is fine, just polish)
2. Pick ONE theme (try Forest Crypto for fresh look)
3. Add time filters ([24h] [all time])
4. Add "Last updated" timestamp

---

*Report generated: March 7, 2026*
