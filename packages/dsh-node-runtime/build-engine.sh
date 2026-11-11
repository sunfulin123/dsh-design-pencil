#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
export RUSTUP_TOOLCHAIN=1.96.0
target_dir="${CARGO_TARGET_DIR:-$root/target}"
cargo build --locked -p op-dsh-engine --target wasm32-unknown-unknown --release
wasm-bindgen --target nodejs --out-dir packages/dsh-node-runtime/wasm \
  "$target_dir/wasm32-unknown-unknown/release/op_dsh_engine.wasm"
cp crates/op-ai-skills/skills/synapse-design/SKILL.md packages/dsh-node-runtime/wasm/design-skill.md
mkdir -p packages/dsh-node-runtime/skills
node --input-type=module <<'EOF'
import { cp, rm } from 'node:fs/promises';
import { basename } from 'node:path';
const source = 'crates/op-ai-skills/skills/synapse-design-html';
const destination = 'packages/dsh-node-runtime/skills/synapse-design-html';
await rm(destination, { recursive: true, force: true });
await cp(source, destination, {
  recursive: true,
  filter: path => basename(path) !== '__pycache__' && !/\.pyc$|\.DS_Store$/.test(path),
});
EOF
