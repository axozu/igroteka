import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText } from '../../public/js/logic/normalize.js';
import { searchGames, MAX_QUERY_LENGTH } from '../../public/js/logic/search.js';
import { GAMES, ids } from '../fixtures/games.mjs';

test('normalizeText: регистр, ё, пробелы', () => {
  assert.equal(normalizeText('  Ёлка   НА \t поезде \n'), 'елка на поезде');
  assert.equal(normalizeText('ЁЁё'), 'еее');
  assert.equal(normalizeText(''), '');
});

test('normalizeText: не строка → пустая строка', () => {
  for (const bad of [null, undefined, 42, {}, []]) assert.equal(normalizeText(bad), '');
});

test('MAX_QUERY_LENGTH = 100', () => {
  assert.equal(MAX_QUERY_LENGTH, 100);
});

test('«КАР» находит «Каркассон»', () => {
  assert.deepEqual(ids(searchGames(GAMES, 'КАР')), ['carcassonne']);
});

test('«елка» и «ёлка» находят «Ёлка»', () => {
  assert.deepEqual(ids(searchGames(GAMES, 'елка')), ['elka']);
  assert.deepEqual(ids(searchGames(GAMES, 'ёлка')), ['elka']);
  assert.deepEqual(ids(searchGames(GAMES, 'ЕЛКА')), ['elka']);
});

test('поиск по originalTitle', () => {
  assert.deepEqual(ids(searchGames(GAMES, 'azul')), ['azul']);
  assert.deepEqual(ids(searchGames(GAMES, 'ticket  to')), ['ticket']);
});

test('пустой и пробельный запрос возвращают всё', () => {
  assert.deepEqual(ids(searchGames(GAMES, '  ')), ids(GAMES));
  assert.deepEqual(ids(searchGames(GAMES, '')), ids(GAMES));
  assert.deepEqual(ids(searchGames(GAMES, undefined)), ids(GAMES));
});

test('нет совпадений → []', () => {
  assert.deepEqual(searchGames(GAMES, 'монополия'), []);
});

test('запрос длиннее 100 символов обрезается', () => {
  // После обрезки остаются одни пробелы → ничего не отсекается.
  const query = `${' '.repeat(MAX_QUERY_LENGTH)}Ёлка`;
  assert.deepEqual(ids(searchGames(GAMES, query)), ids(GAMES));
  assert.doesNotThrow(() => searchGames(GAMES, 'я'.repeat(100_000)));
});

test('исходный массив не изменён и результат — новый массив', () => {
  const games = [...GAMES];
  const result = searchGames(games, '');
  assert.notEqual(result, games);
  assert.deepEqual(games, [...GAMES]);
});
