#!/usr/bin/env bash
# Check the extension bundle against the same ordered source used by op-html.
# Chrome's unpacked extension loads the resulting standalone script directly.
#
# Usage:
#   scripts/check-extractor-sync.sh          # verify (exit 1 on drift)
#   scripts/check-extractor-sync.sh --fix    # regenerate the extension bundle

set -euo pipefail

script_dir=$(CDPATH= cd "$(dirname "$0")" && pwd -P)
extension_dir=$(CDPATH= cd "$script_dir/.." && pwd -P)
repo_root=$(CDPATH= cd "$extension_dir/../.." && pwd -P)

assets="$repo_root/crates/op-html/assets"
copy="$extension_dir/vendor/snapshot-extractor.js"
bundle=$(mktemp)
trap 'rm -- "$bundle"' EXIT
cat "$assets/snapshot-extractor.js" "$assets/snapshot-extractor-decorations.js" > "$bundle"

if [[ "${1:-}" == "--fix" ]]; then
    mkdir -p "$(dirname "$copy")"
    cp "$bundle" "$copy"
    printf 'extractor-sync: refreshed %s\n' "${copy#"$repo_root"/}"
    exit 0
fi

if [[ ! -f "$copy" ]]; then
    printf 'extractor-sync: bundled copy is missing: %s\n' "$copy" >&2
    printf 'extractor-sync: run scripts/check-extractor-sync.sh --fix\n' >&2
    exit 1
fi

if ! cmp -s "$bundle" "$copy"; then
    printf 'extractor-sync: %s has drifted from the Rust extractor sources\n'         "${copy#"$repo_root"/}" >&2
    diff -u "$bundle" "$copy" >&2 || true
    printf 'extractor-sync: run scripts/check-extractor-sync.sh --fix\n' >&2
    exit 1
fi

printf 'extractor-sync: ok (%s)\n' "${copy#"$repo_root"/}"
