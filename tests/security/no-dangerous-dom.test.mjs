import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PUBLIC_DIR, listFiles } from '../helpers/html.mjs';
import { scanDangerousDom } from '../helpers/scan.mjs';

const files = listFiles(join(PUBLIC_DIR, 'js'), ['.js']);

test('самопроверка: сканер находит нарушения в строках-примерах', () => {
  const samples = [
    'el.innerHTML = data.title;',
    'node.outerHTML = x',
    "el.insertAdjacentHTML('beforeend', s)",
    'document.write(s)',
    'document.writeln(s)',
    'eval(code)',
    "new Function('return 1')",
    "Function('return 1')()",
    "setTimeout('alert(1)', 10)",
    'setInterval(`tick()`, 10)',
    'frame.srcdoc = html',
    'range.createContextualFragment(s)',
    'new DOMParser()',
  ];
  for (const sample of samples) {
    assert.ok(scanDangerousDom(sample).length > 0, `не найдено: ${sample}`);
  }
});

test('самопроверка: безопасный код не считается нарушением', () => {
  const safe = [
    'el.textContent = data.title;',
    'setTimeout(() => run(), 250)',
    'setTimeout(run, 250)',
    'const evaluate = 1; retrieval(x);',
    'el.setAttribute("aria-label", title)',
  ];
  for (const sample of safe) {
    assert.deepEqual(scanDangerousDom(sample), [], sample);
  }
});

test('в public/js есть файлы для проверки', () => {
  assert.ok(files.length > 0);
});

for (const file of files) {
  test(`${relative(PUBLIC_DIR, file)}: нет опасных DOM-конструкций`, () => {
    assert.deepEqual(scanDangerousDom(readFileSync(file, 'utf8')), []);
  });
}
