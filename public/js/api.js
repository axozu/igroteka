// Загрузка каталога (§7). Данные не считаются надёжными: перед отрисовкой — validateCatalog.
import { validateCatalog } from './logic/validate.js';

const CATALOG_URL = './data/games.json';

/**
 * Загружает и проверяет каталог.
 * @param {typeof fetch} [fetchFn] — для тестов; по умолчанию глобальный fetch
 * @returns {Promise<{ genres: object[], games: object[] }>}
 * @throws {Error} сеть недоступна, ответ не 2xx, битый JSON или каталог не прошёл проверку
 */
export async function loadCatalog(fetchFn = globalThis.fetch) {
  let response;
  try {
    response = await fetchFn(CATALOG_URL, { cache: 'no-cache' });
  } catch (cause) {
    throw new Error('Сеть недоступна', { cause });
  }
  if (!response.ok) throw new Error(`Ответ сервера: ${response.status}`);

  let data;
  try {
    data = await response.json();
  } catch (cause) {
    throw new Error('Файл каталога повреждён', { cause });
  }

  const result = validateCatalog(data);
  if (!result.ok) throw new Error(`Каталог не прошёл проверку: ${result.errors.slice(0, 5).join('; ')}`);
  return data;
}
