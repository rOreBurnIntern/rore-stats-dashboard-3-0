const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Read all source files in src/
const srcDir = path.join(__dirname, '..', 'src');
const files = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(full);
    }
  }
}
walk(srcDir);

// DaisyUI class patterns to detect (only within className/class attributes)
const daisyuiPatterns = [
  /data-theme=/,
  /className=["'][^"']*btn-primary[^"']*["']/,
  /className=["'][^"']*btn-secondary[^"']*["']/,
  /className=["'][^"']*btn-ghost[^"']*["']/,
  /className=["'][^"']*btn-sm[^"']*["']/,
  /className=["'][^"']*btn-lg[^"']*["']/,
  /className=["'][^"']*btn-circle[^"']*["']/,
  /className=["'][^"']*\bcard\b[^"']*["']/,
  /className=["'][^"']*card-body[^"']*["']/,
  /className=["'][^"']*card-title[^"']*["']/,
  /className=["'][^"']*\bbadge\b[^"']*["']/,
  /className=["'][^"']*loading-spinner[^"']*["']/,
  /className=["'][^"']*loading[^"']*["']/,
  /className=["'][^"']*join-item[^"']*["']/,
  /className=["'][^"']*\bjoin\b[^"']*["']/,
  /className=["'][^"']*bg-base-[^"']*["']/,
  /className=["'][^"']*text-base-content[^"']*["']/,
  /className=["'][^"']*opacity-60[^"']*["']/
];

test('no DaisyUI classes remain in source code', () => {
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of daisyuiPatterns) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: i + 1,
            lineContent: line.trim(),
            pattern: pattern.toString()
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    assert.fail(`Found ${violations.length} DaisyUI class violations:\n` +
      violations.map(v => `  ${v.file}:${v.line} (${v.pattern}): ${v.lineContent}`).join('\n'));
  }
});

test('daisyui is not a dependency in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps.daisyui, undefined, 'daisyui should be removed from package.json');
});

test('tailwind.config.js does not require daisyui plugin', () => {
  const configPath = path.join(process.cwd(), 'tailwind.config.js');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    assert.doesNotMatch(content, /require\(['"]daisyui['"]\)/, 'tailwind.config.js should not require daisyui');
    assert.doesNotMatch(content, /daisyui:/, 'tailwind.config.js should not have daisyui config');
  }
});
