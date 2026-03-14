const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('uses a dedicated two-column lg grid for pie/bar charts', () => {
  assert.match(
    source,
    /<section className="grid grid-cols-1 lg:grid-cols-2 gap-8">/,
    'expected a 2-column lg grid container for the chart area'
  );
});

test('stacks pie and bar charts in the left column', () => {
  assert.match(
    source,
    /<div className="flex flex-col gap-8">[\s\S]*WinnerTypesPie[\s\S]*BlockPerformanceBar/,
    'expected WinnerTypesPie and BlockPerformanceBar to share the left column'
  );
});

test('renders the motherlode chart in the right column card', () => {
  assert.match(
    source,
    /<div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">[\s\S]*MotherlodeLineChart/,
    'expected MotherlodeLineChart to render in the right column card'
  );
});
