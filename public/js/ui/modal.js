// Модальное окно с подробностями игры (§6.2). Открывается по state.openGameId (в адресе ?game=id).
import { h, clear } from './dom.js';
import { bindDialog } from './dialog.js';
import { renderCover } from './cover.js';
import { FAVORITE_LABELS } from './card.js';
import { COMPLEXITY_LABELS } from '../logic/active-filters.js';
import { formatAge, formatPlayers, formatPlayTime, formatPrice, formatRating } from '../logic/format.js';

const TITLE_ID = 'game-modal-title';

function fact(term, value) {
  return h('div', { class: 'facts__item' }, h('dt', { class: 'facts__term' }, term), h('dd', { class: 'facts__value' }, value));
}

/** Куда вернуть фокус: кнопка-заголовок карточки, а если карточки не видно — поле поиска. */
function cardButton(id) {
  const card = [...document.querySelectorAll('article.card[data-id]')].find((el) => el.dataset.id === id);
  return card?.querySelector('.card__open') ?? document.getElementById('search-input');
}

/**
 * @param {HTMLDialogElement} dialog — #game-modal
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 * @param {(action: 'favorite' | 'compare', id: string) => void} onAction — те же действия, что у карточек
 */
export function mountGameModal(dialog, store, onAction) {
  const close = () => store.setState({ openGameId: null });
  const closeButton = h('button', { class: 'icon-button modal__close', type: 'button', 'aria-label': 'Закрыть', on: { click: close } }, '×');
  const title = h('h2', { class: 'modal__title', id: TITLE_ID });
  const content = h('div', { class: 'modal__content' });
  dialog.setAttribute('aria-labelledby', TITLE_ID);
  dialog.append(h('div', { class: 'modal__panel' }, h('div', { class: 'modal__header' }, title, closeButton), content));

  const modal = bindDialog(dialog, close);
  let shownId = null;

  content.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (button && shownId) onAction(button.dataset.action, shownId);
  });

  function renderGame(game, state) {
    const genresById = new Map(state.genres.map((g) => [g.id, g.name]));
    title.textContent = game.title;
    clear(content);
    content.append(
      h('div', { class: 'modal__cover' }, renderCover(game, { size: 'card' })),
      h(
        'div',
        { class: 'modal__info' },
        h('p', { class: 'modal__subtitle' }, `${game.originalTitle} · ${game.year}`),
        h('ul', { class: 'card__genres', 'aria-label': 'Жанры' }, game.genres.map((id) => h('li', { class: 'tag' }, genresById.get(id) ?? id))),
        h('p', { class: 'modal__description' }, game.description),
        h(
          'dl',
          { class: 'facts' },
          fact('Игроки', formatPlayers(game.players)),
          fact('Время', formatPlayTime(game.playTime)),
          fact('Возраст', formatAge(game.age)),
          fact('Сложность', COMPLEXITY_LABELS[game.complexity]),
          fact('Рейтинг', formatRating(game.rating)),
          fact('Цена', formatPrice(game.price)),
          fact('Автор', game.designer),
          fact('Издатель в России', game.publisher),
        ),
        h(
          'div',
          { class: 'modal__actions' },
          h('button', { class: 'button modal__favorite', type: 'button', dataset: { action: 'favorite' } }),
          h('button', { class: 'button button--ghost', type: 'button', dataset: { action: 'compare' } }, 'Сравнить'),
        ),
      ),
    );
  }

  function syncToggles(state) {
    if (!shownId) return;
    const isFavorite = state.favorites.includes(shownId);
    const favorite = content.querySelector('[data-action="favorite"]');
    const compare = content.querySelector('[data-action="compare"]');
    favorite.setAttribute('aria-pressed', String(isFavorite));
    favorite.textContent = isFavorite ? '♥ В избранном' : '♡ В избранное';
    favorite.setAttribute('aria-label', isFavorite ? FAVORITE_LABELS.remove : FAVORITE_LABELS.add);
    compare.setAttribute('aria-pressed', String(state.compare.includes(shownId)));
  }

  function render(state) {
    const game = state.status === 'ready' && state.openGameId
      ? state.games.find((g) => g.id === state.openGameId)
      : null;
    if (game && game.id !== shownId) {
      shownId = game.id;
      renderGame(game, state);
      syncToggles(state);
      modal.open(closeButton);
    } else if (!game && shownId) {
      const id = shownId;
      shownId = null;
      modal.close(cardButton(id));
    } else {
      syncToggles(state);
    }
  }

  store.subscribe(render);
  render(store.getState());
}
