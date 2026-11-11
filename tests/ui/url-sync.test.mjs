import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startUrlSync } from '../../public/js/url-sync.js';
import { createStore, createInitialState } from '../../public/js/store.js';
import { DEFAULT_FILTERS } from '../../public/js/logic/filter.js';

/** Поддельные location/history/window: pushState и replaceState меняют location.search. */
function fakeBrowser(search = '', pathname = '/igroteka/') {
  const location = { pathname, search };
  const calls = [];
  const listeners = {};
  const apply = (url) => {
    const u = new URL(url, 'http://x');
    assert.equal(u.pathname, location.pathname, 'путь страницы не меняется');
    location.search = u.search;
  };
  const history = {
    pushState(_s, _t, url) { calls.push(['push', url]); apply(url); },
    replaceState(_s, _t, url) { calls.push(['replace', url]); apply(url); },
  };
  const window = { addEventListener: (type, fn) => { listeners[type] = fn; } };
  const back = (newSearch) => {
    location.search = newSearch;
    listeners.popstate?.({});
  };
  return { location, history, window, calls, back };
}

const setup = (search, pathname) => {
  const browser = fakeBrowser(search, pathname);
  const store = createStore(createInitialState());
  startUrlSync(store, browser);
  return { store, ...browser };
};

const withFilters = (store, patch) => store.setState((s) => ({ filters: { ...s.filters, ...patch } }));

test('начальное состояние берётся из адреса', () => {
  const { store } = setup('?q=%D0%BA%D0%B0%D1%80&genre=coop&players=2&sort=title-asc');
  const s = store.getState();
  assert.equal(s.query, 'кар');
  assert.deepEqual(s.filters, { ...DEFAULT_FILTERS, genres: ['coop'], players: 2 });
  assert.equal(s.sort, 'title-asc');
});

test('мусор в адресе: состояние по умолчанию, адрес очищается через replaceState', () => {
  const { store, calls, location } = setup('?players=abc&genre=xxx');
  assert.deepEqual(store.getState().filters, { ...DEFAULT_FILTERS });
  assert.deepEqual(calls, [['replace', '/igroteka/']]);
  assert.equal(location.search, '');
});

test('корректный адрес не перезаписывается при старте', () => {
  const { calls } = setup('?genre=coop');
  assert.deepEqual(calls, []);
});

test('изменение фильтра → pushState, путь /igroteka/ сохраняется', () => {
  const { store, calls } = setup('?genre=coop');
  withFilters(store, { time: ['short'] });
  assert.deepEqual(calls, [['push', '/igroteka/?genre=coop&time=short']]);
});

test('изменение только query → replaceState', () => {
  const { store, calls } = setup();
  store.setState({ query: 'к' });
  store.setState({ query: 'ка' });
  assert.deepEqual(calls, [['replace', '/igroteka/?q=%D0%BA'], ['replace', '/igroteka/?q=%D0%BA%D0%B0']]);
});

test('query и фильтр вместе → pushState', () => {
  const { store, calls } = setup();
  store.setState((s) => ({ query: 'кар', filters: { ...s.filters, age: 8 } }));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'push');
});

test('изменения вне URL-части не трогают историю', () => {
  const { store, calls } = setup();
  store.setState({ status: 'ready', drawerOpen: true, favorites: ['azul'] });
  assert.deepEqual(calls, []);
});

test('«Назад» (popstate) восстанавливает состояние и сбрасывает отсутствующие параметры', () => {
  const { store, calls, back } = setup('?genre=coop');
  withFilters(store, { time: ['short'] });
  store.setState({ sort: 'price-asc', view: 'favorites' });
  calls.length = 0;
  back('?genre=coop');
  const s = store.getState();
  assert.deepEqual(s.filters, { ...DEFAULT_FILTERS, genres: ['coop'] });
  assert.equal(s.sort, 'rating-desc');
  assert.equal(s.view, 'all');
  assert.equal(s.query, '');
  assert.deepEqual(calls, [], 'popstate не создаёт новых записей истории');
});

test('popstate с мусором → значения по умолчанию', () => {
  const { store, back } = setup('?genre=coop&age=8');
  back('?age=7&sort=evil');
  assert.deepEqual(store.getState().filters, { ...DEFAULT_FILTERS });
  assert.equal(store.getState().sort, 'rating-desc');
});

test('после загрузки каталога жанры проверяются по реальному списку', () => {
  const { store, back } = setup();
  store.setState({ genres: [{ id: 'coop', name: 'Кооператив' }] });
  back('?genre=coop,strategy');
  assert.deepEqual(store.getState().filters.genres, ['coop']);
});

test('возвращает функцию остановки', () => {
  const browser = fakeBrowser();
  const store = createStore(createInitialState());
  const stop = startUrlSync(store, browser);
  stop();
  store.setState({ sort: 'price-asc' });
  assert.deepEqual(browser.calls, []);
});
