// Локальный статический сервер для разработки (на сайт не публикуется).
// Отдаёт public/ по корню «/» и по подпути «/igroteka/» — как GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 8080;
const BASE = '/igroteka';
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Превращает путь из запроса в абсолютный путь к файлу внутри public/.
 * Возвращает null для всего подозрительного: «..», обратные слэши,
 * нулевой байт, битое %-кодирование, выход за пределы public/.
 */
function resolvePublicPath(rawPath) {
  let path;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (path.includes('\0') || path.includes('\\')) return null;
  if (path.split('/').some((part) => part === '..' || part === '.')) return null;

  if (path === BASE || path.startsWith(`${BASE}/`)) path = path.slice(BASE.length) || '/';
  if (path.endsWith('/')) path += 'index.html';

  const full = join(PUBLIC_DIR, path);
  return full.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep) ? full : null;
}

async function sendNotFound(res, isHead) {
  let body;
  let type;
  try {
    body = await readFile(join(PUBLIC_DIR, '404.html'));
    type = MIME['.html'];
  } catch {
    body = Buffer.from('Не найдено');
    type = MIME['.txt'];
  }
  res.writeHead(404, { 'Content-Type': type, 'Content-Length': body.length });
  res.end(isHead ? undefined : body);
}

async function handle(req, res) {
  const isHead = req.method === 'HEAD';
  if (req.method !== 'GET' && !isHead) {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': MIME['.txt'] });
    res.end('Метод не поддерживается');
    return;
  }

  const rawPath = (req.url ?? '/').split(/[?#]/)[0];

  // Как на GitHub Pages: /igroteka → /igroteka/ (иначе относительные пути ломаются).
  if (rawPath === BASE) {
    const query = (req.url ?? '').slice(rawPath.length);
    res.writeHead(301, { Location: `${BASE}/${query}` });
    res.end();
    return;
  }

  const file = resolvePublicPath(rawPath);
  if (!file) return sendNotFound(res, isHead);

  try {
    const info = await stat(file);
    if (!info.isFile()) return sendNotFound(res, isHead);
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(isHead ? undefined : body);
  } catch {
    return sendNotFound(res, isHead);
  }
}

createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': MIME['.txt'] });
    res.end('Внутренняя ошибка');
  });
}).listen(PORT, HOST, () => {
  console.log(`ИГРОТЕКА: http://${HOST}:${PORT}/  и  http://${HOST}:${PORT}${BASE}/`);
});
