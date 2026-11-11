import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeActiveFilters, removeActiveFilter, TIME_LABELS, COMPLEXITY_LABELS, playersLabel, ageLabel,
} from '../../public/js/logic/active-filters.js';
import { DEFAULT_FILTERS, countActiveFilters } from '../../public/js/logic/filter.js';

const NBSP = ' ';
const genreNames = new Map([['coop', 'Кооператив'], ['card', 'Карточная']]);
const only = (patch) => ({ ...DEFAULT_FILTERS, ...patch });

test('подписи вариантов', () => {
  assert.deepEqual(TIME_LABELS, { short: 'до 30 мин', medium: '30–60 мин', long: 'больше часа' });
  assert.deepEqual(COMPLEXITY_LABELS, { 1: 'Лёгкая', 2: 'Средняя', 3: 'Сложная' });
  assert.equal(playersLabel(1), '1 игрок');
  assert.equal(playersLabel(2), '2 игрока');
  assert.equal(playersLabel(5), '5 игроков');
  assert.equal(playersLabel(6), '6+ игроков');
  assert.equal(ageLabel(8), '8 лет');
});

test('по умолчанию — ничего', () => {
  assert.deepEqual(describeActiveFilters(DEFAULT_FILTERS, genreNames), []);
});

test('все группы по порядку; число чипов = countActiveFilters', () => {
  const filters = only({
    genres: ['coop', 'card'], players: 2, priceMin: 1000, priceMax: 5000, age: 8, time: ['short'], complexity: [1, 3],
  });
  const chips = describeActiveFilters(filters, genreNames);
  assert.deepEqual(chips.map((c) => c.label), [
    'Кооператив', 'Карточная', '2 игрока', `1${NBSP}000–5${NBSP}000${NBSP}₽`, 'Возраст: 8 лет', 'до 30 мин', 'Лёгкая', 'Сложная',
  ]);
  assert.equal(chips.length, countActiveFilters(filters));
  assert.deepEqual(chips[0], { group: 'genres', value: 'coop', label: 'Кооператив' });
});

test('цена: только от / только до / переставленные границы', () => {
  assert.equal(describeActiveFilters(only({ priceMin: 1000 }), genreNames)[0].label, `от 1${NBSP}000${NBSP}₽`);
  assert.equal(describeActiveFilters(only({ priceMax: 500 }), genreNames)[0].label, `до 500${NBSP}₽`);
  assert.equal(describeActiveFilters(only({ priceMin: 5000, priceMax: 1000 }), genreNames)[0].label, `1${NBSP}000–5${NBSP}000${NBSP}₽`);
});

test('неизвестный жанр подписывается своим id', () => {
  assert.equal(describeActiveFilters(only({ genres: ['duel'] }), genreNames)[0].label, 'duel');
});

test('removeActiveFilter снимает одно значение и не меняет исходный объект', () => {
  const filters = only({ genres: ['coop', 'card'], players: 2, priceMin: 1, priceMax: 9, age: 8, time: ['short', 'long'], complexity: [1] });
  const frozen = structuredClone(filters);
  assert.deepEqual(removeActiveFilter(filters, 'genres', 'coop').genres, ['card']);
  assert.equal(removeActiveFilter(filters, 'players').players, null);
  const noPrice = removeActiveFilter(filters, 'price');
  assert.equal(noPrice.priceMin, null);
  assert.equal(noPrice.priceMax, null);
  assert.equal(removeActiveFilter(filters, 'age').age, null);
  assert.deepEqual(removeActiveFilter(filters, 'time', 'long').time, ['short']);
  assert.deepEqual(removeActiveFilter(filters, 'complexity', 1).complexity, []);
  assert.deepEqual(filters, frozen);
});

test('removeActiveFilter: неизвестная группа → копия без изменений', () => {
  const filters = only({ age: 8 });
  const result = removeActiveFilter(filters, 'evil', 1);
  assert.deepEqual(result, filters);
  assert.notEqual(result, filters);
});
