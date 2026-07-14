# Checklist: audit-governor

## Источники истины

- `AGENTS.md`
- `README.md`
- `package.json`
- `.markdownlint-cli2.jsonc`
- `.cursor/rules/*.mdc` (16 файлов — канон, 1:1 отражён в `.claude/rules/*.md`):
  `agents-format.mdc`, `audit-governor.mdc`, `collaboration-boundaries.mdc`,
  `comments-style.mdc`, `commit-hygiene.mdc`, `docs-consistency.mdc`,
  `external-references.mdc`, `js-dev.mdc`, `js-style.mdc`,
  `markdownlint-project.mdc`, `platform-scripts.mdc`, `readme-format.mdc`,
  `release-notes.mdc`, `rules-sync.mdc`, `ts-dev.mdc`, `ts-style.mdc`

## Область аудита

### Режим `audit changed`

- Проверить `git status` (staged, unstaged, untracked).
- Определить base-ветку (`main` или `master`).
- Проверить все коммиты текущей ветки относительно base.
- Проверить итоговый diff ветки относительно base.

### Режим `audit full`

- Проверить все ключевые модули в `src/`.
- Проверить все тесты в `tests/`.
- Проверить документацию и `markdownlint-examples/`.
- Проверить правила (`AGENTS.md` + `.cursor/rules/*.mdc`) и агентные
  инструкции.

## Обязательные проверки качества

- Покрыть все пласты без исключений: код, тесты, примеры, docs,
  комментарии, правила, `AGENTS.md`.
- Подтвердить высокий инженерный уровень: SRP, DRY, минимализм, простота,
  читаемость.
- Консистентность кода, тестов, примеров, docs, правил.
- Каталог custom `names` идентичен в `markdownlint-rules.ts`/`.js`,
  `.markdownlint-cli2.jsonc`, `AGENTS.md`, `README.md`, обоих каталогах
  правил; sync round-trip проходит (`tests/test-cli2-config.cjs`).
- Комментарии: минимум, актуальность, выравнивание по
  `.cursor/rules/comments-style.mdc`.
- Проверить автоконтроль выравнивания GFM-таблиц и inline-`#` в командных
  fenced-блоках: `tests/test-markdown-tables.cjs` проходит в составе
  `npm test`.
- Проверить, что `tests/test-rules-consistency.cjs` проходит в составе
  `npm test`: симметрия пар `.cursor/rules/*.mdc` ↔ `.claude/rules/*.md`,
  идентичный порядок правил в `AGENTS.md`/`CLAUDE.md`/`rules-sync.mdc`,
  blockquote-ссылка и frontmatter в каждом файле-правиле (см.
  `.cursor/rules/rules-sync.mdc`) — это регрессионный барьер именно от того
  типа расхождений, которые ранее находились только вручную на разных
  прогонах аудита.
- Проверить контракт `onError({ lineNumber, detail, context? })` во всех
  правилах `src/rules/`.
- Проверить контракт `.markdownlint-ignore`: якорность многосегментных
  паттернов, интеграционный прогон `tests/test-markdownlint-ignore.cjs`.
- Проверить контракт веб-хука `notify.js`: `https://`-only URL, короткое
  сообщение, таймаут `2000` мс, fire-and-forget.
- Отсутствие необоснованных suppression-комментариев:
  - `// eslint-disable`
  - `@ts-ignore`
  - `@ts-expect-error`
- Не ограничиваться только последним коммитом в режиме `audit changed`.

## Обязательные команды

```bash
npm test                                  # tests/run-all + cli2/ignore/tables/rules-consistency + check-function-order
npm run check                             # tsc --noEmit + node --check + check-function-order
npm run lint:md -- README.md AGENTS.md    # 0 ошибок на изменённых docs
```

## Цикл выполнения

1. Найти несоответствия.
2. Исправить минимально и безопасно.
3. Повторить все 3 команды.
4. Выполнить повторный аудит тем же режимом.
5. Повторять до полного green.

## Definition of Done

- Все 3 команды зелёные.
- Нет расхождений между кодом, тестами, docs, примерами, правилами.
- Проверены и согласованы комментарии, а также правила/`AGENTS.md`.
- Комментарии соответствуют правилам и не раздуты.
- Кроссплатформенность bin-скриптов соблюдена.
- Нет необоснованных suppression-комментариев.
- При необходимости обновлены `.cursor/rules/*.mdc` и/или `AGENTS.md`
  минимально и по факту.
