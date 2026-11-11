// Сканер опасных DOM-конструкций (§8.3) для no-dangerous-dom.test.mjs.

const RULES = [
  [/\.innerHTML\b/, 'innerHTML'],
  [/\.outerHTML\b/, 'outerHTML'],
  [/\binsertAdjacentHTML\b/, 'insertAdjacentHTML'],
  [/\bdocument\s*\.\s*write(ln)?\b/, 'document.write'],
  [/\beval\s*\(/, 'eval('],
  [/\bnew\s+Function\s*\(/, 'new Function('],
  [/(^|[^.\w])Function\s*\(\s*['"`]/, 'Function("…")'],
  [/\bset(Timeout|Interval)\s*\(\s*['"`]/, 'строковый setTimeout/setInterval'],
  [/\.srcdoc\b/, 'srcdoc'],
  [/\bcreateContextualFragment\b/, 'createContextualFragment'],
  [/\bDOMParser\b/, 'DOMParser'],
];

/**
 * Ищет опасные конструкции в исходном тексте.
 * @param {string} source
 * @returns {string[]} названия найденных нарушений с номером строки
 */
export function scanDangerousDom(source) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    for (const [re, label] of RULES) {
      if (re.test(line)) found.push(`строка ${index + 1}: ${label}`);
    }
  });
  return found;
}
