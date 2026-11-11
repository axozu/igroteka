// Поле поиска (§5.1): задержка 250 мс, Esc очищает, не больше 100 символов.
import { debounce } from './dom.js';
import { MAX_QUERY_LENGTH } from '../logic/search.js';

const DELAY_MS = 250;

/**
 * Подключает существующее поле поиска к хранилищу. Поле не пересоздаётся;
 * его значение обновляется, только когда запрос меняется извне (сброс, «Назад»).
 * @param {HTMLInputElement} input
 * @param {{ getState: Function, setState: Function, subscribe: Function }} store
 */
export function mountSearch(input, store) {
  input.maxLength = MAX_QUERY_LENGTH;
  input.value = store.getState().query;

  const commit = debounce((value) => store.setState({ query: value.slice(0, MAX_QUERY_LENGTH) }), DELAY_MS);

  input.addEventListener('input', () => commit(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || input.value === '') return;
    event.preventDefault();
    commit.cancel();
    input.value = '';
    store.setState({ query: '' });
  });

  store.subscribe((state, prev) => {
    if (state.query === prev.query || state.query === input.value) return;
    commit.cancel();
    input.value = state.query;
  });
}
