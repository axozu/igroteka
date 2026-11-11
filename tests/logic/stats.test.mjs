import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCatalogStats } from '../../public/js/logic/stats.js';
import { GAMES } from '../fixtures/games.mjs';
import { GENRES } from '../fixtures/catalog.mjs';

test('точные числа статистики на фикстурах', () => {
  // Рейтинги: 7.4 + 6.5 + 7.7 + 7.4 + 8.2 + 7.9 = 45.1; 45.1 / 6 = 7.516… → 7.5
  assert.deepEqual(getCatalogStats(GAMES, GENRES), {
    gamesCount: 6, genresCount: 6, avgRating: 7.5, priceMin: 900, priceMax: 4990,
  });
});

test('средний рейтинг округляется до 0.1', () => {
  const stats = getCatalogStats([{ rating: 7.1, price: 100 }, { rating: 7.2, price: 200 }], []);
  assert.equal(stats.avgRating, 7.2); // 7.15 → 7.2
  assert.equal(getCatalogStats([{ rating: 8, price: 100 }, { rating: 7.9, price: 100 }, { rating: 7.9, price: 100 }], []).avgRating, 7.9);
});

test('пустой каталог → нули и null', () => {
  assert.deepEqual(getCatalogStats([], []), {
    gamesCount: 0, genresCount: 0, avgRating: null, priceMin: null, priceMax: null,
  });
});
