#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
export RUSTUP_TOOLCHAIN=1.96.0
target_dir="${CARGO_TARGET_DIR:-$root/target}"
bundle="$root/packages/dsh-node-runtime/web-bundle"
cd "$root"
cargo build --locked -p op-host-web --target wasm32-unknown-unknown \
  --no-default-features --features canvaskit --release
mkdir -p "$bundle"
wasm-bindgen --target web --out-dir "$bundle" \
  "$target_dir/wasm32-unknown-unknown/release/op_host_web.wasm"
node --input-type=module - "$bundle/op_host_web_bg.wasm" <<'JS'
import { readFile } from 'node:fs/promises'
const module = await WebAssembly.compile(await readFile(process.argv[2]))
if (WebAssembly.Module.imports(module).some(entry => entry.module === 'env')) {
  throw new Error('Browser engine contains unsupported native environment imports')
}
JS
bash tools/stage-web-assets.sh "$bundle/assets"
cp crates/op-editor-ui/assets/iconify-catalog-brands.json "$bundle/assets/"
cp crates/op-host-services/src/web_static/index.html "$bundle/index.html"
mkdir -p "$bundle/canvaskit"
cp crates/op-host-web/assets/canvaskit/canvaskit.js \
  crates/op-host-web/assets/canvaskit/canvaskit.wasm \
  crates/op-host-web/assets/canvaskit/LICENSE "$bundle/canvaskit/"