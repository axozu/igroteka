import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { CSP, PUBLIC_DIR, collapseSpaces, listFiles } from '../helpers/html.mjs';

const htmlFiles = listFiles(PUBLIC_DIR, ['.html']);
const name = (file) => relative(PUBLIC_DIR, file);

test('в public/ есть HTML-страницы', () => {
  assert.ok(htmlFiles.length > 0, 'не найдено ни одного .html в public/');
});

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');

  test(`${name(file)}: CSP — первый элемент <head> после <meta charset>`, () => {
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
    assert.ok(head, 'нет <head>');
    const tags = head[1].match(/<[a-z][^>]*>/gi) ?? [];
    assert.match(tags[0] ?? '', /^<meta charset="utf-8">$/i, 'первым должен идти <meta charset="utf-8">');
    const csp = tags[1] ?? '';
    assert.match(csp, /^<meta http-equiv="Content-Security-Policy" content="[^"]*">$/, 'вторым должен идти CSP-meta');
    const content = csp.match(/content="([^"]*)"/)[1];
    assert.equal(collapseSpaces(content), CSP);
  });

  test(`${name(file)}: referrer-meta`, () => {
    assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  });

  test(`${name(file)}: нет inline-скриптов, стилей и обработчиков`, () => {
    assert.doesNotMatch(html, /<script\b(?![^>]*\bsrc=)[^>]*>/i, 'inline <script>');
    assert.doesNotMatch(html, /<style/i, '<style>');
    assert.doesNotMatch(html, /style="/i, 'атрибут style=');
    assert.doesNotMatch(html, /\son[a-z]+=/i, 'обработчик on*=');
  });
}
