// Общие помощники для тестов-сканеров: эталонная CSP (§8.1) и обход файлов.
import { readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Корень проекта. */
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Папка, которая публикуется на GitHub Pages. */
export const PUBLIC_DIR = join(ROOT, 'public');

/** Точная строка CSP из §8.1 (пробелы схлопнуты). */
export const CSP = [
  "default-src 'self';",
  "script-src 'self';",
  "style-src 'self';",
  "img-src 'self' data:;",
  "font-src 'self';",
  "connect-src 'self';",
  "object-src 'none';",
  "base-uri 'none';",
  "form-action 'none';",
  "require-trusted-types-for 'script';",
  "trusted-types 'none'",
].join(' ');

/** Схлопывает пробельные символы в один пробел и обрезает края. */
export function collapseSpaces(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

/**
 * Рекурсивно собирает файлы с указанными расширениями.
 * @param {string} dir — папка для обхода (если её нет — пустой список)
 * @param {string[]} exts — расширения с точкой, например ['.html', '.js']
 * @returns {string[]} абсолютные пути, отсортированные
 */
export function listFiles(dir, exts) {
  if (!existsSync(dir)) return [];
  const wanted = new Set(exts.map((e) => e.toLowerCase()));
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(full, exts));
    else if (wanted.has(extname(entry.name).toLowerCase())) result.push(full);
  }
  return result.sort();
}
