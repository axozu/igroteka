// Карточка игры в сетке каталога (§6.2).
import { h } from './dom.js';
import { renderCover } from './cover.js';
import { formatAge, formatPlayers, formatPlayTime, formatPrice, formatRating } from '../logic/format.js';

/** Подписи кнопки избранного. */
export const FAVORITE_LABELS = Object.freeze({ add: 'Добавить в избранное', remove: 'Убрать из избранного' });

/**
 * Карточка игры: article.card[data-id]. Заголовок — кнопка data-action="open",
 * ♥ и «Сравнить» — data-action="favorite" | "compare" (обрабатываются делегированием).
 * @param {object} game
 * @param {{ isFavorite?: boolean, inCompare?: boolean, genresById?: Map<string, string> }} [options]
 * @returns {HTMLElement}
 */
export function renderCard(game, { isFavorite = false, inCompare = false, genresById = new Map() } = {}) {
  const titleId = `card-title-${game.id}`;
  const genreNames = game.genres.map((id) => genresById.get(id)).filter(Boolean);

  return h(
    'article',
    { class: 'card', dataset: { id: game.id }, 'aria-labelledby': titleId },
    h('div', { class: 'card__cover' }, renderCover(game, { size: 'card' })),
    h(
      'div',
      { class: 'card__body' },
      h(
        'h3',
        { class: 'card__title', id: titleId },
        h('button', { class: 'card__open', type: 'button', dataset: { action: 'open' } }, game.title),
      ),
      h('p', { class: 'card__year' }, `${game.originalTitle} · ${game.year}`),
      genreNames.length > 0 &&
        h('ul', { class: 'card__genres', 'aria-label': 'Жанры' }, genreNames.map((name) => h('li', { class: 'tag' }, name))),
      h(
        'p',
        { class: 'card__meta' },
        `${formatPlayers(game.players)} · ${formatPlayTime(game.playTime)} · ${formatAge(game.age)}`,
      ),
      h(
        'p',
        { class: 'card__numbers' },
        h('span', { class: 'card__rating' }, h('span', { class: 'visually-hidden' }, 'Рейтинг '), formatRating(game.rating)),
        h('span', { class: 'card__price' }, formatPrice(game.price)),
      ),
      h(
        'div',
        { class: 'card__actions' },
        h(
          'button',
          {
            class: 'icon-button card__favorite',
            type: 'button',
            dataset: { action: 'favorite' },
            'aria-pressed': String(isFavorite),
            'aria-label': isFavorite ? FAVORITE_LABELS.remove : FAVORITE_LABELS.add,
          },
          h('span', { 'aria-hidden': 'true' }, '♥'),
        ),
        h(
          'button',
          { class: 'button button--ghost card__compare', type: 'button', dataset: { action: 'compare' }, 'aria-pressed': String(inCompare) },
          'Сравнить',
        ),
      ),
    ),
  );
}
