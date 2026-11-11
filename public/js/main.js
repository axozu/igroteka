// Точка входа приложения (§7).
import { createStore, createInitialState } from './store.js';
import { loadCatalog } from './api.js';
import { startUrlSync } from './url-sync.js';
import { mountCatalog } from './ui/catalog.js';
import { mountSearch } from './ui/search.js';
import { mountFilters } from './ui/filters.js';
import { mountToolbar } from './ui/toolbar.js';
import { createFavoritesService } from './favorites-service.js';
import { mountHeader, mountHeaderFavorites } from './ui/header.js';
import { mountThemeToggle } from './ui/theme.js';
import { mountAbout } from './ui/about.js';
import { mountReveal } from './ui/reveal.js';
import { mountFavoritesDrawer } from './ui/favorites-drawer.js';
import { showToast } from './ui/toast.js';
import { createCompareService } from './compare-service.js';
import { mountGameModal } from './ui/modal.js';
import { mountCompare } from './ui/compare.js';

/** localStorage может быть недоступен (приватный режим, запрет cookie) — тогда работаем в памяти. */
function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const store = createStore(createInitialState());
startUrlSync(store, { history: window.history, location: window.location, window });
const storage = getStorage();
const favorites = createFavoritesService(store, storage, window);
const compare = createCompareService(store, storage);

/** Действия кнопок карточек и модалки: open, favorite, compare. */
function onCardAction(action, id) {
  if (action === 'open') {
    store.setState({ openGameId: id });
  } else if (action === 'favorite') {
    if (favorites.toggle(id).rejected) showToast('В избранном может быть не больше 100 игр');
  } else if (action === 'compare') {
    if (compare.toggle(id).rejected) showToast('Можно сравнить не больше 3 игр');
  }
}

async function load() {
  store.setState({ status: 'loading', error: null });
  try {
    const { games, genres } = await loadCatalog();
    store.setState({ status: 'ready', games, genres });
  } catch (error) {
    // Подробности — разработчику в консоль; пользователю — понятное сообщение в интерфейсе.
    console.warn('ИГРОТЕКА: каталог не загружен.', error.message);
    store.setState({ status: 'error', error: error.message });
  }
}

mountThemeToggle(document.getElementById('theme-toggle'), store, storage);
mountHeader(document.querySelector('.site-header'), store);
mountSearch(document.getElementById('search-input'), store);
mountFilters(document.getElementById('filters'), store);
mountToolbar(document.getElementById('toolbar'), store);
const favoritesButton = document.getElementById('favorites-button');
mountHeaderFavorites(favoritesButton, document.getElementById('favorites-count'), store);
mountFavoritesDrawer(document.getElementById('favorites-drawer'), store, favorites, { returnFocusTo: favoritesButton });
mountCatalog(document.getElementById('catalog-root'), store, { onRetry: load, onAction: onCardAction });
mountGameModal(document.getElementById('game-modal'), store, onCardAction);
mountCompare(document.getElementById('compare-bar'), document.getElementById('compare-dialog'), store, compare);
mountAbout(document.getElementById('about-stats'), store);
mountReveal(document.querySelectorAll('[data-reveal]'));
document.getElementById('footer-year').textContent = String(new Date().getFullYear());
load();
