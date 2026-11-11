// Сортировка каталога (§5.1). При равенстве — по названию.

/** Варианты сортировки для интерфейса. */
export const SORT_OPTIONS = Object.freeze([
  Object.freeze({ id: 'rating-desc', label: 'По рейтингу' }),
  Object.freeze({ id: 'price-asc', label: 'Сначала дешевле' }),
  Object.freeze({ id: 'price-desc', label: 'Сначала дороже' }),
  Object.freeze({ id: 'title-asc', label: 'По названию' }),
  Object.freeze({ id: 'year-desc', label: 'Сначала новые' }),
]);

/** Сортировка по умолчанию. */
export const DEFAULT_SORT = 'rating-desc';

const collator = new Intl.Collator('ru');
const byTitle = (a, b) => collator.compare(a.title, b.title);

const COMPARATORS = {
  'rating-desc': (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'title-asc': () => 0,
  'year-desc': (a, b) => b.year - a.year,
};

/**
 * Сортирует игры по ключу; неизвестный ключ — как DEFAULT_SORT.
 * @param {object[]} games
 * @param {string} sortKey — id из SORT_OPTIONS
 * @returns {object[]} новый массив, исходный не изменяется
 */
export function sortGames(games, sortKey) {
  const key = typeof sortKey === 'string' && Object.hasOwn(COMPARATORS, sortKey) ? sortKey : DEFAULT_SORT;
  const primary = COMPARATORS[key];
  return [...games].sort((a, b) => primary(a, b) || byTitle(a, b));
}
