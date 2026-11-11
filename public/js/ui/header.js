// Шапка (§6.2): навигация, бургер на узких экранах, перенос поиска, ♥ со счётчиком.
import { pluralize } from '../logic/format.js';

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Подключает шапку: бургер-меню (до 767 px) и перенос поля поиска между шапкой
 * и панелью каталога. Поле одно — оно перемещается, а не дублируется.
 * @param {HTMLElement} root — header.site-header
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 */
export function mountHeader(root, store) {
  const burger = root.querySelector('.burger');
  const nav = root.querySelector('#site-nav');
  const headerSlot = root.querySelector('#header-search-slot');
  const catalogSlot = document.getElementById('catalog-search-slot');
  const search = document.querySelector('.search');
  const desktop = window.matchMedia(DESKTOP_QUERY);

  function placeSearch() {
    const target = desktop.matches ? headerSlot : catalogSlot;
    if (search && target && search.parentElement !== target) target.append(search);
  }

  burger.addEventListener('click', () => store.setState((s) => ({ menuOpen: !s.menuOpen })));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) store.setState({ menuOpen: false });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && store.getState().menuOpen && !document.querySelector('dialog[open]')) {
      store.setState({ menuOpen: false });
      burger.focus();
    }
  });
  desktop.addEventListener('change', () => {
    placeSearch();
    if (desktop.matches) store.setState({ menuOpen: false });
  });

  function render(state) {
    burger.setAttribute('aria-expanded', String(state.menuOpen));
    burger.setAttribute('aria-label', state.menuOpen ? 'Закрыть меню' : 'Меню');
    nav.classList.toggle('is-open', state.menuOpen);
  }

  placeSearch();
  store.subscribe((state, prev) => {
    if (state.menuOpen !== prev.menuOpen) render(state);
  });
  render(store.getState());
}

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
