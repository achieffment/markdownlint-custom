# AGENTS.md

## Обзор

Краткий справочник для AI-агента при работе с кастомными правилами markdownlint в этом репозитории.

## Роль

Эксперт по custom rules markdownlint (TypeScript → CommonJS) и кроссплатформенному запуску (Windows CMD, Linux, macOS, WSL): точные правки в правилах и хелперах, минимальный bootstrap в [`bin/lint-markdown.cjs`](bin/lint-markdown.cjs) (`node_modules`, stale build артефактов), сохранение контрактов API, минимальный diff. Не переписывай файлы «с нуля» и не навязывай архитектуру без запроса.

## Scope

| Область        | Файлы                                                                                                                                                                                                                                            |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Правила        | `src/rules/*.ts` (`extends BaseRule`), barrel `src/markdownlint-rules.ts`, `src/details.ts`, `src/regex.ts`, `src/types.ts`, `src/markdownlint-api.d.ts`                                                                                         |
| Domain / core  | `src/core/`, `src/domain/`, `src/composition/app-context.ts`                                                                                                                                                                                     |
| Barrels        | `src/markdownlint-rules.ts`, `src/markdownlint-hlprs.ts`                                                                                                                                                                                         |
| Runtime        | корневые `*.js`, `core/`, `domain/`, `composition/`, `rules/` (артефакты tsc; entry points: `markdownlint-rules.js`, `markdownlint-hlprs.js`, `notify.js`)                                                                                       |
| Конфиг lint    | `.markdownlint-cli2.jsonc`, `.markdownlint-ignore`, `load-cli2-config.cjs`, `schema/`, `scripts/` (`sync-cli2-config.cjs`, `cli2-overrides.cjs`)                                                                                                 |
| CLI / bin      | `bin/lint-markdown.cjs`, `bin/lint-markdown.{sh,bat,command}`                                                                                                                                                                                    |
| Уведомления    | `src/notify.ts` → `notify.js`; `.env.example` (`MDLINT_WEBHOOK_URL`/`_TOK`)                                                                                                                                                                      |
| Примеры        | `markdownlint-examples/**/*.md`                                                                                                                                                                                                                  |
| Тесты          | `tests/` (`run-all.cjs`, `helpers.cjs`, `examples.test.cjs`, `hlprs.test.cjs`, `rules/*.test.cjs`, `test-cli2-config.cjs`, `test-markdownlint-ignore.cjs`, `test-markdown-tables.cjs`, `test-rules-consistency.cjs`), `check-function-order.cjs` |
| Cursor rules   | `.cursor/rules/*.mdc`                                                                                                                                                                                                                            |
| Claude rules   | `.claude/rules/*.md`, `CLAUDE.md`                                                                                                                                                                                                                |
| Repo / tooling | `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.npmrc`                                                                                                                                                                              |
| Docs           | `README.md`, `AGENTS.md`                                                                                                                                                                                                                         |

**Lint:** весь markdown workspace (кроме `node_modules`, `vendor`); внешняя docs — `npm run lint:md -- <path>`. Подробнее — [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) / [markdownlint-project.md](.claude/rules/markdownlint-project.md) (Scope lint).

## Правила репозитория

Правила продублированы для двух редакторов: Cursor (`.cursor/rules/*.mdc`) и Claude Code (`.claude/rules/*.md`, точка входа — [`CLAUDE.md`](CLAUDE.md)). Содержание синхронно.

