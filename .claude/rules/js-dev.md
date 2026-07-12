# Проектирование tests/**/*.cjs

> Claude-эквивалент [`.cursor/rules/js-dev.mdc`](../../.cursor/rules/js-dev.mdc). Применяется при работе с `tests/**/*.cjs`.

Исходники правил и domain — [ts-dev.md](ts-dev.md). Оформление inline-кейсов — [js-style.md](js-style.md). Проект — [markdownlint-project.md](markdownlint-project.md). При изменении конвенций test — [docs-consistency.md](docs-consistency.md).

**База:** минимальный diff; SRP/DRY не повод для рефактора без запроса; не менять сигнатуры hlprs, формат `onError({ lineNumber, detail, context? })`. Примеры lintятся через `config` из [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) ([`load-cli2-config.cjs`](../../load-cli2-config.cjs)) + `customRules` отдельно; inline-кейсы — `{ default: false }`. CLI/bin — [platform-scripts.md](platform-scripts.md).

## Структура `tests/`

- [`tests/helpers.cjs`](../../tests/helpers.cjs) — вся общая инфраструктура (`assert`/`getFailed`, `lintStrings`/`lintStringsFull`, `getViolations`/`getFiredRules`, `checkExamplePair`, `checkExampleFenceLang`, `collectErrs`, `collectCases`); общий mutable-счётчик ошибок — единственный singleton (Node кеширует модуль по resolved path), расшарен между всеми файлами, которые его `require()`;
- [`tests/examples.test.cjs`](../../tests/examples.test.cjs) — кросс-правиловая проверка (sync правил↔`markdownlint-examples/`, H2-exclusivity, `checkExamplePair`, fence-lang, ожидаемое сработавшее правило на `_err`/чистота на `_suc`);
- [`tests/hlprs.test.cjs`](../../tests/hlprs.test.cjs) — unit-тесты публичного API `markdownlint-hlprs.js` и test-only domain-хелперов;
- `tests/rules/<rule-name>.test.cjs` — **1 файл на custom lint-правило**: rule-specific sub-detail проверки (`_err.md` sub-details), multi-violation counts, все inline `lintStrings`/`lintStringsFull` кейсы для этого правила;
- [`tests/run-all.cjs`](../../tests/run-all.cjs) — entry point (`npm test`): требует `examples.test.cjs` (hard stop при провале — до inline-кейсов, как раньше), затем `hlprs.test.cjs` и все `tests/rules/*.test.cjs`, финальная проверка `getFailed()`.

Новое custom lint-правило — новый `tests/rules/<rule-name>.test.cjs` + `require()` в `run-all.cjs` + `node --check` в `package.json` `scripts.check`.

## SRP

Одна единица — **одна причина для изменения**.

- **Файл** `tests/rules/<rule>.test.cjs` — один custom lint-правило, ничего от других правил
- **Функция** — одна проверка, один inline-кейс, одна assert-группа
- **Const-хелпер** в `tests/helpers.cjs` — одна операция (`lintStrings`, `getFiredRules`)
- Разные сценарии — разные блоки inline-кейсов

```javascript
// Плохо: одна function на 80+ строк с несвязанными ветками
// Хорошо: findListItemBodyEnd — конец тела пункта; boundBefIdx — только границы blank
```

## DRY

Выносить повтор, только если совпадают **алгоритм и смысл** — не «похожие строки».

- Внутри inline-кейса — локальные const; не дублировать логику domain (lint через custom rules)
- **WET лучше неверной абстракции** — похожие markdown-строки в разных кейсах допустимы
- Выносить хелпер в `tests/helpers.cjs` — если **≥3 повтора** между `tests/rules/*.test.cjs` (не для `src/domain/` — там см. [ts-dev.md](ts-dev.md))

## Test-only domain imports

`tests/hlprs.test.cjs` намеренно импортирует из `domain/` напрямую (не через `markdownlint-hlprs.js`), через `tests/helpers.cjs`:

| Модуль | Экспорт | Назначение |
|--------|---------|------------|
| `domain/micromark-parse.js` | `parseMicromarkTokens` | exclusivity H2, inline spacing |
| `domain/micromark-heading.js` | `hasMinimumH2` | exclusivity примеров, setext-кейсы |
| `domain/outside-code-lines.js` | `isOpeningCodeFenceAt`, `eachOpeningCodeFenceLine` | folcod unit-тесты, `checkExampleFenceLang` |

Не переносить в публичный API hlprs без явного запроса — раздувает контракт.

## Порядок функций

Top-level `const`-хелперы и вложенные `const`-стрелки — **callee перед caller** (как в [ts-dev.md](ts-dev.md)). Проверка: `npm run check:order` (входит в `npm test` и `npm run check`). Scope: `src/**/*.ts`, `tests/**/*.cjs`.

## Функции и модули

- **Guard clauses**, ранний `return`; `onError` — на границе правила, не внутри парсера
- **Чистые хелперы** без побочных эффектов; closure на `lines` — ок для API markdownlint
- **Pipeline** вместо вложенных вызовов — [js-style.md](js-style.md)
- **CommonJS** как в файле; без side effects при `require`; ESM и `npm install` — только по запросу
- **Ошибки:** fail fast; через `onError`, не `try/catch` вокруг всего правила

## Когда рефакторить

1. Задача явно просит — иначе точечная правка
2. ≥3 повтора между `tests/rules/*.test.cjs` и меняются вместе — или функция стала двусмысленной
3. Не выносить хелперы «на будущее»; domain-логика — в `src/domain/`, не в test
