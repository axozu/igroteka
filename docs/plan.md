# ИГРОТЕКА — план реализации

> **Для агента (Claude Code):** выполняй план **строго по одному этапу**. Шаги отмечены чекбоксами `- [ ]`, отмечай их `- [x]` по мере выполнения. После последнего шага этапа **остановись** и жди подтверждения заказчика. Следующий этап без подтверждения не начинай. Рекомендуемый навык: superpowers:executing-plans.

**Цель:** адаптивный интерактивный каталог реальных настольных игр с поиском, фильтрами, избранным и сравнением. Бесплатно публикуется на GitHub Pages, без внешних зависимостей, с мерами защиты для статического сайта.

**Архитектура:** чистые ES-модули без сборки: store с подпиской, чистые функции в `public/js/logic/`, отрисовка в `public/js/ui/`. Данные — в `public/data/games.json`. Публикуется только папка `public/` через GitHub Actions после прохождения тестов.

**Стек:** HTML, CSS, JavaScript (ES2022+), Node.js ≥ 22 (только для тестов и локального сервера), `node:test`, GitHub Pages, GitHub Actions.

**Спецификация:** [`docs/specs/2026-11-11-igroteka-design.md`](specs/2026-11-11-igroteka-design.md). Читай её вместе с планом: номера разделов (§) ниже указывают на неё.

## Глобальные ограничения

- **Ноль зависимостей:** в `package.json` нет `dependencies` и `devDependencies`; `npm install` никогда не вызывается. Только встроенные модули Node и API браузера. Внешних доменов на сайте нет.
- `package.json`: `"type": "module"`, `"private": true`, `"engines": { "node": ">=22" }`.
- Тесты: `npm test` → `node --test "tests/**/*.test.mjs"`. Один файл: `node --test tests/<путь>.test.mjs`.
- `public/js/logic/` не использует `document`, `window`, `localStorage`, `location`, `fetch`.
- Во фронтенде **нельзя** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, строковые `setTimeout`/`setInterval`, inline `<script>` с кодом, `on*=`, `style=`, `<style>` (§8.3). Элементы создаются через `h()`/`svg()` из `ui/dom.js`, текст — через `textContent`.
- **Все пути внутри `public/` относительные** (`./css/…`, `./js/…`, `./data/games.json`): на GitHub Pages сайт живёт по подпути `/igroteka/`. Пути, начинающиеся с `/`, запрещены.
- CSP — точная строка из §8.1, первый элемент `<head>` каждой HTML-страницы.
- Язык интерфейса — русский. Цена: `≈ 3 990 ₽` (`Intl.NumberFormat('ru-RU')`). Рейтинг: `★ 8.1`.
- Брейкпоинты: 600 / 768 / 1024 / 1280 px. Проверочные ширины: 360 / 768 / 1024 / 1440.
- Коммит в конце каждого этапа: `этап N: <кратко>`, с подписью `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Фокус ревью (то, что легко сломать незаметно)

1. **Мусор в адресе** (`?players=abc&genre=xxx&game=<script>&priceMin=-5&q=<очень длинная строка>`) → игнорируется или обрезается, приложение не падает, ничего не выводится как HTML. Тест в этапе 4.
2. **Недоступный localStorage** (приватный режим, `getItem` бросает исключение) → приложение работает с настройками по умолчанию. Тест в этапе 4.
3. **Подпуть GitHub Pages** (`/igroteka/`): абсолютный путь вида `/css/base.css` работает локально, но ломает опубликованный сайт. Тест-сканер путей в этапе 1, дополнение в этапе 5; локальный сервер умеет отдавать сайт по `/igroteka/` для проверки.
4. **Повреждённый или подменённый `games.json`** (лишнее поле, строка вместо числа, HTML в названии) → состояние ошибки или безопасный текст, а не сломанная страница. Тесты в этапах 2 и 5.
5. **Две открытые вкладки:** изменили избранное в одной → другая обновляется (событие `storage`) и не затирает новые данные старыми. Шаг в этапе 7.

## Ритуал завершения КАЖДОГО этапа

1. `npm test` — все тесты зелёные (`# fail 0`).
2. `npm start`, пройти ручной чеклист этапа в браузере (в консоли нет ошибок, **включая нарушения CSP**).
3. Проверить отсутствие зависимостей: `node -e "const p=require('./package.json');process.exit(p.dependencies||p.devDependencies?1:0)"` (код 0).
4. Коммит `этап N: …`.
5. **Остановиться.** Написать заказчику: что сделано, результаты тестов, что проверить руками. Ждать «ок».

---

## Этап 1. Каркас проекта

