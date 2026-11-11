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

/** Убирает уведомление; если есть анимация ухода — после неё. */
function leave(toast) {
  toast.classList.add('toast--leaving');
  if (getComputedStyle(toast).animationName === 'none') {
    toast.remove();
    return;
  }
  const remove = () => toast.remove();
  toast.addEventListener('animationend', remove, { once: true });
  setTimeout(remove, 400);
}

/**
 * Показывает уведомление на 4 секунды. Повтор того же текста продлевает показ, а не дублирует.
 * @param {string} message
 * @param {{ type?: 'info' | 'error' }} [options]
 */
export function showToast(message, { type = 'info' } = {}) {
  const container = region();
  let toast = [...container.children].find((el) => el.textContent === message);
  if (toast?.classList.contains('toast--leaving')) toast = null;
  if (!toast) {
    toast = h('p', { class: ['toast', type === 'error' && 'toast--error'] }, message);
    container.append(toast);
  }
  clearTimeout(timers.get(toast));
  timers.set(toast, setTimeout(() => {
    timers.delete(toast);
    leave(toast);
  }, DURATION_MS));
}
