# AGENTS.md

Руководство для AI-агента при работе с кастомными правилами markdownlint в этом репозитории.

## Роль

Эксперт по custom rules markdownlint (TypeScript → CommonJS): точные правки в правилах и хелперах, сохранение контрактов API, минимальный diff. Не переписывай файлы «с нуля» и не навязывай архитектуру без запроса.

## Scope

| Область | Файлы |
|---------|-------|
| Правила | `src/rules/*.ts` (`extends BaseRule`), barrel `src/markdownlint-rules.ts` |
| Domain / core | `src/core/`, `src/domain/`, `src/composition/app-context.ts` |
| Barrels | `src/markdownlint-rules.ts`, `src/markdownlint-hlprs.ts` |
| Runtime | корневые `*.js`, `rules/*.js` (артефакты tsc; entry points: `markdownlint-rules.js`, `markdownlint-hlprs.js`) |
| Примеры | `markdownlint-examples/**/*.md` |
| Тесты | `test-rules.cjs` |

## Правила репозитория

| Файл | Вопрос |
|------|--------|
| [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) | **Проект:** каталог правил, структура, workflow, VS Code |
| [ts-style.mdc](.cursor/rules/ts-style.mdc) | **Оформление TS/OOP:** BaseRule, классы, типы |
| [ts-dev.mdc](.cursor/rules/ts-dev.mdc) | **Проектирование TS:** SRP, DRY, модули |
| [js-style.mdc](.cursor/rules/js-style.mdc) | **Оформление:** `test-rules.cjs` |
| [js-dev.mdc](.cursor/rules/js-dev.mdc) | **Проектирование:** `test-rules.cjs` |

Перед правками — целевое правило, хелперы и примеры в `markdownlint-examples/`; повторяй локальные конвенции.

## Каталог правил (кратко)

| `names` | Суть |
|---------|------|
| `minimum-h2-heading` | Минимум один `##` вне code fence |
| `list-items-end-with-semicolon-or-colon` | `;`, перед блоком кода или вложенным подсписком — `:` |
| `list-blank-line-spacing` | Numbered: blank до/после (EOF skip, same-kind skip) и единообразно между соседними num-пунктами блока (включая `1.1`, `1.1.1`); bulleted: blank до/после блока |
| `list-preceded-by-colon` | Обычный текст (не пункт списка) перед первым пунктом блока верхнего уровня (num/bul) заканчивается `:`; вложенные не проверяются |
| `codeblock-preceded-by-colon` | Открывающая `` ``` ``: строка перед ней заканчивается `:` (обычный текст, не пункт списка) |
| `no-leading-spaces` | Нет отступа у обычного текста, пунктов списка верхнего уровня и обозначений блока кода (`` ``` ``); вложенные пункты — при `indent >=` предыдущего |
| `sentences-end-with-mark` | Обычный текст заканчивается `.`, `!`, `?`, `:` или `;` |

Подробности и пути к примерам — в [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc).

## Рабочий процесс

1. **Read first** — правило в `src/rules/`, хелперы, `_err.md` / `_suc.md`
2. **Design check** — одна политика на правило? дублирование вынести **только в рамках задачи**? ([ts-dev.mdc](.cursor/rules/ts-dev.mdc))
3. **Minimal diff** — без drive-by refactor
4. **Match conventions** — `extends BaseRule`, `AppContext`, [`src/details.ts`](src/details.ts), стиль как в файле
5. **Preserve contracts** — `onError({ lineNumber, detail, context? })`, публичный API hlprs, runtime CommonJS
6. **Register** — `new XxxRule(deps).toRule()` в [`src/markdownlint-rules.ts`](src/markdownlint-rules.ts)
7. **Build** — после правки `src/`: `npm run build`
8. **Root cause** — не угадывай; спроси при неясности

## Верификация

```bash
npm test
```

Полная верификация — `npm test` (`pretest` запускает `build`). `npm run check` — `tsc --noEmit` + `node --check` артефактов; **не** пересобирает tsc.

- `test-rules.cjs` также содержит inline-кейсы — обязаны проходить
- После правки примеров — `_err` должен срабатывать **только** на целевое правило

## Границы

- Не коммить/push, не менять конфиги VS Code — без явной просьбы
- Не раздувать scope; не трогать built-in правила markdownlint
- Runtime custom rules — CommonJS `.js`; не подключать `.ts` или ESM в markdownlint
- Не padding-ить перед `=` и не переформатировать вне задачи

## Коммуникация

Язык пользователя или репозитория; кратко: что, зачем, как проверено.
