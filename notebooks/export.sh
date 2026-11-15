#!/usr/bin/env bash
# Export each notebook as a single-file WASM page in three themes: <name>.html follows the OS,
# <name>-light.html and <name>-dark.html are forced (marimo script metadata: tool.marimo.display.theme).
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/notebooks
mkdir -p "$out"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for src in notebooks/*.py; do
  name=$(basename "$src" .py); name=${name//_/-}
  uvx marimo export html-wasm "$src" -o "$out/$name.html" --single-file --mode run --no-show-code --force
  for theme in light dark; do
    { printf '# /// script\n# [tool.marimo.display]\n# theme = "%s"\n# ///\n' "$theme"; cat "$src"; } > "$tmp/$name.py"
    uvx marimo export html-wasm "$tmp/$name.py" -o "$out/$name-$theme.html" --single-file --mode run --no-show-code --force
  done
done