**Файлы:**
- Create: `package.json`, `.gitignore` (`.env`, `node_modules/`, `*.log`, `.DS_Store`, `Thumbs.db`), `.gitattributes` (`* text=auto eol=lf`), `README.md` (заготовка)
- Create: `scripts/serve.mjs`
- Create: `public/index.html`, `public/favicon.svg`, `public/css/tokens.css`, `public/css/base.css`, `public/css/components.css`, `public/js/main.js`
- Create: `tests/helpers/html.mjs`, `tests/smoke.test.mjs`, `tests/security/csp.test.mjs`, `tests/security/relative-paths.test.mjs`

**Интерфейсы:**
- Даёт: `npm start` → `node scripts/serve.mjs` (только `127.0.0.1:8080`). Отдаёт `public/` по корню `/` **и** по подпути `/igroteka/` (как на GitHub Pages).
- Даёт: DOM-якоря `header.site-header`, `main#catalog`, `section#about`, `footer.site-footer`; `<script type="module" src="./js/main.js">`.
- Даёт: `CSP` — экспортируемая строка из §8.1 в `tests/helpers/html.mjs`; `listFiles(dir, exts): string[]` — рекурсивный обход для сканеров.

- [x] **Шаг 1: Проверить git.** `git config user.name` и `git config user.email` должны что-то выводить. Если пусто — **остановиться и спросить заказчика** (глобальные настройки без согласия не менять).
- [x] **Шаг 2: Тесты:**
  - `smoke.test.mjs`: 4 раздела в `index.html`; `lang="ru"`, `name="viewport"`, `<title>ИГРОТЕКА`; `package.json` без зависимостей.
  - `csp.test.mjs`: в **каждом** `public/**/*.html` первый элемент внутри `<head>` после `<meta charset>` — `<meta http-equiv="Content-Security-Policy" content="…">`, и `content` после схлопывания пробелов точно равен `CSP`; есть `<meta name="referrer" content="strict-origin-when-cross-origin">`; нет `<script>` без `src`, `<style`, `style="`, ` on[a-z]+=`.
  - `relative-paths.test.mjs`: в `public/**/*.{html,css,js}` нет `src="/`, `href="/`, `url(/`, `fetch('/`, `import … from '/`; нет `http://`; `https://` допускается только для ссылки на `github.com` в подвале (с этапа 9).
- [x] **Шаг 3:** `npm test` → FAIL.
- [x] **Шаг 4: `package.json`** со scripts `start`, `test`.
- [x] **Шаг 5: `scripts/serve.mjs`** — `node:http`; путь `/igroteka/...` отображается на `public/...`; `/` → `index.html`; MIME-типы html, css, js, json, svg, ico, txt (`charset=utf-8` для текстовых); выход за `public/` (`..`, `%2e%2e`, обратные слэши, нулевой байт) → 404; несуществующий файл → содержимое `public/404.html` со статусом 404 (если файла ещё нет — текст «Не найдено»).
- [x] **Шаг 6: `index.html`** — `<meta charset="utf-8">`, затем CSP-meta, referrer-meta, viewport, description, `<meta name="color-scheme" content="light dark">`, favicon, три CSS (tokens → base → components), каркас 4 разделов с заголовками-заглушками.
- [x] **Шаг 7: `tokens.css`** — `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent` (`#1F6F5C`), `--color-accent-contrast`, `--color-danger`, `--radius-s/m/l` (8/10/12px), `--space-1…8` (шаг 4px), `--shadow-hover`, `--font-sans`, `--container` (1280px). Тёмная тема: `[data-theme="dark"]` и `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }`. Контраст текста ≥ 4.5:1.
- [x] **Шаг 8: `base.css`** — сброс, `body { background: var(--color-bg) }`, типографика, `.container`, `.visually-hidden`, `:focus-visible` (2px outline акцентом), `prefers-reduced-motion: reduce` отключает transition и animation. `components.css` — заготовка с оглавлением.
- [x] **Шаг 9:** `npm test` → PASS.
- [x] **Ручной чеклист:** `http://127.0.0.1:8080/` и `http://127.0.0.1:8080/igroteka/` — одинаково открываются, стили применились; 4 раздела; консоль без ошибок и нарушений CSP; `/../package.json` → 404; 360 px — нет горизонтальной прокрутки.
- [x] **Ритуал завершения** → `этап 1: каркас проекта` → СТОП.

## Этап 2. Данные

**Файлы:**
- Create: `public/data/games.json` (20 игр из §4.2, формат §4.1)
- Create: `public/js/logic/validate.js`
- Test: `tests/logic/validate.test.mjs`, `tests/data/games.test.mjs`

