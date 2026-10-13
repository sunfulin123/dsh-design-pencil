#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
export RUSTUP_TOOLCHAIN=1.96.0
target_dir="${CARGO_TARGET_DIR:-$root/target}"
cargo build --locked -p op-dsh-engine --target wasm32-unknown-unknown --release
wasm-bindgen --target nodejs --out-dir packages/dsh-node-runtime/wasm \
  "$target_dir/wasm32-unknown-unknown/release/op_dsh_engine.wasm"