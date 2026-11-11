// Поиск по названию (§5.1).
import { normalizeText } from './normalize.js';

/** Максимальная длина поискового запроса. */
export const MAX_QUERY_LENGTH = 100;

/**
 * Ищет подстроку в `title` или `originalTitle` без учёта регистра и разницы «е/ё».
 * Запрос обрезается до MAX_QUERY_LENGTH символов; пустой запрос ничего не отсекает.
 * @param {object[]} games
 * @param {string} query
 * @returns {object[]} новый массив, исходный не изменяется
 */
export function searchGames(games, query) {
  const needle = normalizeText(typeof query === 'string' ? query.slice(0, MAX_QUERY_LENGTH) : '');
  if (needle === '') return [...games];
  return games.filter(
    (game) => normalizeText(game.title).includes(needle) || normalizeText(game.originalTitle).includes(needle),
  );
}
