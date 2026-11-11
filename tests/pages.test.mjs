// Разметка страниц: шапка, подвал, 404, ранняя установка темы.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { PUBLIC_DIR, listFiles } from './helpers/html.mjs';

const read = (name) => readFileSync(join(PUBLIC_DIR, name), 'utf8');
const head = (html) => html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];

for (const [page, prefix] of [['index.html', './'], ['404.html', '/igroteka/']]) {
  test(`${page}: theme-init.js — обычный скрипт в <head> до стилей, без defer/async/module`, () => {
    const h = head(read(page));
    const tag = h.match(/<script\b[^>]*theme-init\.js[^>]*><\/script>/);
    assert.ok(tag, 'нет theme-init.js');
    assert.equal(tag[0], `<script src="${prefix}js/theme-init.js"></script>`);
    assert.ok(h.indexOf(tag[0]) < h.indexOf('rel="stylesheet"'), 'theme-init должен идти до стилей');
  });

  test(`${page}: стили tokens → base → components`, () => {
    const css = [...head(read(page)).matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
    assert.deepEqual(css, ['tokens', 'base', 'components'].map((n) => `${prefix}css/${n}.css`));
  });
}

test('index.html: шапка с навигацией, бургером, темой и слотом поиска', () => {
  const html = read('index.html');
  assert.match(html, /<nav\b[^>]*id="site-nav"/);
  assert.match(html, /href="#catalog"/);
  assert.match(html, /href="#about"/);
  assert.match(html, /<button\b[^>]*class="[^"]*burger[^"]*"[^>]*aria-controls="site-nav"[^>]*aria-expanded="false"/);
  assert.match(html, /<button\b[^>]*id="theme-toggle"/);
  assert.match(html, /id="header-search-slot"/);
  assert.equal((html.match(/id="search-input"/g) ?? []).length, 1, 'поле поиска одно');
});

test('index.html: подвал и «О проекте»', () => {
  const html = read('index.html');
  assert.match(html, /Цены ориентировочные, данные приведены для демонстрации/);
  assert.match(html, /id="footer-year"/);
  assert.match(html, /<section\b[^>]*id="about"[\s\S]*id="about-stats"/);
  assert.equal((html.match(/class="advantage"/g) ?? []).length, 3, 'три преимущества');
});

test('index.html: modulepreload ровно для всех модулей приложения (без цепочки загрузок)', () => {
  const jsDir = join(PUBLIC_DIR, 'js');
  const modules = listFiles(jsDir, ['.js'])
    .map((f) => `./js/${relative(jsDir, f).split(sep).join('/')}`)
    .filter((p) => p !== './js/theme-init.js')
    .sort();
  const preloads = [...head(read('index.html')).matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => m[1]).sort();
  assert.deepEqual(preloads, modules);
});

test('index.html: поле поиска изначально в шапке (без сдвига вёрстки на десктопе)', () => {
  const html = read('index.html');
  assert.match(html, /id="header-search-slot"[^>]*>\s*<div class="search">[\s\S]*?id="search-input"/);
  assert.match(html, /<div id="catalog-search-slot" class="catalog-search-slot"><\/div>/);
});

test('404.html: текст, ссылка «В каталог», язык и заголовок', () => {
  const html = read('404.html');
  assert.match(html, /<html\b[^>]*lang="ru"/);
  assert.match(html, /<title>[^<]*Страница не найдена/);
  assert.match(html, /<h1[^>]*>Страница не найдена<\/h1>/);
  assert.match(html, /<a\b[^>]*href="\/igroteka\/"[^>]*>В каталог<\/a>/);
  assert.match(html, /name="viewport"/);
});
