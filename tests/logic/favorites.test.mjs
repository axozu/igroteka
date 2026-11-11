import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleId, pruneUnknown, isIdList, MAX_FAVORITES } from '../../public/js/logic/favorites.js';

test('MAX_FAVORITES = 100', () => {
  assert.equal(MAX_FAVORITES, 100);
});

test('toggleId добавляет в конец и убирает', () => {
  const a = toggleId([], 'azul');
  assert.deepEqual(a, ['azul']);
  const b = toggleId(a, 'catan');
  assert.deepEqual(b, ['azul', 'catan']);
  assert.deepEqual(toggleId(b, 'azul'), ['catan']);
  assert.deepEqual(a, ['azul'], 'исходный массив не изменён');
});

test('на 101-м добавлении список не растёт', () => {
  const full = Array.from({ length: MAX_FAVORITES }, (_, i) => `game-${i}`);
  const result = toggleId(full, 'one-more');
  assert.equal(result.length, MAX_FAVORITES);
  assert.equal(result, full, 'при отказе возвращается тот же массив');
  assert.equal(toggleId(full, 'game-5').length, MAX_FAVORITES - 1, 'убрать при лимите можно');
});

test('toggleId с своим лимитом', () => {
  assert.deepEqual(toggleId(['a', 'b'], 'c', 2), ['a', 'b']);
});

test('pruneUnknown убирает неизвестные id', () => {
  assert.deepEqual(pruneUnknown(['azul', 'ghost', 'catan'], new Set(['catan', 'azul'])), ['azul', 'catan']);
  assert.deepEqual(pruneUnknown([], new Set(['azul'])), []);
});

test('isIdList', () => {
  assert.equal(isIdList([], 3), true);
  assert.equal(isIdList(['azul', 'catan'], 3), true);
  assert.equal(isIdList(['a', 'b', 'c', 'd'], 3), false);
  assert.equal(isIdList(['azul', 'azul'], 3), false);
  assert.equal(isIdList(['<b>'], 3), false);
  assert.equal(isIdList(['Bad Id'], 3), false);
  assert.equal(isIdList([1], 3), false);
  assert.equal(isIdList('azul', 3), false);
  assert.equal(isIdList({ length: 0 }, 3), false);
  assert.equal(isIdList(null, 3), false);
});
