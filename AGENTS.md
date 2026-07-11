# AGENTS.md

## Обзор

Краткий справочник для AI-агента при работе с кастомными правилами markdownlint в этом репозитории.

## Роль

Эксперт по custom rules markdownlint (TypeScript → CommonJS) и кроссплатформенному запуску (Windows CMD, Linux, macOS, WSL): точные правки в правилах и хелперах, минимальный bootstrap в [`bin/lint-markdown.cjs`](bin/lint-markdown.cjs) (`node_modules`, stale build артефактов), сохранение контрактов API, минимальный diff. Не переписывай файлы «с нуля» и не навязывай архитектуру без запроса.

## Scope

| Область | Файлы |
| --- | --- |
| Правила | `src/rules/*.ts` (`extends BaseRule`), barrel `src/markdownlint-rules.ts`, `src/details.ts`, `src/regex.ts`, `src/types.ts`, `src/markdownlint-api.d.ts` |
| Domain / core | `src/core/`, `src/domain/`, `src/composition/app-context.ts` |
| Barrels | `src/markdownlint-rules.ts`, `src/markdownlint-hlprs.ts` |
| Runtime | корневые `*.js`, `core/`, `domain/`, `composition/`, `rules/` (артефакты tsc; entry points: `markdownlint-rules.js`, `markdownlint-hlprs.js`, `notify.js`) |
| Конфиг lint | `.markdownlint-cli2.jsonc`, `.markdownlint-ignore`, `load-cli2-config.cjs`, `schema/`, `scripts/` (`sync-cli2-config.cjs`, `cli2-overrides.cjs`) |
| CLI / bin | `bin/lint-markdown.cjs`, `bin/lint-markdown.{sh,bat,command}` |
| Уведомления | `src/notify.ts` → `notify.js`; `.env.example` (`MDLINT_WEBHOOK_URL`/`_TOK`) |
| Примеры | `markdownlint-examples/**/*.md` |
| Тесты | `test-rules.cjs`, `test-cli2-config.cjs`, `test-markdownlint-ignore.cjs`, `check-function-order.cjs` |
| Cursor rules | `.cursor/rules/*.mdc` |
| Claude rules | `.claude/rules/*.md`, `CLAUDE.md` |
| Repo / tooling | `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.npmrc` |
| Docs | `README.md`, `AGENTS.md` |

**Lint:** весь markdown workspace (кроме `node_modules`, `vendor`); внешняя docs — `npm run lint:md -- <path>`. Подробнее — [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) / [markdownlint-project.md](.claude/rules/markdownlint-project.md) (Scope lint).

## Правила репозитория

Правила продублированы для двух редакторов: Cursor (`.cursor/rules/*.mdc`) и Claude Code (`.claude/rules/*.md`, точка входа — [`CLAUDE.md`](CLAUDE.md)). Содержание синхронно.

| Cursor | Claude | Вопрос |
| --- | --- | --- |
| [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) | [markdownlint-project.md](.claude/rules/markdownlint-project.md) | **Проект:** политики lint-правил, примеры, API hlprs, структура, `.markdownlint-cli2.jsonc`, CLI |
| [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc) | [platform-scripts.md](.claude/rules/platform-scripts.md) | **Платформы:** bin-скрипты, bootstrap в `lint-markdown.cjs` |
| [ts-style.mdc](.cursor/rules/ts-style.mdc) | [ts-style.md](.claude/rules/ts-style.md) | **Оформление TS/OOP:** BaseRule, классы, типы |
| [ts-dev.mdc](.cursor/rules/ts-dev.mdc) | [ts-dev.md](.claude/rules/ts-dev.md) | **Проектирование TS:** SRP, DRY, модули |
| [js-style.mdc](.cursor/rules/js-style.mdc) | [js-style.md](.claude/rules/js-style.md) | **Оформление:** `test-rules.cjs` |
| [js-dev.mdc](.cursor/rules/js-dev.mdc) | [js-dev.md](.claude/rules/js-dev.md) | **Проектирование:** `test-rules.cjs` |
| [comments-style.mdc](.cursor/rules/comments-style.mdc) | [comments-style.md](.claude/rules/comments-style.md) | **Комментарии:** стиль в коде, выравнивание inline-комментариев в командных fenced-блоках docs |
| [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc) | [docs-consistency.md](.claude/rules/docs-consistency.md) | **Синхронизация:** код ↔ все правила ↔ AGENTS ↔ README при изменении логики |
| [rules-sync.mdc](.cursor/rules/rules-sync.mdc) | [rules-sync.md](.claude/rules/rules-sync.md) | **Синхронизация правил:** карта соответствия `.mdc` ↔ `.md`, допустимые механические различия, порядок зеркалирования правок |

