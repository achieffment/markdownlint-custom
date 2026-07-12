# Проект markdownlint custom rules

> Claude-эквивалент [`.cursor/rules/markdownlint-project.mdc`](../../.cursor/rules/markdownlint-project.mdc). Применяется всегда.

Кастомные правила [markdownlint](https://github.com/DavidAnson/markdownlint) для VS Code (**vscode-markdownlint**) и локального CLI (**markdownlint-cli2**). Единый конфиг — [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc).

## Структура репозитория

| Файл / каталог | Назначение |
|----------------|------------|
| [`src/`](../../src/) | Исходники TypeScript (правила, хелперы, типы) |
| [`src/core/`](../../src/core/) | `ICustomRule`, `abstract BaseRule` |
| [`src/domain/`](../../src/domain/) | `ListLineParser`, `list-item-body-end`, `outside-code-lines`, `line-list-walker`, `micromark-token-utils`, `micromark-lists`, `micromark-heading`, `micromark-list-checkers`, `no-leading-spaces-checker`, `micromark-parse`, `ListSpacingChecker`, `ColonChecker`, `sentences-end-mark-checker` |
| [`src/composition/`](../../src/composition/) | `AppContext` — wiring зависимостей |
| [`src/rules/`](../../src/rules/) | Класс `XxxRule extends BaseRule` |
| [`markdownlint-rules.js`](../../markdownlint-rules.js) | **Артефакт tsc:** массив правил (`module.exports = [...]`) |
| [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) | **Единый конфиг:** built-in MD001–MD060 + custom rules + `customRules` + `gitignore`; IDE и CLI |
| [`.markdownlint-ignore`](../../.markdownlint-ignore) | Игнор-файл (gitignore-синтаксис); подключён через top-level `gitignore` в `.markdownlint-cli2.jsonc` — см. [platform-scripts.md](platform-scripts.md) |
| [`load-cli2-config.cjs`](../../load-cli2-config.cjs) | Загрузка `config` из cli2 для [`tests/`](../../tests/) |
| [`tests/test-cli2-config.cjs`](../../tests/test-cli2-config.cjs) | Parity cli2 `config` ↔ [`schema/.markdownlint.jsonc`](../../schema/.markdownlint.jsonc); проверка `gitignore` |
| [`tests/test-markdownlint-ignore.cjs`](../../tests/test-markdownlint-ignore.cjs) | Тест `.markdownlint-ignore`: интеграционный прогон реального cli2 с временным конфигом |
| [`scripts/sync-cli2-config.cjs`](../../scripts/sync-cli2-config.cjs) | Регенерация `.markdownlint-cli2.jsonc` из schema + custom keys из `markdownlint-rules.js` + `gitignore` (`presync:cli2-config` → build) |
| [`scripts/cli2-overrides.cjs`](../../scripts/cli2-overrides.cjs) | Единый список built-in overrides (`MD013`, `MD007`, `MD029`, `MD032`, `MD043`, `MD046`) для sync и `tests/test-cli2-config.cjs` |
| [`schema/.markdownlint.jsonc`](../../schema/.markdownlint.jsonc) | Snapshot official schema для тестов |
| [`bin/`](../../bin/) | `lint-markdown.cjs`; `.sh` / `.bat` / `.command` |
| [`src/notify.ts`](../../src/notify.ts) → `notify.js` | **Артефакт tsc:** веб-хук CLI-уведомлений (`MDLINT_WEBHOOK_URL`/`MDLINT_WEBHOOK_TOK` из `.env`); только в [`bin/lint-markdown.cjs`](../../bin/lint-markdown.cjs) |
| [`.env.example`](../../.env.example) | Шаблон конфигурации веб-хука; `.env` в git не коммитится |
| [`markdownlint-hlprs.js`](../../markdownlint-hlprs.js) | **Артефакт tsc:** публичный API для `tests/rules/*.test.cjs` (compat); правила — DI через `AppContext` |
| Корневые `*.js`, `core/`, `domain/`, `composition/`, [`rules/`](../../rules/) | **Артефакты tsc**; коммитить вместе с `src/` |
| [`markdownlint-examples/`](../../markdownlint-examples/) | Пары `_err.md` / `_suc.md` на каждое правило |
| [`tests/`](../../tests/) | `helpers.cjs` (общая инфраструктура), `examples.test.cjs` (sync/exclusivity/pair-проверки), `hlprs.test.cjs` (unit-тесты hlprs API), `rules/<rule-name>.test.cjs` (1 файл на custom lint-правило), `run-all.cjs` (entry point `npm test`) |
| [`check-function-order.cjs`](../../check-function-order.cjs) | Проверка порядка функций (callee перед caller); обходит `src/**/*.ts` и `tests/**/*.cjs` |
| [`tsconfig.json`](../../tsconfig.json) | Сборка `src/` → CommonJS `.js` в корне |
| `.gitignore`, `.gitattributes` | Git: ignore-паттерны; LF в index и working tree (Windows: `core.autocrlf=false`) |
| `.editorconfig` | LF, отступ 4 пробела (EditorConfig) |
| `.nvmrc`, `.npmrc` | Node 22 (nvm), `engine-strict` для `engines` |
| [`package.json`](../../package.json) | npm-скрипты, `engines.node >= 22`, `type: commonjs` |
| [`AGENTS.md`](../../AGENTS.md) | Краткий справочник для AI-агента |
| [`README.md`](../../README.md) | Документация для людей (onboarding, правила проверки кратко) |
| [`.cursor/rules/`](../../.cursor/rules/) | Правила Cursor; каталог — [AGENTS.md](../../AGENTS.md) |
| [`.claude/rules/`](../../.claude/rules/) | Правила Claude Code (эквивалент `.cursor/rules/`); каталог — [AGENTS.md](../../AGENTS.md) |

## Каталог правил

| `names` | Что проверяет | Примеры |
|---------|---------------|---------|
| `minimum-h2-heading` | Минимум один заголовок H2 (`##` или setext) вне code fence | `markdownlint-examples/minimum-h2-heading/` |
| `list-items-end-with-semicolon-or-colon` | Пункт списка (num/bul, вложенные): `;`, перед открывающей `` ``` `` или **прямым дочерним** пунктом — `:`; конец тела через `findListItemBodyEnd` | `markdownlint-examples/list-items-end-with-semicolon-or-colon/` |
| `list-blank-line-spacing` | Numbered: blank до/после (EOF skip, same-kind skip) и единообразно между соседними `listItemPrefix` в ordered subtree (вложенные bul/num); bulleted: blank до/после блока (между пунктами не проверяется); blank после `##` перед списком обязателен | `markdownlint-examples/list-blank-line-spacing/` |
| `list-preceded-by-colon` | Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня (num/bul) заканчивается `:`; skip prev: заголовок, пункт списка, code fence, pipe-таблица; вложенные не проверяются | `markdownlint-examples/list-preceded-by-colon/` |
| `codeblock-preceded-by-colon` | Открывающая `` ``` ``: строка перед ней заканчивается `:` (не пункт списка — те проверяет `list-items-*`); skip prev: заголовок, пункт списка, code fence, pipe-таблица | `markdownlint-examples/codeblock-preceded-by-colon/` |
| `no-leading-spaces` | Нет отступа у обычного текста, пунктов списка верхнего уровня и обозначений блока кода (`` ``` ``); вложенные пункты — при `indent >=` предыдущего | `markdownlint-examples/no-leading-spaces/` |
| `sentences-end-with-mark` | Обычный текст заканчивается `.`, `!`, `?`, `:` или `;`; skip: заголовки, blockquote и продолжения, HR, любые пункты списка (`isLstItem`), pipe-таблицы | `markdownlint-examples/sentences-end-with-mark/` |

