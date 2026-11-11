// Связь хранилища с адресной строкой (§5.2). Браузерные объекты передаются аргументами.
import { stateToQuery, queryToState } from './logic/url-state.js';
import { DEFAULT_FILTERS } from './logic/filter.js';
import { DEFAULT_SORT } from './logic/sort.js';

/**
 * Запускает синхронизацию: начальное состояние из адреса, затем адрес из состояния.
 * Изменение только поиска → replaceState, остальное → pushState; путь страницы не меняется;
 * «Назад»/«Вперёд» восстанавливают состояние.
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {{ history: History, location: Location, window: Window }} browser
 * @returns {() => void} остановка синхронизации
 */
export function startUrlSync(store, { history, location, window }) {
  const currentQuery = () => location.search.replace(/^\?/, '');
  const urlFor = (query) => `${location.pathname}${query ? `?${query}` : ''}`;
  const withoutSearch = (state) => stateToQuery({ ...state, query: '' });

  /** URL-часть состояния из адреса; отсутствующие параметры — значения по умолчанию. */
  function readAddress() {
    const { genres, games } = store.getState();
    const known = {};
    if (genres.length > 0) known.genreIds = new Set(genres.map((g) => g.id));
    if (games.length > 0) known.gameIds = new Set(games.map((g) => g.id));
    const patch = queryToState(location.search, known);
    return {
      query: patch.query ?? '',
      filters: { ...DEFAULT_FILTERS, genres: [], time: [], complexity: [], ...patch.filters },
      sort: patch.sort ?? DEFAULT_SORT,
      view: patch.view ?? 'all',
      openGameId: patch.openGameId ?? null,
    };
  }

  /** Приводит адрес к каноническому виду без новой записи истории (мусор из адреса исчезает). */
  function normalizeAddress() {
    const query = stateToQuery(store.getState());
    if (query !== currentQuery()) history.replaceState(null, '', urlFor(query));
  }

  let restoring = false;
  store.setState(readAddress());
  normalizeAddress();
  let lastWithoutSearch = withoutSearch(store.getState());

  const unsubscribe = store.subscribe((state) => {
    if (restoring) return;
    const query = stateToQuery(state);
    if (query === currentQuery()) return;
    const next = withoutSearch(state);
    const method = next === lastWithoutSearch ? 'replaceState' : 'pushState';
    lastWithoutSearch = next;
    history[method](null, '', urlFor(query));
  });

  function onPopState() {
    restoring = true;
    try {
      store.setState(readAddress());
    } finally {
      restoring = false;
    }
    normalizeAddress();
    lastWithoutSearch = withoutSearch(store.getState());
  }

  window.addEventListener('popstate', onPopState);
  return () => {
    unsubscribe();
    window.removeEventListener?.('popstate', onPopState);
  };
}
