# Auto-detect nested OS sandbox failure in headless Chromium and retry with --no-sandbox verified under macOS Seatbelt

Record-Version: 2
Task-ID: bf5c658f-654d-4a2c-9f83-76230be5a0b4
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T05:39:08.343308+00:00
Type: fix-bug
Status: complete

## Context

DSH executes agent `bash` commands inside a macOS Seatbelt `sandbox-exec` (`workspace-write`) sandbox. When `capture-poc.mjs` or `verify-surface.mjs` launched Google Chrome or Microsoft Edge inside Seatbelt without `--no-sandbox`, the browser parent process printed `DevTools listening on ws://...`, but its renderer/GPU/network helper children failed inner `sandbox_init` (`sandbox initialization failed: Operation not permitted` / `aperitif: Failed to initialize sandbox`), causing `Page.enable` to hang or disconnect on every attempt. Additionally, the live DSH `labs` profile still held an older staged runtime (`0.8.5-synapse.5`) prior to local staging.

## Changes

- Updated `packages/dsh-node-runtime/chrome-cdp.mjs`:
  - Preserved the default OS sandbox on unsandboxed hosts while watching Chromium `stderr` for nested sandbox initialization errors (`SANDBOX_INIT_ERROR_RE`: `sandbox initialization failed`, `Failed to initialize sandbox`, `No usable sandbox`, `Failed to move to new namespace`, `Running as root without --no-sandbox`).
  - Added an in-launch `Runtime.evaluate('1')` renderer readiness probe raced against `stderr` sandbox-error detection so `launchHeadlessPage` never returns a page whose renderer helper failed `sandbox_init` after `DevTools listening` was printed.
  - Automatically aborted the broken attempt, cleaned its process group and profile directory, cached `nestedSandboxDetected = true` for subsequent launches in the same process, and immediately retried with `--no-sandbox` (plus `--disable-breakpad` so Crashpad does not attempt writes outside `userDataDir` under Seatbelt).
- Updated `packages/dsh-node-runtime/headless-renderer.mjs`:
  - Piped `stderr` and added automatic restart with `--no-sandbox` if the render-only CanvasKit headless Chrome encounters nested OS sandbox initialization failure.
- Added unit and real-Seatbelt E2E tests in `packages/dsh-node-runtime/chrome-cdp.test.mjs`, `packages/dsh-node-runtime/headless-renderer.test.mjs`, and `packages/dsh-node-runtime/html-skill-browser.test.mjs` (`sandbox-exec -p` with the exact DSH `workspace-write` SBPL profile, verifying real `status: "captured"` PNG screenshots in both `capture-poc.mjs --steps` and `verify-surface.mjs`).
- Updated `docs/kb/html-import.md` to document the nested OS sandbox auto-detection and `--no-sandbox` fallback behavior.

## Validation

- Passed: `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` (`273 passed, 0 failed, 0 skipped`, `0` leftover `op-headless-chrome-*` directories)
- Passed: `OPENPENCIL_CHROME_PATH='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/html-skill-browser.test.mjs` (`6 passed, 0 failed`, including real Seatbelt `workspace-write` capture on Edge)
- Passed: `node --test scripts/check-dsh-runtime.test.mjs` (`15 passed, 0 failed`)
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (`168 packages`)
- Passed: `./packages/node_modules/.bin/oxlint --config packages/.oxlintrc.json packages/dsh-node-runtime/chrome-cdp.mjs packages/dsh-node-runtime/chrome-cdp.test.mjs packages/dsh-node-runtime/headless-renderer.mjs packages/dsh-node-runtime/headless-renderer.test.mjs packages/dsh-node-runtime/html-skill-browser.test.mjs` (`0 errors`)
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task bf5c658f-654d-4a2c-9f83-76230be5a0b4`
- Skipped / not run: Rust workspace tests (no Rust sources changed in this task).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Documented automatic nested OS sandbox (macOS Seatbelt) detection and --no-sandbox fallback with Runtime.evaluate renderer readiness verification in chrome-cdp.mjs.",
      "sha256": "d697442a67cd750bc628d8056c193807519806613ccd4e41a8931a587fb22485"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Added real macOS Seatbelt workspace-write browser capture E2E test to html-skill-browser.test.mjs; runtime/MCP boundaries in runtime-mcp.md remain unchanged.",
      "sha256": "011cb36da953e5bd94c59dbc2b07454c94703ac0db5f42d5300637e1245244fa"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- When running inside an outer OS sandbox (such as DSH's macOS Seatbelt `workspace-write`), Chromium's inner process sandbox cannot initialize and falls back to `--no-sandbox` while remaining confined by the outer Seatbelt file-write policy and `capture-poc`'s localhost/local-file URL restriction.
- Updating `dsh-design-pencil` source alone does not update an already-installed DSH profile (`~/.synapse/profiles/labs/.../ss-dsh-design/runtime`); the updated runtime must be staged into `ss-dsh-design` and deployed to the active DSH profile.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "9d963876db93d1284aaa02744a56f55019e857aae29f4f2aedb83f935cae8ed3",
      "after": "d697442a67cd750bc628d8056c193807519806613ccd4e41a8931a587fb22485"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "b6cdb897f2142a58f025ef0c92b495ec675fb3250dd7f5f186ac65579afa4b46",
      "after": "011cb36da953e5bd94c59dbc2b07454c94703ac0db5f42d5300637e1245244fa"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "710359980fcbc3012161e3e90bfe15f4d0362b0e72bc12d33c14e5d0584675e7",
      "after": "848fd7514fe6ec07f8440e9606b7b1194c17dfff1cefcddbba9922157b6fd233"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.test.mjs",
      "before": "76c71643e3d5919429b01e679e3d01c44d7115023017f6a39a5ffca4f8ff196e",
      "after": "28865d391d6b0660582fa2b9cf85f005d562532aad45278abfd4f03484f099e3"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.mjs",
      "before": "53b97127941ac7c7ae9b19fbfc95aee3caa25796a42e1390055edf28e3da5535",
      "after": "ebb07c9f871e9c5806d0eb0ac5e44b2a82bca0e4dc8785e5d43ba68bc735a2c5"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.test.mjs",
      "before": "5b58be6e900aa77df8cd5e677d2203a06fc047c193386dfba0ca8c52d01e3dff",
      "after": "1c93328f33586507b9dc4d45a9253ac8d15c8d8eef5586dc68f497b4460a89fa"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-browser.test.mjs",
      "before": "0c47a4fe10adb47c4915356370501fd1d0f26842143e5a3c3170c0feb7efe515",
      "after": "215b53b2725e63e8f3757cd49914b2306a0485493b3e14967ccbf6a7ea9f268b"
    }
  ]
}
```

Completed-At: 2026-11-13T05:59:21.799520+00:00
