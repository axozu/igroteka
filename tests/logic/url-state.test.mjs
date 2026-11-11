import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stateToQuery, queryToState } from '../../public/js/logic/url-state.js';
import { DEFAULT_FILTERS } from '../../public/js/logic/filter.js';
import { createInitialState } from '../../public/js/store.js';

const known = { genreIds: new Set(['strategy', 'family', 'party', 'coop', 'duel', 'card']), gameIds: new Set(['azul', 'catan']) };

const FULL = createInitialState({
  query: 'Каркассон и ёлка',
  filters: {
    genres: ['family', 'strategy'], players: 6, priceMin: 1000, priceMax: 5000,
    age: 12, time: ['short', 'long'], complexity: [1, 3],
  },
  sort: 'price-desc',
  view: 'favorites',
  openGameId: 'azul',
});

const urlPart = (s) => ({ query: s.query, filters: s.filters, sort: s.sort, view: s.view, openGameId: s.openGameId });

test('порядок параметров и формат', () => {
  assert.equal(
    stateToQuery(FULL),
    'q=%D0%9A%D0%B0%D1%80%D0%BA%D0%B0%D1%81%D1%81%D0%BE%D0%BD+%D0%B8+%D1%91%D0%BB%D0%BA%D0%B0' +
      '&genre=family,strategy&players=6&priceMin=1000&priceMax=5000&age=12&time=short,long&level=1,3' +
      '&sort=price-desc&view=favorites&game=azul',
  );
});

test('туда-обратно для полностью заполненного состояния', () => {
  assert.deepEqual(queryToState(stateToQuery(FULL), known), urlPart(FULL));
});

test('значения по умолчанию → пустая строка', () => {
  assert.equal(stateToQuery(createInitialState()), '');
  assert.deepEqual(queryToState(''), {});
  assert.deepEqual(queryToState('?'), {});
});

test('кириллица в q кодируется и декодируется', () => {
  const query = stateToQuery(createInitialState({ query: 'Ёлка & «Каркассон»' }));
  assert.doesNotMatch(query, /[а-яё«»]/i, 'кириллица закодирована');
  assert.equal(query.split('&').length, 1, '«&» внутри q закодирован');
  assert.deepEqual(queryToState(`?${query}`), { query: 'Ёлка & «Каркассон»' });
});

test('мусор в адресе игнорируется', () => {
  const search = '?players=abc&genre=xxx,strategy&priceMin=-5&priceMax=1e9&age=7&time=forever&level=9&sort=evil&view=admin&game=<script>';
  assert.deepEqual(queryToState(search, known), { filters: { genres: ['strategy'] } });
  assert.deepEqual(queryToState(search), { filters: { genres: ['strategy'] } });
});

test('game: только известные id', () => {
  assert.deepEqual(queryToState('game=azul', known), { openGameId: 'azul' });
  assert.deepEqual(queryToState('game=ghost', known), {});
  assert.deepEqual(queryToState('game=Bad%20Id'), {});
});

test('q из 500 символов обрезается до 100', () => {
  const result = queryToState(`q=${'я'.repeat(500)}`);
  assert.equal(result.query.length, 100);
  assert.equal(stateToQuery(createInitialState({ query: 'я'.repeat(500) })), stateToQuery(createInitialState({ query: 'я'.repeat(100) })));
});

test('пробельный q игнорируется', () => {
  assert.deepEqual(queryToState('q=+++'), {});
  assert.equal(stateToQuery(createInitialState({ query: '   ' })), '');
});

test('числа: только целые из допустимых вариантов и диапазонов', () => {
  assert.deepEqual(queryToState('players=1&age=18&priceMin=0&priceMax=100000'), {
    filters: { players: 1, age: 18, priceMin: 0, priceMax: 100000 },
  });
  for (const bad of ['players=7', 'players=2.5', 'players=+2', 'age=0x10', 'priceMax=100001', 'priceMin=1.5', 'priceMin=', 'priceMin=%201']) {
    assert.deepEqual(queryToState(bad), {}, bad);
  }
});

test('списки: повторы убираются, неизвестные значения отбрасываются', () => {
  assert.deepEqual(queryToState('genre=card,card,horror&time=short,short,medium&level=2,2,0,1'), {
    filters: { genres: ['card'], time: ['short', 'medium'], complexity: [2, 1] },
  });
  assert.deepEqual(queryToState('genre=,,,'), {});
});

test('known.genreIds ограничивает жанры', () => {
  assert.deepEqual(queryToState('genre=card,duel', { genreIds: new Set(['duel']) }), { filters: { genres: ['duel'] } });
});

test('sort и view: только известные значения', () => {
  assert.deepEqual(queryToState('sort=title-asc&view=favorites'), { sort: 'title-asc', view: 'favorites' });
  assert.deepEqual(queryToState('sort=__proto__&view=constructor'), {});
});

test('не строка и прототипные ключи не ломают разбор', () => {
  for (const bad of [null, undefined, 42, {}]) assert.deepEqual(queryToState(bad), {});
  assert.deepEqual(queryToState('__proto__=1&constructor=2&toString=3'), {});
});

test('stateToQuery дополняет частичные filters значениями по умолчанию', () => {
  assert.equal(stateToQuery({ ...createInitialState(), filters: { genres: ['duel'] } }), 'genre=duel');
  assert.equal(stateToQuery({ ...createInitialState(), filters: DEFAULT_FILTERS }), '');
});
