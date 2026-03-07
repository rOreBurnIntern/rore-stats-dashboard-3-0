# UI Design Prompts for Codex

## Principles
1. Be specific about dimensions and spacing
2. Reference existing design system (colors, fonts)
3. Describe the goal, not just the task

## Good vs Bad Prompts

### BAD
"Make the UI look better"

### GOOD
"Polish the stat cards with these specs:
- Background: var(--panel) with 1px var(--panel-border) border
- Padding: 1.25rem
- Border-radius: 1rem
- Box-shadow: var(--shadow)
- Hover: translateY(-2px), shadow increases
- Font: use Space Grotesk for headings
- Gap between cards: 1rem"

## Chart Prompts

### Good Chart Prompt
"Fix the pie chart:
- Remove extra space inside chart-card
- Set canvas max-height: 240px
- Keep maintainAspectRatio: true
- Use doughnut type with cutout: '64%'
- Colors: ['#4c9aff', '#24c29a']"

## CSS Prompts

### Good CSS Prompt
"Improve desktop layout in styles.css:
- Container max-width: 1200px, centered
- Stat grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Chart grid: 2 columns wide, line chart spans full width
- Padding: 2rem on desktop, 1rem on mobile"

## Common Issues Fixes

### Issue: Charts different heights
Fix: Set explicit min-height on .chart-card and flex:1 on canvas

### Issue: Too much spacing
Fix: Reduce grid gap, card padding, margin values

### Issue: Mobile layout broken
Fix: Use media queries, stack to single column below 768px

## Template for UI Tasks
```
Fix [specific element] in [file]:

Current state: [describe what's wrong]

Desired state: [describe what you want]

Constraints:
- Keep existing functionality
- Use existing CSS variables: [list variables]
- Mobile responsive below [breakpoint]
- Maintain [any specific requirements]
```