**Интерфейсы:**
- Даёт (`validate.js`):
  - `COVER_ICONS: readonly string[]` — 12 значений из §4.1; `MIN_GAMES = 16`.
  - `validateGame(game, genreIds: Set<string>): string[]` — ошибки вида `"<id>: <поле> — <проблема>"`; `[]` = ок.
  - `validateCatalog(data: unknown): { ok: boolean, errors: string[] }` — форма `{genres, games}`, каждая игра, уникальность id игр и жанров; никогда не бросает исключений.

- [x] **Шаг 1: Тесты `validate.test.mjs`** (на фикстурах): корректная игра → `[]`; `players {min:5,max:2}` → ошибка `players`; неизвестный жанр; `rating: 11` и `7.15`; `cover.color: "red"`; `cover.icon: "unicorn"`; `id: "Bad Id"`; лишнее поле `foo`; `price: "3990"` (строка); `short` длиной 10; дубликат id → `ok:false` с текстом `дубликат`; `validateCatalog(null)`, `({})`, `({genres:'x', games:[]})` → `ok:false` без исключений.
- [x] **Шаг 2:** FAIL → **Шаг 3: реализовать** по таблице §4.1 (год ≤ `new Date().getFullYear()`) → PASS.
- [x] **Шаг 4: Заполнить `games.json`.** 20 игр из §4.2. Для каждой **сверить** с BoardGameGeek и сайтом российского издателя: год, авторов (по-русски), издателя в РФ, игроков, время, возраст, официальное русское название. `rating` — округлённый рейтинг BGG; `price` — ориентировочная цена в РФ, округлённая до 10 ₽. `short` и `description` — свой текст, не копировать с сайтов. Цвета обложек приглушённые, у соседних игр одного жанра разные. Что не удалось проверить — перечислить в отчёте этапа.
- [x] **Шаг 5: Тесты `games.test.mjs`** на реальном файле: `validateCatalog(...).ok === true` (при провале выводить `errors`); игр ≥ `MIN_GAMES`; в каждом жанре ≥ 3 игр; ровно 6 жанров с id из §4.1.
- [x] **Шаг 6:** `npm test` → PASS.
- [x] **Ручной чеклист:** `http://127.0.0.1:8080/data/games.json` — валидный JSON, русский текст читается.
- [x] **Ритуал завершения** → `этап 2: данные каталога` → СТОП.

## Этап 3. Логика каталога

**Файлы:**
- Create: `public/js/logic/normalize.js`, `search.js`, `filter.js`, `sort.js`, `catalog.js`, `stats.js`
- Create: `tests/fixtures/games.mjs` — 6 коротких игр, покрывающих крайние случаи (ё в названии, равный рейтинг, 1 игрок, 8 игроков, время ровно 30 и ровно 60)
- Test: `tests/logic/search.test.mjs`, `filter.test.mjs`, `sort.test.mjs`, `catalog.test.mjs`, `stats.test.mjs`

**Интерфейсы:**
- Даёт:
  - `normalizeText(s: string): string` — нижний регистр, `ё→е`, `trim`, схлопывание пробелов.
  - `MAX_QUERY_LENGTH = 100`; `searchGames(games, query: string): Game[]`.
  - `DEFAULT_FILTERS` (заморожен, §5), `TIME_BUCKETS = { short: [0,30], medium: [31,60], long: [61, Infinity] }`, `PLAYER_OPTIONS = [1,2,3,4,5,6]`, `AGE_OPTIONS = [6,8,10,12,14,18]`, `PRICE_LIMIT = 100000`.
  - `filterGames(games, filters): Game[]`, `countActiveFilters(filters): number`, `isDefaultFilters(filters): boolean`.
  - `SORT_OPTIONS: {id, label}[]` — `rating-desc` «По рейтингу», `price-asc` «Сначала дешевле», `price-desc` «Сначала дороже», `title-asc` «По названию», `year-desc` «Сначала новые»; `DEFAULT_SORT = 'rating-desc'`; `sortGames(games, sortKey): Game[]`.
  - `selectVisibleGames(state): Game[]` — view → search → filter → sort.
  - `getCatalogStats(games, genres): { gamesCount, genresCount, avgRating, priceMin, priceMax }` (`avgRating` до 0.1).

