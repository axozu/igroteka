// Списки id: избранное (§5, §5.3) и общие помощники для списков.
import { isValidId } from './validate.js';

/** Максимум игр в избранном. */
export const MAX_FAVORITES = 100;

/**
 * Добавляет id в конец или убирает его. Если список полон, возвращается тот же массив.
 * @param {string[]} ids
 * @param {string} id
 * @param {number} [max]
 * @returns {string[]} новый массив (или исходный, если добавить нельзя)
 */
export function toggleId(ids, id, max = MAX_FAVORITES) {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  if (ids.length >= max) return ids;
  return [...ids, id];
}

/**
 * Оставляет только id, которые есть в каталоге.
 * @param {string[]} ids
 * @param {Set<string>} knownIds
 * @returns {string[]}
 */
export function pruneUnknown(ids, knownIds) {
  return ids.filter((id) => knownIds.has(id));
}

/**
 * Guard для данных из хранилища: массив уникальных id формата §4.1 длиной ≤ max.
 * @param {unknown} v
 * @param {number} max
 * @returns {boolean}
 */
export function isIdList(v, max) {
  return Array.isArray(v) && v.length <= max && v.every(isValidId) && new Set(v).size === v.length;
}
