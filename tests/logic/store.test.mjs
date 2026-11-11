import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, createInitialState } from '../../public/js/store.js';
import { DEFAULT_FILTERS } from '../../public/js/logic/filter.js';

test('createInitialState: состояние §5 со status "loading"', () => {
  assert.deepEqual(createInitialState(), {
    status: 'loading', error: null, games: [], genres: [],
    query: '', filters: { ...DEFAULT_FILTERS, genres: [], time: [], complexity: [] },
    sort: 'rating-desc', view: 'all', favorites: [], compare: [], openGameId: null,
    drawerOpen: false, filtersSheetOpen: false, menuOpen: false, theme: 'system',
  });
});

test('createInitialState: overrides и независимые копии', () => {
  const a = createInitialState({ query: 'азул', favorites: ['azul'] });
  assert.equal(a.query, 'азул');
  assert.deepEqual(a.favorites, ['azul']);
  const b = createInitialState();
  assert.notEqual(a.filters, b.filters);
  assert.notEqual(a.filters.genres, DEFAULT_FILTERS.genres);
  assert.equal(Object.isFrozen(b.filters.genres), false);
});

test('getState возвращает текущее состояние', () => {
  const store = createStore({ a: 1 });
  assert.deepEqual(store.getState(), { a: 1 });
});

test('setState — поверхностное слияние', () => {
  const store = createStore({ a: 1, b: { x: 1 } });
  store.setState({ a: 2 });
  assert.deepEqual(store.getState(), { a: 2, b: { x: 1 } });
});

test('подписчик получает (state, prev)', () => {
  const store = createStore({ a: 1, b: 1 });
  const calls = [];
  store.subscribe((state, prev) => calls.push([state, prev]));
  store.setState({ a: 2 });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], { a: 2, b: 1 });
  assert.deepEqual(calls[0][1], { a: 1, b: 1 });
  assert.notEqual(calls[0][0], calls[0][1]);
});

test('повтор тех же значений не уведомляет', () => {
  const list = ['x'];
  const store = createStore({ a: 1, list });
  let count = 0;
  store.subscribe(() => count++);
  store.setState({ a: 1 });
  store.setState({ list });
  store.setState({});
  store.setState(null);
  assert.equal(count, 0);
  store.setState({ a: Number.NaN });
  store.setState({ a: Number.NaN }); // Object.is(NaN, NaN) — изменений нет
  assert.equal(count, 1);
});

test('отписка', () => {
  const store = createStore({ a: 1 });
  let count = 0;
  const unsubscribe = store.subscribe(() => count++);
  store.setState({ a: 2 });
  unsubscribe();
  store.setState({ a: 3 });
  assert.equal(count, 1);
});

test('функция-патч получает текущее состояние', () => {
  const store = createStore({ n: 1 });
  store.setState((s) => ({ n: s.n + 1 }));
  store.setState((s) => ({ n: s.n * 10 }));
  assert.equal(store.getState().n, 20);
});

test('отписка во время уведомления не ломает остальных подписчиков', () => {
  const store = createStore({ a: 1 });
  const seen = [];
  const unsubscribeFirst = store.subscribe(() => {
    seen.push('first');
    unsubscribeFirst();
  });
  store.subscribe(() => seen.push('second'));
  store.setState({ a: 2 });
  store.setState({ a: 3 });
  assert.deepEqual(seen, ['first', 'second', 'second']);
});

test('setState внутри подписчика: следующий подписчик видит актуальное состояние', () => {
  const store = createStore({ a: 1, b: 0 });
  store.subscribe((s) => {
    if (s.a === 2 && s.b === 0) store.setState({ b: 1 });
  });
  store.setState({ a: 2 });
  assert.deepEqual(store.getState(), { a: 2, b: 1 });
});

test('setState внутри подписчика: каждый подписчик видит все переходы по порядку', () => {
  const store = createStore({ a: 1, b: 0 });
  store.subscribe((s) => {
    if (s.a === 2 && s.b === 0) store.setState({ b: 1 });
  });
  const seen = [];
  store.subscribe((s, prev) => seen.push(`${prev.a}${prev.b}→${s.a}${s.b}`));
  store.setState({ a: 2 });
  assert.deepEqual(seen, ['10→20', '20→21']);
});

test('исключение в подписчике не блокирует хранилище', () => {
  const store = createStore({ a: 1 });
  let fail = true;
  let count = 0;
  store.subscribe(() => {
    if (fail) throw new Error('render');
  });
  store.subscribe(() => count++);
  assert.throws(() => store.setState({ a: 2 }));
  fail = false;
  store.setState({ a: 3 });
  assert.equal(store.getState().a, 3);
  assert.equal(count, 1);
});
