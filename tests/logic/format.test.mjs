import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pluralize, formatPrice, formatRating, formatPlayers, formatPlayTime, formatAge,
} from '../../public/js/logic/format.js';

const NBSP = ' ';

test('pluralize', () => {
  const forms = ['игрок', 'игрока', 'игроков'];
  const cases = { 1: 'игрок', 2: 'игрока', 4: 'игрока', 5: 'игроков', 11: 'игроков', 12: 'игроков', 21: 'игрок', 22: 'игрока', 25: 'игроков', 101: 'игрок', 111: 'игроков' };
  for (const [n, expected] of Object.entries(cases)) assert.equal(pluralize(Number(n), forms), expected, n);
});

test('formatPrice: «≈ 3 990 ₽» с неразрывными пробелами', () => {
  assert.equal(formatPrice(3990), `≈${NBSP}3${NBSP}990${NBSP}₽`);
  assert.equal(formatPrice(990), `≈${NBSP}990${NBSP}₽`);
  assert.equal(formatPrice(12500), `≈${NBSP}12${NBSP}500${NBSP}₽`);
});

test('formatRating: «★ 8.1», всегда один знак', () => {
  assert.equal(formatRating(8.1), '★ 8.1');
  assert.equal(formatRating(8), '★ 8.0');
});

test('formatPlayers', () => {
  assert.equal(formatPlayers({ min: 1, max: 1 }), '1 игрок');
  assert.equal(formatPlayers({ min: 2, max: 2 }), '2 игрока');
  assert.equal(formatPlayers({ min: 1, max: 4 }), '1–4 игрока');
  assert.equal(formatPlayers({ min: 2, max: 5 }), '2–5 игроков');
  assert.equal(formatPlayers({ min: 2, max: 8 }), '2–8 игроков');
});

test('formatPlayTime', () => {
  assert.equal(formatPlayTime({ min: 30, max: 30 }), '30 мин');
  assert.equal(formatPlayTime({ min: 30, max: 45 }), '30–45 мин');
});

test('formatAge', () => {
  assert.equal(formatAge(10), '10+');
});
