// Панель инструментов каталога (§6.2): вкладки, «Найдено: N», сортировка, чипы, сброс.
import { h, clear } from './dom.js';
import { SORT_OPTIONS } from '../logic/sort.js';
import { countActiveFilters } from '../logic/filter.js';
import { selectVisibleGames } from '../logic/catalog.js';
import { describeActiveFilters, removeActiveFilter } from '../logic/active-filters.js';
import { freshFilters } from './filters.js';

/**
 * Создаёт панель инструментов внутри root и синхронизирует её с состоянием.
 * @param {HTMLElement} root
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 */
export function mountToolbar(root, store) {
  const allCount = h('span', { class: 'segmented__count' });
  const favCount = h('span', { class: 'segmented__count' });
  const allTab = h('button', { class: 'segmented__button', type: 'button', dataset: { view: 'all' } }, 'Все игры ', allCount);
  const favTab = h('button', { class: 'segmented__button', type: 'button', dataset: { view: 'favorites' } }, 'Избранное ', favCount);
  const found = h('p', { class: 'toolbar__found', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const filtersButton = h('button', {
    class: 'button toolbar__filters', type: 'button', 'aria-controls': 'filters', 'aria-expanded': 'false',
    on: { click: () => store.setState({ filtersSheetOpen: true }) },
  });
  const sortSelect = h(
    'select',
    { class: 'select', id: 'sort-select', on: { change: (e) => store.setState({ sort: e.target.value }) } },
    SORT_OPTIONS.map((o) => h('option', { value: o.id }, o.label)),
  );
  const chips = h('ul', { class: 'chips', 'aria-label': 'Активные фильтры' });
  const resetAll = h('button', {
    class: 'button button--link', type: 'button',
    on: { click: () => store.setState({ query: '', filters: freshFilters() }) },
  }, 'Сбросить всё');

  root.append(
    h(
      'div',
      { class: 'toolbar__row' },
      h('div', { class: 'segmented', role: 'group', 'aria-label': 'Раздел каталога' }, allTab, favTab),
      found,
    ),
    h(
      'div',
      { class: 'toolbar__row' },
      filtersButton,
      h('div', { class: 'toolbar__sort' }, h('label', { for: 'sort-select', class: 'toolbar__sort-label' }, 'Сортировка'), sortSelect),
    ),
    h('div', { class: 'toolbar__row toolbar__row--chips' }, chips, resetAll),
  );

  root.querySelector('.segmented').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button) store.setState({ view: button.dataset.view });
  });

  chips.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) return;
    const index = Number(button.dataset.index);
    const { filters, genres } = store.getState();
    const chip = describeActiveFilters(filters, new Map(genres.map((g) => [g.id, g.name])))[index];
    if (!chip) return;
    store.setState({ filters: removeActiveFilter(filters, chip.group, chip.value) });
    // Фокус — на соседний чип, а если чипов не осталось — на сортировку.
    const next = chips.querySelectorAll('button')[Math.min(index, chips.children.length - 1)];
    (next ?? sortSelect).focus();
  });

  function renderChips(state) {
    clear(chips);
    const names = new Map(state.genres.map((g) => [g.id, g.name]));
    describeActiveFilters(state.filters, names).forEach((chip, index) => {
      chips.append(
        h('li', {}, h('button', { class: 'chip', type: 'button', dataset: { index }, 'aria-label': `Убрать фильтр: ${chip.label}` },
          chip.label, h('span', { class: 'chip__x', 'aria-hidden': 'true' }, '×'))),
      );
    });
  }

  function render(state, prev) {
    const ids = new Set(state.games.map((g) => g.id));
    allCount.textContent = `(${state.games.length})`;
    favCount.textContent = `(${state.favorites.filter((id) => ids.has(id)).length})`;
    allTab.setAttribute('aria-pressed', String(state.view === 'all'));
    favTab.setAttribute('aria-pressed', String(state.view === 'favorites'));

    const text = state.status === 'ready' ? `Найдено: ${selectVisibleGames(state).length}` : '';
    if (found.textContent !== text) found.textContent = text;

    const active = countActiveFilters(state.filters);
    filtersButton.textContent = active > 0 ? `Фильтры (${active})` : 'Фильтры';
    filtersButton.setAttribute('aria-expanded', String(state.filtersSheetOpen));
    if (sortSelect.value !== state.sort) sortSelect.value = state.sort;

    if (!prev || state.filters !== prev.filters || state.genres !== prev.genres) renderChips(state);
    chips.hidden = active === 0;
    resetAll.hidden = active === 0 && state.query.trim() === '';
  }

  store.subscribe(render);
  render(store.getState(), null);
}