## Конвенция примеров

- Каталог = имя правила в `names`.
- `_err.md` — нарушает **только** целевое custom-правило (`npm test` проверяет exclusivity при полном конфиге из `.markdownlint-cli2.jsonc`).
- `_err.md` (кроме `minimum-h2-heading`) содержит `##`, чтобы не срабатывал `minimum-h2-heading`; прочий текст и списки оформлены под остальные правила.
- `_suc.md` — проходит все custom rules.
- **`_err.md` и `_suc.md` — один и тот же текст:** в `_suc` исправлены только нарушения целевого правила (и минимальные правки для exclusivity в `_err`, например `;` / `:` у пунктов списка). Не менять порядок блоков, не подменять сценарии «успешным» вариантом. Исключение: `list-blank-line-spacing` — непустые строки идентичны, отличаются только пустые строки (сама правка — blank lines). `tests/helpers.cjs`: `checkExamplePair`, допустимые отличия строк — `allowedLineDiff`: суффикс `;`/`:`/`.`/`!`/`?`; `.` или `;` → `:`; `trimStart` для `no-leading-spaces`; пустой bullet → `- текст;`; пустой numbered `1.  ` → `1. текст;`.
- **`minimum-h2-heading`:** в `_suc` добавляется строка `## …` **в конце** документа (не между блоками), чтобы строки 1…N совпадали с `_err`; `npm test` проверяет это (`checkExamplePair`).
- **Code fence в примерах:** открывающая `` ``` `` с идентификатором языка (`js`, `pr`, …); голый `` ``` `` допустим только в inline-кейсах `tests/rules/*.test.cjs`.
- Вложенные нумерованные пункты: **3 пробела** на уровень, маркер **`1.`** (CommonMark); не использовать поднумерацию `1.1` в маркере.

