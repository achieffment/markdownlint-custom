# Платформы и bin-скрипты

> Claude-эквивалент [`.cursor/rules/platform-scripts.mdc`](../../.cursor/rules/platform-scripts.mdc). Применяется всегда.

Контекст роли: опытный разработчик JavaScript/TypeScript и инженер ОС (Windows CMD, Linux, macOS, WSL). Учитывать различия shell, path separators, `node_modules/.bin` на win32, LF в репозитории.

## Поддерживаемые ОС и оболочки

| ОС | Оболочка | Файл |
|----|----------|------|
| Linux / WSL | bash | [`bin/lint-markdown.sh`](../../bin/lint-markdown.sh) |
| Windows | CMD | [`bin/lint-markdown.bat`](../../bin/lint-markdown.bat) |
| macOS (терминал) | bash | [`bin/lint-markdown.sh`](../../bin/lint-markdown.sh) |
| macOS (Finder) | bash | [`bin/lint-markdown.command`](../../bin/lint-markdown.command) |
| Любая (npm) | — | `npm run lint:md` |

## Архитектура

- **Lint-runner** — [`bin/lint-markdown.cjs`](../../bin/lint-markdown.cjs)
- **Оболочки** — thin: `cd` в корень repo → `node bin/lint-markdown.cjs "$@"`
- **Не дублировать** lint-логику в `.sh` / `.bat` / `.command`

## Bootstrap

Минимально в [`lint-markdown.cjs`](../../bin/lint-markdown.cjs):

| Проверка | Действие |
|----------|----------|
| нет `node_modules` | `npm ci` (lock) / `npm install` |
| нет `markdownlint-rules.js` / `markdownlint-hlprs.js` или `src/**/*.ts` новее любого tsc-артефакта (`domain/`, `rules/`, `core/`, `composition/`, entry-points, `details.js`, `regex.js`, `types.js`) | `npm run build` |

Оболочки (`.sh` / `.bat` / `.command`) — только `cd` + `node bin/lint-markdown.cjs`. `.sh` — `set -euo pipefail`; `.command` (Finder) — без strict-mode, без дублирования guard. **Без явного пути** (первый аргумент не path) — guard в [`lint-markdown.cjs`](../../bin/lint-markdown.cjs): `usage()` и `exit 1` (не lint всего репо); флаги cli2 до path (`--fix ./docs`) — тоже `usage`.

Windows CMD: пути с пробелами передавать в кавычках (`bin\lint-markdown.bat ".\my docs"`).

| Точка входа | Bootstrap |
|-------------|-----------|
| `npm run lint:md` | `ensureNodeModules` + `ensureBuild` в `.cjs` |
| bin-оболочки | `ensureNodeModules` + `ensureBuild` в `.cjs` |

## Lint-runner

- `markdownlint-cli2` из `node_modules/.bin`
- `--no-globs` + glob целевой папки/файла (`:rel/path` для одного файла)
- `cwd` = корень repo
- `--help` / `-h` — справка; без `targetPath` первым аргументом — `usage()` и `exit 1` (в т.ч. флаги cli2 до path)
- Passthrough: `lint-markdown <path> -- <extra cli2 args>` или `lint-markdown -- <path> <extra>`; `--` после path отрезается как разделитель
- **Несколько файлов:** первый аргумент — `targetPath` (`:file` glob); остальные пути передаются в cli2 как passthrough: `npm run lint:md -- README.md AGENTS.md` → `:README.md` + `AGENTS.md`
- Конфиг и `customRules` — всегда из корня этого репозитория (`cwd` = repoRoot), в т.ч. для внешнего `<path>`
- Исключение `node_modules`, `vendor`: в [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) — `!node_modules`, `!vendor` (IDE/workspace); в [`lint-markdown.cjs`](../../bin/lint-markdown.cjs) для папок — `#node_modules`, `#vendor` (cli2 glob при `--no-globs`)

## Игнор-файл (`.markdownlint-ignore`)

Единственный файл в корне репозитория; синтаксис — как в `.gitignore` (комментарии `#`, пустые строки игнорируются, glob-паттерны от корня репозитория).

Подключён через top-level `"gitignore": ".markdownlint-ignore"` в [`.markdownlint-cli2.jsonc`](../../.markdownlint-cli2.jsonc) — читает сам `markdownlint-cli2`, поэтому работает одинаково в VS Code и в CLI без дополнительного кода.

- Только **относительные** glob-паттерны (`docs/legacy/`, `notes/*.md`); абсолютные пути файловой системы не поддерживаются.
- **Якорность (настоящее правило `.gitignore`):** `/` где-либо в паттерне, **кроме самого конца строки**, делает паттерн **якорным** — матчится только от каталога `.markdownlint-ignore` (корня репозитория). Один сегмент с `/` только в конце (`docs/`) — **неякорный**, матчится на любой глубине. Многосегментный путь (`docs/generated/`) — **якорный**, матчится только буквально от корня. Явно неякорная форма для многосегментных путей — префикс `**/` (`**/generated/**`).
- **Lint-цель вне репозитория** (`bin/lint-markdown.cjs <внешний путь>` / `npm run lint:md -- <внешний путь>`): [`targetToGlobs`](../../bin/lint-markdown.cjs) считает путь к файлу как `path.relative(repoRoot, target)`, то есть с `../` в начале (например `../../Workspace/Warehouse/...`). Якорный многосегментный паттерн (`Warehouse/Arduino/...`) в этом случае **никогда не совпадёт** — путь начинается не с него, а с `../`. Нужен явно неякорный паттерн: `**/Warehouse/Arduino/...` — он совпадёт независимо от `../` в начале пути.
- Тесты — [`test-markdownlint-ignore.cjs`](../../test-markdownlint-ignore.cjs): интеграционный прогон реального `markdownlint-cli2` с временным конфигом (относительные паттерны) и с целью вне «репозитория» (якорный/неякорный паттерн — регрессия на этот кейс).

## Новые исполняемые артефакты

При добавлении CLI/bin:

- Все три оболочки (`.sh`, `.bat`, `.command`) + npm-скрипт
- LF в index ([`.gitattributes`](../../.gitattributes)); shebang для Unix
- Синхронизация: [`docs-consistency.md`](docs-consistency.md) → README, AGENTS, `markdownlint-project.md`, `platform-scripts.md`
