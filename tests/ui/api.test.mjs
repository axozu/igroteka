import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../public/js/api.js';
import { makeCatalog, makeGame } from '../fixtures/catalog.mjs';

/** Поддельный fetch, запоминающий вызовы. */
function fakeFetch(response) {
  const calls = [];
  const fn = async (...args) => {
    calls.push(args);
    if (response instanceof Error) throw response;
    return response;
  };
  fn.calls = calls;
  return fn;
}

const jsonResponse = (data, ok = true, status = 200) => ({ ok, status, json: async () => data });

test('загружает ./data/games.json без кэша и возвращает каталог', async () => {
  const catalog = makeCatalog();
  const fetchFn = fakeFetch(jsonResponse(catalog));
  assert.deepEqual(await loadCatalog(fetchFn), catalog);
  assert.deepEqual(fetchFn.calls, [['./data/games.json', { cache: 'no-cache' }]]);
});

test('не-ok ответ → Error', async () => {
  await assert.rejects(loadCatalog(fakeFetch(jsonResponse(makeCatalog(), false, 404))), Error);
});

test('сетевая ошибка → Error', async () => {
  await assert.rejects(loadCatalog(fakeFetch(new TypeError('Failed to fetch'))), Error);
});

test('битый JSON → Error', async () => {
  const response = { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token'); } };
  await assert.rejects(loadCatalog(fakeFetch(response)), Error);
});

test('каталог не прошёл проверку (лишнее поле hack) → Error', async () => {
  const catalog = makeCatalog([makeGame({ hack: 1 })]);
  await assert.rejects(loadCatalog(fakeFetch(jsonResponse(catalog))), /hack/);
});
