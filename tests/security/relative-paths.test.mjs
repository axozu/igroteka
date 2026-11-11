// Сайт живёт по подпути /igroteka/ — абсолютные пути ломают опубликованную версию.
// Исключение — 404.html: GitHub Pages отдаёт его с любой глубины пути, поэтому там пути
// начинаются ровно с /igroteka/.
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

/** Единственный разрешённый внешний адрес — репозиторий проекта (подвал). */
export const REPO_URL = 'https://github.com/axozu/igroteka';
const SVG_NS = 'http://www.w3.org/2000/svg';
const PAGE_404 = '404.html';
const BASE_PATH = '/igroteka/';

const stripSvgNs = (s) => s.replaceAll(`'${SVG_NS}'`, '');
const externalUrls = (text) => text.match(/https?:\/\/[^\s"'`)<>]+/gi) ?? [];
const attrPaths = (html) => [...html.matchAll(/\b(?:src|href)=["']([^"']*)["']/gi)].map((m) => m[1]);

test('самопроверка: разрешён только точный адрес пространства имён SVG', () => {
  assert.doesNotMatch(stripSvgNs(`const NS = '${SVG_NS}';`), /http:\/\//);
  assert.match(stripSvgNs(`fetch('${SVG_NS}/evil')`), /http:\/\//);
  assert.match(stripSvgNs("img.src = 'http://evil.example/x.png'"), /http:\/\//);
});

test('самопроверка: внешний адрес допускается только точно равный REPO_URL', () => {
  const allowed = (url) => url === REPO_URL;
  assert.ok(allowed(REPO_URL));
  for (const bad of [`${REPO_URL}/evil`, 'https://github.com/someone/igroteka', 'https://github.com.evil.example/x', 'https://evil.example']) {
    assert.ok(!allowed(bad), bad);
  }
});

test('в public/ есть файлы для проверки, включая 404.html', () => {
  assert.ok(files.length > 0);
  assert.ok(files.some((f) => relative(PUBLIC_DIR, f) === PAGE_404), 'нет public/404.html');
});

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const name = relative(PUBLIC_DIR, file);

  if (name === PAGE_404) {
    test(`${name}: все локальные пути начинаются ровно с ${BASE_PATH}`, () => {
      const paths = attrPaths(text).filter((p) => p !== REPO_URL);
      assert.ok(paths.length > 0);
      for (const p of paths) assert.ok(p.startsWith(BASE_PATH) && !p.includes('..'), `путь ${p}`);
    });
  } else {
    test(`${name}: нет абсолютных путей`, () => {
      for (const [re, label] of ABSOLUTE_PATTERNS) assert.doesNotMatch(text, re, `найден ${label}`);
    });
  }

  test(`${name}: нет http:// и посторонних https://`, () => {
    assert.doesNotMatch(stripSvgNs(text), /http:\/\//i, 'найден http://');
    for (const url of externalUrls(stripSvgNs(text))) assert.equal(url, REPO_URL, `внешний адрес ${url}`);
  });
}

test(`внешняя ссылка на репозиторий открывается в новой вкладке с rel="noopener noreferrer"`, () => {
  for (const file of listFiles(PUBLIC_DIR, ['.html'])) {
    const html = readFileSync(file, 'utf8');
    for (const tag of html.match(/<a\b[^>]*href="https:[^"]*"[^>]*>/gi) ?? []) {
      assert.match(tag, /target="_blank"/, tag);
      assert.match(tag, /rel="noopener noreferrer"/, tag);
    }
  }
});
