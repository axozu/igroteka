// Безопасное создание DOM (§8.3). Данные попадают в страницу только как текстовые узлы
// и проверенные атрибуты; обработчики событий — только функциями через `on`.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Атрибуты со ссылками: допускаются только http(s) и относительные адреса. */
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'cite']);

/** Атрибуты, которые нельзя задавать никогда. */
const FORBIDDEN_ATTRS = new Set(['style', 'srcdoc']);

/**
 * Безопасна ли ссылка: http(s) или относительный адрес. Управляющие символы и пробелы,
 * которые браузер выбрасывает при разборе схемы, учитываются.
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeHref(url) {
  if (typeof url !== 'string') return false;
  const compact = url.replace(/[\u0000- \u007f]/g, '');
  if (compact === '') return false;
  if (/^[\\/]{2}/.test(compact)) return false; // //host — чужой домен
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact)) return /^https?:/i.test(compact);
  return true;
}

function setAttrs(el, attrs, isSvg) {
  for (const [name, value] of Object.entries(attrs ?? {})) {
    const lower = name.toLowerCase();
    if (lower.startsWith('on') && name !== 'on') throw new Error(`h(): атрибут ${name} запрещён`);
    if (FORBIDDEN_ATTRS.has(lower)) throw new Error(`h(): атрибут ${name} запрещён`);
    if (value === null || value === undefined || value === false) continue;

    if (name === 'on') {
      for (const [type, handler] of Object.entries(value)) {
        if (typeof handler !== 'function') throw new Error(`h(): обработчик ${type} должен быть функцией`);
        el.addEventListener(type, handler);
      }
    } else if (name === 'dataset') {
      for (const [key, v] of Object.entries(value)) el.dataset[key] = String(v);
    } else if (name === 'class' && !isSvg) {
      el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
    } else {
      if (URL_ATTRS.has(lower) && !isSafeHref(String(value))) {
        throw new Error(`h(): небезопасный адрес в ${name}`);
      }
      const text = value === true ? '' : Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
      el.setAttribute(name, text);
    }
  }
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === true) continue;
    el.append(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/**
 * Создаёт HTML-элемент. Строки и числа среди детей становятся текстовыми узлами.
 * @param {string} tag
 * @param {object} [attrs] — атрибуты; `class` (строка или массив), `dataset`, `on: { click: fn }`
 * @param {...(Node|string|number|null|false|Array)} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  setAttrs(el, attrs, false);
  appendChildren(el, children);
  return el;
}

/**
 * Создаёт SVG-элемент с теми же правилами, что и h().
 * @param {string} tag
 * @param {object} [attrs]
 * @param {...(Node|string|number|null|false|Array)} children
 * @returns {SVGElement}
 */
export function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  setAttrs(el, attrs, true);
  appendChildren(el, children);
  return el;
}

/**
 * Удаляет всех детей элемента.
 * @param {Element} el
 */
export function clear(el) {
  el.replaceChildren();
}

/**
 * Откладывает вызов fn до паузы в ms миллисекунд; у результата есть cancel().
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function & { cancel: () => void }}
 */
export function debounce(fn, ms) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Удерживает фокус клавишей Tab внутри контейнера.
 * @param {HTMLElement} container
 * @returns {() => void} функция, снимающая удержание
 */
export function trapFocus(container) {
  function onKeydown(event) {
    if (event.key !== 'Tab') return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]'));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}