- [x] **Шаг 1: Тесты поиска:** «КАР» находит «Каркассон»; «елка» и «ёлка» находят фикстуру «Ёлка»; поиск по `originalTitle` («azul»); «  » возвращает всё; нет совпадений → `[]`; запрос длиннее 100 символов обрезается и не вызывает ошибок; исходный массив не изменён.
- [x] **Шаг 2: Тесты фильтров:** каждая группа отдельно (жанры ИЛИ; `players: 6` → `max ≥ 6`; `players: 1`; цена только min / только max / min > max меняются местами; `age: 8` → `age ≤ 8`; `time: ['short']` включает `max = 30`, `['medium']` включает `max = 60`; сложность ИЛИ); комбинация групп = И; `DEFAULT_FILTERS` → всё; `countActiveFilters` (цена от-до = 1).
- [x] **Шаг 3: Тесты сортировки:** каждый ключ; равный рейтинг → по названию; `title-asc`: «Азул» раньше «Билет…»; неизвестный ключ → как `DEFAULT_SORT`; исходный массив не изменён.
- [x] **Шаг 4: Тесты конвейера и статистики:** `view:'favorites'` + запрос + фильтр + сортировка вместе; пустое избранное → `[]`; точные числа статистики на фикстурах.
- [x] **Шаг 5:** FAIL → **Шаг 6: реализовать** (входные данные не изменяются: `toSorted` / `[...a].sort`) → **Шаг 7:** `npm test` PASS.
- [x] **Ручной чеклист:** в `public/js/logic/` нет `document`, `window`, `localStorage`, `location`, `fetch`.
- [x] **Ритуал завершения** → `этап 3: логика поиска, фильтров и сортировки` → СТОП.

## Этап 4. Состояние

**Файлы:**
- Create: `public/js/store.js`, `public/js/logic/url-state.js`, `persist.js`, `favorites.js`, `compare.js`
- Test: `tests/logic/store.test.mjs`, `url-state.test.mjs`, `persist.test.mjs`, `favorites.test.mjs`, `compare.test.mjs`

**Интерфейсы:**
- Даёт:
  - `createStore(initial): { getState(), setState(patch | (s)=>patch), subscribe(fn: (state, prev)=>void): () => void }` — поверхностное слияние; подписчики не вызываются, если ничего не изменилось (`Object.is` по ключам).
  - `createInitialState(overrides?)` — состояние §5 со `status:'loading'`.
  - `stateToQuery(state): string` — без `?`, значения по умолчанию опускаются, порядок: `q, genre, players, priceMin, priceMax, age, time, level, sort, view, game`.
  - `queryToState(search: string, known?: { genreIds?: Set, gameIds?: Set }): Partial<State>` — белый список §5.2/§8.4.
  - `readJSON(storage, key, fallback, guard: (v)=>boolean)`, `writeJSON(storage, key, value): boolean` — никогда не бросают исключений.
  - `STORAGE_KEYS = { favorites: 'igroteka:favorites', compare: 'igroteka:compare', theme: 'igroteka:theme' }`; `MAX_FAVORITES = 100`.
  - `toggleId(ids, id, max = MAX_FAVORITES): string[]`, `pruneUnknown(ids, knownIds: Set): string[]`, `isIdList(v, max): boolean` (guard: массив уникальных строк-id формата §4.1 длиной ≤ max).
  - `MAX_COMPARE = 3`, `toggleCompare(ids, id, max = MAX_COMPARE): { ids, rejected: boolean }`, `getBestValues(games): { rating: string[], price: string[], complexity: string[], time: string[] }`.

- [x] **Шаг 1: Тесты store:** подписчик получает `(state, prev)`; повтор тех же значений не уведомляет; отписка; функция-патч получает текущее состояние.
- [x] **Шаг 2: Тесты URL:** туда-обратно для полностью заполненного состояния; дефолт → `''`; кириллица в `q` кодируется и декодируется; **мусор** `players=abc&genre=xxx,strategy&priceMin=-5&priceMax=1e9&age=7&time=forever&level=9&sort=evil&view=admin&game=<script>` → ровно `{ filters:{genres:['strategy']} }` (при `known.gameIds` без такого id); `q` из 500 символов → обрезан до 100.
- [x] **Шаг 3: Тесты persist:** storage с бросающими `getItem`/`setItem` → fallback / `false`, без исключений; битый JSON → fallback; значение не проходит guard (не массив, 101 id, дубли, `"<b>"`) → fallback.
- [x] **Шаг 4: Тесты избранного и сравнения:** `toggleId` добавляет в конец и убирает; на 101-м добавлении список не растёт; `pruneUnknown`; `toggleCompare` при 3 id → `rejected:true`, массив не изменён; снятие работает; `getBestValues` на фикстурах, включая равенство.
- [x] **Шаг 5:** FAIL → **Шаг 6: реализовать** → **Шаг 7:** `npm test` PASS.
- [x] **Ритуал завершения** → `этап 4: состояние, URL, хранение, сравнение` → СТОП.

## Этап 5. Каталог в интерфейсе

**Файлы:**
- Create: `public/js/api.js`, `public/js/ui/dom.js`, `public/js/ui/cover.js`, `public/js/ui/card.js`, `public/js/ui/catalog.js`
- Modify: `public/js/main.js`, `public/index.html`, `public/css/components.css`
- Test: `tests/ui/dom.test.mjs`, `tests/security/no-dangerous-dom.test.mjs`

