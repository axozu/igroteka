// Статистика каталога для раздела «О проекте» (§6.2).

/**
 * Сводка по каталогу. Для пустого каталога avgRating, priceMin и priceMax — null.
 * @param {{ rating: number, price: number }[]} games
 * @param {object[]} genres
 * @returns {{ gamesCount: number, genresCount: number, avgRating: number|null,
 *             priceMin: number|null, priceMax: number|null }}
 */
export function getCatalogStats(games, genres) {
  const gamesCount = games.length;
  const genresCount = genres.length;
  if (gamesCount === 0) {
    return { gamesCount, genresCount, avgRating: null, priceMin: null, priceMax: null };
  }
  const ratingSum = games.reduce((sum, game) => sum + game.rating, 0);
  const prices = games.map((game) => game.price);
  return {
    gamesCount,
    genresCount,
    avgRating: Math.round((ratingSum * 10) / gamesCount) / 10,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
  };
}
