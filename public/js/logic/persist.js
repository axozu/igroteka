// Безопасная работа с хранилищем (§5.3, §8.4). Хранилище передаётся аргументом,
// поэтому модуль не зависит от браузера. Функции никогда не бросают исключений.

/** Ключи localStorage. */
export const STORAGE_KEYS = Object.freeze({
  favorites: 'igroteka:favorites',
  compare: 'igroteka:compare',
  theme: 'igroteka:theme',
});

/** Строки длиннее этого считаются повреждёнными (100 id по 40 символов — около 4 КБ). */
const MAX_RAW_LENGTH = 100_000;

/**
 * Читает и разбирает JSON. При любой проблеме (нет storage, исключение, битый JSON,
 * слишком длинная строка, значение не прошло guard) возвращает fallback.
 * @param {{ getItem: (k: string) => string | null } | null | undefined} storage
 * @param {string} key
 * @param {*} fallback
 * @param {(v: unknown) => boolean} guard
 * @returns {*}
 */
export function readJSON(storage, key, fallback, guard) {
  try {
    const raw = storage.getItem(key);
    if (typeof raw !== 'string' || raw.length > MAX_RAW_LENGTH) return fallback;
    const value = JSON.parse(raw);
    return guard(value) === true ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Сохраняет значение как JSON.
 * @param {{ setItem: (k: string, v: string) => void } | null | undefined} storage
 * @param {string} key
 * @param {*} value
 * @returns {boolean} true — записано, false — не удалось
 */
export function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
