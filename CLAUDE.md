# CLAUDE.md

Справочник и правила проекта для Claude Code — эквивалент `.cursor/rules/` для Cursor. Основной AI-справочник — @AGENTS.md.

## Правила (Claude)

Детальные политики — в `.claude/rules/` (перенесены из `.cursor/rules/*.mdc`, содержание синхронизировано):

- [`.claude/rules/markdownlint-project.md`](.claude/rules/markdownlint-project.md) — структура репозитория, каталог lint-правил, политики, конфиг `.markdownlint-cli2.jsonc`;
- [`.claude/rules/platform-scripts.md`](.claude/rules/platform-scripts.md) — кроссплатформенный запуск, bootstrap в `bin/lint-markdown.cjs`;
- [`.claude/rules/ts-style.md`](.claude/rules/ts-style.md) — оформление `src/**/*.ts`;
- [`.claude/rules/ts-dev.md`](.claude/rules/ts-dev.md) — проектирование TS-модулей (SRP/DRY, порядок функций);
- [`.claude/rules/js-style.md`](.claude/rules/js-style.md) — оформление `test-rules.cjs`;
- [`.claude/rules/js-dev.md`](.claude/rules/js-dev.md) — проектирование `test-rules.cjs`;
- [`.claude/rules/docs-consistency.md`](.claude/rules/docs-consistency.md) — синхронизация кода и всех документов при изменениях;
- [`.claude/rules/rules-sync.md`](.claude/rules/rules-sync.md) — двусторонняя синхронизация правил Cursor (`.mdc`) и Claude (`.md`);

Перед правками в соответствующей области — прочитать релевантное правило.

## Синхронизация с Cursor

Проект поддерживает оба редактора: `.cursor/rules/*.mdc` (Cursor) и `.claude/rules/*.md` (Claude) содержат один и тот же канон. При изменении политики — обновлять обе версии одновременно (см. [`.claude/rules/docs-consistency.md`](.claude/rules/docs-consistency.md)).
