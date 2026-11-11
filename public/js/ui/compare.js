// Сравнение (§6.2): закреплённая снизу плашка и окно с таблицей, лучшие значения выделены.
import { h, clear } from './dom.js';
import { bindDialog } from './dialog.js';
import { getBestValues } from '../logic/compare.js';
import { COMPLEXITY_LABELS } from '../logic/active-filters.js';
import { formatAge, formatPlayers, formatPlayTime, formatPrice, formatRating } from '../logic/format.js';

const TITLE_ID = 'compare-title';

/** Строки таблицы: подпись, значение, ключ из getBestValues (если строка участвует в выделении). */
const ROWS = [
  ['Рейтинг', (g) => formatRating(g.rating), 'rating'],
  ['Цена', (g) => formatPrice(g.price), 'price'],
  ['Игроки', (g) => formatPlayers(g.players)],
  ['Время', (g) => formatPlayTime(g.playTime), 'time'],
  ['Возраст', (g) => formatAge(g.age)],
  ['Сложность', (g) => COMPLEXITY_LABELS[g.complexity], 'complexity'],
  ['Год', (g) => String(g.year)],
  ['Жанры', (g, genres) => g.genres.map((id) => genres.get(id) ?? id).join(', ')],
];

function renderTable(games, genres) {
  const best = getBestValues(games);
  return h(
    'table',
    { class: 'compare-table' },
    h('caption', { class: 'visually-hidden' }, 'Сравнение игр; лучшие значения отмечены'),
    h('thead', {}, h('tr', {}, h('td', { class: 'compare-table__corner' }), games.map((g) => h('th', { scope: 'col' }, g.title)))),
    h(
      'tbody',
      {},
      ROWS.map(([label, value, bestKey]) =>
        h(
          'tr',
          {},
          h('th', { scope: 'row' }, label),
          games.map((g) => {
            const isBest = Boolean(bestKey) && best[bestKey].includes(g.id);
            return h('td', { class: isBest ? 'is-best' : null }, value(g, genres), isBest && h('span', { class: 'visually-hidden' }, ' — лучшее'));
          }),
        ),
      ),
    ),
  );
}

/**
 * @param {HTMLElement} bar — #compare-bar
 * @param {HTMLDialogElement} dialog — #compare-dialog
 * @param {{ getState: Function, subscribe: Function }} store
 * @param {{ clear: () => void }} compare — сервис сравнения
 */
export function mountCompare(bar, dialog, store, compare) {
  const openButton = h('button', { class: 'button button--primary', type: 'button', 'aria-describedby': 'compare-hint' });
  const names = h('p', { class: 'compare-bar__names' });
  const hint = h('p', { class: 'compare-bar__hint', id: 'compare-hint' });
  bar.append(
    h('div', { class: 'container compare-bar__inner' },
      h('div', { class: 'compare-bar__text' }, names, hint),
      h('div', { class: 'compare-bar__actions' },
        openButton,
        h('button', { class: 'button', type: 'button', on: { click: () => compare.clear() } }, 'Очистить'))),
  );

  const closeButton = h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Закрыть сравнение' }, '×');
  const tableWrap = h('div', { class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Таблица сравнения, прокручивается по горизонтали' });
  dialog.setAttribute('aria-labelledby', TITLE_ID);
  dialog.append(h('div', { class: 'modal__panel' },
    h('div', { class: 'modal__header' }, h('h2', { class: 'modal__title', id: TITLE_ID }, 'Сравнение игр'), closeButton),
    h('div', { class: 'modal__content modal__content--table' }, tableWrap)));

  let isOpen = false;
  const modal = bindDialog(dialog, () => setOpen(false));
  closeButton.addEventListener('click', () => setOpen(false));
  openButton.addEventListener('click', () => setOpen(true));

  const selected = (state) => {
    const byId = new Map(state.games.map((g) => [g.id, g]));
    return state.compare.map((id) => byId.get(id)).filter(Boolean);
  };

  function renderDialog(state) {
    clear(tableWrap);
    tableWrap.append(renderTable(selected(state), new Map(state.genres.map((g) => [g.id, g.name]))));
  }

  function setOpen(open) {
    if (open === isOpen) return;
    isOpen = open;
    if (open) {
      renderDialog(store.getState());
      modal.open(closeButton);
    } else {
      modal.close(openButton.isConnected && !bar.hidden ? openButton : document.getElementById('search-input'));
    }
  }

  function render(state) {
    const games = selected(state);
    const n = games.length;
    bar.hidden = n === 0;
    document.documentElement.classList.toggle('has-compare-bar', n > 0);
    openButton.textContent = `Сравнить (${n})`;
    openButton.disabled = n < 2;
    names.textContent = games.map((g) => g.title).join(' · ');
    hint.textContent = n < 2 ? 'Выберите ещё хотя бы одну игру' : `Можно выбрать до 3 игр`;
    if (isOpen && n < 2) setOpen(false);
    else if (isOpen) renderDialog(state);
  }

  store.subscribe(render);
  render(store.getState());
}
