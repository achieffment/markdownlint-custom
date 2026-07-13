# CLAUDE.md

Справочник и правила проекта для Claude Code — эквивалент `.cursor/rules/` для Cursor. Основной AI-справочник — @AGENTS.md.

## Правила (Claude)

Детальные политики — в `.claude/rules/` (перенесены из `.cursor/rules/*.mdc`, содержание синхронизировано):

- [`.claude/rules/agents-format.md`](.claude/rules/agents-format.md) — канонический скелет `AGENTS.md`/`CLAUDE.md` и формат файла-правила;
- [`.claude/rules/audit-governor.md`](.claude/rules/audit-governor.md) — единый контракт аудита правок и всего проекта; практический запуск — skill [`audit-governor`](.claude/skills/audit-governor/SKILL.md);
- [`.claude/rules/collaboration-boundaries.md`](.claude/rules/collaboration-boundaries.md) — границы работы агента и стиль коммуникации с пользователем;
- [`.claude/rules/comments-style.md`](.claude/rules/comments-style.md) — стиль комментариев в коде и выравнивание inline-комментариев в документации;
- [`.claude/rules/commit-hygiene.md`](.claude/rules/commit-hygiene.md) — секреты перед коммитом и стилистика сообщений коммитов;
- [`.claude/rules/docs-consistency.md`](.claude/rules/docs-consistency.md) — синхронизация кода и всех документов при изменениях;
- [`.claude/rules/external-references.md`](.claude/rules/external-references.md) — запрет ссылок на внешние проекты-источники переиспользования;
- [`.claude/rules/js-dev.md`](.claude/rules/js-dev.md) — проектирование `tests/**/*.cjs`;
- [`.claude/rules/js-style.md`](.claude/rules/js-style.md) — оформление `tests/**/*.cjs`;
- [`.claude/rules/markdownlint-project.md`](.claude/rules/markdownlint-project.md) — структура репозитория, каталог lint-правил, политики, конфиг `.markdownlint-cli2.jsonc`;
- [`.claude/rules/platform-scripts.md`](.claude/rules/platform-scripts.md) — кроссплатформенный запуск, bootstrap в `bin/lint-markdown.cjs`;
- [`.claude/rules/readme-format.md`](.claude/rules/readme-format.md) — формат вводной части `README.md` (секция «Обзор»);
- [`.claude/rules/release-notes.md`](.claude/rules/release-notes.md) — формат названий и описаний релизов GitHub;
- [`.claude/rules/rules-sync.md`](.claude/rules/rules-sync.md) — двусторонняя синхронизация правил Cursor (`.mdc`) и Claude (`.md`);
- [`.claude/rules/ts-dev.md`](.claude/rules/ts-dev.md) — проектирование TS-модулей (SRP/DRY, порядок функций);
- [`.claude/rules/ts-style.md`](.claude/rules/ts-style.md) — оформление `src/**/*.ts`;

Список — в алфавитном порядке файлов, синхронно с картой в [`rules-sync.md`](.claude/rules/rules-sync.md) и таблицей «Правила репозитория» в [`AGENTS.md`](AGENTS.md). Перед правками в соответствующей области — прочитать релевантное правило.

## Синхронизация с Cursor

Проект поддерживает оба редактора: `.cursor/rules/*.mdc` (Cursor) и `.claude/rules/*.md` (Claude) содержат один и тот же канон. При изменении политики — обновлять обе версии одновременно (см. [`.claude/rules/rules-sync.md`](.claude/rules/rules-sync.md)).
