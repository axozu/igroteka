// Форматирование значений для интерфейса (русский язык).

const NBSP = ' ';
const priceFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/**
 * Русская форма слова для числа.
 * @param {number} n
 * @param {[string, string, string]} forms — для 1, 2–4 и 5+ («игрок», «игрока», «игроков»)
 * @returns {string}
 */
export function pluralize(n, [one, few, many]) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/**
 * Ориентировочная цена: «≈ 3 990 ₽» (пробелы неразрывные).
 * @param {number} price
 * @returns {string}
 */
export function formatPrice(price) {
  return `≈${NBSP}${priceFormat.format(price).replace(/\s/g, NBSP)}${NBSP}₽`;
}

/**
 * Рейтинг: «★ 8.1».
 * @param {number} rating
 * @returns {string}
 */
export function formatRating(rating) {
  return `★ ${rating.toFixed(1)}`;
}

const range = ({ min, max }) => (min === max ? `${min}` : `${min}–${max}`);

/**
 * Число игроков: «1 игрок», «2–5 игроков».
 * @param {{ min: number, max: number }} players
 * @returns {string}
 */
export function formatPlayers(players) {
  return `${range(players)} ${pluralize(players.max, ['игрок', 'игрока', 'игроков'])}`;
}

/**
 * Время партии: «30 мин», «30–45 мин».
 * @param {{ min: number, max: number }} playTime
 * @returns {string}
 */
export function formatPlayTime(playTime) {
  return `${range(playTime)} мин`;
}

/**
 * Возраст: «10+».
 * @param {number} age
 * @returns {string}
 */
export function formatAge(age) {
  return `${age}+`;
}
