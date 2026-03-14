const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('uses a dedicated two-column lg grid for pie/bar charts', () => {
  assert.match(
    source,
    /grid grid-cols-1 lg:grid-cols-2 gap-4/,
    'expected a 2-column lg grid container for Winner Type and Block Performance'
  );
});

test('does not keep legacy 3-column chart grid', () => {
  assert.doesNotMatch(
    source,
    /grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4/,
    'legacy 3-column chart grid should be removed'
  );
});

test('places line chart in a separate full-width row', () => {
  assert.match(
    source,
    /<div className="grid grid-cols-1 gap-4 mt-4">[\s\S]*Motherlode History/,
    'expected Motherlode History chart in its own full-width row'
  );
});
