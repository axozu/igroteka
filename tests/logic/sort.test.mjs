import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SORT_OPTIONS, DEFAULT_SORT, sortGames } from '../../public/js/logic/sort.js';
import { GAMES, ids } from '../fixtures/games.mjs';

test('SORT_OPTIONS и DEFAULT_SORT', () => {
  assert.deepEqual(SORT_OPTIONS, [
    { id: 'rating-desc', label: 'По рейтингу' },
    { id: 'price-asc', label: 'Сначала дешевле' },
    { id: 'price-desc', label: 'Сначала дороже' },
    { id: 'title-asc', label: 'По названию' },
    { id: 'year-desc', label: 'Сначала новые' },
  ]);
  assert.equal(DEFAULT_SORT, 'rating-desc');
});

test('rating-desc; равный рейтинг → по названию', () => {
  // Каркассон и Билет на поезд — оба 7.4: «Билет…» раньше.
  assert.deepEqual(ids(sortGames(GAMES, 'rating-desc')), ['solo', 'duel', 'azul', 'ticket', 'carcassonne', 'elka']);
});

test('price-asc; равная цена → по названию', () => {
  assert.deepEqual(ids(sortGames(GAMES, 'price-asc')), ['elka', 'carcassonne', 'duel', 'solo', 'azul', 'ticket']);
});

test('price-desc; равная цена → по названию', () => {
  assert.deepEqual(ids(sortGames(GAMES, 'price-desc')), ['azul', 'ticket', 'solo', 'duel', 'carcassonne', 'elka']);
});

test('title-asc: «Азул» раньше «Билет…», ё — по русскому алфавиту', () => {
  assert.deepEqual(ids(sortGames(GAMES, 'title-asc')), ['azul', 'ticket', 'duel', 'elka', 'carcassonne', 'solo']);
});

test('year-desc', () => {
  assert.deepEqual(ids(sortGames(GAMES, 'year-desc')), ['solo', 'elka', 'azul', 'duel', 'ticket', 'carcassonne']);
});

test('неизвестный ключ → как DEFAULT_SORT', () => {
  for (const bad of ['evil', undefined, null, 42, '__proto__']) {
    assert.deepEqual(ids(sortGames(GAMES, bad)), ids(sortGames(GAMES, DEFAULT_SORT)));
  }
});

test('исходный массив не изменён', () => {
  const games = [...GAMES];
  const result = sortGames(games, 'title-asc');
  assert.notEqual(result, games);
  assert.deepEqual(games, [...GAMES]);
});
