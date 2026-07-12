# Проектирование TypeScript правил markdownlint

> Claude-эквивалент [`.cursor/rules/ts-dev.mdc`](../../.cursor/rules/ts-dev.mdc). Применяется при работе с `**/*.ts`.

SRP/DRY — те же принципы, что в [js-dev.md](js-dev.md) (для test harness). Оформление — [ts-style.md](ts-style.md). Синхронизация docs — [docs-consistency.md](docs-consistency.md).

**База:** composition over inheritance; один уровень наследования правил (`BaseRule`); контракт `onError` и публичный API hlprs сохранять. Задачи с CLI/bin — [platform-scripts.md](platform-scripts.md).

## Модули `src/`

| Каталог                                  | SRP                                                                                                                                                                                                                                                                                                                                                                |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`core/`](../../src/core/)               | `ICustomRule`, `abstract BaseRule` (Template Method `toRule()`)                                                                                                                                                                                                                                                                                                    |
| [`domain/`](../../src/domain/)           | `ListLineParser`, `list-item-body-end`, `outside-code-lines` (`skipFenceBlockFwd`/`skipFenceBlockBck`, `isOpeningCodeFenceAt`), `line-list-walker`, `micromark-token-utils`, `micromark-lists`, `micromark-heading`, `micromark-parse`, `ListSpacingChecker`, `ColonChecker`, `micromark-list-checkers`, `no-leading-spaces-checker`, `sentences-end-mark-checker` |
| [`composition/`](../../src/composition/) | `AppContext` — wiring singleton-ов                                                                                                                                                                                                                                                                                                                                 |
| [`rules/`](../../src/rules/)             | Класс `XxxRule extends BaseRule` — одна политика                                                                                                                                                                                                                                                                                                                   |
| `regex.ts`, `details.ts`                 | Константы (не классы)                                                                                                                                                                                                                                                                                                                                              |
| `types.ts`                               | Типы колбэков                                                                                                                                                                                                                                                                                                                                                      |
| `markdownlint-rules.ts`                  | Composition root: `new XxxRule(deps).toRule()`                                                                                                                                                                                                                                                                                                                     |
| `markdownlint-hlprs.ts`                  | Wiring `module.exports` для test-rules                                                                                                                                                                                                                                                                                                                             |
| `notify.ts`                              | Веб-хук CLI-уведомлений (`.env` → `MDLINT_WEBHOOK_URL`/`_TOK`, fire-and-forget, короткий таймаут); не lint-правило, используется только `bin/lint-markdown.cjs`                                                                                                                                                                                                    |

## OOP

- **Наследование:** только `extends BaseRule`; без цепочек `ListRule → NumListRule`
- **Composition:** правила получают checker/parser/walker через `constructor(private readonly ...)`
- **Domain-классы** не наследуют друг друга; делегируют через поля
- **≥3 связанных методов с общим state** (`lines`, parser) — **class**, не closure factory (`createHelpers`); stateless utility-модули (`outside-code-lines`, `micromark-lists`) — функции
- **`onError`** — на границе `checkMicromark()` / `check()` / методов checker-ов
- **Composition root** — `app-context.ts`, barrels; не создавать `new` в domain вне root

## Порядок функций

В каждой области видимости (модуль, class body, блок с `const`-стрелками) **вызываемая идёт раньше вызывающей**: прямой вызов `foo()`, `this.foo()` между siblings. Проверка: `npm run check:order` (входит в `npm test` и `npm run check`). Scope: `src/**/*.ts`, `tests/**/*.cjs` (не `bin/`, `scripts/`). Эталон — [`line-list-walker.ts`](../../src/domain/line-list-walker.ts) (`LineListBlockWalker` class body).

## Workflow

Общий порядок — [AGENTS.md](../../AGENTS.md). TS-специфика — [markdownlint-project.md](markdownlint-project.md) («Специфика lint-правила», п. 1–4).

## Границы

- Не менять политики без `markdownlint-examples/`
- Runtime — CommonJS `.js`
- `tests/**/*.cjs` — [js-dev.md](js-dev.md)
