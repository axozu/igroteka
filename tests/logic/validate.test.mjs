import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGame, validateCatalog, COVER_ICONS, MIN_GAMES } from '../../public/js/logic/validate.js';
import { GENRE_IDS, makeGame, makeCatalog } from '../fixtures/catalog.mjs';

/** Ошибки игры, где есть упоминание поля. */
const errorsFor = (game, field) =>
  validateGame(game, GENRE_IDS).filter((e) => e.includes(`: ${field} —`));

test('константы', () => {
  assert.equal(MIN_GAMES, 16);
  assert.deepEqual(
    [...COVER_ICONS].sort(),
    ['bird', 'cards', 'castle', 'dice', 'gem', 'hex', 'leaf', 'meeple', 'planet', 'tile', 'train', 'virus'],
  );
  assert.ok(Object.isFrozen(COVER_ICONS));
});

test('корректная игра → []', () => {
  assert.deepEqual(validateGame(makeGame(), GENRE_IDS), []);
});

test('граничные значения допустимы', () => {
  const game = makeGame({
    year: new Date().getFullYear(),
    players: { min: 1, max: 12 },
    playTime: { min: 5, max: 300 },
    age: 18,
    complexity: 3,
    rating: 10,
    price: 30000,
    genres: ['strategy', 'family', 'card'],
  });
  assert.deepEqual(validateGame(game, GENRE_IDS), []);
  assert.deepEqual(validateGame(makeGame({ rating: 0, price: 100, age: 3, year: 1950 }), GENRE_IDS), []);
});

test('формат ошибки: "<id>: <поле> — <проблема>"', () => {
  const [error] = validateGame(makeGame({ age: 2 }), GENRE_IDS);
  assert.match(error, /^test-game: age — .+/);
});

test('players {min:5, max:2} → ошибка players', () => {
  assert.ok(errorsFor(makeGame({ players: { min: 5, max: 2 } }), 'players').length > 0);
  assert.ok(errorsFor(makeGame({ players: { min: 0, max: 2 } }), 'players').length > 0);
  assert.ok(errorsFor(makeGame({ players: { min: 1, max: 13 } }), 'players').length > 0);
  assert.ok(errorsFor(makeGame({ players: { min: 1.5, max: 2 } }), 'players').length > 0);
  assert.ok(errorsFor(makeGame({ players: [2, 4] }), 'players').length > 0);
});

test('playTime вне 5–300 или min > max → ошибка', () => {
  assert.ok(errorsFor(makeGame({ playTime: { min: 4, max: 30 } }), 'playTime').length > 0);
  assert.ok(errorsFor(makeGame({ playTime: { min: 60, max: 30 } }), 'playTime').length > 0);
  assert.ok(errorsFor(makeGame({ playTime: { min: 30, max: 301 } }), 'playTime').length > 0);
});

test('лишнее поле во вложенном объекте → ошибка', () => {
  assert.ok(errorsFor(makeGame({ players: { min: 2, max: 4, x: 1 } }), 'players').length > 0);
  assert.ok(errorsFor(makeGame({ cover: { color: '#C8553D', icon: 'hex', href: 'x' } }), 'cover').length > 0);
});

test('неизвестный жанр → ошибка genres', () => {
  assert.ok(errorsFor(makeGame({ genres: ['horror'] }), 'genres').length > 0);
});

test('genres: пусто, больше 3, повтор → ошибка', () => {
  assert.ok(errorsFor(makeGame({ genres: [] }), 'genres').length > 0);
  assert.ok(errorsFor(makeGame({ genres: ['strategy', 'family', 'card', 'duel'] }), 'genres').length > 0);
  assert.ok(errorsFor(makeGame({ genres: ['card', 'card'] }), 'genres').length > 0);
  assert.ok(errorsFor(makeGame({ genres: 'card' }), 'genres').length > 0);
});

test('rating: 11 и 7.15 → ошибка', () => {
  assert.ok(errorsFor(makeGame({ rating: 11 }), 'rating').length > 0);
  assert.ok(errorsFor(makeGame({ rating: 7.15 }), 'rating').length > 0);
  assert.ok(errorsFor(makeGame({ rating: -0.1 }), 'rating').length > 0);
  assert.ok(errorsFor(makeGame({ rating: Number.NaN }), 'rating').length > 0);
  assert.ok(errorsFor(makeGame({ rating: '7.1' }), 'rating').length > 0);
});

test('cover.color: "red" → ошибка', () => {
  assert.ok(errorsFor(makeGame({ cover: { color: 'red', icon: 'hex' } }), 'cover.color').length > 0);
});

