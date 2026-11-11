// Нормализация текста для поиска (§5.1).

/**
 * Приводит строку к виду для сравнения: нижний регистр, «ё» → «е»,
 * обрезка краёв и схлопывание пробелов. Не строка → пустая строка.
 * @param {unknown} s
 * @returns {string}
 */
export function normalizeText(s) {
  if (typeof s !== 'string') return '';
  return s.toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();
}
