import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DIR } from '../helpers/html.mjs';
import { validateCatalog, MIN_GAMES } from '../../public/js/logic/validate.js';

const GENRE_IDS = ['strategy', 'family', 'party', 'coop', 'duel', 'card'];

const load = () => JSON.parse(readFileSync(join(PUBLIC_DIR, 'data', 'games.json'), 'utf8'));

test('games.json проходит validateCatalog', () => {
  const result = validateCatalog(load());
  assert.ok(result.ok, `ошибки каталога:\n${result.errors.join('\n')}`);
});

test(`в каталоге не меньше ${MIN_GAMES} игр`, () => {
  assert.ok(load().games.length >= MIN_GAMES);
});

test('ровно 6 жанров с id из §4.1', () => {
  assert.deepEqual(load().genres.map((g) => g.id).sort(), [...GENRE_IDS].sort());
});

test('в каждом жанре не меньше 3 игр', () => {
  const { games } = load();
  for (const id of GENRE_IDS) {
    const count = games.filter((g) => g.genres.includes(id)).length;
    assert.ok(count >= 3, `жанр ${id}: ${count} игр`);
  }
});

test('у соседних игр одного жанра разные цвета обложек', () => {
  const { games } = load();
  for (const id of GENRE_IDS) {
    const colors = games.filter((g) => g.genres.includes(id)).map((g) => g.cover.color.toUpperCase());
    colors.slice(1).forEach((color, i) => {
      assert.notEqual(color, colors[i], `жанр ${id}: повтор цвета ${color}`);
    });
  }
});
