// Панель фильтров (§6.2): боковая колонка от 1024 px, на меньших экранах — полноэкранный лист.
import { h, clear, trapFocus } from './dom.js';
import { DEFAULT_FILTERS, PLAYER_OPTIONS, AGE_OPTIONS, PRICE_LIMIT, TIME_BUCKETS } from '../logic/filter.js';
import { TIME_LABELS, COMPLEXITY_LABELS, playersLabel, ageLabel } from '../logic/active-filters.js';
import { selectVisibleGames } from '../logic/catalog.js';
import { pluralize } from '../logic/format.js';

const DESKTOP_QUERY = '(min-width: 1024px)';

function option(type, name, value, ...label) {
  return h('label', { class: 'option' }, h('input', { class: 'option__input', type, name, value: String(value) }), h('span', {}, ...label));
}

function group(title, ...children) {
  return h('fieldset', { class: 'filter-group' }, h('legend', { class: 'filter-group__title' }, title), h('div', { class: 'filter-group__options' }, ...children));
}

function priceInput(name, label) {
  return h(
    'label',
    { class: 'price-field' },
    h('span', { class: 'price-field__label' }, label),
    h('input', { class: 'input', type: 'number', name, min: 0, max: PRICE_LIMIT, step: 10, inputmode: 'numeric', placeholder: '—' }),
  );
}

/** Целое 0…PRICE_LIMIT из поля или null. */
function parsePrice(input) {
  if (input.value.trim() === '' || Number.isNaN(input.valueAsNumber)) return null;
  return Math.min(PRICE_LIMIT, Math.max(0, Math.round(input.valueAsNumber)));
}

export const freshFilters = () => ({ ...DEFAULT_FILTERS, genres: [], time: [], complexity: [] });

/**
 * Создаёт фильтры внутри root один раз и синхронизирует их с состоянием.
 * @param {HTMLElement} root — aside#filters
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 */
export function mountFilters(root, store) {
  const close = () => store.setState({ filtersSheetOpen: false });
  const titleId = 'filters-title';
  const closeButton = h('button', { class: 'icon-button filters__close', type: 'button', 'aria-label': 'Закрыть фильтры', on: { click: close } }, '×');
  const genreOptions = h('div', { class: 'filter-group__options filter-group__options--genres' });
  const showButton = h('button', { class: 'button button--primary filters__show', type: 'button', on: { click: close } });

  root.append(
    h('div', { class: 'filters__header' }, h('h2', { class: 'filters__title', id: titleId }, 'Фильтры'), closeButton),
    h(
      'div',
      { class: 'filters__body' },
      h('fieldset', { class: 'filter-group' }, h('legend', { class: 'filter-group__title' }, 'Жанр'), genreOptions),
      group('Игроки', option('radio', 'players', '', 'Любое'), PLAYER_OPTIONS.map((n) => option('radio', 'players', n, n === PLAYER_OPTIONS.at(-1) ? `${n}+` : String(n)))),
      h(
        'fieldset',
        { class: 'filter-group' },
        h('legend', { class: 'filter-group__title' }, 'Цена, ₽'),
        h('div', { class: 'price-range' }, priceInput('priceMin', 'от'), priceInput('priceMax', 'до')),
      ),
      group('Возраст игрока', option('radio', 'age', '', 'Любой'), AGE_OPTIONS.map((n) => option('radio', 'age', n, ageLabel(n)))),
      group('Время партии', Object.keys(TIME_BUCKETS).map((key) => option('checkbox', 'time', key, TIME_LABELS[key]))),
      group('Сложность', [1, 2, 3].map((n) => option('checkbox', 'complexity', n, COMPLEXITY_LABELS[n]))),
    ),
    h(
      'div',
      { class: 'filters__footer' },
      h('button', { class: 'button', type: 'button', on: { click: () => store.setState({ filters: freshFilters() }) } }, 'Сбросить'),
      showButton,
    ),
  );

  const inputs = (name) => [...root.querySelectorAll(`input[name="${name}"]`)];
  const checked = (name) => inputs(name).filter((i) => i.checked).map((i) => i.value);

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const value = input.value === '' ? null : Number(input.value);
    const patches = {
      genre: () => ({ genres: checked('genre') }),
      players: () => ({ players: value }),
      age: () => ({ age: value }),
      time: () => ({ time: checked('time') }),
      complexity: () => ({ complexity: checked('complexity').map(Number) }),
      priceMin: () => ({ priceMin: parsePrice(input) }),
      priceMax: () => ({ priceMax: parsePrice(input) }),
    };
    if (!Object.hasOwn(patches, input.name)) return;
    store.setState((s) => ({ filters: { ...s.filters, ...patches[input.name]() } }));
  });

  function renderGenres(state) {
    clear(genreOptions);
    genreOptions.append(
      ...state.genres.map((genre) => {
        const count = state.games.filter((g) => g.genres.includes(genre.id)).length;
        return option('checkbox', 'genre', genre.id, genre.name, h('span', { class: 'option__count' }, ` (${count})`));
      }),
    );
  }

  function syncInputs(filters) {
    const f = { ...DEFAULT_FILTERS, ...filters };
    for (const input of root.querySelectorAll('input')) {
      if (input.name === 'genre') input.checked = f.genres.includes(input.value);
      else if (input.name === 'players') input.checked = input.value === (f.players === null ? '' : String(f.players));
      else if (input.name === 'age') input.checked = input.value === (f.age === null ? '' : String(f.age));
      else if (input.name === 'time') input.checked = f.time.includes(input.value);
      else if (input.name === 'complexity') input.checked = f.complexity.includes(Number(input.value));
      else if (input.name === 'priceMin' || input.name === 'priceMax') {
        const v = f[input.name] === null ? '' : String(f[input.name]);
        if (input.value !== v) input.value = v;
      }
    }
  }

  // ----- Лист фильтров на узких экранах -----
  const desktop = window.matchMedia(DESKTOP_QUERY);
  let releaseFocus = null;
  let returnFocusTo = null;

  function applySheet(open) {
    const isSheet = open && !desktop.matches;
    if (isSheet === root.classList.contains('is-open')) return;
    root.classList.toggle('is-open', isSheet);
    document.documentElement.classList.toggle('is-locked', isSheet);
    if (isSheet) {
      returnFocusTo = document.activeElement;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-labelledby', titleId);
      releaseFocus = trapFocus(root);
      closeButton.focus();
    } else {
      root.removeAttribute('role');
      root.removeAttribute('aria-modal');
      root.removeAttribute('aria-labelledby');
      releaseFocus?.();
      releaseFocus = null;
      returnFocusTo?.focus?.();
      returnFocusTo = null;
    }
  }

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      event.preventDefault();
      close();
    }
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) close();
  });

  function render(state, prev) {
    if (!prev || state.genres !== prev.genres || state.games !== prev.games) renderGenres(state);
    if (!prev || state.filters !== prev.filters || state.genres !== prev.genres) syncInputs(state.filters);
    if (!prev || state.filtersSheetOpen !== prev.filtersSheetOpen) applySheet(state.filtersSheetOpen);
    const n = selectVisibleGames(state).length;
    showButton.textContent = `Показать ${n} ${pluralize(n, ['игру', 'игры', 'игр'])}`;
  }

  store.subscribe(render);
  render(store.getState(), null);
}
