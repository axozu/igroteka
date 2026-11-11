// Проверка каталога игр по формату §4.1. Чистые функции: данные из games.json
// не считаются надёжными, поэтому проверяется каждое поле, а лишние поля запрещены.

/** Допустимые иконки обложек. */
export const COVER_ICONS = Object.freeze([
  'hex', 'tile', 'train', 'cards', 'bird', 'gem',
  'planet', 'virus', 'dice', 'meeple', 'castle', 'leaf',
]);

/** Минимальное число игр в каталоге (§1, критерий 2). */
export const MIN_GAMES = 16;

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_MAX = 40;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const GENRE_NAME_MAX = 40;

const GAME_FIELDS = [
  'id', 'title', 'originalTitle', 'year', 'designer', 'publisher', 'genres',
  'players', 'playTime', 'age', 'complexity', 'rating', 'price',
  'short', 'description', 'cover',
];
const CATALOG_FIELDS = ['genres', 'games'];
const GENRE_FIELDS = ['id', 'name'];

/** Строковые поля игры и допустимая длина [min, max]. */
const STRING_RULES = {
  title: [1, 80],
  originalTitle: [1, 80],
  designer: [1, 120],
  publisher: [1, 120],
  short: [20, 160],
  description: [100, 800],
};

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v) => Number.isInteger(v);
const intIn = (v, min, max) => isInt(v) && v >= min && v <= max;
/**
 * Строка-id формата §4.1: `^[a-z0-9]+(-[a-z0-9]+)*$`, не длиннее 40 символов.
 * @param {unknown} v
 * @returns {boolean}
 */
export const isValidId = (v) => typeof v === 'string' && v.length <= ID_MAX && ID_RE.test(v);

/** Ошибки из-за лишних полей объекта. */
function extraKeys(obj, allowed) {
  return Object.keys(obj).filter((key) => !allowed.includes(key));
}

/** Строка нужной длины (пустая из одних пробелов не считается). */
function checkString(value, [min, max]) {
  if (typeof value !== 'string') return 'должно быть строкой';
  if (value.trim().length === 0 && min > 0) return 'не может быть пустым';
  if (value.length < min || value.length > max) return `длина должна быть ${min}–${max} символов`;
  return null;
}

/** Диапазон {min, max} целых чисел в границах [low, high]. */
function checkRange(value, low, high) {
  if (!isPlainObject(value)) return 'должно быть объектом {min, max}';
  const extra = extraKeys(value, ['min', 'max']);
  if (extra.length > 0) return `лишнее поле ${extra.join(', ')}`;
  if (!intIn(value.min, low, high) || !intIn(value.max, low, high)) {
    return `min и max должны быть целыми ${low}–${high}`;
  }
  if (value.min > value.max) return 'min больше max';
  return null;
}

function checkGenres(value, genreIds) {
  if (!Array.isArray(value)) return 'должно быть массивом';
  if (value.length < 1 || value.length > 3) return 'должно быть 1–3 жанра';
  if (new Set(value).size !== value.length) return 'жанры повторяются';
  const unknown = value.filter((g) => typeof g !== 'string' || !genreIds.has(g));
  if (unknown.length > 0) return `неизвестный жанр ${unknown.map(String).join(', ')}`;
  return null;
}

function checkRating(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'должно быть числом';
  if (value < 0 || value > 10) return 'должно быть 0–10';
  if (Math.round(value * 10) / 10 !== value) return 'не больше одного знака после запятой';
  return null;
}

/** Ошибки обложки как пары [поле, проблема]. */
function checkCover(value) {
  if (!isPlainObject(value)) return [['cover', 'должно быть объектом {color, icon}']];
  const errors = [];
  const extra = extraKeys(value, ['color', 'icon']);
  if (extra.length > 0) errors.push(['cover', `лишнее поле ${extra.join(', ')}`]);
  if (typeof value.color !== 'string' || !COLOR_RE.test(value.color)) {
    errors.push(['cover.color', 'должно быть цветом вида #RRGGBB']);
  }
  if (!COVER_ICONS.includes(value.icon)) errors.push(['cover.icon', 'неизвестная иконка']);
  return errors;
}

