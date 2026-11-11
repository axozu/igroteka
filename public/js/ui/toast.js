// Короткие уведомления (§6.3). Область role="status" есть в разметке заранее,
// чтобы экранный диктор объявлял сообщения.
import { h } from './dom.js';

const DURATION_MS = 4000;
const timers = new Map();

function region() {
  let el = document.getElementById('toasts');
  if (!el) {
    el = h('div', { id: 'toasts', class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  return el;
}

/**
 * Показывает уведомление на 4 секунды. Повтор того же текста продлевает показ, а не дублирует.
 * @param {string} message
 * @param {{ type?: 'info' | 'error' }} [options]
 */
export function showToast(message, { type = 'info' } = {}) {
  const container = region();
  let toast = [...container.children].find((el) => el.textContent === message);
  if (!toast) {
    toast = h('p', { class: ['toast', type === 'error' && 'toast--error'] }, message);
    container.append(toast);
  }
  clearTimeout(timers.get(toast));
  timers.set(toast, setTimeout(() => {
    timers.delete(toast);
    toast.remove();
  }, DURATION_MS));
}
