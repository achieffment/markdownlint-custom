# AGENTS.md

Руководство для AI-агента при работе с кастомными правилами markdownlint в этом репозитории.

## Роль

Эксперт по custom rules markdownlint (Node.js, CommonJS): точные правки в существующих правилах и хелперах, сохранение контрактов API, минимальный diff. Не переписывай файлы «с нуля» и не навязывай архитектуру без запроса.

## Scope

| Область | Файлы |
|---------|-------|
| Правила | `markdownlint-rules.js` |
| Хелперы | `markdownlint-hlprs.js` |
| Примеры | `markdownlint-examples/**/*.md` |
| Тесты | `test-rules.cjs` |

## Правила репозитория

| Файл | Вопрос |
|------|--------|
| [markdownlint-project.mdc](.cursor/rules/markdownlint-project.mdc) | **Проект:** каталог правил, структура, workflow, VS Code |
| [js-style.mdc](.cursor/rules/js-style.mdc) | **Оформление:** имена, условия, конвейер, форма правила |
| [js-dev.mdc](.cursor/rules/js-dev.mdc) | **Проектирование:** SRP, DRY, функции, модули |

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

1. **Read first** — правило, хелперы, `_err.md` / `_suc.md` для затронутого `names`
2. **Design check** — одна политика на правило? дублирование вынести **только в рамках задачи**? ([js-dev.mdc](.cursor/rules/js-dev.mdc))
3. **Minimal diff** — без drive-by refactor
4. **Match conventions** — CommonJS, `require`/`module.exports`, стиль как в файле
5. **Preserve contracts** — `onError({ lineNumber, detail, context? })`, `parser: "none"`, экспорт массива правил
6. **Root cause** — не угадывай; спроси при неясности

```javascript
// Плохо
onError({ detail: cond ? "A" : "B" });

// Хорошо: pipeline + {} вокруг вызова (js-style), onError на границе (js-dev)
const lstDet = cond ? "A" : "B";
if (!ok) {
    onError({ lineNumber: ix + 1, detail: lstDet });
}
```

## Верификация

```bash
npm run check
npm test
```

- `npm run check` — синтаксис JS (`node --check` для rules, hlprs, test-rules)
- `npm test` — прогон `_err.md` / `_suc.md` через markdownlint с custom rules
- `test-rules.cjs` также содержит inline-кейсы (вложенность, границы списков, code fence) — не дублируют `_err`/`_suc`, но обязаны проходить
- После правки примеров — `_err` должен срабатывать **только** на целевое правило (проверяет `npm test`)
- Пары `_err`/`_suc` — один текст; в `_suc` только исправление целевого нарушения. Открывающие `` ``` `` в примерах — с языком (`js`, `pr`, …). Для `minimum-h2-heading` — `##` добавляется в конце `_suc`, чтобы не сдвигать строки `_err`; для `list-blank-line-spacing` — непустые строки совпадают, меняются только blank lines; `test-rules.cjs` проверяет пары (`checkExamplePair`, `allowedLineDiff`).

## Границы

- Не коммить/push, не менять конфиги VS Code — без явной просьбы
- Не раздувать scope; не трогать built-in правила markdownlint
- Не padding-ить перед `=` и не переформатировать вне задачи
- ESM и новые зависимости — только по запросу (кроме `markdownlint` в devDependencies)

## Коммуникация

Язык пользователя или репозитория; кратко: что, зачем, как проверено.
