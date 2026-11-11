// Общее поведение модальных окон на <dialog>: showModal(), Esc и клик по фону,
// удержание фокуса и блокировка прокрутки страницы.
import { trapFocus } from './dom.js';

/**
 * @param {HTMLDialogElement} dialog — содержимое должно лежать во внутреннем элементе-панели,
 *   тогда клик с target === dialog означает клик по фону
 * @param {() => void} onRequestClose — вызывается по Esc и клику по фону
 * @returns {{ open: (focusTarget?: HTMLElement) => void, close: (returnTo?: HTMLElement | null) => void }}
 */
export function bindDialog(dialog, onRequestClose) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) onRequestClose();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    onRequestClose();
  });

  let releaseFocus = null;
  return {
    open(focusTarget) {
      if (dialog.open) return;
      dialog.showModal();
      document.documentElement.classList.add('is-locked');
      releaseFocus = trapFocus(dialog);
      focusTarget?.focus();
    },
    close(returnTo) {
      if (!dialog.open) return;
      dialog.close();
      releaseFocus?.();
      releaseFocus = null;
      if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('is-locked');
      returnTo?.focus();
    },
  };
}