**Интерфейсы:**
- Потребляет: `createStore`, `createInitialState`, `selectVisibleGames`, `validateCatalog`, `COVER_ICONS`.
- Даёт:
  - `loadCatalog(): Promise<{genres, games}>` — `fetch('./data/games.json', { cache: 'no-cache' })`; не-ok ответ, битый JSON или `validateCatalog().ok === false` → `Error`.
  - `h(tag, attrs?, ...children): Element` — атрибуты через `setAttribute`, `class`, `dataset`, `on: {click: fn}`; **отклоняет** атрибуты `on*` и `style`, а `href` — со схемой не `http(s)`/относительной (бросает `Error`); строки-дети → `TextNode`. `svg(tag, attrs, ...children)` — через `createElementNS`. `clear(el)`, `debounce(fn, ms)`, `trapFocus(container): () => void`, `isSafeHref(url): boolean`.
  - `renderCover(game, { size: 'card' | 'mini' }): SVGElement` — фон `cover.color` через `fill`, иконка (12 простых SVG-путей по одному на значение `COVER_ICONS`), название; `role="img"`, `aria-label`.
  - `renderCard(game, { isFavorite, inCompare, genresById }): HTMLElement` — `article.card[data-id]`; заголовок — `button[data-action="open"]`; ♥ и «Сравнить» — `data-action="favorite" | "compare"`.
  - `mountCatalog(root, store): void` — состояния loading / error / ready (пустые — этап 6).

- [x] **Шаг 1: Тесты `dom.test.mjs`** (чистые функции): `isSafeHref` — `javascript:alert(1)`, `JaVaScRiPt:…`, `data:text/html,…`, ` javascript:` с пробелом → `false`; `https://github.com/x`, `./?game=azul`, `#about` → `true`; `debounce` вызывает функцию один раз (`mock.timers`).
- [x] **Шаг 2: Тест-сканер `no-dangerous-dom.test.mjs`** (§8.3): по всем `public/**/*.js` — нет `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function(`, `setTimeout(`/`setInterval(` со строковым первым аргументом. Самопроверка: функция сканирования находит нарушение во временной строке-примере.
- [x] **Шаг 3:** FAIL → **Шаг 4:** реализовать `dom.js` → PASS.
- [x] **Шаг 5: Реализовать** `cover.js`, `card.js`, `catalog.js`, `api.js`, `main.js`: store → `mountCatalog` → `loadCatalog()` → `setState({status:'ready', games, genres})` или `{status:'error', error}`; «Повторить» перезапускает загрузку; сетка перерисовывается только при изменении списка видимых id; события — делегированием на контейнер сетки.
- [x] **Шаг 6: Стили** карточки, сетки (1/2/3/4 колонки), скелетона (без анимации при reduced-motion), блока ошибки.
- [x] **Шаг 7:** `npm test` → PASS.
- [x] **Ручной чеклист:**
  - 20 карточек с разными обложками;
  - DevTools → Network → «Slow 3G»: скелетоны;
  - переименовать `games.json` → «Не удалось загрузить каталог» + «Повторить»; вернуть имя → «Повторить» работает;
  - добавить в одну игру поле `"hack": 1` → состояние ошибки; убрать;
  - вписать в `title` одной игры `<img src=x onerror=alert(1)>` → на карточке видно как текст, alert нет; вернуть;
  - ширины 360 / 768 / 1024 / 1440 → 1 / 2 / 3 / 4 колонки, без горизонтальной прокрутки;
  - всё то же по адресу `/igroteka/`; консоль без нарушений CSP и Trusted Types.
- [x] **Ритуал завершения** → `этап 5: каталог, карточки, загрузка и ошибка` → СТОП.

## Этап 6. Поиск, фильтры, сортировка в интерфейсе

**Файлы:**
- Create: `public/js/ui/search.js`, `public/js/ui/filters.js`, `public/js/ui/toolbar.js`, `public/js/url-sync.js`
- Modify: `public/js/ui/catalog.js` (пустые состояния), `public/js/main.js`, `public/index.html`, `public/css/components.css`

