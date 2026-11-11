// theme-init.js — обычный (не модульный) скрипт в <head>. Запускаем его в песочнице vm
// с поддельными document и localStorage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { PUBLIC_DIR } from '../helpers/html.mjs';

const source = readFileSync(join(PUBLIC_DIR, 'js', 'theme-init.js'), 'utf8');

function run(storage) {
  const attrs = {};
  const documentElement = {
    setAttribute: (k, v) => { attrs[k] = String(v); },
    removeAttribute: (k) => { delete attrs[k]; },
  };
  const context = { document: { documentElement } };
  Object.defineProperty(context, 'localStorage', {
    get() {
      if (storage instanceof Error) throw storage;
      return storage;
    },
  });
  vm.runInNewContext(source, context);
  return attrs;
}

const storageWith = (value) => ({ getItem: (k) => (k === 'igroteka:theme' ? value : null) });

test('сохранённая тёмная/светлая тема ставится до отрисовки', () => {
  assert.deepEqual(run(storageWith('"dark"')), { 'data-theme': 'dark' });
  assert.deepEqual(run(storageWith('"light"')), { 'data-theme': 'light' });
});

test('system, пусто и мусор → атрибут не ставится', () => {
  for (const raw of ['"system"', null, '"evil"', 'dark', '{', '["dark"]', '"<b>x</b>"']) {
    assert.deepEqual(run(storageWith(raw)), {}, String(raw));
  }
});

test('недоступный localStorage → без исключений', () => {
  assert.doesNotThrow(() => run(new Error('SecurityError')));
  assert.doesNotThrow(() => run({ getItem() { throw new Error('denied'); } }));
  assert.doesNotThrow(() => run(null));
});

test('скрипт не модульный и без опасных конструкций', () => {
  assert.doesNotMatch(source, /\bimport\b|\bexport\b/);
  assert.doesNotMatch(source, /innerHTML|eval\(|document\.write/);
});
