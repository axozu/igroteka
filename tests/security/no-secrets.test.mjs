// Нет ключей, токенов и паролей в файлах репозитория (§8.6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { ROOT } from '../helpers/html.mjs';

const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.pdf']);

const RULES = [
  [/-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, 'приватный ключ'],
  [/\bghp_[A-Za-z0-9]{20,}/, 'токен GitHub (ghp_)'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'токен GitHub (github_pat_)'],
  [/\bsk-[A-Za-z0-9_-]{16,}/, 'ключ API (sk-)'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'ключ AWS'],
];
const SECRET_WORD = /key|secret|token|password/i;
const LONG_VALUE = /[A-Za-z0-9+/=_-]{32,}/;

/**
 * Ищет похожие на секреты строки в тексте файла.
 * @param {string} text
 * @returns {string[]}
 */
export function scanSecrets(text) {
  const found = [];
  text.split('\n').forEach((line, i) => {
    for (const [re, label] of RULES) if (re.test(line)) found.push(`строка ${i + 1}: ${label}`);
    if (SECRET_WORD.test(line) && LONG_VALUE.test(line)) found.push(`строка ${i + 1}: длинное значение рядом со словом key/secret/token/password`);
  });
  return found;
}

/** Файлы под git (отслеживаемые и новые, не попавшие в .gitignore). */
function repoFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

test('самопроверка: поддельные ключи находятся', () => {
  // Строки собираются при выполнении, чтобы в исходном коде не было «ключей».
  const fake = 'A1b2C3d4E5f6G7h8J9k0L1m2N3p4Q5r6S7t8';
  const samples = [
    ['-----BEGIN ', 'OPENSSH PRIVATE KEY-----'].join(''),
    ['-----BEGIN ', 'PRIVATE KEY-----'].join(''),
    `token = ${['gh', 'p_'].join('')}${fake}`,
    `${['github', '_pat_'].join('')}${fake}`,
    `OPENAI=${['s', 'k-'].join('')}${fake}`,
    `aws ${['AK', 'IA'].join('')}ABCDEFGHIJKLMNOP`,
    `const apiKey = "${fake}";`,
    `password: ${'f0e1d2c3b4a59687'.repeat(2)}`,
  ];
  for (const sample of samples) assert.ok(scanSecrets(sample).length > 0, sample.slice(0, 30));
});

test('самопроверка: обычный код не считается секретом', () => {
  for (const line of [
    "const STORAGE_KEYS = { favorites: 'igroteka:favorites' };",
    'uses: actions/checkout@0123456789abcdef0123456789abcdef01234567 # v4',
    '      id-token: write',
    '.mask-image { color: red }',
    'token: короткий',
  ]) {
    assert.deepEqual(scanSecrets(line), [], line);
  }
});

test('в репозитории нет файлов .env', () => {
  const env = repoFiles().filter((f) => /^\.env(\..*)?$/.test(basename(f)));
  assert.deepEqual(env, []);
});

test('.gitignore закрывает .env, node_modules и логи', () => {
  const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  for (const entry of ['.env', 'node_modules/', '*.log']) assert.ok(ignore.includes(entry), entry);
});

test('в файлах репозитория нет похожих на секреты строк', () => {
  const files = repoFiles().filter((f) => !BINARY.has(extname(f).toLowerCase()));
  assert.ok(files.length > 10, 'git ls-files вернул слишком мало файлов');
  const problems = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(join(ROOT, file), 'utf8');
    } catch {
      continue; // файл удалён, но ещё в индексе
    }
    for (const p of scanSecrets(text)) problems.push(`${file}: ${p}`);
  }
  assert.deepEqual(problems, []);
});