**Интерфейсы:**
- Потребляет: `DEFAULT_FILTERS`, `PLAYER_OPTIONS`, `AGE_OPTIONS`, `TIME_BUCKETS`, `SORT_OPTIONS`, `MAX_QUERY_LENGTH`, `countActiveFilters`, `stateToQuery`, `queryToState`.
- Даёт:
  - `mountSearch(input: HTMLInputElement, store)` — `maxlength=100`, задержка 250 мс, Esc очищает.
  - `mountFilters(root, store)` — жанры (чекбоксы с числом игр), игроки (радио «Любое», 1…5, «6+»), цена (два `input type=number min=0 max=100000`, применяются по `change`), возраст («Любой», 6…18), время («до 30 мин», «30–60 мин», «больше часа»), сложность. < 1024 px — лист (`filtersSheetOpen`) с «Показать N игр».
  - `mountToolbar(root, store)` — вкладки «Все игры (N) / Избранное (N)», «Найдено: N» (`aria-live="polite"`), select сортировки, чипы с ×, «Сбросить всё», «Фильтры (k)» (< 1024 px).
  - `startUrlSync(store, { history, location, window })` — начальное состояние из адреса; `replaceState`, если изменился только `query`, иначе `pushState`; путь (`location.pathname`) не трогается; `popstate` → `setState(queryToState(...))`.

- [x] **Шаг 1: Реализовать.** Поля ввода создаются один раз, их значения синхронизируются со state.
- [x] **Шаг 2: Пустые состояния** (тексты §6.3): с запросом — «По запросу «…» ничего не найдено» (запрос выводится через `textContent`), иначе «Под выбранные фильтры игр нет»; кнопки «Сбросить поиск» / «Сбросить фильтры» по ситуации.
- [x] **Шаг 3: Стили** панели, листа (фокус удерживается, Esc закрывает), чипов, панели инструментов.
- [x] **Шаг 4:** `npm test` → PASS.
- [x] **Ручной чеклист:**
  - «кар» → Каркассон в результатах; «КАР» — то же; «zzz» → сообщение с запросом и «Сбросить поиск»; ввести в поиск `<b>x</b>` → в сообщении видно буквально;
  - «Кооператив» + «2 игрока» + «до 30 мин» → только подходящие; «Найдено» = числу карточек;
  - чип × снимает фильтр; «Сбросить всё» снимает все; сортировки работают;
  - URL меняется; ссылка в новой вкладке восстанавливает состояние; «Назад» откатывает фильтр; ввод в поиске не плодит записи истории;
  - по адресу `/igroteka/?genre=coop` путь `/igroteka/` сохраняется при изменениях;
  - 360 px: «Фильтры (k)» → лист → «Показать N игр»; Esc закрывает; Tab не выходит за пределы листа;
  - `?players=abc&genre=xxx` → каталог работает, показано всё.
- [x] **Ритуал завершения** → `этап 6: поиск, фильтры, сортировка, URL` → СТОП.

## Этап 7. Избранное

**Файлы:**
- Create: `public/js/ui/favorites-drawer.js`, `public/js/ui/header.js` (пока: счётчик ♥ и открытие панели), `public/js/ui/toast.js`, `public/js/favorites-service.js`
- Modify: `public/js/ui/card.js`, `public/js/ui/catalog.js`, `public/js/main.js`, `public/index.html`, `public/css/components.css`

**Интерфейсы:**
- Потребляет: `toggleId`, `pruneUnknown`, `isIdList`, `readJSON`/`writeJSON`, `STORAGE_KEYS`, `MAX_FAVORITES`.
- Даёт:
  - `createFavoritesService(store, storage, win = window): { toggle(id), remove(id), list() }` — пишет в localStorage при каждом изменении; после загрузки каталога вызывает `pruneUnknown`; слушает `window` `storage` (ключ `igroteka:favorites`) и заменяет state значением из события, если оно проходит `isIdList`.
  - `mountFavoritesDrawer(root, store, favorites)`; `showToast(message, { type: 'info' | 'error' })` — `role="status"`, исчезает через 4 с.

- [ ] **Шаг 1: Реализовать.** ♥ на карточке и в шапке (`aria-pressed`, `aria-label` «Добавить в избранное» / «Убрать из избранного»); при лимите 100 — toast «В избранном может быть не больше 100 игр». Пустое состояние вкладки (§6.3). Панель (§6.2): мини-обложки, сумма через `Intl.NumberFormat`, «Показать в каталоге», Esc и клик по фону закрывают, фокус удерживается и возвращается на ♥ в шапке.
- [ ] **Шаг 2:** `npm test` → PASS.
- [ ] **Ручной чеклист:**
  - добавить 3 игры → счётчик 3; перезагрузить → на месте;
  - вкладка «Избранное» + поиск внутри; пустое избранное → своё сообщение;
  - удаление в панели убирает игру везде; сумма пересчитывается;
  - в DevTools записать в `igroteka:favorites` значение `"мусор"` или `["<b>x</b>"]` → перезагрузить → избранное пустое, ошибок нет;
  - две вкладки: ♥ в одной → счётчик меняется в другой; затем ♥ во второй → в первой видны оба изменения.
- [ ] **Ритуал завершения** → `этап 7: избранное` → СТОП.