### `minimum-h2-heading` — политика

- **Parser:** `micromark` (`params.parsers.micromark.tokens`).
- **Проверка:** хотя бы один `atxHeading` или `setextHeading` уровня 2 с непустым текстом (`hasMinimumH2` в [`src/domain/micromark-heading.ts`](../../src/domain/micromark-heading.ts)).
- **Ошибка:** строка 1, если заголовка H2 нет.

### `list-items-end-with-semicolon-or-colon` — политика

- **Parser:** `micromark` (`listItemPrefix` через `eachListItemPrefix`); контент, `folcod`/`folsub` и конец тела — `params.lines[]` + `findListItemBodyEnd`.
- **Конец тела:** `findListItemBodyEnd` (`traverseFence: true`, `shouldBrk: isLstItem`) — как в [`line-list-walker.ts`](../../src/domain/line-list-walker.ts); последняя prose-строка тела — через `getLastProseIx` (пропуск blank и code fence блоков). Строка на отступе пункта **сразу** после закрывающей `` ``` `` (без пустой строки) считается продолжением тела **один раз**; пустая строка сбрасывает это продолжение — дальнейший текст в тело пункта не входит (граница нужна для `list-preceded-by-colon` / `codeblock-preceded-by-colon` перед следующим блоком).
- **Проверка:** последняя prose-строка тела заканчивается `;`; если после неё в теле или сразу после тела — открывающая `` ``` `` или **прямой** дочерний пункт (больший отступ; sibling на том же indent — `;`), то `:`.
- **folcod:** только **открывающая** `` ``` `` (pre-scan `eachOpeningCodeFenceLine` → `Set<number>` в [`ListItemsChecker`](../../src/domain/micromark-list-checkers.ts); в теле между последней prose-строкой и `bodyEnd` или сразу после `bodyEnd`; `isOpeningCodeFenceAt` — эквивалентная семантика, unit-тесты; closing fence не требует `:`).
- **folsub:** первая непустая строка после `bodyEnd` — прямой дочерний пункт (`isChildLstItem`).
- **Пустой пункт** (только маркер) — ошибка с `detail: listItemsEmpty`; контент после маркера — через `ListLineParser.trimStart`, не `line.trim()` (иначе `- ` теряет пробел маркера).
- **Sub-detail:** `listItemsColon` — перед открывающей `` ``` `` или прямым дочерним пунктом нужен `:`; `listItemsSemi` — в остальных случаях нужен `;`.
- **lineNumber:** строка с нарушением (последняя prose-строка тела пункта).

