// Состояние ⇄ query-строка адреса (§5.2). Всё из адреса проверяется по белому списку (§8.4).
import { DEFAULT_FILTERS, PLAYER_OPTIONS, AGE_OPTIONS, PRICE_LIMIT, TIME_BUCKETS } from './filter.js';
import { DEFAULT_SORT, SORT_OPTIONS } from './sort.js';
import { MAX_QUERY_LENGTH } from './search.js';
import { isValidId } from './validate.js';

/** Жанры §4.1 — белый список, пока каталог ещё не загружен. */
const DEFAULT_GENRE_IDS = new Set(['strategy', 'family', 'party', 'coop', 'duel', 'card']);
const SORT_IDS = new Set(SORT_OPTIONS.map((o) => o.id));
const TIME_IDS = new Set(Object.keys(TIME_BUCKETS));
const LEVELS = new Set([1, 2, 3]);
const VIEWS = new Set(['all', 'favorites']);
const DIGITS_RE = /^\d{1,6}$/;
const MAX_LIST_PARAM = 200;

const cut = (s) => (typeof s === 'string' ? s.slice(0, MAX_QUERY_LENGTH) : '');

/**
 * Query-строка (без «?») для URL-части состояния. Значения по умолчанию опускаются.
 * Порядок: q, genre, players, priceMin, priceMax, age, time, level, sort, view, game.
 * @param {object} state
 * @returns {string}
 */
export function stateToQuery(state) {
  const f = { ...DEFAULT_FILTERS, ...state.filters };
  const params = new URLSearchParams();
  const query = cut(state.query);
  if (query.trim() !== '') params.set('q', query);
  if (f.genres.length > 0) params.set('genre', f.genres.join(','));
  if (f.players !== null) params.set('players', String(f.players));
  if (f.priceMin !== null) params.set('priceMin', String(f.priceMin));
  if (f.priceMax !== null) params.set('priceMax', String(f.priceMax));
  if (f.age !== null) params.set('age', String(f.age));
  if (f.time.length > 0) params.set('time', f.time.join(','));
  if (f.complexity.length > 0) params.set('level', f.complexity.join(','));
  if (state.sort && state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
  if (state.view === 'favorites') params.set('view', 'favorites');
  if (state.openGameId) params.set('game', state.openGameId);
  // Запятые в списках оставляем читаемыми: ?genre=family,strategy
  return params.toString().replaceAll('%2C', ',');
}

/** Целое число из строки только из цифр, иначе null. */
function parseDigits(raw) {
  return typeof raw === 'string' && DIGITS_RE.test(raw) ? Number(raw) : null;
}

/** Уникальные значения списка через запятую, прошедшие проверку. */
function parseList(raw, convert, isAllowed) {
  if (typeof raw !== 'string') return [];
  const result = [];
  for (const part of raw.slice(0, MAX_LIST_PARAM).split(',')) {
    const value = convert(part);
    if (isAllowed(value) && !result.includes(value)) result.push(value);
  }
  return result;
}

/**
 * Разбирает query-строку в частичное состояние. Некорректные значения молча отбрасываются,
 * в результат попадают только корректные поля; `filters` тоже частичный.
 * @param {string} search — строка вида "?q=…" или "q=…"
 * @param {{ genreIds?: Set<string>, gameIds?: Set<string> }} [known]
 * @returns {object}
 */
export function queryToState(search, known = {}) {
  const params = new URLSearchParams(typeof search === 'string' ? search : '');
  const genreIds = known.genreIds instanceof Set ? known.genreIds : DEFAULT_GENRE_IDS;
  const gameIds = known.gameIds instanceof Set ? known.gameIds : null;
  const result = {};
  const filters = {};

  const query = cut(params.get('q') ?? '');
  if (query.trim() !== '') result.query = query;

  const genres = parseList(params.get('genre'), String, (g) => isValidId(g) && genreIds.has(g));
  if (genres.length > 0) filters.genres = genres;

  const players = parseDigits(params.get('players'));
  if (PLAYER_OPTIONS.includes(players)) filters.players = players;

  for (const key of ['priceMin', 'priceMax']) {
    const price = parseDigits(params.get(key));
    if (price !== null && price <= PRICE_LIMIT) filters[key] = price;
  }

  const age = parseDigits(params.get('age'));
  if (AGE_OPTIONS.includes(age)) filters.age = age;

  const time = parseList(params.get('time'), String, (t) => TIME_IDS.has(t));
  if (time.length > 0) filters.time = time;

  const levels = parseList(params.get('level'), parseDigits, (n) => LEVELS.has(n));
  if (levels.length > 0) filters.complexity = levels;

  if (Object.keys(filters).length > 0) result.filters = filters;

  const sort = params.get('sort');
  if (SORT_IDS.has(sort)) result.sort = sort;

  const view = params.get('view');
  if (VIEWS.has(view)) result.view = view;

  const game = params.get('game');
  if (isValidId(game) && (gameIds === null || gameIds.has(game))) result.openGameId = game;

  return result;
}