## Этап 8. Подробная карточка и сравнение

**Файлы:**
- Create: `public/js/ui/modal.js`, `public/js/ui/compare.js`
- Modify: `public/js/main.js`, `public/js/ui/catalog.js`, `public/index.html` (два `<dialog>`), `public/css/components.css`

**Интерфейсы:**
- Потребляет: `toggleCompare`, `getBestValues`, `MAX_COMPARE`, `showToast`, `createFavoritesService`.
- Даёт: `mountGameModal(dialog, store, favorites)`, `mountCompare(bar, dialog, store, storage)`.

- [ ] **Шаг 1: Модалка** (§6.2): `<dialog>` + `showModal()`; содержимое из `openGameId`; ×, Esc, клик по фону; фокус возвращается на кнопку-заголовок карточки; `?game=id` через url-sync (`pushState`); неизвестный `id` → модалка не открывается, `openGameId = null`.
- [ ] **Шаг 2: Сравнение** (§6.2): плашка при ≥ 1; «Сравнить» активна при ≥ 2; 4-я игра → toast «Можно сравнить не больше 3 игр»; строки таблицы: рейтинг, цена, игроки, время, возраст, сложность, год, жанры; лучшие значения из `getBestValues` выделены классом и текстом «лучшее» (`.visually-hidden`); на телефоне горизонтальная прокрутка, первая колонка закреплена; сохраняется в `igroteka:compare` (guard `isIdList(v, 3)`).
- [ ] **Шаг 3:** `npm test` → PASS.
- [ ] **Ручной чеклист:**
  - клик по карточке → модалка; ♥ и «Сравнить» модалку не открывают;
  - Tab ходит по кругу внутри; Esc закрывает; фокус вернулся;
  - `…/?game=azul` в новой вкладке сразу открывает Азул; `?game=nope` → просто каталог; «Назад» закрывает модалку;
  - 3 игры отмечены → 4-я нет, уведомление; таблица выделяет лучшее; на 360 px прокручивается.
- [ ] **Ритуал завершения** → `этап 8: модалка игры и сравнение` → СТОП.

## Этап 9. Шапка, «О проекте», подвал, тема, 404

**Файлы:**
- Create: `public/js/theme-init.js`, `public/js/ui/theme.js`, `public/js/ui/about.js`, `public/404.html`
- Modify: `public/js/ui/header.js`, `public/index.html`, `public/css/components.css`

**Интерфейсы:**
- Потребляет: `getCatalogStats`, `STORAGE_KEYS.theme`, `readJSON`.
- Даёт: `mountHeader(root, store)` (полная), `mountThemeToggle(button, store, storage)`, `mountAbout(root, store)`.
- `theme-init.js` подключается в `<head>` обычным `<script src="./js/theme-init.js">` (без `defer`), в try/catch читает тему и ставит `data-theme` до отрисовки.

- [ ] **Шаг 1: Шапка** (§6.2): sticky; навигация с плавной прокруткой (отключается при reduced-motion); ≤ 767 px — бургер (`aria-expanded`, `aria-controls`, Esc закрывает); поле поиска **перемещается** в панель инструментов, а не дублируется.
- [ ] **Шаг 2: Тема:** цикл system → light → dark; иконка и `aria-label` («Тема: как в системе» / «светлая» / «тёмная»); сохраняется в `igroteka:theme`.
- [ ] **Шаг 3: «О проекте»** (§6.2): текст, три преимущества, статистика (во время загрузки — «—»).
- [ ] **Шаг 4: Подвал** (§6.2): год из `new Date().getFullYear()`; ссылка на репозиторий `https://github.com/<логин>/igroteka` с `target="_blank" rel="noopener noreferrer"` (логин спросить у заказчика; до ответа — плейсхолдер с пометкой в отчёте). Обновить `relative-paths.test.mjs`: единственный разрешённый внешний URL — этот.
- [ ] **Шаг 5: `404.html`:** тот же `<head>` (CSP, referrer, стили, `theme-init.js`), «Страница не найдена», ссылка «В каталог». **Важно:** GitHub Pages отдаёт `404.html` для любых несуществующих путей, поэтому ссылка и стили должны работать с любой глубины пути: используются пути вида `/igroteka/css/base.css` **только в этом файле**; исключение явно прописывается в `relative-paths.test.mjs` для `public/404.html` с проверкой, что такие пути начинаются ровно с `/igroteka/`.
- [ ] **Шаг 6:** `npm test` → PASS.
- [ ] **Ручной чеклист:**
  - тёмная тема → перезагрузка → тёмная без «вспышки» светлой; «как в системе» следует за ОС;
  - цифры «О проекте» совпадают с данными (20 игр, 6 жанров);
  - 360 px: бургер открывается и закрывается, ссылки ведут к разделам;
  - шапка видна при прокрутке;
  - `http://127.0.0.1:8080/igroteka/nope/deep` → страница 404 со стилями, «В каталог» ведёт на каталог;
  - ссылка в подвале открывается в новой вкладке.
