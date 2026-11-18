# Split snapshot extractor source while preserving the runtime and Chrome extension capture contract

Record-Version: 2
Task-ID: 9b287c5c-ae9d-4d37-94e6-c7defdb0d8ed
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T14:55:19.918017+00:00
Type: refactor
Status: complete

## Context

Split snapshot extractor source while preserving the runtime and Chrome extension capture contract

## Changes

Move form text, placeholder and hard inset accent capture into a decoration factory. Preserve the self-contained browser script by assembling the same ordered sources for the Rust constant and the Chrome extension bundle. The main extractor is 992 effective lines and the new file is 109. The legacy ceiling shrinks from 1,017 to 992.

## Validation

`node --check` passed for both source fragments and the bundle. `bash packages/op-chrome-extension/scripts/check-extractor-sync.sh` passed. A Chromium comparison against the prior packaged runtime produced identical objects for full-page capture and picked-root capture. `cargo test -p op-html` passed all 494 tests on the assembled script. `.venv-lint/bin/python tools/check_code_line_cap.py --baseline-ref 3552d715` passed.

The full maintenance command with `--lint-js` passed. `bash packages/dsh-node-runtime/build-engine.sh` rebuilt the Node/WASM runtime. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-{fonts,frame-snapshot,import,state-import,state-visual,fidelity}.test.mjs` passed all 57 tests.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Document the shared browser bundle assembly and dedicated decoration source.",
      "sha256": "c5d05d4e11ed400d6398cb82c5419f359dd609feba01f09a7639704af989404b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Standalone consumers use the assembled script. The public Rust constant and the generated Chrome extension path retain their existing entry points.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-html/assets/snapshot-extractor-decorations.js",
      "before": null,
      "after": "1b1cee593ed3c50f90aef273ead334fe8140a5510081e72a40547ec6e3eaea94"
    },
    {
      "path": "crates/op-html/assets/snapshot-extractor.js",
      "before": "03e82eb537bca896a5f14a43e3853645e832c9088890c24927c5b51c82149042",
      "after": "48c054876effae68a17932a93f5337cb26ffdd7bc40c373365705c44abbbf654"
    },
    {
      "path": "crates/op-html/src/lib.rs",
      "before": "aa9f80ddff873a62334d845dbcac283037740466981bbbde5047f4c285a7e6ad",
      "after": "92ee7b634f6040768c4a8da30f4d425fa45396f68aa9092599498d793801ff52"
    },
    {
      "path": "crates/op-html/src/snapshot.rs",
      "before": "5cdd41b536a3943ed9a533cf64a4999588dc5b7f19d62d9a5e37f8aa7c3402ad",
      "after": "649c3dea42282adf4358fe8b8a595674179783bb8e4b0b363f71ed3910d4b95e"
    },
    {
      "path": "crates/op-html/src/snapshot_bundle.rs",
      "before": null,
      "after": "f1cab112c71590c65af50f4671f0f7b5e8918de361e4204924c8440189386154"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "8faa1a7316f0ce3396f644ac6f122aeb4f7bdb7b42e491d94942d4b00f8000ac",
      "after": "c5d05d4e11ed400d6398cb82c5419f359dd609feba01f09a7639704af989404b"
    },
    {
      "path": "packages/CLAUDE.md",
      "before": "ddf43dffcc1b88f774870538faf41699b72ab2135fdf72739dd355af85060a69",
      "after": "854fc4fcd0ba801688a8ff59ff89812d43e7df8184777d711900bb4e84315ed6"
    },
    {
      "path": "packages/op-chrome-extension/README.md",
      "before": "4b104f36a130e5476ad8eb0118c25e3451025b479a3d6df561c33f5a43b718e0",
      "after": "fb4e4dff4c836c4e07976def79db0cc86aaff92e5296e9183040c15b39efea56"
    },
    {
      "path": "packages/op-chrome-extension/capture.js",
      "before": "8161e6d137724170ec6102bdbbbf87edb600c28e18bf1f7897598a5e81534c60",
      "after": "1900250f6c89c7c626c948c06069715712689af089a5953f2f8ed1e0bef7e480"
    },
    {
      "path": "packages/op-chrome-extension/scripts/check-extractor-sync.sh",
      "before": "5a990636090f2348fd9645903d0117fd3ff7c9f4fa347cf1b003324d7dae4f18",
      "after": "e50387f28da4a55d52248ea825cecd34994633ea92805c93a393ec4a2f90346a"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "e25fd00f6bdb016605b84a1b6713efe31d865db18c1f4a6424e491d2fafc7064",
      "after": "6223a6067e0b330848a0236472863bd156f3d619a9bce7718247b3fba38bb552"
    }
  ]
}
```

Completed-At: 2026-11-18T15:05:29.184384+00:00
