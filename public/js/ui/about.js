// Статистика в разделе «О проекте» (§6.2). Пока каталог не загружен — «—».
import { h, clear } from './dom.js';
import { getCatalogStats } from '../logic/stats.js';
import { formatPrice } from '../logic/format.js';

const DASH = '—';

function stat(term, value) {
  return h('div', { class: 'stats__item' }, h('dt', { class: 'stats__term' }, term), h('dd', { class: 'stats__value' }, value));
}

/**
 * @param {HTMLElement} root — dl#about-stats
 * @param {{ getState: Function, subscribe: Function }} store
 */
export function mountAbout(root, store) {
  function render(state) {
    const ready = state.status === 'ready';
    const s = ready ? getCatalogStats(state.games, state.genres) : null;
    const prices = s && s.priceMin !== null ? `${formatPrice(s.priceMin)} – ${formatPrice(s.priceMax).replace(/^≈ /, '')}` : DASH;
    clear(root);
    root.append(
      stat('Игр в каталоге', s ? String(s.gamesCount) : DASH),
      stat('Жанров', s ? String(s.genresCount) : DASH),
      stat('Средний рейтинг', s && s.avgRating !== null ? `★ ${s.avgRating.toFixed(1)}` : DASH),
      stat('Цены', prices),
    );
  }

  store.subscribe((state, prev) => {
    if (state.status !== prev.status || state.games !== prev.games || state.genres !== prev.genres) render(state);
  });
  render(store.getState());
}
