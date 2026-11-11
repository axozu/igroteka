// Панель избранного (§6.2): выезжает справа, на телефоне — на всю ширину.
// Построена на <dialog> + showModal(): фон неактивен, Esc закрывает штатно.
import { h, clear, trapFocus } from './dom.js';
import { renderCover } from './cover.js';
import { formatPrice, pluralize } from '../logic/format.js';

const EMPTY_TEXT = 'Вы пока ничего не добавили в избранное';

/**
 * @param {HTMLDialogElement} dialog — #favorites-drawer
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {{ remove: (id: string) => void }} favorites
 * @param {{ returnFocusTo: HTMLElement }} options — куда вернуть фокус после закрытия (♥ в шапке)
 */
export function mountFavoritesDrawer(dialog, store, favorites, { returnFocusTo }) {
  const close = () => store.setState({ drawerOpen: false });
  const closeButton = h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Закрыть избранное', on: { click: close } }, '×');
  const list = h('ul', { class: 'drawer__list' });
  const total = h('p', { class: 'drawer__total' });
  const footer = h(
    'div',
    { class: 'drawer__footer' },
    total,
    h('button', {
      class: 'button button--primary', type: 'button',
      on: {
        click: () => {
          store.setState({ view: 'favorites', drawerOpen: false });
          // Фокус — на вкладку «Избранное», чтобы клавиатура осталась рядом с результатом.
          document.querySelector('.segmented__button[data-view="favorites"]')?.focus({ preventScroll: true });
          document.getElementById('catalog')?.scrollIntoView();
        },
      },
    }, 'Показать в каталоге'),
  );
  const empty = h(
    'div',
    { class: 'drawer__empty' },
    h('p', {}, EMPTY_TEXT),
    h('button', { class: 'button button--primary', type: 'button', on: { click: () => store.setState({ view: 'all', drawerOpen: false }) } }, 'Перейти в каталог'),
  );
  const panel = h(
    'div',
    { class: 'drawer__panel' },
    h('div', { class: 'drawer__header' }, h('h2', { class: 'drawer__title', id: 'favorites-title' }, 'Избранное'), closeButton),
    h('div', { class: 'drawer__body' }, list, empty),
    footer,
  );
  dialog.setAttribute('aria-labelledby', 'favorites-title');
  dialog.append(panel);

  // Клик по фону (вне панели) закрывает; Esc → событие cancel → закрываем через состояние.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;
    const index = [...list.children].indexOf(button.closest('li'));
    favorites.remove(button.dataset.remove);
    const next = list.children[Math.min(index, list.children.length - 1)]?.querySelector('button[data-remove]');
    (next ?? closeButton).focus();
  });

  function renderList(state) {
    const byId = new Map(state.games.map((g) => [g.id, g]));
    const games = state.favorites.map((id) => byId.get(id)).filter(Boolean);
    clear(list);
    list.append(
      ...games.map((game) =>
        h(
          'li',
          { class: 'drawer__item' },
          h('div', { class: 'drawer__cover' }, renderCover(game, { size: 'mini' })),
          h('div', { class: 'drawer__info' }, h('p', { class: 'drawer__name' }, game.title), h('p', { class: 'drawer__price' }, formatPrice(game.price))),
          h('button', {
            class: 'icon-button', type: 'button', dataset: { remove: game.id }, 'aria-label': `Убрать «${game.title}» из избранного`,
          }, '×'),
        ),
      ),
    );
    const sum = games.reduce((acc, g) => acc + g.price, 0);
    total.textContent = `${games.length} ${pluralize(games.length, ['игра', 'игры', 'игр'])} · ${formatPrice(sum)}`;
    list.hidden = games.length === 0;
    footer.hidden = games.length === 0;
    empty.hidden = games.length > 0;
  }

  let releaseFocus = null;
  function applyOpen(open) {
    if (open === dialog.open) return;
    if (open) {
      dialog.showModal();
      document.documentElement.classList.add('is-locked');
      releaseFocus = trapFocus(dialog);
      closeButton.focus();
    } else {
      dialog.close();
      document.documentElement.classList.remove('is-locked');
      releaseFocus?.();
      releaseFocus = null;
      returnFocusTo.focus();
    }
  }

  function render(state, prev) {
    if (!prev || state.favorites !== prev.favorites || state.games !== prev.games) renderList(state);
    if (!prev || state.drawerOpen !== prev.drawerOpen) applyOpen(state.drawerOpen);
  }

  store.subscribe(render);
  render(store.getState(), null);
}