test('cover.icon: "unicorn" → ошибка', () => {
  assert.ok(errorsFor(makeGame({ cover: { color: '#C8553D', icon: 'unicorn' } }), 'cover.icon').length > 0);
});

test('id: "Bad Id" → ошибка', () => {
  assert.ok(errorsFor(makeGame({ id: 'Bad Id' }), 'id').length > 0);
  assert.ok(errorsFor(makeGame({ id: 'a'.repeat(41) }), 'id').length > 0);
  assert.ok(errorsFor(makeGame({ id: 'trailing-' }), 'id').length > 0);
});

test('лишнее поле foo → ошибка', () => {
  assert.ok(errorsFor(makeGame({ foo: 1 }), 'foo').length > 0);
});

test('отсутствующее поле → ошибка', () => {
  const game = makeGame();
  delete game.publisher;
  assert.ok(errorsFor(game, 'publisher').length > 0);
});

test('price: "3990" (строка) → ошибка', () => {
  assert.ok(errorsFor(makeGame({ price: '3990' }), 'price').length > 0);
  assert.ok(errorsFor(makeGame({ price: 99 }), 'price').length > 0);
  assert.ok(errorsFor(makeGame({ price: 3990.5 }), 'price').length > 0);
});

test('short длиной 10 → ошибка', () => {
  assert.ok(errorsFor(makeGame({ short: 'а'.repeat(10) }), 'short').length > 0);
  assert.ok(errorsFor(makeGame({ short: 'а'.repeat(161) }), 'short').length > 0);
});

test('строки: длины и типы', () => {
  assert.ok(errorsFor(makeGame({ title: '' }), 'title').length > 0);
  assert.ok(errorsFor(makeGame({ title: '   ' }), 'title').length > 0);
  assert.ok(errorsFor(makeGame({ originalTitle: 'x'.repeat(81) }), 'originalTitle').length > 0);
  assert.ok(errorsFor(makeGame({ designer: 42 }), 'designer').length > 0);
  assert.ok(errorsFor(makeGame({ description: 'коротко' }), 'description').length > 0);
});

test('year: будущий, до 1950, дробный → ошибка', () => {
  assert.ok(errorsFor(makeGame({ year: new Date().getFullYear() + 1 }), 'year').length > 0);
  assert.ok(errorsFor(makeGame({ year: 1949 }), 'year').length > 0);
  assert.ok(errorsFor(makeGame({ year: 2000.5 }), 'year').length > 0);
});

test('age и complexity вне допустимого → ошибка', () => {
  assert.ok(errorsFor(makeGame({ age: 19 }), 'age').length > 0);
  assert.ok(errorsFor(makeGame({ complexity: 4 }), 'complexity').length > 0);
  assert.ok(errorsFor(makeGame({ complexity: '2' }), 'complexity').length > 0);
});

test('игра — не объект → ошибка без исключения', () => {
  for (const bad of [null, undefined, 42, 'game', []]) {
    assert.ok(validateGame(bad, GENRE_IDS).length > 0);
  }
});

test('корректный каталог → ok:true', () => {
  assert.deepEqual(validateCatalog(makeCatalog()), { ok: true, errors: [] });
});

test('дубликат id игры → ok:false с текстом "дубликат"', () => {
  const result = validateCatalog(makeCatalog([makeGame(), makeGame()]));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('дубликат')));
});

test('дубликат id жанра → ok:false с текстом "дубликат"', () => {
  const catalog = makeCatalog();
  catalog.genres.push({ id: 'card', name: 'Ещё карточная' });
  const result = validateCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('дубликат')));
});

test('ошибки игр попадают в errors каталога', () => {
  const result = validateCatalog(makeCatalog([makeGame({ rating: 11 })]));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('test-game: rating')));
});

test('битый жанр и лишние поля каталога → ok:false', () => {
  const badGenre = makeCatalog();
  badGenre.genres[0] = { id: 'strategy', name: '', extra: 1 };
  assert.equal(validateCatalog(badGenre).ok, false);
  assert.equal(validateCatalog({ ...makeCatalog(), extra: true }).ok, false);
});

test('мусор вместо каталога → ok:false без исключений', () => {
  for (const bad of [null, undefined, {}, { genres: 'x', games: [] }, { genres: [], games: 'x' }, [], 'catalog', 1]) {
    const result = validateCatalog(bad);
    assert.equal(result.ok, false, JSON.stringify(bad));
    assert.ok(result.errors.length > 0);
  }
});
