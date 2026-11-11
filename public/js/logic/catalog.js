// Конвейер каталога (§5.1): view → поиск → фильтры → сортировка.
import { searchGames } from './search.js';
import { filterGames } from './filter.js';
import { sortGames } from './sort.js';

/**
 * Список игр, которые видит пользователь при данном состоянии.
 * @param {{ games: object[], view: 'all'|'favorites', favorites: string[],
 *           query: string, filters: object, sort: string }} state
 * @returns {object[]}
 */
export function selectVisibleGames(state) {
  const games = Array.isArray(state.games) ? state.games : [];
  let list = games;
  if (state.view === 'favorites') {
    const favorites = new Set(Array.isArray(state.favorites) ? state.favorites : []);
    list = games.filter((game) => favorites.has(game.id));
  }
  return sortGames(filterGames(searchGames(list, state.query), state.filters), state.sort);
}
