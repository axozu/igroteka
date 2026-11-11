// Центральное хранилище состояния (§2, §5): поверхностное слияние и подписка.
import { DEFAULT_FILTERS } from './logic/filter.js';
import { DEFAULT_SORT } from './logic/sort.js';

/**
 * Начальное состояние приложения (§5) со status 'loading'.
 * @param {object} [overrides] — поля верхнего уровня, заменяющие значения по умолчанию
 * @returns {object}
 */
export function createInitialState(overrides = {}) {
  return {
    status: 'loading',
    error: null,
    games: [],
    genres: [],
    query: '',
    filters: { ...DEFAULT_FILTERS, genres: [], time: [], complexity: [] },
    sort: DEFAULT_SORT,
    view: 'all',
    favorites: [],
    compare: [],
    openGameId: null,
    drawerOpen: false,
    filtersSheetOpen: false,
    menuOpen: false,
    theme: 'system',
    ...overrides,
  };
}

/**
 * Создаёт хранилище. Подписчики вызываются как fn(state, prev), только если
 * хотя бы одно поле патча отличается от текущего (сравнение через Object.is).
 * @param {object} initial
 * @returns {{ getState: () => object,
 *             setState: (patch: object | ((s: object) => object)) => void,
 *             subscribe: (fn: (state: object, prev: object) => void) => () => void }}
 */
export function createStore(initial) {
  let state = { ...initial };
  let listeners = [];
  // Переходы, о которых ещё не сообщили. setState из подписчика не уведомляет сразу,
  // а ставит переход в очередь — так каждый подписчик видит все переходы по порядку.
  let queue = [];
  let notifying = false;

  function getState() {
    return state;
  }

  function setState(patchOrFn) {
    const patch = typeof patchOrFn === 'function' ? patchOrFn(state) : patchOrFn;
    if (typeof patch !== 'object' || patch === null) return;
    const changed = Object.keys(patch).some((key) => !Object.is(state[key], patch[key]));
    if (!changed) return;
    const prev = state;
    state = { ...state, ...patch };
    queue.push([state, prev]);
    if (notifying) return;
    notifying = true;
    try {
      while (queue.length > 0) {
        const [next, before] = queue.shift();
        for (const listener of listeners) listener(next, before);
      }
    } finally {
      notifying = false;
      queue = [];
    }
  }

  function subscribe(fn) {
    listeners = [...listeners, fn];
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }

  return { getState, setState, subscribe };
}
