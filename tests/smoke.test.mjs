import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, PUBLIC_DIR } from './helpers/html.mjs';

const readIndex = () => readFileSync(join(PUBLIC_DIR, 'index.html'), 'utf8');

test('index.html содержит четыре раздела', () => {
  const html = readIndex();
  assert.match(html, /<header\b[^>]*class="[^"]*\bsite-header\b[^"]*"/);
  assert.match(html, /<main\b[^>]*id="catalog"/);
  assert.match(html, /<section\b[^>]*id="about"/);
  assert.match(html, /<footer\b[^>]*class="[^"]*\bsite-footer\b[^"]*"/);
});

test('index.html: язык, viewport и заголовок', () => {
  const html = readIndex();
  assert.match(html, /<html\b[^>]*lang="ru"/);
  assert.match(html, /<meta\b[^>]*name="viewport"/);
  assert.match(html, /<title>ИГРОТЕКА/);
});

test('index.html подключает main.js как модуль', () => {
  assert.match(readIndex(), /<script type="module" src="\.\/js\/main\.js"><\/script>/);
});

test('package.json без зависимостей и с нужными полями', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.private, true);
  assert.equal(pkg.engines?.node, '>=22');
  assert.equal(typeof pkg.scripts?.start, 'string');
  assert.equal(typeof pkg.scripts?.test, 'string');
});
