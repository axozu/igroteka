// Сетка каталога и её состояния (§6.3): загрузка, ошибка, пустой результат, готово.
import { h, clear } from './dom.js';
import { renderCard } from './card.js';
import { selectVisibleGames } from '../logic/catalog.js';
import { countActiveFilters, DEFAULT_FILTERS } from '../logic/filter.js';

const SKELETON_COUNT = 8;

function renderSkeletons() {
  return Array.from({ length: SKELETON_COUNT }, () =>
    h(
      'li',
      { class: 'card card--skeleton', 'aria-hidden': 'true' },
      h('div', { class: 'skeleton skeleton--cover' }),
      h(
        'div',
        { class: 'card__body' },
        h('div', { class: 'skeleton skeleton--title' }),
        h('div', { class: 'skeleton skeleton--line' }),
        h('div', { class: 'skeleton skeleton--line skeleton--short' }),
      ),
    ),
  );
}

function renderError(onRetry) {
  return h(
    'div',
    { class: 'catalog-message catalog-message--error', role: 'alert' },
    h('h2', { class: 'catalog-message__title' }, 'Не удалось загрузить каталог'),
    h('p', {}, 'Проверьте подключение к интернету и попробуйте ещё раз.'),
    h('button', { class: 'button button--primary', type: 'button', on: { click: () => onRetry() } }, 'Повторить'),
  );
}

function renderEmpty(state, store) {
  const query = state.query.trim();
  const hasFilters = countActiveFilters(state.filters) > 0;
  let text = 'Здесь пока нет игр';
  if (query !== '') text = `По запросу «${query}» ничего не найдено`;
  else if (hasFilters) text = 'Под выбранные фильтры игр нет';
  return h(
    'div',
    { class: 'catalog-message' },
    h('h2', { class: 'catalog-message__title' }, text),
    h(
      'div',
      { class: 'catalog-message__actions' },
      query !== '' && h('button', { class: 'button button--primary', type: 'button', on: { click: () => store.setState({ query: '' }) } }, 'Сбросить поиск'),
      hasFilters && h('button', {
        class: 'button', type: 'button',
        on: { click: () => store.setState({ filters: { ...DEFAULT_FILTERS, genres: [], time: [], complexity: [] } }) },
      }, 'Сбросить фильтры'),
    ),
  );
}

/**
 * Подключает каталог к хранилищу. Сетка перерисовывается только при смене статуса
 * или списка видимых id; клики по карточкам обрабатываются делегированием.
 * @param {HTMLElement} root — контейнер каталога
 * @param {{ getState: Function, subscribe: Function }} store
 * @param {{ onRetry: () => void, onAction?: (action: string, id: string) => void }} handlers
 */
export function mountCatalog(root, store, { onRetry, onAction = () => {} }) {
  const status = h('p', { class: 'visually-hidden', role: 'status' });
  const grid = h('ul', { class: 'card-grid', 'aria-label': 'Игры' });
  const message = h('div', { class: 'catalog-message-slot' });
  root.append(status, message, grid);

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !grid.contains(button)) return;
    const card = button.closest('.card[data-id]');
    if (card) onAction(button.dataset.action, card.dataset.id);
  });

  let lastKey = null;

  function render(state) {
    const visible = state.status === 'ready' ? selectVisibleGames(state) : [];
    const ids = visible.map((g) => g.id).join(',');
    // Для пустого результата текст зависит от запроса и наличия фильтров.
    const emptyKey = state.status === 'ready' && visible.length === 0 ? `|${state.query.trim()}|${countActiveFilters(state.filters) > 0}` : '';
    const key = `${state.status}|${ids}${emptyKey}`;
    if (key === lastKey) return;
    lastKey = key;

    clear(message);
    clear(grid);
    grid.hidden = state.status === 'error';
    grid.setAttribute('aria-busy', String(state.status === 'loading'));

    if (state.status === 'loading') {
      status.textContent = 'Загрузка каталога…';
      grid.append(...renderSkeletons());
      return;
    }
    if (state.status === 'error') {
      status.textContent = '';
      message.append(renderError(onRetry));
      return;
    }

    status.textContent = '';
    if (visible.length === 0) {
      message.append(renderEmpty(state, store));
      return;
    }
    const genresById = new Map(state.genres.map((g) => [g.id, g.name]));
    const favorites = new Set(state.favorites);
    const compare = new Set(state.compare);
    grid.append(
      ...visible.map((game) =>
        h('li', { class: 'card-grid__item' }, renderCard(game, {
          isFavorite: favorites.has(game.id),
          inCompare: compare.has(game.id),
          genresById,
        })),
      ),
    );
  }

  store.subscribe(render);
  render(store.getState());
}
