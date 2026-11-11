// Кнопка темы (§6.1): system → light → dark, сохраняется в igroteka:theme.
import { THEME_LABELS, isTheme, nextTheme } from '../logic/theme.js';
import { readJSON, writeJSON, STORAGE_KEYS } from '../logic/persist.js';

const ICONS = { system: '◐', light: '☀', dark: '☾' };

/** Применяет тему к <html>: для system атрибут снимается и работает prefers-color-scheme. */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/**
 * @param {HTMLButtonElement} button — #theme-toggle
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {Storage | null} storage
 */
export function mountThemeToggle(button, store, storage) {
  const icon = button.querySelector('.theme-icon');
  store.setState({ theme: readJSON(storage, STORAGE_KEYS.theme, 'system', isTheme) });

  let animationTimer = null;
  button.addEventListener('click', () => {
    // Плавный переход цветов только на время переключения (CSS — при no-preference).
    const root = document.documentElement;
    root.classList.add('theme-animating');
    clearTimeout(animationTimer);
    animationTimer = setTimeout(() => root.classList.remove('theme-animating'), 600);
    const theme = nextTheme(store.getState().theme);
    store.setState({ theme });
    writeJSON(storage, STORAGE_KEYS.theme, theme);
  });

  function render(state) {
    applyTheme(state.theme);
    button.setAttribute('aria-label', THEME_LABELS[state.theme]);
    button.title = THEME_LABELS[state.theme];
    if (icon) icon.textContent = ICONS[state.theme];
  }

  store.subscribe((state, prev) => {
    if (state.theme !== prev.theme) render(state);
  });
  render(store.getState());
}
