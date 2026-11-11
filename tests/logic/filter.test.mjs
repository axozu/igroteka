import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FILTERS, TIME_BUCKETS, PLAYER_OPTIONS, AGE_OPTIONS, PRICE_LIMIT,
  filterGames, countActiveFilters, isDefaultFilters,
} from '../../public/js/logic/filter.js';
import { GAMES, ids } from '../fixtures/games.mjs';

const only = (patch) => ({ ...DEFAULT_FILTERS, ...patch });
const run = (patch) => ids(filterGames(GAMES, only(patch)));

test('константы', () => {
  assert.deepEqual(DEFAULT_FILTERS, {
    genres: [], players: null, priceMin: null, priceMax: null, age: null, time: [], complexity: [],
  });
  assert.ok(Object.isFrozen(DEFAULT_FILTERS));
  assert.ok(Object.isFrozen(DEFAULT_FILTERS.genres));
  assert.deepEqual(TIME_BUCKETS, { short: [0, 30], medium: [31, 60], long: [61, Infinity] });
  assert.deepEqual(PLAYER_OPTIONS, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(AGE_OPTIONS, [6, 8, 10, 12, 14, 18]);
  assert.equal(PRICE_LIMIT, 100000);
});

test('DEFAULT_FILTERS → всё', () => {
  assert.deepEqual(ids(filterGames(GAMES, DEFAULT_FILTERS)), ids(GAMES));
});

test('жанры: ИЛИ внутри группы', () => {
  assert.deepEqual(run({ genres: ['party'] }), ['elka']);
  assert.deepEqual(run({ genres: ['party', 'duel'] }), ['elka', 'duel']);
  assert.deepEqual(run({ genres: ['card'] }), ['solo', 'duel']);
});

test('игроки: N попадает в min…max', () => {
  assert.deepEqual(run({ players: 1 }), ['solo']);
  assert.deepEqual(run({ players: 5 }), ['carcassonne', 'elka', 'ticket']);
});

test('игроки: 6 означает «6+» (max ≥ 6)', () => {
  assert.deepEqual(run({ players: 6 }), ['elka']);
  // Игра на 7–12 человек не включает ровно 6, но подходит под «6+».
  const big = { ...GAMES[1], id: 'big', players: { min: 7, max: 12 } };
  assert.deepEqual(ids(filterGames([big], only({ players: 6 }))), ['big']);
});

test('цена: только min', () => {
  assert.deepEqual(run({ priceMin: 3000 }), ['azul', 'ticket', 'solo']);
});

test('цена: только max', () => {
  assert.deepEqual(run({ priceMax: 1990 }), ['carcassonne', 'elka']);
});

test('цена: min > max — границы меняются местами', () => {
  assert.deepEqual(run({ priceMin: 3000, priceMax: 1990 }), run({ priceMin: 1990, priceMax: 3000 }));
  assert.deepEqual(run({ priceMin: 3000, priceMax: 1990 }), ['carcassonne', 'solo', 'duel']);
});

test('возраст: age ≤ N', () => {
  assert.deepEqual(run({ age: 8 }), ['carcassonne', 'elka', 'azul', 'ticket']);
  assert.deepEqual(run({ age: 6 }), ['elka']);
});

test('время: short включает max = 30', () => {
  assert.deepEqual(run({ time: ['short'] }), ['elka', 'azul', 'duel']);
});

test('время: medium включает max = 60', () => {
  assert.deepEqual(run({ time: ['medium'] }), ['carcassonne', 'ticket']);
  assert.deepEqual(run({ time: ['long'] }), ['solo']);
  assert.deepEqual(run({ time: ['short', 'long'] }), ['elka', 'azul', 'solo', 'duel']);
});

test('сложность: ИЛИ внутри группы', () => {
  assert.deepEqual(run({ complexity: [2, 3] }), ['solo', 'duel']);
});

test('комбинация групп = И', () => {
  assert.deepEqual(run({ genres: ['family'], priceMax: 2000 }), ['carcassonne']);
  assert.deepEqual(run({ genres: ['card'], players: 2, time: ['short'] }), ['duel']);
  assert.deepEqual(run({ genres: ['party'], complexity: [3] }), []);
});

test('частичный объект фильтров дополняется значениями по умолчанию', () => {
  assert.deepEqual(ids(filterGames(GAMES, { genres: ['party'] })), ['elka']);
  assert.deepEqual(ids(filterGames(GAMES, undefined)), ids(GAMES));
});

test('исходный массив не изменён', () => {
  const games = [...GAMES];
  filterGames(games, only({ genres: ['party'] }));
  assert.deepEqual(games, [...GAMES]);
});

test('countActiveFilters: каждое значение — 1, цена от-до — 1', () => {
  assert.equal(countActiveFilters(DEFAULT_FILTERS), 0);
  assert.equal(countActiveFilters(only({ priceMin: 100, priceMax: 5000 })), 1);
  assert.equal(countActiveFilters(only({ priceMin: 100 })), 1);
  assert.equal(countActiveFilters(only({ genres: ['party', 'card'] })), 2);
  assert.equal(
    countActiveFilters(only({ genres: ['party'], players: 2, age: 8, time: ['short'], complexity: [1, 2], priceMax: 3000 })),
    7,
  );
});

test('isDefaultFilters', () => {
  assert.equal(isDefaultFilters(DEFAULT_FILTERS), true);
  assert.equal(isDefaultFilters({ ...DEFAULT_FILTERS }), true);
  assert.equal(isDefaultFilters(only({ age: 6 })), false);
});
