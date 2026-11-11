// Сайт живёт по подпути /igroteka/ — абсолютные пути ломают опубликованную версию.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { PUBLIC_DIR, listFiles } from '../helpers/html.mjs';

const files = listFiles(PUBLIC_DIR, ['.html', '.css', '.js']);

const ABSOLUTE_PATTERNS = [
  [/\bsrc=["']\//i, 'src="/'],
  [/\bhref=["']\//i, 'href="/'],
  [/url\(\s*["']?\//i, 'url(/'],
  [/fetch\(\s*["'`]\//, "fetch('/"],
  [/\bimport\b[^;]*?\bfrom\s*["']\//, "import … from '/"],
  [/\bimport\(\s*["'`]\//, "import('/"],
];

// Единственный разрешённый внешний адрес — репозиторий на GitHub (подвал, этап 9).
const ALLOWED_HTTPS = /^https:\/\/github\.com\//;

test('в public/ есть файлы для проверки', () => {
  assert.ok(files.length > 0, 'не найдено ни одного .html/.css/.js в public/');
});

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const name = relative(PUBLIC_DIR, file);

  test(`${name}: нет абсолютных путей`, () => {
    for (const [re, label] of ABSOLUTE_PATTERNS) {
      assert.doesNotMatch(text, re, `найден ${label}`);
    }
  });

  test(`${name}: нет http:// и посторонних https://`, () => {
    assert.doesNotMatch(text, /http:\/\//i, 'найден http://');
    for (const url of text.match(/https:\/\/[^\s"'`)<>]+/gi) ?? []) {
      assert.match(url, ALLOWED_HTTPS, `внешний адрес ${url}`);
    }
  });
}