### `list-blank-line-spacing` — политика

- **Parser:** `micromark` + `params.lines[]` (границы/gaps — line-based там, где `list.endLine` захватывает prose после списка).
- **Numbered** (`isNumItem`: `1.`): blank перед первым и после последнего пункта блока; единообразные blank между **каждой парой** соседних `listItemPrefix` в ordered subtree (`collectPrefixesInList` + `findListItemBodyEnd`, включая вложенные bul/num). Если хотя бы один переход с blank — все должны иметь; если ни у одного нет — OK.
- **Bulleted** (`isBulItem`: `-`, `*`, `+`): только blank до первого и после последнего пункта блока; между пунктами **не проверяется**.
- **Границы (bounds):** blank до/после проверяется только при реальной границе блока — перед контентом **другого типа** (не same-kind); after не проверяется в EOF; blank после `##` перед списком **обязателен**.
- **Блок:** top-level `listOrdered` / `listUnordered` из micromark; конец последнего пункта — `findListItemBodyEnd` (не `list.endLine`).
- **Sub-detail:** `listBlankBef` — нет blank перед первым пунктом блока; `listBlankAft` — нет blank после последнего; `listBlankGap` — неединообразные blank между соседними `listItemPrefix` в ordered subtree.
- **lineNumber:** `listBlankBef` — первый пункт блока; `listBlankAft` — первая непустая content-строка после блока (через `skipBlankFwd` от конца последнего пункта); `listBlankGap` — следующий пункт в паре с нарушением.

### `list-preceded-by-colon` — политика

- **Parser:** `none` (line-based: `walkLineBasedListBlocks` / `line-list-walker`; micromark не используется — разрывает списки на fence).
- **Scope:** нумерованные и маркированные списки.
- **Проверка:** только строка перед **первым пунктом блока** верхнего уровня (не перед каждым вложенным).
- **Skip вложенные:** пункт с отступом (`indent > 0`) — `:` не требуется (`isNestedLstItem`).
- **Skip prev:** заголовок, пункт списка, code fence, pipe-строки таблицы (подъём вверх через `tableRowRx` в `checkPrecededByColon`, включая пустые строки между pipe-строками); нет непустой строки выше (`prev < 0`) — skip.
- **Пустые строки:** между целью и prev пропускаются (`skipBlankBck`); `:` ищется на первой непустой prose-строке выше после skip blank + pipe-блока.
- **Тело пункта:** текст после code fence внутри пункта не считается отдельным блоком (`line-list-walker` / `LineListBlockWalker` / `findListItemBodyEnd`).
- **lineNumber:** строка prose **перед** первым пунктом блока (первая непустая выше после skip blank + pipe-блока; не pipe-строка).

### `codeblock-preceded-by-colon` — политика

- **Parser:** `none` (line-based: `eachOpeningCodeFenceLine` / regex; micromark не парсит indented fence как `codeFenced`).
- **Scope:** только **открывающие** `` ``` `` (не закрывающие).
- **Проверка:** строка перед fence должна заканчиваться `:`.
- **Skip prev:** заголовок, **любой** пункт списка (`isLstItem` / `lstItemRx`), code fence, pipe-строки таблицы (подъём вверх через `tableRowRx` в `checkPrecededByColon`, включая пустые строки между pipe-строками); нет непустой строки выше — skip.
- **Пустые строки:** между fence и prev пропускаются (`skipBlankBck`); `:` ищется на первой непустой prose-строке выше после skip blank + pipe-блока.
- **Обход fence:** `eachOpeningCodeFenceLine` из [`src/domain/outside-code-lines.ts`](../../src/domain/outside-code-lines.ts) (regex; покрывает indented fence, которые micromark не парсит как `codeFenced`).
- **lineNumber:** строка prose **перед** открывающей `` ``` `` (первая непустая выше после skip blank + pipe-блока; не pipe-строка).