| Cursor                                                                     | Claude                                                                   | Вопрос                                                                                                                       |
|----------------------------------------------------------------------------|--------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| [agents-format.mdc](.cursor/rules/agents-format.mdc)                       | [agents-format.md](.claude/rules/agents-format.md)                       | **Формат:** канонический скелет `AGENTS.md`/`CLAUDE.md` и файла-правила                                                      |
| [audit-governor.mdc](.cursor/rules/audit-governor.mdc)                     | [audit-governor.md](.claude/rules/audit-governor.md)                     | **Аудит:** единый контракт аудита правок и проекта; запуск — skill `audit-governor`                                          |
| [collaboration-boundaries.mdc](.cursor/rules/collaboration-boundaries.mdc) | [collaboration-boundaries.md](.claude/rules/collaboration-boundaries.md) | **Границы:** поведение агента и стиль коммуникации                                                                           |
| [comments-style.mdc](.cursor/rules/comments-style.mdc)                     | [comments-style.md](.claude/rules/comments-style.md)                     | **Комментарии:** стиль в коде, выравнивание inline-комментариев в командных fenced-блоках docs                               |
| [commit-hygiene.mdc](.cursor/rules/commit-hygiene.mdc)                     | [commit-hygiene.md](.claude/rules/commit-hygiene.md)                     | **Коммиты:** секреты перед коммитом, стилистика commit-сообщений                                                             |
| [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc)                 | [docs-consistency.md](.claude/rules/docs-consistency.md)                 | **Синхронизация:** код ↔ все правила ↔ AGENTS ↔ README при изменении логики                                                  |
| [external-references.mdc](.cursor/rules/external-references.mdc)           | [external-references.md](.claude/rules/external-references.md)           | **Самодостаточность:** запрет ссылок на внешние проекты-источники                                                            |
| [js-dev.mdc](.cursor/rules/js-dev.mdc)                                     | [js-dev.md](.claude/rules/js-dev.md)                                     | **Проектирование:** `tests/**/*.cjs`                                                                                         |
| [js-style.mdc](.cursor/rules/js-style.mdc)                                 | [js-style.md](.claude/rules/js-style.md)                                 | **Оформление:** `tests/**/*.cjs`                                                                                             |
| [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc)         | [markdownlint-project.md](.claude/rules/markdownlint-project.md)         | **Проект:** политики lint-правил, примеры, API hlprs, структура, `.markdownlint-cli2.jsonc`, CLI                             |
| [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc)                 | [platform-scripts.md](.claude/rules/platform-scripts.md)                 | **Платформы:** bin-скрипты, bootstrap в `lint-markdown.cjs`                                                                  |
| [readme-format.mdc](.cursor/rules/readme-format.mdc)                       | [readme-format.md](.claude/rules/readme-format.md)                       | **README:** формат вводной части (секция «Обзор»)                                                                            |
| [release-notes.mdc](.cursor/rules/release-notes.mdc)                       | [release-notes.md](.claude/rules/release-notes.md)                       | **Релизы:** формат названий и описаний релизов GitHub                                                                        |
| [rules-sync.mdc](.cursor/rules/rules-sync.mdc)                             | [rules-sync.md](.claude/rules/rules-sync.md)                             | **Синхронизация правил:** карта соответствия `.mdc` ↔ `.md`, допустимые механические различия, порядок зеркалирования правок |
| [ts-dev.mdc](.cursor/rules/ts-dev.mdc)                                     | [ts-dev.md](.claude/rules/ts-dev.md)                                     | **Проектирование TS:** SRP, DRY, модули                                                                                      |
| [ts-style.mdc](.cursor/rules/ts-style.mdc)                                 | [ts-style.md](.claude/rules/ts-style.md)                                 | **Оформление TS/OOP:** BaseRule, классы, типы                                                                                |

Перед правками — целевое правило, хелперы и примеры в `markdownlint-examples/`; повторяй локальные конвенции.

## Синхронизация с Claude

Проект поддерживает оба редактора: `.cursor/rules/*.mdc` (Cursor) и `.claude/rules/*.md` (Claude Code, точка входа — [`CLAUDE.md`](CLAUDE.md)) содержат один и тот же канон. Синхронизация двусторонняя: Cursor → Claude и Claude → Cursor — правка, начатая в любом из двух наборов, переносится в парный в этом же шаге, не «потом» (см. [`.claude/rules/rules-sync.md`](.claude/rules/rules-sync.md)).

## Каталог правил (кратко)

| `names`                                  | Суть                                                                                                                                                                                                                                                                 |
|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `minimum-h2-heading`                     | Минимум один H2 (`##` или setext) вне code fence                                                                                                                                                                                                                     |
| `list-items-end-with-semicolon-or-colon` | Пункт списка (num/bul, вложенные): `;`, перед открывающей `` ``` `` или **прямым дочерним** пунктом — `:`; конец тела через `findListItemBodyEnd`                                                                                                                    |
| `list-blank-line-spacing`                | Numbered: blank до/после (EOF skip, same-kind skip) и единообразно между соседними `listItemPrefix` в ordered subtree (вложенные bul/num на любом уровне); bulleted: blank до/после блока (между пунктами не проверяется); blank после `##` перед списком обязателен |
| `list-preceded-by-colon`                 | Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня (num/bul) заканчивается `:`; skip prev: заголовок, пункт списка, code fence, pipe-таблица; вложенные не проверяются                                                                       |
| `codeblock-preceded-by-colon`            | Открывающая `` ``` ``: строка перед ней заканчивается `:` (обычный текст, не пункт списка); skip prev: заголовок, пункт списка, code fence, pipe-таблица                                                                                                             |
| `no-leading-spaces`                      | Нет отступа у обычного текста, пунктов списка верхнего уровня и обозначений блока кода (`` ``` ``); вложенные пункты — при `indent >=` предыдущего                                                                                                                   |
| `sentences-end-with-mark`                | Обычный текст (не заголовок, blockquote и продолжения, HR, пункт списка, pipe-таблица) заканчивается `.`, `!`, `?`, `:` или `;`                                                                                                                                      |

