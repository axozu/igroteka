// Фильтры каталога (§5.1): между группами — И, внутри группы — ИЛИ, пустая группа не фильтрует.

/** Фильтры по умолчанию (ничего не отсекают). */
export const DEFAULT_FILTERS = Object.freeze({
  genres: Object.freeze([]),
  players: null,
  priceMin: null,
  priceMax: null,
  age: null,
  time: Object.freeze([]),
  complexity: Object.freeze([]),
});

/** Длительность партии по `playTime.max`, минуты включительно. */
export const TIME_BUCKETS = Object.freeze({
  short: Object.freeze([0, 30]),
  medium: Object.freeze([31, 60]),
  long: Object.freeze([61, Infinity]),
});

/** Варианты числа игроков; последний означает «6+». */
export const PLAYER_OPTIONS = Object.freeze([1, 2, 3, 4, 5, 6]);

/** Варианты возраста: показываются игры с `age ≤ N`. */
export const AGE_OPTIONS = Object.freeze([6, 8, 10, 12, 14, 18]);

/** Верхняя граница допустимой цены в фильтре, ₽. */
export const PRICE_LIMIT = 100000;

const MAX_PLAYERS_OPTION = PLAYER_OPTIONS.at(-1);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const asList = (v) => (Array.isArray(v) ? v : []);

/** Границы цены с учётом перестановки, если min > max. */
function priceBounds({ priceMin, priceMax }) {
  const min = isNum(priceMin) ? priceMin : null;
  const max = isNum(priceMax) ? priceMax : null;
  if (min !== null && max !== null && min > max) return [max, min];
  return [min, max];
}

function matchesPlayers(game, n) {
  if (n === MAX_PLAYERS_OPTION) return game.players.max >= n;
  return game.players.min <= n && n <= game.players.max;
}

function matchesTime(game, buckets) {
  return buckets.some((key) => {
    const range = Object.hasOwn(TIME_BUCKETS, key) ? TIME_BUCKETS[key] : null;
    return range !== null && game.playTime.max >= range[0] && game.playTime.max <= range[1];
  });
}

/**
 * Отбирает игры по фильтрам. Недостающие поля фильтров берутся из DEFAULT_FILTERS.
 * @param {object[]} games
 * @param {Partial<typeof DEFAULT_FILTERS>} filters
 * @returns {object[]} новый массив, исходный не изменяется
 */
export function filterGames(games, filters) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const genres = asList(f.genres);
  const time = asList(f.time);
  const complexity = asList(f.complexity);
  const [priceMin, priceMax] = priceBounds(f);

  return games.filter((game) => {
    if (genres.length > 0 && !game.genres.some((g) => genres.includes(g))) return false;
    if (isNum(f.players) && !matchesPlayers(game, f.players)) return false;
    if (priceMin !== null && game.price < priceMin) return false;
    if (priceMax !== null && game.price > priceMax) return false;
    if (isNum(f.age) && game.age > f.age) return false;
    if (time.length > 0 && !matchesTime(game, time)) return false;
    if (complexity.length > 0 && !complexity.includes(game.complexity)) return false;
    return true;
  });
}

/**
 * Число активных фильтров: каждое выбранное значение — 1, диапазон цены (от и/или до) — 1.
 * @param {Partial<typeof DEFAULT_FILTERS>} filters
 * @returns {number}
 */
export function countActiveFilters(filters) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return (
    asList(f.genres).length +
    (isNum(f.players) ? 1 : 0) +
    (isNum(f.priceMin) || isNum(f.priceMax) ? 1 : 0) +
    (isNum(f.age) ? 1 : 0) +
    asList(f.time).length +
    asList(f.complexity).length
  );
}

/**
 * Совпадают ли фильтры со значениями по умолчанию.
 * @param {Partial<typeof DEFAULT_FILTERS>} filters
 * @returns {boolean}
 */
export function isDefaultFilters(filters) {
  return countActiveFilters(filters) === 0;
}
