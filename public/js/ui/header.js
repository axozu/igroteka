// Шапка (§6.2). Пока: кнопка ♥ со счётчиком, открывающая панель избранного.
import { pluralize } from '../logic/format.js';

/**
 * Подключает кнопку избранного в шапке.
 * @param {HTMLButtonElement} button — #favorites-button
 * @param {HTMLElement} badge — счётчик внутри кнопки
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 */
export function mountHeaderFavorites(button, badge, store) {
  button.addEventListener('click', () => store.setState({ drawerOpen: true }));

  function render(state) {
    const n = state.favorites.length;
    badge.textContent = String(n);
    badge.hidden = n === 0;
    button.setAttribute('aria-label', `Избранное: ${n} ${pluralize(n, ['игра', 'игры', 'игр'])}`);
    button.setAttribute('aria-expanded', String(state.drawerOpen));
  }

  store.subscribe(render);
  render(store.getState());
}
