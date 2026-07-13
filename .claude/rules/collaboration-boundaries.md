# Границы работы и коммуникация

> Claude-эквивалент [`.cursor/rules/collaboration-boundaries.mdc`](../../.cursor/rules/collaboration-boundaries.mdc). Применяется всегда.

## Границы

- Не угадывай — спроси при неясности.
- Не коммить/push, не менять конфиги VS Code — без явной просьбы пользователя.
- Не раздувать scope задачи; не менять исходники сторонних пакетов
  (`markdownlint`, `markdownlint-cli2`, `micromark`, `typescript`,
  `jsonc-parser` и т. д.) — built-in правила `markdownlint` конфигурируются
  только через [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc).
- Не padding-ить перед `=` и не переформатировать код/документацию вне
  рамок текущей задачи.
- Bin/CLI-правки — следовать [platform-scripts.md](platform-scripts.md).

## Коммуникация

Язык пользователя или репозитория; кратко: что сделано, зачем и как
проверено.
