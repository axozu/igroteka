import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectVisibleGames } from '../../public/js/logic/catalog.js';
import { DEFAULT_FILTERS } from '../../public/js/logic/filter.js';
import { GAMES, ids } from '../fixtures/games.mjs';

const state = (patch) => ({
  games: GAMES, query: '', filters: DEFAULT_FILTERS, sort: 'rating-desc', view: 'all', favorites: [], ...patch,
});

test('по умолчанию — все игры по рейтингу', () => {
  assert.deepEqual(ids(selectVisibleGames(state())), ['solo', 'duel', 'azul', 'ticket', 'carcassonne', 'elka']);
});

test('избранное + запрос + фильтр + сортировка вместе', () => {
  const result = selectVisibleGames(state({
    view: 'favorites',
    favorites: ['elka', 'ticket', 'azul', 'carcassonne', 'duel'],
    query: 'а', // Азул, Билет на поезд, Ёлка, Каркассон; у «Дуэль» нет «а»
    filters: { ...DEFAULT_FILTERS, genres: ['family'] }, // убирает Ёлку
    sort: 'price-desc',
  }));
  assert.deepEqual(ids(result), ['azul', 'ticket', 'carcassonne']);
});

test('view:"all" не учитывает избранное', () => {
  assert.equal(selectVisibleGames(state({ favorites: ['elka'] })).length, GAMES.length);
});

test('пустое избранное → []', () => {
  assert.deepEqual(selectVisibleGames(state({ view: 'favorites', favorites: [] })), []);
});

test('избранное с неизвестными id → только существующие игры', () => {
  assert.deepEqual(ids(selectVisibleGames(state({ view: 'favorites', favorites: ['ghost', 'elka'] }))), ['elka']);
});

test('нет игр (загрузка) → []', () => {
  assert.deepEqual(selectVisibleGames(state({ games: [] })), []);
});