### `no-leading-spaces` — политика

- **Parser:** `none` (line-based: `walkCodeFenceAware`; проверяет сами строки `` ``` ``, не только контент).
- **Scope:** строки вне code fence и строки-обозначения блока (opening/closing `` ``` ``).
- **Обход:** `walkCodeFenceAware` из [`src/domain/outside-code-lines.ts`](../../src/domain/outside-code-lines.ts) (строки fence не пропускаются; не `eachLineOutsideCode`).
- **Skip:** заголовки (`#`); содержимое между fence не проверяется.
- **Fence:** отступ 0 у opening/closing `` ``` ``.
- **Пункт списка:** отступ 0; вложенный допустим при `indent > 0` и `indent >=` отступа предыдущего пункта списка (`findPrevListInd`; соседи на одном уровне — с тем же отступом); при поиске предыдущего пункта пропускаются блоки code fence. При `indent > 0` ошибка на **первом** пункте блока (`prevInd < 0`); siblings с тем же отступом (`currInd >= prevInd`) допустимы — осознанная ленивость.
- **Обычный текст:** отступ 0.

### `sentences-end-with-mark` — политика

- **Parser:** `none` (line-based: blockquote continuation state, skip HR/table/list проще построчно).
- **Scope:** непустые строки вне code fence.
- **Skip:** заголовки, blockquote (`>`) и **продолжения** цитаты (непустые строки сразу после blockquote без пустой строки между), HR (`---` / `***` / `___`), любые пункты списка (`isLstItem`), pipe-таблицы (строка после trim начинается с `|`, `tableRowRx`).
- **Проверка:** строка заканчивается `.`, `!`, `?`, `:` или `;`.
- **Ограничения:** только GFM pipe-таблицы, не HTML `<table>`; строка prose с `|` в начале после trim skip-ится (редкий edge case).

### Публичный API хелперов (`markdownlint-hlprs.js`)

Экспорт для `tests/rules/*.test.cjs` (обратная совместимость):

| Экспорт | Назначение |
|---------|------------|
| `lstItemRx` | Regex пункта списка (num/bul) на `trimStart` строки |
| `isLstItem` | Пункт списка по строке |
| `isChildLstItem` | Следующий пункт — прямой дочерний (больший indent) |
| `getIndent` | Длина ведущих пробелов |
| `skipBlankFwd` | Индекс следующей непустой строки |
| `eachLineOutsideCode` | Колбэк по строкам вне code fence |
| `findPrevListInd` | Отступ предыдущего пункта списка |
| `checkPrecededByColon` | `:` у обычного текста перед строкой `ix`; 4-й аргумент `colDet` — `details.codeblockColon` или `details.listPrecededByColon` |
| `checkListBlankSpacing` | Политика `list-blank-line-spacing` (третий аргумент — `blankDets`: `bef`/`aft`/`gap`) |
| `checkListPrecededByColon` | Политика `list-preceded-by-colon` (третий аргумент — `colDet`) |

Внутренние (не экспортируются): `ListLineParser` (`trimStart`, `isNumItem`, `isBulItem`, `isNestedLstItem`, `skipBlankBck`), `list-item-body-end` (`findListItemBodyEnd` — shared конец тела пункта для spacing и colon), `line-list-walker` (`LineListBlockWalker`, `walkLineBasedListBlocks` — fence-in-list для `list-preceded-by-colon`), `ListSpacingChecker` (`hasBlankGap`, `boundBefIdx`, `boundAftIdx`), `outside-code-lines` (`walkOutsideCode`, `walkCodeFenceAware`, `eachOpeningCodeFenceLine`, `isOpeningCodeFenceAt`, `skipFenceBlockFwd`, `skipFenceBlockBck`; `eachLineOutsideCode` — публичный через hlprs), `micromark-token-utils` (`require("markdownlint/helpers")` + `path.join(helpersDir, "micromark-helpers.cjs")`: `filterByTypes`, `getParentOfType`, `isBlankLine`, …), `micromark-lists` (`eachTopLevelList`, `collectPrefixesInList`, `eachListItemPrefix`), `micromark-heading` (`hasMinimumH2`), `micromark-list-checkers` (`ListItemsChecker`), `no-leading-spaces-checker` (`NoLeadingSpacesChecker`), `sentences-end-mark-checker` (`SentencesEndMarkChecker`), `ColonChecker` (`checkPrecededByColon`, `checkOpeningCodeFences`, `checkListPrecededByColon`), `micromark-parse` (`parseMicromarkTokens` — `ListSpacingChecker.checkLines` для hlprs `checkListBlankSpacing`; exclusivity в test-rules; production rules получают tokens от markdownlint).

**Parser custom rules:** **3** правила — `parser: "micromark"` (`checkMicromark`, `params.parsers.micromark.tokens`): `minimum-h2-heading`, `list-items-end-with-semicolon-or-colon`, `list-blank-line-spacing` (последнее — tokens + `params.lines[]` для границ/gaps). **4** правила — `parser: "none"` по умолчанию ([`BaseRule`](../../src/core/base-rule.ts), `check()`, только `params.lines[]`): `list-preceded-by-colon`, `codeblock-preceded-by-colon`, `no-leading-spaces`, `sentences-end-with-mark` — line-based там, где micromark разрывает списки на fence, не парсит indented fence или проще обходить prose/blockquote построчно.

## Конфигурация lint (`.markdownlint-cli2.jsonc`)

Единый канон для **vscode-markdownlint**, **markdownlint-cli2** и [`bin/lint-markdown.cjs`](../../bin/lint-markdown.cjs). Расширение подхватывает файл в корне workspace автоматически.

| Политика | Значение |
|----------|----------|
| `default` | `true` — все built-in включены |
| `MD013` | `false` — как дефолт vscode-markdownlint |
| `MD007` | `false` — пересекается с custom `no-leading-spaces` |
| `MD029` | `false` — fenced code в examples разрывает списки; nested `1.` — style one |
| `MD032` | `false` — заменено custom `list-blank-line-spacing` |
| `MD043` | `false` — дефолт schema с пустым `headings` некорректен |
| `MD046` | `false` — намеренно (fenced code в examples) |
| 7 custom `names` | `true` |

Полный список MD001–MD060 — в [`config`](../../.markdownlint-cli2.jsonc) (на базе [official schema](https://github.com/DavidAnson/markdownlint/blob/main/schema/.markdownlint.jsonc)). Отключения MD029/MD046 документированы комментарием с закомментированным дефолтом.

`customRules`: `["./markdownlint-rules.js"]`.

`globs`: `["**/*.{md,markdown}", "!node_modules", "!vendor"]` — workspace/IDE: весь markdown, кроме `node_modules` и `vendor`; в [`bin/lint-markdown.cjs`](../../bin/lint-markdown.cjs) для папок — `#node_modules`, `#vendor` (явный путь, `--no-globs`).

