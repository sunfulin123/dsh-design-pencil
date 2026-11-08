#!/usr/bin/env bash
# Lightweight source-size and task-evidence gate. No product build or server.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
python="${PYTHON:-$root/.venv-lint/bin/python}"
if [[ -z "${PYTHON:-}" && ! -x "$python" ]]; then
  python=python3
fi
base=""
lint_js=false
task=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      [[ $# -ge 2 ]] || { echo "--base requires a git ref" >&2; exit 2; }
      base="$2"
      shift 2
      ;;
    --lint-js)
      lint_js=true
      shift
      ;;
    --task)
      [[ $# -ge 2 ]] || { echo "--task requires a Task-ID" >&2; exit 2; }
      task="$2"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done
"$python" -m unittest discover -s tools -p test_code_line_cap.py
"$python" -m unittest discover -s tools -p test_harness.py
"$python" -m unittest discover -s tools -p test_task_state.py
"$python" -m unittest discover -s tools -p test_knowledge.py
"$python" -m unittest discover -s tools -p test_task_notes.py
if [[ -n "$base" ]]; then
  "$python" tools/check_code_line_cap.py --baseline-ref "$base"
  set -- --base "$base"
else
  "$python" tools/check_code_line_cap.py
  set --
fi
if [[ "$lint_js" == true ]]; then
  set -- "$@" --lint-js
fi
if [[ -n "$task" ]]; then
  set -- "$@" --task "$task"
fi
"$python" tools/check_harness.py "$@"
