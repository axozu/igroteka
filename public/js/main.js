// Точка входа приложения (§7).
import { createStore, createInitialState } from './store.js';
import { loadCatalog } from './api.js';
import { startUrlSync } from './url-sync.js';
import { mountCatalog } from './ui/catalog.js';
import { mountSearch } from './ui/search.js';
import { mountFilters } from './ui/filters.js';
import { mountToolbar } from './ui/toolbar.js';

const store = createStore(createInitialState());
startUrlSync(store, { history: window.history, location: window.location, window });

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

mountSearch(document.getElementById('search-input'), store);
mountFilters(document.getElementById('filters'), store);
mountToolbar(document.getElementById('toolbar'), store);
mountCatalog(document.getElementById('catalog-root'), store, { onRetry: load });
load();
