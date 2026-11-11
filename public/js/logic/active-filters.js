// Подписи активных фильтров (чипы) и снятие отдельного фильтра.
import { DEFAULT_FILTERS, PLAYER_OPTIONS } from './filter.js';
import { pluralize } from './format.js';

const NBSP = ' ';
const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const rub = (n) => `${numberFormat.format(n).replace(/\s/g, NBSP)}${NBSP}₽`;

/** Подписи вариантов времени партии. */
export const TIME_LABELS = Object.freeze({ short: 'до 30 мин', medium: '30–60 мин', long: 'больше часа' });

/** Подписи уровней сложности. */
export const COMPLEXITY_LABELS = Object.freeze({ 1: 'Лёгкая', 2: 'Средняя', 3: 'Сложная' });

/**
 * Подпись варианта числа игроков: «2 игрока», последний вариант — «6+ игроков».
 * @param {number} n
 * @returns {string}
 */
export function playersLabel(n) {
  if (n === PLAYER_OPTIONS.at(-1)) return `${n}+ игроков`;
  return `${n} ${pluralize(n, ['игрок', 'игрока', 'игроков'])}`;
}

/**
 * Подпись варианта возраста: «8 лет».
 * @param {number} n
 * @returns {string}
 */
export function ageLabel(n) {
  return `${n} ${pluralize(n, ['год', 'года', 'лет'])}`;
}

function priceLabel(min, max) {
  if (min !== null && max !== null) {
    const [low, high] = min > max ? [max, min] : [min, max];
    return `${numberFormat.format(low).replace(/\s/g, NBSP)}–${rub(high)}`;
  }
  return min !== null ? `от ${rub(min)}` : `до ${rub(max)}`;
}

/**
 * Активные фильтры в порядке групп: жанры, игроки, цена, возраст, время, сложность.
 * @param {object} filters
 * @param {Map<string, string>} genreNames — id жанра → название
 * @returns {{ group: string, value?: string|number, label: string }[]}
 */
export function describeActiveFilters(filters, genreNames) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const chips = [];
  for (const id of f.genres) chips.push({ group: 'genres', value: id, label: genreNames.get(id) ?? id });
  if (f.players !== null) chips.push({ group: 'players', value: f.players, label: playersLabel(f.players) });
  if (f.priceMin !== null || f.priceMax !== null) chips.push({ group: 'price', label: priceLabel(f.priceMin, f.priceMax) });
  if (f.age !== null) chips.push({ group: 'age', value: f.age, label: `Возраст: ${ageLabel(f.age)}` });
  for (const t of f.time) chips.push({ group: 'time', value: t, label: TIME_LABELS[t] ?? t });
  for (const c of f.complexity) chips.push({ group: 'complexity', value: c, label: COMPLEXITY_LABELS[c] ?? String(c) });
  return chips;
}

/**
 * Новый объект фильтров без одного значения (или без всей группы для players, price, age).
 * @param {object} filters
 * @param {string} group — genres | players | price | age | time | complexity
 * @param {string|number} [value]
 * @returns {object}
 */
export function removeActiveFilter(filters, group, value) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  switch (group) {
    case 'genres':
    case 'time':
    case 'complexity':
      return { ...f, [group]: f[group].filter((v) => v !== value) };
    case 'players':
    case 'age':
      return { ...f, [group]: null };
    case 'price':
      return { ...f, priceMin: null, priceMax: null };
    default:
      return { ...f };
  }
}
