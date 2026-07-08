# AGENTS.md

Краткий справочник для AI-агента при работе с кастомными правилами markdownlint в этом репозитории.

## Роль

Эксперт по custom rules markdownlint (TypeScript → CommonJS) и кроссплатформенному запуску (Windows CMD, Linux, macOS, WSL): точные правки в правилах и хелперах, минимальный bootstrap в [`bin/lint-markdown.cjs`](bin/lint-markdown.cjs) (`node_modules`, `markdownlint-rules.js`, `markdownlint-hlprs.js`), сохранение контрактов API, минимальный diff. Не переписывай файлы «с нуля» и не навязывай архитектуру без запроса.

## Scope

| Область | Файлы |
|---------|-------|
| Правила | `src/rules/*.ts` (`extends BaseRule`), barrel `src/markdownlint-rules.ts`, `src/details.ts`, `src/regex.ts` |
| Domain / core | `src/core/`, `src/domain/`, `src/composition/app-context.ts` |
| Barrels | `src/markdownlint-rules.ts`, `src/markdownlint-hlprs.ts` |
| Runtime | корневые `*.js`, `core/`, `domain/`, `composition/`, `rules/` (артефакты tsc; entry points: `markdownlint-rules.js`, `markdownlint-hlprs.js`) |
| Конфиг lint | `.markdownlint-cli2.jsonc`, `load-cli2-config.cjs`, `schema/`, `scripts/sync-cli2-config.cjs` |
| CLI / bin | `bin/lint-markdown.cjs`, `bin/lint-markdown.{sh,bat,command}` |
| Примеры | `markdownlint-examples/**/*.md` |
| Тесты | `test-rules.cjs`, `test-cli2-config.cjs`, `check-function-order.cjs` |
| Cursor rules | `.cursor/rules/*.mdc` |
| Repo / tooling | `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.npmrc` |
| Docs | `README.md`, `AGENTS.md` |

## Правила репозитория

| Файл | Вопрос |
|------|--------|
| [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) | **Проект:** политики lint-правил, примеры, API hlprs, структура, `.markdownlint-cli2.jsonc`, CLI |
| [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc) | **Платформы:** bin-скрипты, bootstrap в `lint-markdown.cjs` |
| [ts-style.mdc](.cursor/rules/ts-style.mdc) | **Оформление TS/OOP:** BaseRule, классы, типы |
| [ts-dev.mdc](.cursor/rules/ts-dev.mdc) | **Проектирование TS:** SRP, DRY, модули |
| [js-style.mdc](.cursor/rules/js-style.mdc) | **Оформление:** `test-rules.cjs` |
| [js-dev.mdc](.cursor/rules/js-dev.mdc) | **Проектирование:** `test-rules.cjs` |
| [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc) | **Синхронизация:** код ↔ все `.mdc` ↔ AGENTS ↔ README при изменении логики |

Перед правками — целевое правило, хелперы и примеры в `markdownlint-examples/`; повторяй локальные конвенции.

## Каталог правил (кратко)

| `names` | Суть |
|---------|------|
| `minimum-h2-heading` | Минимум один `##` вне code fence |
| `list-items-end-with-semicolon-or-colon` | `;`, перед блоком кода или **прямым дочерним** пунктом — `:` |
| `list-blank-line-spacing` | Numbered: blank до/после (EOF skip, same-kind skip) и единообразно между соседними num-пунктами блока (включая `1.1`, `1.1.1`); bulleted: blank до/после блока |
| `list-preceded-by-colon` | Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня (num/bul) заканчивается `:`; skip prev: заголовок, пункт списка, code fence; вложенные не проверяются |
| `codeblock-preceded-by-colon` | Открывающая `` ``` ``: строка перед ней заканчивается `:` (обычный текст, не пункт списка); skip prev: заголовок, пункт списка, code fence |
| `no-leading-spaces` | Нет отступа у обычного текста, пунктов списка верхнего уровня и обозначений блока кода (`` ``` ``); вложенные пункты — при `indent >=` предыдущего |
| `sentences-end-with-mark` | Обычный текст (не заголовок, blockquote, HR, не пункт списка) заканчивается `.`, `!`, `?`, `:` или `;` |

Подробности и пути к примерам — в [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc).

## Рабочий процесс

1. **Read first** — правило в `src/rules/`, хелперы, `_err.md` / `_suc.md`
2. **Design check** — одна политика на правило? дублирование вынести **только в рамках задачи**? ([ts-dev.mdc](.cursor/rules/ts-dev.mdc))
3. **Minimal diff** — без drive-by refactor
4. **Match conventions** — `extends BaseRule`, `AppContext`, [`src/details.ts`](src/details.ts), стиль как в файле
5. **Preserve contracts** — `onError({ lineNumber, detail, context? })`, публичный API hlprs, runtime CommonJS
6. **Register** — `new XxxRule(deps).toRule()` в [`src/markdownlint-rules.ts`](src/markdownlint-rules.ts); новый checker → [`src/composition/app-context.ts`](src/composition/app-context.ts); обновить cli2: `npm run sync:cli2-config` (через `presync:cli2-config` → build; custom keys из `markdownlint-rules.js`)
7. **Test** — `npm test` (pretest → build; test-rules + test-cli2-config + check-function-order)
8. **Sync docs** — по [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc): `.mdc` (по матрице) → AGENTS → README

Локальная проверка **папки с документацией** (не meta-файлов репо): `npm run lint:md -- <path>` или `./bin/lint-markdown.sh <path>`. `README.md`, `AGENTS.md`, `.cursor/**` в `ignores` cli2.

## Верификация

См. шаг 7 workflow. Дополнительно — `npm run check`, `npm run lint:md`, `npm run sync:cli2-config` (через `presync:cli2-config` → build: schema + overrides + custom keys из `markdownlint-rules.js`, `ignores`).

После правки примеров — `_err` срабатывает **только** на целевое custom-правило (полный конфиг); inline-кейсы в `test-rules.cjs` обязаны проходить.

## Границы

- Не угадывай; спроси при неясности
- Не коммить/push, не менять конфиги VS Code — без явной просьбы
- Не раздувать scope; не менять исходники пакета `markdownlint`
- Runtime custom rules — CommonJS `.js`; не подключать `.ts` или ESM в markdownlint
- Не padding-ить перед `=` и не переформатировать вне задачи
- Bin/CLI — следовать [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc)

## Коммуникация

Язык пользователя или репозитория; кратко: что, зачем, как проверено.
