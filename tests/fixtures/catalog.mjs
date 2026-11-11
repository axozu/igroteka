// Фикстуры для тестов логики. Данные условные: это не реальный каталог.

export const GENRES = [
  { id: 'strategy', name: 'Стратегия' },
  { id: 'family', name: 'Семейная' },
  { id: 'party', name: 'Для компании' },
  { id: 'coop', name: 'Кооператив' },
  { id: 'duel', name: 'Для двоих' },
  { id: 'card', name: 'Карточная' },
];

export const GENRE_IDS = new Set(GENRES.map((g) => g.id));

/** Корректная игра; overrides заменяют поля верхнего уровня. */
export function makeGame(overrides = {}) {
  return {
    id: 'test-game',
    title: 'Тестовая игра',
    originalTitle: 'Test Game',
    year: 2010,
    designer: 'Иван Тестов',
    publisher: 'Тестовое издательство',
    genres: ['strategy', 'family'],
    players: { min: 2, max: 4 },
    playTime: { min: 30, max: 60 },
    age: 10,
    complexity: 2,
    rating: 7.1,
    price: 3990,
    short: 'Короткое описание тестовой игры для карточки.',
    description:
      'Полное описание тестовой игры. Оно нужно только для проверки валидатора и должно быть длиннее ста символов, чтобы пройти проверку.',
    cover: { color: '#C8553D', icon: 'hex' },
    ...overrides,
  };
}

/** Корректный каталог из нескольких игр. */
export function makeCatalog(games = [makeGame(), makeGame({ id: 'second-game' })]) {
  return { genres: GENRES.map((g) => ({ ...g })), games };
}
