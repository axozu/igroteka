// Избранное (§5.3): хранение в localStorage, синхронизация между вкладками (событие storage).
import { readJSON, writeJSON, STORAGE_KEYS } from './logic/persist.js';
import { toggleId, pruneUnknown, isIdList, MAX_FAVORITES } from './logic/favorites.js';

const KEY = STORAGE_KEYS.favorites;
const isFavoritesList = (v) => isIdList(v, MAX_FAVORITES);

/**
 * Сервис избранного. Хранилище и окно передаются аргументами; при недоступном
 * хранилище избранное работает в памяти.
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {Storage | null} storage
 * @param {{ addEventListener: Function }} [win]
 * @returns {{ toggle: (id: string) => { rejected: boolean, added: boolean },
 *             remove: (id: string) => void, list: () => string[] }}
 */
export function createFavoritesService(store, storage, win = window) {
  /** Отбрасывает неизвестные id, если каталог уже загружен. */
  function known(ids) {
    const { status, games } = store.getState();
    return status === 'ready' ? pruneUnknown(ids, new Set(games.map((g) => g.id))) : ids;
  }

  /** Самое свежее значение: из хранилища (его могла изменить другая вкладка) или из состояния. */
  function latest() {
    return known(readJSON(storage, KEY, store.getState().favorites, isFavoritesList));
  }

  function commit(ids) {
    store.setState({ favorites: ids });
    writeJSON(storage, KEY, ids);
  }

  store.setState({ favorites: readJSON(storage, KEY, [], isFavoritesList) });

  store.subscribe((state, prev) => {
    if (state.status !== 'ready' || (prev.status === 'ready' && state.games === prev.games)) return;
    const pruned = known(state.favorites);
    if (pruned.length !== state.favorites.length) commit(pruned);
  });

  win.addEventListener('storage', (event) => {
    if (event.storageArea && event.storageArea !== storage) return;
    if (event.key === null) {
      store.setState({ favorites: [] });
      return;
    }
    if (event.key !== KEY) return;
    let value;
    try {
      value = event.newValue === null ? [] : JSON.parse(event.newValue);
    } catch {
      return;
    }
    if (isFavoritesList(value)) store.setState({ favorites: known(value) });
  });

  return {
    toggle(id) {
      const base = latest();
      const next = toggleId(base, id);
      if (next === base) {
        store.setState({ favorites: base });
        return { rejected: true, added: false };
      }
      commit(next);
      return { rejected: false, added: next.includes(id) };
    },
    remove(id) {
      const base = latest();
      if (base.includes(id)) commit(base.filter((x) => x !== id));
    },
    list() {
      return store.getState().favorites;
    },
  };
}
