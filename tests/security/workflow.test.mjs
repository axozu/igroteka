// Безопасная публикация (§8.7): actions закреплены по SHA, минимальные права, deploy только после тестов.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listFiles } from '../helpers/html.mjs';

const WORKFLOWS_DIR = join(ROOT, '.github', 'workflows');
const files = listFiles(WORKFLOWS_DIR, ['.yml', '.yaml']);
const PAGES = join(WORKFLOWS_DIR, 'pages.yml');
const read = (file) => readFileSync(file, 'utf8');

/** Строки «uses:», не закреплённые полным SHA с комментарием версии. */
export function unpinnedUses(text) {
  return text
    .split('\n')
    .filter((line) => /^\s*-?\s*uses:/.test(line))
    .filter((line) => !/uses:\s*[\w.-]+\/[\w.-]+(?:\/[\w.-]+)*@[0-9a-f]{40}\s+#\s*v\d+(\.\d+)*\s*$/.test(line));
}

test('самопроверка: незакреплённые actions находятся', () => {
  assert.equal(unpinnedUses('      - uses: actions/checkout@v4').length, 1);
  assert.equal(unpinnedUses('      - uses: actions/checkout@main').length, 1);
  assert.equal(unpinnedUses('      - uses: actions/checkout@0123456789abcdef0123456789abcdef01234567').length, 1, 'без комментария версии');
  assert.equal(unpinnedUses('      - uses: actions/checkout@0123456789abcdef0123456789abcdef01234567 # v4.2.2').length, 0);
});

test('есть .github/workflows/pages.yml', () => {
  assert.ok(files.includes(PAGES), 'нет pages.yml');
});

for (const file of files) {
  test(`${file.slice(ROOT.length)}: каждое uses: закреплено 40-символьным SHA с комментарием версии`, () => {
    assert.deepEqual(unpinnedUses(read(file)), []);
  });

  test(`${file.slice(ROOT.length)}: на верхнем уровне permissions: contents: read; нет pull_request_target`, () => {
    const text = read(file);
    assert.match(text, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
    assert.doesNotMatch(text, /pull_request_target/);
    assert.doesNotMatch(text, /permissions:\s*write-all/);
  });
}

test('pages.yml: триггеры, concurrency, тесты, deploy после test и не для pull request', () => {
  const text = read(PAGES);
  assert.match(text, /^on:/m);
  assert.match(text, /push:\s*\n\s+branches:\s*\[\s*main\s*\]/);
  assert.match(text, /^\s+pull_request:/m);
  assert.match(text, /^\s+workflow_dispatch:/m);
  assert.match(text, /concurrency:\s*\n\s+group:\s*pages\s*\n\s+cancel-in-progress:\s*false/);
  assert.match(text, /run:\s*npm test/);
  assert.match(text, /node-version:\s*24/);
  assert.match(text, /needs:\s*test/);
  assert.match(text, /if:\s*github\.event_name != 'pull_request'/);
  assert.match(text, /pages:\s*write/);
  assert.match(text, /id-token:\s*write/);
  assert.match(text, /path:\s*public\b/);
  assert.match(text, /url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}/);
  assert.doesNotMatch(text, /run:.*\bnpm (install|i|ci)\b/, 'зависимостей нет — npm install не нужен');
});
