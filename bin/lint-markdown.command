#!/usr/bin/env bash
if [ "$#" -eq 0 ]; then
    echo "Usage: lint-markdown.command <targetPath>"
    echo "  targetPath — file or directory with markdown docs"
    exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec node "$ROOT/bin/lint-markdown.cjs" "$@"
