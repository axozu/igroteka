import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCompareService } from '../../public/js/compare-service.js';
import { createStore, createInitialState } from '../../public/js/store.js';

const KEY = 'igroteka:compare';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
}

function setup(initial = {}) {
  const storage = memoryStorage(initial);
  const store = createStore(createInitialState());
  return { storage, store, service: createCompareService(store, storage) };
}

test('загружает сравнение из хранилища', () => {
  const { store } = setup({ [KEY]: '["azul","catan"]' });
  assert.deepEqual(store.getState().compare, ['azul', 'catan']);
});

test('мусор и больше 3 id → пусто', () => {
  for (const raw of ['"мусор"', '["<b>x</b>"]', '["a","b","c","d"]', '["a","a"]', '{']) {
    assert.deepEqual(setup({ [KEY]: raw }).store.getState().compare, [], raw);
  }
});

test('toggle добавляет и убирает с сохранением', () => {
  const { store, storage, service } = setup();
  assert.deepEqual(service.toggle('azul'), { rejected: false });
  service.toggle('catan');
  assert.equal(storage.data.get(KEY), '["azul","catan"]');
  service.toggle('azul');
  assert.deepEqual(store.getState().compare, ['catan']);
  assert.equal(storage.data.get(KEY), '["catan"]');
});

test('4-я игра → rejected, ничего не меняется', () => {
  const { store, storage, service } = setup({ [KEY]: '["a","b","c"]' });
  assert.deepEqual(service.toggle('d'), { rejected: true });
  assert.deepEqual(store.getState().compare, ['a', 'b', 'c']);
  assert.equal(storage.data.get(KEY), '["a","b","c"]');
});

test('clear очищает и сохраняет', () => {
  const { store, storage, service } = setup({ [KEY]: '["a","b"]' });
  service.clear();
  assert.deepEqual(store.getState().compare, []);
  assert.equal(storage.data.get(KEY), '[]');
});

test('после загрузки каталога неизвестные id отбрасываются', () => {
  const { store, storage } = setup({ [KEY]: '["azul","ghost"]' });
  store.setState({ status: 'ready', games: [{ id: 'azul' }] });
  assert.deepEqual(store.getState().compare, ['azul']);
  assert.equal(storage.data.get(KEY), '["azul"]');
});

test('недоступное хранилище → работает в памяти', () => {
  const store = createStore(createInitialState());
  const service = createCompareService(store, { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } });
  service.toggle('azul');
  assert.deepEqual(store.getState().compare, ['azul']);
});
