// Общее поведение модальных окон на <dialog>: showModal(), Esc и клик по фону,
// удержание фокуса, блокировка прокрутки и анимация закрытия.
import { trapFocus } from './dom.js';

/** Сколько ждать конца анимации закрытия, если событие animationend не пришло. */
const CLOSE_FALLBACK_MS = 400;

/** Идёт ли у элемента или его первого потомка CSS-анимация (при reduced-motion — нет). */
function isAnimated(dialog) {
  return [dialog, dialog.firstElementChild].some((el) => el && getComputedStyle(el).animationName !== 'none');
}

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
  let pendingClose = null;
  let lastReturnTo = null;

  // Chrome может закрыть окно по Esc сам, не дав отменить cancel (если пользователь давно
  // ничего не нажимал). Тогда завершаем закрытие сразу и синхронизируем состояние.
  dialog.addEventListener('close', () => {
    if (pendingClose) {
      pendingClose.finishNow();
    } else if (releaseFocus) {
      finishClose(lastReturnTo);
      onRequestClose();
    }
  });

  function finishClose(returnTo) {
    pendingClose = null;
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
    releaseFocus?.();
    releaseFocus = null;
    if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('is-locked');
    returnTo?.focus();
  }

  function cancelPendingClose() {
    if (!pendingClose) return;
    pendingClose.cancel();
    pendingClose = null;
    dialog.classList.remove('is-closing');
  }

  return {
    open(focusTarget) {
      if (pendingClose) {
        // Окно снова открыли, пока шла анимация закрытия, — просто остаёмся открытыми.
        cancelPendingClose();
        focusTarget?.focus();
        return;
      }
      if (dialog.open) return;
      dialog.showModal();
      document.documentElement.classList.add('is-locked');
      releaseFocus = trapFocus(dialog);
      lastReturnTo = document.activeElement;
      focusTarget?.focus();
    },
    close(returnTo) {
      if (!dialog.open || pendingClose) return;
      dialog.classList.add('is-closing');
      if (!isAnimated(dialog)) {
        finishClose(returnTo);
        return;
      }
      const onEnd = (event) => {
        if (event.animationName.endsWith('-out')) done();
      };
      const timer = setTimeout(() => done(), CLOSE_FALLBACK_MS);
      const done = () => {
        clearTimeout(timer);
        dialog.removeEventListener('animationend', onEnd);
        finishClose(returnTo);
      };
      dialog.addEventListener('animationend', onEnd);
      pendingClose = {
        cancel() {
          clearTimeout(timer);
          dialog.removeEventListener('animationend', onEnd);
        },
        finishNow: done,
      };
    },
  };
}
