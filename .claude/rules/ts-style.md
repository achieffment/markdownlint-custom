# Стиль TypeScript правил markdownlint

> Claude-эквивалент [`.cursor/rules/ts-style.mdc`](../../.cursor/rules/ts-style.mdc). Применяется при работе с `**/*.ts`.

Симметрия имён, конвейер, условия — как в [js-style.md](js-style.md). Проект — [markdownlint-project.md](markdownlint-project.md); проектирование — [ts-dev.md](ts-dev.md). При изменении конвенций TS — [docs-consistency.md](docs-consistency.md).

## Формат файла

- Исходники в [`src/`](../../src/); runtime — CommonJS `.js` после `npm run build`
- Типы markdownlint — `import type { RuleOnError } from "markdownlint"` ([`markdownlint-api.d.ts`](../../src/markdownlint-api.d.ts))
- Правило: `class XxxRule extends BaseRule` в [`src/rules/`](../../src/rules/); export class; регистрация в [`markdownlint-rules.ts`](../../src/markdownlint-rules.ts)
- [`BaseRule.toRule()`](../../src/core/base-rule.ts) — единственный способ получить `Rule`
- Barrels — composition root / wiring; без бизнес-логики
- `description` / `detail` — [`details.ts`](../../src/details.ts); regex — [`regex.ts`](../../src/regex.ts)
- **Не выравнивать** ключи и пробелы перед `=`

## TypeScript / OOP

- `import type` для типов; без `any`, `enum`, `@ts-ignore`
- `private readonly` для зависимостей в конструкторе правил и domain
- `readonly string[]` для `lines`
- `as const` в `details.ts`
- `module.exports` в barrels
- **Функции** (`const` / `export const`, методы класса, method в `module.exports`, колбэки) — всегда block body `{ return …; }` на отдельных строках; не expression arrow (`=> expr`), не однострочное `{ return x; }`

## Симметрия имён и конвейер

Как [js-style.md](js-style.md): `folcod`/`folsub`, guard + `{}` вокруг `onError`.

## Markdownlint

- `parser: "none" | "micromark"` через override `protected get parser()` в [`BaseRule`](../../src/core/base-rule.ts); `check(params, onError)` для line-based; `checkMicromark(params, onError)` для micromark
- **Checker entry:** `checkMicromark` — tokens + lines; `checkLines` — только `params.lines` (line-only checker’ы: `NoLeadingSpacesChecker`, `SentencesEndMarkChecker`; alias `ListSpacingChecker.checkLines` для hlprs)
- `onError({ lineNumber, detail, context? })`, `lineNumber` с 1
- **`detail`:** `this.description` для основного сообщения; `details.*` для sub-detail (`listItemsColon`, `listBlankBef`, …)
- **`context`:** полная `line` — indent-правила (`no-leading-spaces`, `colon-checker`); `trim` — prose (`ListItemsChecker`, `SentencesEndMarkChecker`, `ListSpacingChecker`)
- Runtime — **CommonJS**

## Чего не делать

- Логику в barrels
- Глубокие иерархии классов
- `defineRule` / свободные `check*` в корне `src/`
- Padding перед `=`
