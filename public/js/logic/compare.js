// Сравнение игр (§5.1): до 3 игр и выделение лучших значений.

/** Максимум игр в сравнении. */
export const MAX_COMPARE = 3;

/**
 * Добавляет id в сравнение или убирает его.
 * @param {string[]} ids
 * @param {string} id
 * @param {number} [max]
 * @returns {{ ids: string[], rejected: boolean }} rejected — список полон; тогда ids — исходный массив
 */
export function toggleCompare(ids, id, max = MAX_COMPARE) {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), rejected: false };
  if (ids.length >= max) return { ids, rejected: true };
  return { ids: [...ids, id], rejected: false };
}

/** id игр, у которых значение равно лучшему. */
function bestIds(games, value, pickBest) {
  if (games.length === 0) return [];
  const best = pickBest(...games.map(value));
  return games.filter((g) => value(g) === best).map((g) => g.id);
}

/**
 * Лучшие значения среди сравниваемых игр: рейтинг (max), цена (min), сложность (min),
 * время (min по playTime.max). При равенстве лучшими считаются все.
 * @param {object[]} games
 * @returns {{ rating: string[], price: string[], complexity: string[], time: string[] }}
 */
export function getBestValues(games) {
  return {
    rating: bestIds(games, (g) => g.rating, Math.max),
    price: bestIds(games, (g) => g.price, Math.min),
    complexity: bestIds(games, (g) => g.complexity, Math.min),
    time: bestIds(games, (g) => g.playTime.max, Math.min),
  };
}
