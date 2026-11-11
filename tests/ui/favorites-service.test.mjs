import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFavoritesService } from '../../public/js/favorites-service.js';
import { createStore, createInitialState } from '../../public/js/store.js';
import { MAX_FAVORITES } from '../../public/js/logic/favorites.js';

const KEY = 'igroteka:favorites';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    data,
  };
}

function fakeWindow() {
  const listeners = {};
  return {
    addEventListener: (type, fn) => { listeners[type] = fn; },
    /** Событие storage из другой вкладки. */
    storageEvent(key, newValue, storageArea) { listeners.storage?.({ key, newValue, storageArea }); },
  };
}

function setup(initial = {}) {
  const storage = memoryStorage(initial);
  const win = fakeWindow();
  const store = createStore(createInitialState());
  const service = createFavoritesService(store, storage, win);
  return { storage, win, store, service };
}

const ready = (store, ids) => store.setState({ status: 'ready', games: ids.map((id) => ({ id })) });

test('загружает избранное из хранилища', () => {
  const { store, service } = setup({ [KEY]: '["azul","catan"]' });
  assert.deepEqual(store.getState().favorites, ['azul', 'catan']);
  assert.deepEqual(service.list(), ['azul', 'catan']);
});

test('мусор в хранилище → пустое избранное без ошибок', () => {
  for (const raw of ['"мусор"', '["<b>x</b>"]', '{', '[1,2]', JSON.stringify(Array.from({ length: 101 }, (_, i) => `g-${i}`))]) {
    const { store } = setup({ [KEY]: raw });
    assert.deepEqual(store.getState().favorites, [], raw.slice(0, 30));
  }
});

test('toggle добавляет и убирает, каждый раз сохраняя', () => {
  const { store, storage, service } = setup();
  assert.deepEqual(service.toggle('azul'), { rejected: false, added: true });
  assert.deepEqual(service.toggle('catan'), { rejected: false, added: true });
  assert.equal(storage.data.get(KEY), '["azul","catan"]');
  assert.deepEqual(service.toggle('azul'), { rejected: false, added: false });
  assert.deepEqual(store.getState().favorites, ['catan']);
  assert.equal(storage.data.get(KEY), '["catan"]');
});

test('при лимите 100 → rejected, ничего не меняется', () => {
  const full = Array.from({ length: MAX_FAVORITES }, (_, i) => `game-${i}`);
  const { store, storage, service } = setup({ [KEY]: JSON.stringify(full) });
  assert.deepEqual(service.toggle('one-more'), { rejected: true, added: false });
  assert.equal(store.getState().favorites.length, MAX_FAVORITES);
  assert.equal(storage.data.get(KEY), JSON.stringify(full));
});

test('remove убирает игру', () => {
  const { store, service } = setup({ [KEY]: '["azul","catan"]' });
  service.remove('azul');
  service.remove('ghost');
  assert.deepEqual(store.getState().favorites, ['catan']);
});

test('после загрузки каталога неизвестные id отбрасываются и сохраняются', () => {
  const { store, storage } = setup({ [KEY]: '["azul","ghost","catan"]' });
  ready(store, ['azul', 'catan']);
  assert.deepEqual(store.getState().favorites, ['azul', 'catan']);
  assert.equal(storage.data.get(KEY), '["azul","catan"]');
});

test('событие storage из другой вкладки заменяет избранное', () => {
  const { store, storage, win } = setup({ [KEY]: '["azul"]' });
  win.storageEvent(KEY, '["azul","catan"]', storage);
  assert.deepEqual(store.getState().favorites, ['azul', 'catan']);
});

test('событие storage: мусор, чужой ключ и чужое хранилище игнорируются; очистка → []', () => {
  const { store, storage, win } = setup({ [KEY]: '["azul"]' });
  win.storageEvent(KEY, '["<b>x</b>"]', storage);
  win.storageEvent(KEY, '{', storage);
  win.storageEvent('other', '["catan"]', storage);
  win.storageEvent(KEY, '["catan"]', memoryStorage());
  assert.deepEqual(store.getState().favorites, ['azul']);
  win.storageEvent(null, null, storage); // localStorage.clear() в другой вкладке
  assert.deepEqual(store.getState().favorites, []);
});

test('событие storage после загрузки каталога тоже отбрасывает неизвестные id', () => {
  const { store, storage, win } = setup();
  ready(store, ['azul']);
  win.storageEvent(KEY, '["azul","ghost"]', storage);
  assert.deepEqual(store.getState().favorites, ['azul']);
});

test('две вкладки: новые данные не затираются старыми', () => {
  // Вкладка B видит ["azul"]; вкладка A добавила catan и записала в общее хранилище,
  // но событие до B ещё не дошло. ♥ в B должно сохранить и catan.
  const { store, storage, service } = setup({ [KEY]: '["azul"]' });
  storage.data.set(KEY, '["azul","catan"]');
  service.toggle('wingspan');
  assert.deepEqual(store.getState().favorites, ['azul', 'catan', 'wingspan']);
  assert.equal(storage.data.get(KEY), '["azul","catan","wingspan"]');
});

test('недоступное хранилище: избранное работает в памяти', () => {
  const broken = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };
  const store = createStore(createInitialState());
  const service = createFavoritesService(store, broken, fakeWindow());
  service.toggle('azul');
  assert.deepEqual(store.getState().favorites, ['azul']);
  const nullStore = createStore(createInitialState());
  createFavoritesService(nullStore, null, fakeWindow()).toggle('catan');
  assert.deepEqual(nullStore.getState().favorites, ['catan']);
});
