// Точка входа приложения (§7).
import { createStore, createInitialState } from './store.js';
import { loadCatalog } from './api.js';
import { mountCatalog } from './ui/catalog.js';

const store = createStore(createInitialState());

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

mountCatalog(document.getElementById('catalog-root'), store, { onRetry: load });
load();
