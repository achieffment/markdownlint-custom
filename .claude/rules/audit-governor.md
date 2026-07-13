# Audit-governor: обязательный контракт аудита

> Claude-эквивалент [`.cursor/rules/audit-governor.mdc`](../../.cursor/rules/audit-governor.mdc). Применяется всегда.

Практический запуск в Claude Code — skill [`audit-governor`](../skills/audit-governor/SKILL.md).

Для запросов аудита использовать единый подход:

- режим `audit changed` — аудит всех внесённых правок;
- режим `audit full` — аудит всего проекта.

## Обязательный охват

Проверяются все пласты без исключений:

- код (`src/`, tsc-артефакты в корне);
- тесты (`tests/`);
- примеры (`markdownlint-examples/`);
- документация (`README.md`, `AGENTS.md`, `CLAUDE.md`);
- комментарии;
- правила проекта (`.claude/rules/*.md` / `.cursor/rules/*.mdc`);
- конфиг lint (`.markdownlint-cli2.jsonc`, `schema/`, `scripts/`).

## Критерии качества

- высокий инженерный уровень реализации: SRP, DRY, минимализм, простота,
  читаемость (см. [ts-dev.md](ts-dev.md) / [js-dev.md](js-dev.md));
- консистентность каталога custom `names` между кодом
  ([`markdownlint-rules.ts`](../../src/markdownlint-rules.ts)),
  [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) и всеми docs;
- кроссплатформенность bin-скриптов ([platform-scripts.md](platform-scripts.md));
- отсутствие необоснованных suppression-комментариев
  (`// eslint-disable`, `@ts-ignore`, `@ts-expect-error`) — оправданные
  случаи (`no-require-imports` в domain-модулях, читающих CommonJS API
  `markdownlint`) уже задокументированы в коде, новые suppression без
  аналогичного обоснования недопустимы.

## Обязательные точечные проверки (spot-checks)

- контракт `onError({ lineNumber, detail, context? })`: `lineNumber` с 1,
  `detail` — из [`details.ts`](../../src/details.ts) (см.
  [ts-style.md](ts-style.md));
- `parser: "none" | "micromark"` у каждого правила соответствует политике в
  [markdownlint-project.md](markdownlint-project.md) (3 micromark-правила, 4
  line-based);
- якорность `.markdownlint-ignore`: многосегментные паттерны — якорные от
  корня репозитория, однос сегментный `docs/` — неякорный (см.
  [platform-scripts.md](platform-scripts.md));
- веб-хук `notify.js`: URL обязан быть `https://`, короткое сообщение (не
  список нарушений), таймаут `2000` мс, fire-and-forget;
- выравнивание GFM-таблиц и inline-`#`-комментариев в командных
  fenced-блоках docs — по [comments-style.md](comments-style.md);
- симметрия и порядок трёх листингов правил (`AGENTS.md`, `CLAUDE.md`,
  `rules-sync.md`) — проверяется тестом
  [`tests/test-rules-consistency.cjs`](../../tests/test-rules-consistency.cjs).

## Обязательный цикл

После исправлений запускать до полного green:

    npm test
    npm run check
    npm run lint:md -- README.md AGENTS.md

`npm test` включает `tests/test-rules-consistency.cjs`,
`tests/test-cli2-config.cjs`, `tests/test-markdownlint-ignore.cjs`,
`tests/test-markdown-tables.cjs` и `check-function-order.cjs` — все
обязательны к прохождению, ни один не пропускается выборочно.

## Stop-condition аудита

Аудит считается **закрытым**, когда выполнены все пункты ниже. Дальнейшие правки —
только по новой задаче, не «дочистка аудита»:

1. **`git status`** — чистая working tree (или весь WIP в одном атомарном коммите);
2. **Единый gate один раз в конце** (не по слоям, см. «Обязательный цикл» выше);
3. Все gate зелёные и нет открытых расхождений docs ↔ код ↔ тесты ↔ examples;
4. **Не коммитить** слайсовые «закрытие аудита» без связки: код + тесты +
   examples + docs (см. [docs-consistency.md](docs-consistency.md)).

## Гибкость правил

Если для прохождения проверок требуется корректировка `.claude/rules/*.md` /
`.cursor/rules/*.mdc` или `AGENTS.md`, изменения вносятся минимально, согласованно
и только по фактической необходимости.
