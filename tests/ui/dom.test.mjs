import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHref, debounce, h, svg, clear } from '../../public/js/ui/dom.js';

test('isSafeHref: опасные схемы → false', () => {
  for (const url of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.example/x',
    '\\\\evil.example/x',
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(isSafeHref(url), false, String(url));
  }
});

test('isSafeHref: http(s) и относительные → true', () => {
  for (const url of ['https://github.com/x', 'http://example.com', './?game=azul', '#about', '?view=favorites', './']) {
    assert.equal(isSafeHref(url), true, url);
  }
});

test('debounce вызывает функцию один раз с последними аргументами', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const calls = [];
    const debounced = debounce((x) => calls.push(x), 250);
    debounced('a');
    debounced('b');
    mock.timers.tick(249);
    debounced('c');
    mock.timers.tick(249);
    assert.deepEqual(calls, []);
    mock.timers.tick(1);
    assert.deepEqual(calls, ['c']);
    mock.timers.tick(1000);
    assert.deepEqual(calls, ['c']);
  } finally {
    mock.timers.reset();
  }
});

test('debounce.cancel отменяет вызов', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    let count = 0;
    const debounced = debounce(() => count++, 100);
    debounced();
    debounced.cancel();
    mock.timers.tick(500);
    assert.equal(count, 0);
  } finally {
    mock.timers.reset();
  }
});

// ---- h() / svg() на минимальном поддельном document ----

function fakeElement(tag, ns = null) {
  return {
    tag, ns, attrs: {}, children: [], listeners: {}, dataset: {}, className: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    get firstChild() { return this.children[0] ?? null; },
    removeChild(node) { this.children.splice(this.children.indexOf(node), 1); },
    replaceChildren(...nodes) { this.children = nodes; },
  };
}

function withFakeDocument(fn) {
  const saved = globalThis.document;
  globalThis.document = {
    createElement: (tag) => fakeElement(tag),
    createElementNS: (ns, tag) => fakeElement(tag, ns),
    createTextNode: (text) => ({ text }),
  };
  try {
    fn();
  } finally {
    globalThis.document = saved;
  }
}

test('h: атрибуты, class, dataset, on, дети-строки → текстовые узлы', () => {
  withFakeDocument(() => {
    const onClick = () => {};
    const el = h(
      'a',
      { class: 'card', href: './?game=azul', 'aria-label': 'Азул', dataset: { id: 'azul' }, on: { click: onClick }, hidden: true, title: null },
      '<img src=x onerror=alert(1)>',
      42,
      null,
      false,
    );
    assert.equal(el.tag, 'a');
    assert.equal(el.className, 'card');
    assert.equal(el.attrs.href, './?game=azul');
    assert.equal(el.attrs['aria-label'], 'Азул');
    assert.equal(el.attrs.hidden, '');
    assert.equal('title' in el.attrs, false);
    assert.equal(el.dataset.id, 'azul');
    assert.equal(el.listeners.click, onClick);
    assert.deepEqual(el.children, [{ text: '<img src=x onerror=alert(1)>' }, { text: '42' }]);
  });
});

test('h: отклоняет on*, style и опасные href/src', () => {
  withFakeDocument(() => {
    assert.throws(() => h('div', { onclick: 'alert(1)' }));
    assert.throws(() => h('div', { ONCLICK: 'alert(1)' }));
    assert.throws(() => h('div', { onmouseover: () => {} }));
    assert.throws(() => h('div', { style: 'color: red' }));
    assert.throws(() => h('a', { href: 'javascript:alert(1)' }));
    assert.throws(() => h('a', { href: ' JaVaScRiPt:alert(1)' }));
    assert.throws(() => h('img', { src: 'data:text/html,x' }));
    assert.throws(() => h('iframe', { srcdoc: '<b>x</b>' }));
    assert.throws(() => h('form', { action: 'javascript:x' }));
    assert.throws(() => h('div', { dataset: { x: 1 }, on: { click: 'alert(1)' } }));
  });
});

test('svg: пространство имён SVG и те же запреты', () => {
  withFakeDocument(() => {
    const el = svg('rect', { fill: '#C8553D', class: 'cover' });
    assert.equal(el.ns, 'http://www.w3.org/2000/svg');
    assert.equal(el.attrs.fill, '#C8553D');
    assert.equal(el.attrs.class, 'cover');
    assert.throws(() => svg('rect', { onload: 'alert(1)' }));
    assert.throws(() => svg('rect', { style: 'fill:red' }));
    assert.throws(() => svg('a', { href: 'javascript:alert(1)' }));
    assert.throws(() => svg('a', { 'xlink:href': 'javascript:alert(1)' }));
  });
});

test('clear удаляет всех детей', () => {
  withFakeDocument(() => {
    const el = h('div', {}, 'a', 'b');
    clear(el);
    assert.equal(el.children.length, 0);
  });
});
