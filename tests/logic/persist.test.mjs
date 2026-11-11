import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJSON, writeJSON, STORAGE_KEYS } from '../../public/js/logic/persist.js';
import { isIdList, MAX_FAVORITES } from '../../public/js/logic/favorites.js';

/** Простое хранилище в памяти с интерфейсом localStorage. */
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    data,
  };
}

const throwingStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};

const guard = (v) => isIdList(v, MAX_FAVORITES);
const FALLBACK = Object.freeze([]);

test('STORAGE_KEYS', () => {
  assert.deepEqual(STORAGE_KEYS, { favorites: 'igroteka:favorites', compare: 'igroteka:compare', theme: 'igroteka:theme' });
});

test('запись и чтение', () => {
  const storage = memoryStorage();
  assert.equal(writeJSON(storage, 'k', ['azul', 'catan']), true);
  assert.equal(storage.data.get('k'), '["azul","catan"]');
  assert.deepEqual(readJSON(storage, 'k', FALLBACK, guard), ['azul', 'catan']);
});

test('нет ключа → fallback', () => {
  assert.equal(readJSON(memoryStorage(), 'k', FALLBACK, guard), FALLBACK);
});

test('бросающий storage → fallback / false, без исключений', () => {
  assert.equal(readJSON(throwingStorage, 'k', FALLBACK, guard), FALLBACK);
  assert.equal(writeJSON(throwingStorage, 'k', ['azul']), false);
});

test('storage отсутствует → fallback / false', () => {
  for (const storage of [null, undefined, {}]) {
    assert.equal(readJSON(storage, 'k', FALLBACK, guard), FALLBACK);
    assert.equal(writeJSON(storage, 'k', ['azul']), false);
  }
});

test('битый JSON → fallback', () => {
  for (const raw of ['{', 'undefined', "['azul']", '']) {
    assert.equal(readJSON(memoryStorage({ k: raw }), 'k', FALLBACK, guard), FALLBACK, raw);
  }
});

test('значение не проходит guard → fallback', () => {
  const many = Array.from({ length: 101 }, (_, i) => `game-${i}`);
  for (const value of [{ a: 1 }, 'azul', 42, null, many, ['azul', 'azul'], ['<b>'], [1, 2]]) {
    const storage = memoryStorage({ k: JSON.stringify(value) });
    assert.equal(readJSON(storage, 'k', FALLBACK, guard), FALLBACK, JSON.stringify(value).slice(0, 40));
  }
});

test('бросающий guard → fallback', () => {
  const storage = memoryStorage({ k: '[]' });
  assert.equal(readJSON(storage, 'k', FALLBACK, () => { throw new Error('x'); }), FALLBACK);
});

test('слишком длинная строка в storage → fallback', () => {
  const storage = memoryStorage({ k: JSON.stringify('x'.repeat(200_000)) });
  assert.equal(readJSON(storage, 'k', FALLBACK, () => true), FALLBACK);
});

test('значение, которое нельзя сериализовать → false', () => {
  const cyclic = [];
  cyclic.push(cyclic);
  assert.equal(writeJSON(memoryStorage(), 'k', cyclic), false);
});