Подробности и пути к примерам — в [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) / [markdownlint-project.md](.claude/rules/markdownlint-project.md).

## Рабочий процесс

1. **Read first** — правило в `src/rules/`, хелперы, `_err.md` / `_suc.md`;
2. **Design check** — одна политика на правило? дублирование вынести **только в рамках задачи**? ([ts-dev.mdc](.cursor/rules/ts-dev.mdc) / [ts-dev.md](.claude/rules/ts-dev.md));
3. **Minimal diff** — без drive-by refactor;
4. **Match conventions** — `extends BaseRule`, `AppContext`, [`src/details.ts`](src/details.ts), стиль как в файле;
5. **Preserve contracts** — `onError({ lineNumber, detail, context? })`, публичный API hlprs, runtime CommonJS;
6. **Register** — `new XxxRule(deps).toRule()` в [`src/markdownlint-rules.ts`](src/markdownlint-rules.ts); обновить cli2: `npm run sync:cli2-config` (через `presync:cli2-config` → build; custom keys из `markdownlint-rules.js`); новый checker → [`src/composition/app-context.ts`](src/composition/app-context.ts);
7. **Test** — `npm test` (pretest → build; tests/run-all + tests/test-cli2-config + tests/test-markdownlint-ignore + tests/test-markdown-tables + tests/test-rules-consistency + check-function-order);
8. **Sync docs** — по [docs-consistency.mdc](.cursor/rules/docs-consistency.mdc) / [docs-consistency.md](.claude/rules/docs-consistency.md): правила (по матрице, оба каталога) → AGENTS → README;

Локальная проверка **папки или файла**: `npm run lint:md -- <path>`, `./bin/lint-markdown.sh <path>` (см. [platform-scripts.mdc](.cursor/rules/platform-scripts.mdc) / [platform-scripts.md](.claude/rules/platform-scripts.md) для `.bat`/`.command`); **без пути** — `usage` и `exit 1`.

## Верификация

См. шаг 7 workflow. Дополнительно — `npm run check` (`precheck` → build, без cli2 parity): `tsc --noEmit`, `node --check` на все `.js`/`.cjs` (см. [`package.json`](package.json) `scripts.check`), затем `check-function-order.cjs`; `npm run check:order` (только порядок функций; входит в `npm test` и `npm run check`); `npm run lint:md -- <path>`, `npm run sync:cli2-config` (через `presync:cli2-config` → build: schema + overrides + custom keys из `markdownlint-rules.js`, `globs`, `gitignore`). **Parity cli2 ↔ schema** — только `npm test` (`test-cli2-config.cjs`); **.markdownlint-ignore** — `test-markdownlint-ignore.cjs` (интеграционный прогон cli2); **Таблицы Markdown** — `test-markdown-tables.cjs` (выравнивание столбцов GFM-таблиц по всему проекту); **Inline-комментарии Markdown** — `test-markdown-comments.cjs` (выравнивание `#` в командных fenced-блоках docs); **Консистентность правил** — `test-rules-consistency.cjs` (симметрия пар `.claude/rules/*.md` ↔ `.cursor/rules/*.mdc`, идентичный порядок трёх листингов, blockquote-ссылки, frontmatter).

После правки примеров — `_err` срабатывает **только** на целевое custom-правило (полный конфиг); inline-кейсы в `tests/rules/*.test.cjs` обязаны проходить.

## Границы

Не угадывать при неясности, не коммитить/push без явной просьбы, не раздувать scope, не трогать сторонние пакеты, не переформатировать вне задачи. Детали — [`collaboration-boundaries.md`](.claude/rules/collaboration-boundaries.md) (Cursor: [`collaboration-boundaries.mdc`](.cursor/rules/collaboration-boundaries.mdc)).

## Коммуникация

Язык пользователя или репозитория; кратко: что сделано, зачем и как проверено. Детали — [`collaboration-boundaries.md`](.claude/rules/collaboration-boundaries.md).

## Аудит изменений и проекта

- Для аудитов использовать project skill `audit-governor` с режимами `audit changed` и `audit full`;
- Единый контракт аудита закреплён в skill `audit-governor` (Claude Code: `.claude/skills/audit-governor/`; Cursor: `.cursor/rules/audit-governor.mdc`); его требования обязательны при любом запросе аудита;
- В режиме `audit changed` проверять весь набор правок: staged/unstaged/untracked, все коммиты ветки от base (`main`) и итоговый diff; не ограничиваться последним коммитом;
- После правок по результатам аудита повторять полный цикл проверок до green: `npm test && npm run check && npm run lint:md -- README.md AGENTS.md`;
- Аудит обязателен по всем пластам: код, тесты, примеры, docs, комментарии, правила и `AGENTS.md`;