- [ ] **Ритуал завершения** → `этап 9: шапка, о проекте, подвал, тема, 404` → СТОП.

## Этап 10. Полировка, защита репозитория и публикация на GitHub Pages

**Файлы:**
- Create: `tests/security/no-secrets.test.mjs`, `.github/workflows/pages.yml`, `SECURITY.md`, `docs/checklists/ui.md`, `docs/screenshots/*.png`
- Modify: `README.md`, любые файлы `public/` по результатам проверки

- [ ] **Шаг 1: `no-secrets.test.mjs`** (§8.6): по файлам из `git ls-files` (через `child_process.execFileSync('git', ['ls-files'])`) — нет `.env`; нет `BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY`; нет `ghp_`, `github_pat_`, `sk-`, `AKIA[0-9A-Z]{16}`; нет base64/hex-строк ≥ 32 символов в одной строке со словами `key|secret|token|password`. Самопроверка на временной строке с поддельным ключом.
- [ ] **Шаг 2:** FAIL (сканер ещё не написан) → реализовать → PASS.
- [ ] **Шаг 3: Workflow `.github/workflows/pages.yml`** (§8.7):
  - `on: push (branches: [main])`, `pull_request`, `workflow_dispatch`; `permissions: contents: read`; `concurrency: { group: pages, cancel-in-progress: false }`;
  - job `test`: `ubuntu-latest`, checkout → setup-node (`node-version: 24`) → `npm test`;
  - job `deploy`: `needs: test`, `if: github.event_name != 'pull_request'`, `permissions: { pages: write, id-token: write }`, `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`; шаги configure-pages → upload-pages-artifact (`path: public`) → deploy-pages (`id: deployment`);
  - каждое `uses:` — **полный SHA коммита** актуального релиза с комментарием версии (`uses: actions/checkout@<40 символов> # v4.x.x`). SHA брать со страницы релизов соответствующего репозитория `github.com/actions/...`; не выдумывать.
  - Тест в `tests/security/workflow.test.mjs`: каждое `uses:` в `.github/workflows/*.yml` закреплено 40-символьным SHA; есть `needs: test`; на верхнем уровне `permissions: contents: read`.
- [ ] **Шаг 4: Полный UI-проход** по `docs/checklists/ui.md` (собрать туда чеклисты этапов 5–9 и добавить): 4 ширины × 2 темы; весь сценарий только с клавиатуры; Экранный диктор Windows объявляет «Найдено: N»; zoom 200 %; ландшафт телефона 740×360; Firefox (там нет Trusted Types — сайт работает) и Chrome/Edge.
- [ ] **Шаг 5: `SECURITY.md`** — меры §8 списком (что закрывает каждая), известные ограничения (нет `frame-ancestors` в meta, Trusted Types только в Chromium), как сообщить о проблеме. **README.md** — описание, ссылка на живой сайт, скриншоты светлой и тёмной темы, возможности, архитектура, запуск (`npm start`, `npm test`), структура, «Цены ориентировочные, данные для демонстрации».
- [ ] **Шаг 6:** `npm test` → PASS. Коммит `этап 10: полировка, защита, workflow публикации`.
- [ ] **Шаг 7: Публикация — делает заказчик** (Claude Code даёт пошаговую инструкцию и ждёт; без явного согласия ничего не публикует и не пушит):
  1. Создать **публичный** репозиторий `igroteka` на GitHub (без README).
  2. `git remote add origin https://github.com/<логин>/igroteka.git` → `git push -u origin main`.
  3. Settings → Pages → Source: **GitHub Actions**.
  4. Settings → Code security: включить **Secret scanning** и **Push protection**.
  5. Settings → Branches: правило для `main` — обязательная проверка `test`, запрет force-push.
  6. Включить 2FA на аккаунте GitHub (если ещё нет).
  7. Дождаться зелёного запуска в Actions → сайт на `https://<логин>.github.io/igroteka/`; Settings → Pages → **Enforce HTTPS** включён.
- [ ] **Шаг 8: Проверка опубликованного сайта:** открывается по HTTPS, `http://` перенаправляет на HTTPS; все функции работают; несуществующий путь → наша 404; консоль без ошибок и нарушений CSP; Lighthouse (Mobile и Desktop) ≥ 90 во всех четырёх категориях — числа записать в `docs/checklists/ui.md` и README.
- [ ] **Ритуал завершения** → коммит `этап 10: сайт опубликован` → СТОП. Проект готов.