/**
 * Проверяет одну игру по таблице §4.1.
 * @param {unknown} game — объект игры из games.json
 * @param {Set<string>} genreIds — id существующих жанров
 * @returns {string[]} ошибки вида "<id>: <поле> — <проблема>"; пустой массив — игра корректна
 */
export function validateGame(game, genreIds) {
  if (!isPlainObject(game)) return ['?: игра — должна быть объектом'];

  const label = isValidId(game.id) ? game.id : '?';
  const errors = [];
  const add = (field, problem) => {
    if (problem) errors.push(`${label}: ${field} — ${problem}`);
  };

  for (const key of extraKeys(game, GAME_FIELDS)) add(key, 'лишнее поле');
  for (const key of GAME_FIELDS) {
    if (!Object.hasOwn(game, key)) add(key, 'отсутствует');
  }

  if (Object.hasOwn(game, 'id') && !isValidId(game.id)) {
    add('id', `должен соответствовать ${ID_RE} и быть не длиннее ${ID_MAX} символов`);
  }
  for (const [field, rule] of Object.entries(STRING_RULES)) {
    if (Object.hasOwn(game, field)) add(field, checkString(game[field], rule));
  }

  const has = (key) => Object.hasOwn(game, key);
  const currentYear = new Date().getFullYear();
  if (has('year') && !intIn(game.year, 1950, currentYear)) add('year', `должен быть целым 1950–${currentYear}`);
  if (has('genres')) add('genres', checkGenres(game.genres, genreIds));
  if (has('players')) add('players', checkRange(game.players, 1, 12));
  if (has('playTime')) add('playTime', checkRange(game.playTime, 5, 300));
  if (has('age') && !intIn(game.age, 3, 18)) add('age', 'должен быть целым 3–18');
  if (has('complexity') && ![1, 2, 3].includes(game.complexity)) add('complexity', 'должно быть 1, 2 или 3');
  if (has('rating')) add('rating', checkRating(game.rating));
  if (has('price') && !intIn(game.price, 100, 30000)) add('price', 'должна быть целым 100–30000');
  if (has('cover')) {
    for (const [field, problem] of checkCover(game.cover)) add(field, problem);
  }

  return errors;
}

/** Проверяет список жанров; возвращает ошибки и множество корректных id. */
function validateGenres(genres) {
  const errors = [];
  const ids = new Set();
  genres.forEach((genre, index) => {
    if (!isPlainObject(genre)) {
      errors.push(`жанр #${index}: должен быть объектом {id, name}`);
      return;
    }
    const label = isValidId(genre.id) ? genre.id : `#${index}`;
    for (const key of extraKeys(genre, GENRE_FIELDS)) errors.push(`жанр ${label}: ${key} — лишнее поле`);
    if (!isValidId(genre.id)) errors.push(`жанр ${label}: id — некорректный`);
    else if (ids.has(genre.id)) errors.push(`жанр ${label}: id — дубликат`);
    else ids.add(genre.id);
    const nameProblem = checkString(genre.name, [1, GENRE_NAME_MAX]);
    if (nameProblem) errors.push(`жанр ${label}: name — ${nameProblem}`);
  });
  return { errors, ids };
}

/**
 * Проверяет весь каталог: форму {genres, games}, каждый жанр и игру, уникальность id.
 * Никогда не бросает исключений.
 * @param {unknown} data — разобранный JSON из games.json
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCatalog(data) {
  try {
    if (!isPlainObject(data)) return fail(['каталог — должен быть объектом {genres, games}']);
    const errors = extraKeys(data, CATALOG_FIELDS).map((key) => `каталог: ${key} — лишнее поле`);
    if (!Array.isArray(data.genres)) errors.push('каталог: genres — должен быть массивом');
    if (!Array.isArray(data.games)) errors.push('каталог: games — должен быть массивом');
    if (errors.length > 0) return fail(errors);

    const genres = validateGenres(data.genres);
    errors.push(...genres.errors);

    const seen = new Set();
    for (const game of data.games) {
      errors.push(...validateGame(game, genres.ids));
      if (isPlainObject(game) && isValidId(game.id)) {
        if (seen.has(game.id)) errors.push(`${game.id}: id — дубликат`);
        seen.add(game.id);
      }
    }
    return { ok: errors.length === 0, errors };
  } catch {
    return fail(['каталог — не удалось проверить']);
  }
}

function fail(errors) {
  return { ok: false, errors };
}
