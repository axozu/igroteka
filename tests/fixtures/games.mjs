// 6 условных игр для тестов логики каталога. Покрывают крайние случаи:
// «ё» в названии, равный рейтинг и равная цена, 1 игрок, 8 игроков, время ровно 30 и ровно 60.

function game(fields) {
  return {
    designer: 'Автор',
    publisher: 'Издатель',
    short: 'Короткое описание для тестов.',
    description: 'Описание для тестов.',
    cover: { color: '#777777', icon: 'dice' },
    ...fields,
  };
}

export const GAMES = Object.freeze([
  game({
    id: 'carcassonne', title: 'Каркассон', originalTitle: 'Carcassonne', year: 2000,
    genres: ['family', 'strategy'], players: { min: 2, max: 5 }, playTime: { min: 30, max: 45 },
    age: 7, complexity: 1, rating: 7.4, price: 1990,
  }),
  game({
    id: 'elka', title: 'Ёлка', originalTitle: 'Yolka', year: 2020,
    genres: ['party'], players: { min: 3, max: 8 }, playTime: { min: 10, max: 15 },
    age: 6, complexity: 1, rating: 6.5, price: 900,
  }),
  game({
    id: 'azul', title: 'Азул', originalTitle: 'Azul', year: 2017,
    genres: ['family', 'strategy'], players: { min: 2, max: 4 }, playTime: { min: 30, max: 30 },
    age: 8, complexity: 1, rating: 7.7, price: 4990,
  }),
  game({
    id: 'ticket', title: 'Билет на поезд', originalTitle: 'Ticket to Ride', year: 2004,
    genres: ['family'], players: { min: 2, max: 5 }, playTime: { min: 30, max: 60 },
    age: 8, complexity: 1, rating: 7.4, price: 4990,
  }),
  game({
    id: 'solo', title: 'Одиночка', originalTitle: 'Solo Quest', year: 2021,
    genres: ['coop', 'card'], players: { min: 1, max: 1 }, playTime: { min: 61, max: 120 },
    age: 14, complexity: 3, rating: 8.2, price: 3000,
  }),
  game({
    id: 'duel', title: 'Дуэль', originalTitle: 'Duel', year: 2015,
    genres: ['duel', 'card'], players: { min: 2, max: 2 }, playTime: { min: 20, max: 30 },
    age: 10, complexity: 2, rating: 7.9, price: 2500,
  }),
]);

/** id игр в порядке результата — удобно сравнивать в тестах. */
export const ids = (games) => games.map((g) => g.id);
