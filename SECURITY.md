# Безопасность ИГРОТЕКИ

ИГРОТЕКА — статический сайт на GitHub Pages: у него нет сервера, базы данных, аккаунтов и
секретов. Поэтому главные риски — внедрение чужого кода в страницу (XSS), подмена данных,
утечка ключей в репозиторий и подмена процесса публикации. Ниже — что сделано против каждого.

## Меры защиты

| Мера | Что закрывает | Как проверяется |
|---|---|---|
| **Content Security Policy** в `<meta>` первым элементом `<head>`: только свои скрипты, стили, картинки и запросы; `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` | Загрузку чужих скриптов и стилей, inline-скрипты, подмену `<base>`, отправку форм на чужие сайты | `tests/security/csp.test.mjs` — точное совпадение строки CSP в каждой HTML-странице |
| **Trusted Types** (`require-trusted-types-for 'script'; trusted-types 'none'`) | Браузер сам запрещает вставку строк как HTML/скриптов (`innerHTML = строка` и т. п.) | Сайт полностью работает при включённой политике (проверено в Chrome) |
| **Безопасный DOM**: элементы создаются через `h()`/`svg()`, текст — только `textContent`; запрещены `on*`, `style`, `srcdoc`, ссылки не `http(s)`/относительные | XSS через данные каталога, адрес или хранилище — даже в браузерах без Trusted Types | `tests/ui/dom.test.mjs`; сканер `tests/security/no-dangerous-dom.test.mjs` запрещает `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, строковые таймеры |
| **Нет inline-кода и внешних доменов** в HTML; все пути относительные | Обход CSP, утечку данных посетителя на чужие серверы | `csp.test.mjs`, `relative-paths.test.mjs` (единственный внешний адрес — ссылка на репозиторий) |
| **Проверка `games.json`** (`validateCatalog`) перед отрисовкой: типы, диапазоны, длины, белый список полей | Повреждённые или подменённые данные → понятная ошибка вместо сломанной страницы | `tests/logic/validate.test.mjs`, `tests/data/games.test.mjs`, `tests/ui/api.test.mjs` |
| **Белые списки для адресной строки**: числа — в диапазонах, жанры и игры — только существующие, `q` ≤ 100 символов | Мусор и попытки внедрения через ссылку `?…` | `tests/logic/url-state.test.mjs`, `tests/ui/url-sync.test.mjs` |
| **Безопасное чтение localStorage** (`readJSON`): проверка типа и лимитов, никаких исключений | Подмену данных в хранилище, падение в приватном режиме | `tests/logic/persist.test.mjs`, сервисы избранного и сравнения |
| `referrer: strict-origin-when-cross-origin`; внешняя ссылка — `target="_blank" rel="noopener noreferrer"` | Утечку адреса страницы, доступ чужой вкладки к `window.opener` | `relative-paths.test.mjs` |
| **Нет cookie, аналитики и трекеров** | Слежку за посетителем; баннер согласия не нужен | Отсутствие внешних доменов (сканеры выше) |
| **HTTPS** на GitHub Pages (Enforce HTTPS), домен `github.io` в списке HSTS preload | Перехват и подмену трафика | Настройка Pages, проверка после публикации |
| **Нет секретов в репозитории**; `.gitignore` закрывает `.env`, `.env.*`, логи | Утечку ключей и токенов | `tests/security/no-secrets.test.mjs`; на GitHub — Secret scanning и Push protection |
| **Ноль зависимостей**: в `package.json` нет `dependencies`/`devDependencies`, `npm install` не нужен | Атаки через цепочку поставок npm | `tests/smoke.test.mjs` |
| **Безопасная публикация**: GitHub Actions — сначала `npm test`, потом deploy только папки `public/`; права `contents: read`, deploy — только `pages: write` и `id-token: write`; actions закреплены полным SHA коммита | Публикацию сломанного кода, подмену action через перезаписанный тег, лишние права токена | `tests/security/workflow.test.mjs` |

## Известные ограничения

- **Нет защиты от встраивания во фрейм.** GitHub Pages не позволяет задавать HTTP-заголовки, а
  `frame-ancestors` и `X-Frame-Options` не работают в `<meta>`. Риск низкий: на сайте нет
  действий, которые можно навязать через фрейм (нет входа, оплаты, отправки данных).
- **Trusted Types поддерживаются не во всех браузерах.** В Chromium (Chrome, Edge) политика
  работает; в Firefox 152 объект `window.trustedTypes` есть (проверено 2026-11-11), в Safari и
  старых браузерах может отсутствовать. Там защиту обеспечивают правила кода (`h()`,
  `textContent`) и сканер `no-dangerous-dom` — они не зависят от браузера.
- **CSP задаётся через `<meta>`**, поэтому не действует директива `report-uri` и не защищает от
  внедрения кода до самого тега (тег стоит первым в `<head>`, сразу после `<meta charset>`).
- **Данные хранятся в браузере** (избранное, сравнение, тема) и доступны любому, кто пользуется
  этим же профилем браузера. Личных данных сайт не хранит.

## Рекомендации для владельца репозитория

1. Включить двухфакторную аутентификацию (2FA) в аккаунте GitHub.
2. Settings → Code security: включить **Secret scanning** и **Push protection**.
3. Settings → Branches: правило для `main` — обязательная проверка `test`, запрет force-push.
4. Settings → Pages: Source — **GitHub Actions**, включить **Enforce HTTPS**.
5. Обновлять SHA actions в `.github/workflows/pages.yml` только на SHA из релизов
   `github.com/actions/*`, с комментарием версии.

## Как сообщить о проблеме

Если вы нашли уязвимость, не публикуйте её в открытом issue. Используйте
**Security → Report a vulnerability** (приватное сообщение) в репозитории
[github.com/axozu/igroteka](https://github.com/axozu/igroteka). Опишите, что нашли, как
воспроизвести и в каком браузере. Ответ — в течение 7 дней.
