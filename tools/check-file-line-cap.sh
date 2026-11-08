#!/usr/bin/env bash
# Effective source-line cap; see CODING_STANDARDS.md.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python="${PYTHON:-$root/.venv-lint/bin/python}"
if [[ -z "${PYTHON:-}" && ! -x "$python" ]]; then
  python=python3
fi
exec "$python" "$root/tools/check_code_line_cap.py" "$@"
