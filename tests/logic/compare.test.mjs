import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleCompare, getBestValues, MAX_COMPARE } from '../../public/js/logic/compare.js';
import { GAMES } from '../fixtures/games.mjs';

const pick = (...wanted) => wanted.map((id) => GAMES.find((g) => g.id === id));

test('MAX_COMPARE = 3', () => {
  assert.equal(MAX_COMPARE, 3);
});

test('toggleCompare добавляет в конец', () => {
  assert.deepEqual(toggleCompare([], 'azul'), { ids: ['azul'], rejected: false });
  assert.deepEqual(toggleCompare(['azul'], 'duel'), { ids: ['azul', 'duel'], rejected: false });
});

test('toggleCompare при 3 id → rejected:true, массив не изменён', () => {
  const ids = ['azul', 'duel', 'solo'];
  const result = toggleCompare(ids, 'elka');
  assert.equal(result.rejected, true);
  assert.equal(result.ids, ids);
  assert.deepEqual(ids, ['azul', 'duel', 'solo']);
});

test('снятие работает, в том числе при полном списке', () => {
  assert.deepEqual(toggleCompare(['azul', 'duel', 'solo'], 'duel'), { ids: ['azul', 'solo'], rejected: false });
});

test('getBestValues на фикстурах', () => {
  // azul: 7.7, 4990 ₽, сложн. 1, до 30 мин; carcassonne: 7.4, 1990 ₽, 1, до 45; solo: 8.2, 3000 ₽, 3, до 120
  assert.deepEqual(getBestValues(pick('azul', 'carcassonne', 'solo')), {
    rating: ['solo'], price: ['carcassonne'], complexity: ['azul', 'carcassonne'], time: ['azul'],
  });
});

test('getBestValues: равенство — лучшие все', () => {
  // carcassonne и ticket: рейтинг 7.4 у обоих; azul и ticket: 4990 ₽
  assert.deepEqual(getBestValues(pick('carcassonne', 'ticket')).rating, ['carcassonne', 'ticket']);
  assert.deepEqual(getBestValues(pick('azul', 'ticket')).price, ['azul', 'ticket']);
  assert.deepEqual(getBestValues(pick('azul', 'duel')).time, ['azul', 'duel']);
});

test('getBestValues: пустой список', () => {
  assert.deepEqual(getBestValues([]), { rating: [], price: [], complexity: [], time: [] });
});
