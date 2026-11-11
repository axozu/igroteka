// Сравнение (§5.1, §5.3): до 3 игр, хранится в localStorage под igroteka:compare.
import { readJSON, writeJSON, STORAGE_KEYS } from './logic/persist.js';
import { toggleCompare, MAX_COMPARE } from './logic/compare.js';
import { pruneUnknown, isIdList } from './logic/favorites.js';

const KEY = STORAGE_KEYS.compare;

/**
 * Сервис сравнения. При недоступном хранилище работает в памяти.
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {Storage | null} storage
 * @returns {{ toggle: (id: string) => { rejected: boolean }, clear: () => void }}
 */
export function createCompareService(store, storage) {
  function commit(ids) {
    store.setState({ compare: ids });
    writeJSON(storage, KEY, ids);
  }

  store.setState({ compare: readJSON(storage, KEY, [], (v) => isIdList(v, MAX_COMPARE)) });

  store.subscribe((state, prev) => {
    if (state.status !== 'ready' || (prev.status === 'ready' && state.games === prev.games)) return;
    const pruned = pruneUnknown(state.compare, new Set(state.games.map((g) => g.id)));
    if (pruned.length !== state.compare.length) commit(pruned);
  });

  return {
    toggle(id) {
      const { ids, rejected } = toggleCompare(store.getState().compare, id);
      if (!rejected) commit(ids);
      return { rejected };
    },
    clear() {
      commit([]);
    },
  };
}