Перед правками — целевое правило, хелперы и примеры в `markdownlint-examples/`; повторяй локальные конвенции.

## Каталог правил (кратко)

| `names` | Суть |
| --- | --- |
| `minimum-h2-heading` | Минимум один H2 (`##` или setext) вне code fence |
| `list-items-end-with-semicolon-or-colon` | Пункт списка (num/bul, вложенные): `;`, перед открывающей `` ``` `` или **прямым дочерним** пунктом — `:`; конец тела через `findListItemBodyEnd` |
| `list-blank-line-spacing` | Numbered: blank до/после (EOF skip, same-kind skip) и единообразно между соседними `listItemPrefix` в ordered subtree (вложенные bul/num на любом уровне); bulleted: blank до/после блока (между пунктами не проверяется); blank после `##` перед списком обязателен |
| `list-preceded-by-colon` | Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня (num/bul) заканчивается `:`; skip prev: заголовок, пункт списка, code fence, pipe-таблица; вложенные не проверяются |
| `codeblock-preceded-by-colon` | Открывающая `` ``` ``: строка перед ней заканчивается `:` (обычный текст, не пункт списка); skip prev: заголовок, пункт списка, code fence, pipe-таблица |
| `no-leading-spaces` | Нет отступа у обычного текста, пунктов списка верхнего уровня и обозначений блока кода (`` ``` ``); вложенные пункты — при `indent >=` предыдущего |
| `sentences-end-with-mark` | Обычный текст (не заголовок, blockquote и продолжения, HR, пункт списка, pipe-таблица) заканчивается `.`, `!`, `?`, `:` или `;` |

Подробности и пути к примерам — в [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) / [markdownlint-project.md](.claude/rules/markdownlint-project.md).

## Рабочий процесс

1. **Read first** — правило в `src/rules/`, хелперы, `_err.md` / `_suc.md`;
2. **Design check** — одна политика на правило? дублирование вынести **только в рамках задачи**? ([ts-dev.mdc](.cursor/rules/ts-dev.mdc) / [ts-dev.md](.claude/rules/ts-dev.md));
3. **Minimal diff** — без drive-by refactor;
4. **Match conventions** — `extends BaseRule`, `AppContext`, [`src/details.ts`](src/details.ts), стиль как в файле;
5. **Preserve contracts** — `onError({ lineNumber, detail, context? })`, публичный API hlprs, runtime CommonJS;
6. **Register** — `new XxxRule(deps).toRule()` в [`src/markdownlint-rules.ts`](src/markdownlint-rules.ts); обновить cli2: `npm run sync:cli2-config` (через `presync:cli2-config` → build; custom keys из `markdownlint-rules.js`); новый checker → [`src/composition/app-context.ts`](src/composition/app-context.ts);
7. **Test** — `npm test` (pretest → build; test-rules + test-cli2-config + test-markdownlint-ignore + check-function-order);
8. **Sync docs** — по [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc) / [docs-consistency.md](.claude/rules/docs-consistency.md): правила (по матрице, оба каталога) → AGENTS → README;