`gitignore`: `".markdownlint-ignore"` — top-level ключ cli2, подключает [`.markdownlint-ignore`](../../.markdownlint-ignore) как gitignore-style игнор-файл (относительные glob-паттерны от корня репозитория); читает **и** IDE, **и** CLI (одна и та же реализация `markdownlint-cli2`), поэтому работает одинаково без дополнительного кода. Подробности — [platform-scripts.md](platform-scripts.md).

Синхронизация config с upstream schema: `npm run sync:cli2-config` (сохраняет overrides из [`scripts/cli2-overrides.cjs`](../../scripts/cli2-overrides.cjs), custom keys из `markdownlint-rules.js`, `globs`, `gitignore`).

**Обновление snapshot schema** (при bump `markdownlint` в `package.json`):

1. Скопировать [upstream schema](https://github.com/DavidAnson/markdownlint/blob/main/schema/.markdownlint.jsonc) в [`schema/.markdownlint.jsonc`](../../schema/.markdownlint.jsonc) (версия в URL — тег пакета).
2. `npm run sync:cli2-config`
3. `npm test`

## Scope lint

Весь markdown workspace lintится всегда, кроме `node_modules` и `vendor`.

| Контекст | Поведение |
|----------|-----------|
| IDE (workspace) | Все `*.md` / `*.markdown`, кроме `node_modules`, `vendor` |
| Другой workspace + правила из этой папки | `"markdownlint.configFile": "<abs/path>/.markdownlint-cli2.jsonc"`; `customRules` резолвятся относительно файла конфига |
| `npm run lint:md -- <path>` | Явный путь; globs из конфига не используются (`--no-globs`) |

## IDE и EditorConfig

Рекомендуемые настройки VS Code для markdown (согласованы с правилами и [`.editorconfig`](../../.editorconfig)):

```json
"[markdown]": {
  "editor.tabSize": 4,
  "editor.wordWrap": "on",
  "editor.wrappingIndent": "same",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": false
}
```

| Настройка | Стыковка с правилами |
|-----------|----------------------|
| `insertFinalNewline` | `MD047` |
| `trimTrailingWhitespace: false` | `[*.md]` в EditorConfig; иначе срежутся 2 пробела hard break (`MD009`, `br_spaces: 2`) |
| `tabSize: 4` | EditorConfig `indent_size = 4`; Tab вставляет 4 пробела |
| Вложенные списки | В examples шаг **3** пробела на уровень, маркер **`1.`**; не полагаться на один Tab = один уровень |
| `wordWrap` / `wrappingIndent` | Только UI; `MD013` отключён |

## Подключение в VS Code

Достаточно [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) в корне workspace. Ручной `markdownlint.config` / `markdownlint.customRules` в settings **не нужен**, если файл в корне.

Другой workspace (документация), правила из этой папки:

```json
{
  "markdownlint.configFile": "/abs/path/to/markdownlint-custom/.markdownlint-cli2.jsonc"
}
```

`customRules` в конфиге резолвятся относительно расположения `.markdownlint-cli2.jsonc`.

**Известное ограничение:** команда `markdownlint.lintWorkspace` («Lint all markdown files...») игнорирует `markdownlint.configFile` — она не передаёт `--config` в `markdownlint-cli2` (в отличие от лайв-линтинга открытых файлов) и полагается на собственное автообнаружение конфига в целевом воркспейсе. Если там нет своего `.markdownlint-cli2.jsonc`, применяются дефолты cli2, а `.markdownlint-ignore` из чужого конфига не подключается. Обход: `npm run lint:md` / `bin/lint-markdown.cjs` (явный `--config`) вместо этой команды, либо копия/симлинк конфига в целевом воркспейсе.

## Workflow: новое или изменённое правило

Общий порядок — [AGENTS.md](../../AGENTS.md) (шаги 1–8).

Специфика lint-правила:

1. `_err.md` / `_suc.md` в `markdownlint-examples/<rule-name>/`
2. Класс в `src/rules/<rule-name>.ts`; ключи — [`details.ts`](../../src/details.ts), regex — [`regex.ts`](../../src/regex.ts); domain — при необходимости
3. `new XxxRule(deps).toRule()` в [`src/markdownlint-rules.ts`](../../src/markdownlint-rules.ts); `npm run sync:cli2-config` для [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) (custom keys из `markdownlint-rules.js`); новый checker — [`AppContext`](../../src/composition/app-context.ts); inline-кейсы — [`tests/rules/*.test.cjs`](../../tests/rules/)
4. При ≥3 повторах алгоритма — domain-класс (не barrel)

## Контракты

- **Исходники:** TypeScript в `src/`; **runtime custom rules:** CommonJS `.js` в корне (не ESM, не `.ts` напрямую).
- **onError:** `{ lineNumber, detail, context? }`, `lineNumber` с 1.
- Не менять исходники пакета `markdownlint` (built-in rules); конфигурация built-in — только в [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc).
