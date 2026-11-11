// Тема оформления (§6.1): system → light → dark.

/** Варианты темы в порядке переключения. */
export const THEMES = Object.freeze(['system', 'light', 'dark']);

/** Подписи кнопки темы для экранного диктора. */
export const THEME_LABELS = Object.freeze({
  system: 'Тема: как в системе',
  light: 'Тема: светлая',
  dark: 'Тема: тёмная',
});

/**
 * Известное ли значение темы.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isTheme(value) {
  return typeof value === 'string' && THEMES.includes(value);
}

/**
 * Следующая тема по кругу; неизвестное значение считается как system.
 * @param {string} theme
 * @returns {'system' | 'light' | 'dark'}
 */
export function nextTheme(theme) {
  const index = isTheme(theme) ? THEMES.indexOf(theme) : 0;
  return THEMES[(index + 1) % THEMES.length];
}