Локальная проверка **папки или файла**: `npm run lint:md -- <path>`, `./bin/lint-markdown.sh <path>` (см. [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc) / [platform-scripts.md](.claude/rules/platform-scripts.md) для `.bat`/`.command`); **без пути** — `usage` и `exit 1`.

## Верификация

См. шаг 7 workflow. Дополнительно — `npm run check` (`precheck` → build, без cli2 parity): `tsc --noEmit`, `node --check` на 10 `.js`/`.cjs` (см. [`package.json`](package.json) `scripts.check`), затем `check-function-order.cjs`; `npm run check:order` (только порядок функций; входит в `npm test` и `npm run check`); `npm run lint:md -- <path>`, `npm run sync:cli2-config` (через `presync:cli2-config` → build: schema + overrides + custom keys из `markdownlint-rules.js`, `globs`, `gitignore`). **Parity cli2 ↔ schema** — только `npm test` (`test-cli2-config.cjs`); **.markdownlint-ignore** — `test-markdownlint-ignore.cjs` (интеграционный прогон cli2).

После правки примеров — `_err` срабатывает **только** на целевое custom-правило (полный конфиг); inline-кейсы в `test-rules.cjs` обязаны проходить.

## Критерии завершения аудита

- `npm test` и `npm run check` — зелёные;
- `npm run lint:md -- README.md AGENTS.md` — 0 ошибок;
- `.cursor/rules/*.mdc` и `.claude/rules/*.md` **намеренно** вне lint globs (`**/*.{md,markdown}` в [`.markdownlint-cli2.jsonc`](.markdownlint-cli2.jsonc)); аудит правил — статическая сверка с кодом/docs, не lint-fix каталога;
- Каталог 7 `names` идентичен в коде, cli2, AGENTS, README, обоих каталогах правил;
- Каждый sub-detail в [`src/details.ts`](src/details.ts) семантически соответствует политике в `markdownlint-project.mdc` / `markdownlint-project.md`;
- `test-rules.cjs` использует `regex.js` / `hlprs` вместо дублирующих inline-regex там, где есть канон; **test-only domain imports** (намеренно не в hlprs): `domain/micromark-parse.js` (`parseMicromarkTokens`), `domain/micromark-heading.js` (`hasMinimumH2`), `domain/outside-code-lines.js` (`isOpeningCodeFenceAt`, `eachOpeningCodeFenceLine`); `micromark-parse.js` также в runtime-пути hlprs `checkListBlankSpacing` (`ListSpacingChecker.checkLines`);
- Нет открытых расхождений между `.mdc`-примерами и фактическим кодом test/TS;

## Stop-condition аудита

Аудит считается **закрытым**, когда выполнены все пункты ниже. Дальнейшие правки — только по новой задаче, не «дочистка аудита»:

1. **`git status`** — чистая working tree (или весь WIP в одном атомарном коммите);
2. **Единый gate один раз в конце** (не по слоям):

```bash
npm test && npm run check && npm run lint:md -- README.md AGENTS.md
```

3. Все gate зелёные и нет открытых расхождений docs ↔ код ↔ тесты;
4. **Не коммитить** слайсовые «закрытие аудита» без связки: код + `test-rules.cjs` + examples + docs (см. [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc) / [docs-consistency.md](.claude/rules/docs-consistency.md));

## Границы

- Не угадывай — спроси при неясности;
- Не коммить/push, не менять конфиги VS Code — без явной просьбы;
- Не раздувать scope; не менять исходники пакета `markdownlint`;
- Runtime custom rules — CommonJS `.js`; не подключать `.ts` или ESM в markdownlint;
- Не padding-ить перед `=` и не переформатировать вне задачи;
- Bin/CLI — следовать [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc) / [platform-scripts.md](.claude/rules/platform-scripts.md);

## Коммуникация

Язык пользователя или репозитория; кратко: что, зачем, как проверено.
