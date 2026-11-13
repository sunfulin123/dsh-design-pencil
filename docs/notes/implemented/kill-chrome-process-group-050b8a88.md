# Kill headless Chromium process group so helper grandchildren cannot outlive close or recreate profile dirs

Record-Version: 2
Task-ID: 050b8a88-4189-463a-a80c-4ffbab7cf64a
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T03:51:21.670407+00:00
Type: fix-bug
Status: complete

## Context

After real-Chromium E2E runs, killing only the parent `Google Chrome` PID left `Google Chrome Helper` grandchildren alive for ~50–150ms, recreating `Default/` inside `op-headless-chrome-*` profile directories after `rm(userDataDir)` completed.

## Changes

- Updated `packages/dsh-node-runtime/chrome-cdp.mjs` to spawn headless Chromium in its own POSIX process group (`detached: process.platform !== 'win32'`) and kill `-child.pid` (`SIGKILL`) with retry-enabled `rm`/`rmSync` on both normal `close()` and `SIGTERM`/`SIGINT`/`exit` cleanup.
- Added a process-group grandchild regression test in `packages/dsh-node-runtime/chrome-cdp.test.mjs` and pre-warmed the temporary shell executable before timing `timeoutMs` so macOS `syspolicyd` first-exec scan jitter cannot skew startup timeout assertions.

## Validation

- Passed: `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/canvas-theme-browser.test.mjs packages/dsh-node-runtime/chrome-cdp.test.mjs packages/dsh-node-runtime/html-skill-browser.test.mjs packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/html-fidelity.test.mjs packages/dsh-node-runtime/property-panel-browser.test.mjs` (`21 passed, 0 failed`, `0` leftover `op-headless-chrome-*` directories)
- Passed: `./packages/node_modules/.bin/oxlint --config packages/.oxlintrc.json packages/dsh-node-runtime/chrome-cdp.mjs packages/dsh-node-runtime/chrome-cdp.test.mjs` (`0 errors`)
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task 050b8a88-4189-463a-a80c-4ffbab7cf64a`
- Skipped / not run: Rust workspace tests (no Rust or skill files changed in this follow-up task).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Documented POSIX process-group SIGKILL cleanup of Chrome helper grandchildren in chrome-cdp.mjs.",
      "sha256": "9d963876db93d1284aaa02744a56f55019e857aae29f4f2aedb83f935cae8ed3"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- On Windows (`process.platform === 'win32'`), `detached` process-group negative-PID kill is skipped and falls back to `child.kill('SIGKILL')` with `rm` retries.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "88d2cb79cefdec8d056cf79312c81262f4eba86091cae31d5e0140295f958192",
      "after": "9d963876db93d1284aaa02744a56f55019e857aae29f4f2aedb83f935cae8ed3"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "01be70a87be77679ab2e7fa92caf16992a7f28afc42b62b2167c86b0f0504fbe",
      "after": "710359980fcbc3012161e3e90bfe15f4d0362b0e72bc12d33c14e5d0584675e7"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.test.mjs",
      "before": "abe8610baf33ba5da6693f673d912419d8524d98c76201d48d1cb21264c336e2",
      "after": "76c71643e3d5919429b01e679e3d01c44d7115023017f6a39a5ffca4f8ff196e"
    }
  ]
}
```

Completed-At: 2026-11-13T03:59:00.337264+00:00
