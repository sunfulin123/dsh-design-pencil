# Harden headless Chromium startup, add single-browser interactive POC step runner with stage diagnostics, and allow honest unverified fallback

Record-Version: 2
Task-ID: 4f365fe7-8e49-46d9-81a3-f364f731eaa0
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T03:07:17.098458+00:00
Type: fix-bug
Status: complete

## Context

Repeated headless Chromium timeouts during HTML POC re-verification stalled screenshot capture, interaction checks, and POC handoff:
1. Agents wrote ad-hoc CDP scripts calling `launchHeadlessPage` directly without an overall deadline or stage logging, getting killed by external tool timeouts (`SIGTERM`) and leaking temporary `op-headless-chrome-*` profile directories.
2. `chrome-cdp.mjs` hardcoded a 6s DevTools startup wait regardless of `timeoutMs`, dropped Chrome `stderr` on failure, never retried transient cold-start profile failures, and lacked `SIGTERM`/`SIGINT`/`exit` process/profile cleanup.
3. Each viewport/state capture launched a separate Chromium process (`capture-poc.mjs`), while `verify-browser.mjs` duplicated a separate unretried `--no-sandbox` launcher and crashed `verify-surface.mjs` (`GATE: ERROR`) on browser timeout instead of degrading honestly to `unverified`.
4. CanvasKit `HeadlessRenderer` forced SwiftShader on macOS by default and kept returning `{ ok: true, started: false }` when a render-only Chrome became unresponsive before the 5-minute idle timeout.

## Changes

- Hardened `packages/dsh-node-runtime/chrome-cdp.mjs` (`launchHeadlessPage`):
  - Scaled startup wait within `timeoutMs` (capped at 20s per attempt), captured rolling Chrome `stderr` tail into startup/socket/CDP timeout and early-exit errors, and rejected in-flight CDP calls immediately if the socket closes or Chrome exits.
  - Added fresh-profile launch retry (`retries = 1` default) bounded by `timeoutMs`, waited for child exit before deleting `userDataDir` in `close()`, and registered `exit`/`SIGTERM`/`SIGINT` cleanup so killed scripts do not leak Chrome children or `op-headless-chrome-*` directories.
- Hardened `packages/dsh-node-runtime/headless-renderer.mjs` and `packages/dsh-node-runtime/host-render-tools.mjs`:
  - Avoided forcing SwiftShader on macOS unless `OPENPENCIL_FORCE_SWIFTSHADER=1` (matching `chrome-cdp.mjs`), made `--no-sandbox` opt-in via `OPENPENCIL_CHROME_NO_SANDBOX=1`, and restarted an unresponsive render-only Chrome when still disconnected past `startupGraceMs` (`15_000ms`).
- Added `crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs` and upgraded `capture-poc.mjs`:
  - Enforced a bounded total deadline (`--timeout-ms`, default 35s), recorded per-stage timings (`launch`, `viewport`, `navigate`, `ready`, `fonts`, `step`, `close`), and surfaced structured JSON diagnostics + Chrome `stderr` tail on failure.
  - Added `--steps <plan.json>` to execute multi-viewport (`1440×900`, `390×844`, etc.) interactive verification (`click`, `fill`, `select`, `submit`, `focus`, `press`, `waitFor`, `assertText`, `assertVisible`, `assertCount`, `screenshot`) in a single Chromium launch, plus `--allow-unverified` for browser-only failures without masking UI assertion or schema errors.
- Added honest `unverified` browser-timeout degradation across `verify-browser.mjs`, `verify-surface.mjs`, `verify-evidence.mjs`, `packages/dsh-node-runtime/poc-evidence-validator.mjs`, `packages/dsh-node-runtime/design-discovery-gate.mjs`, and `packages/dsh-node-runtime/design-workflow-text.mjs`:
  - Unified `verify-browser.mjs` onto `chrome-cdp.mjs` (`launchHeadlessPage` with `mobile: false` + touch emulation for `<600px` and `captureBeyondViewport: true`), returning `renderedEvidence` entries with `status: "unverified"` and stage diagnostics in `uncovered` when Chromium fails after retry.
  - Accepted honestly `unverified` `renderedEvidence` entries (and `screenshots: []` when no PNGs exist) through `checkEvidenceLedger`, `parseAndValidateEvidenceLedgerJson`, `checkPocQuestionReadiness`, and `NEXT.pocRecorded` while still requiring explicit post-record prototype presentation and honest `unverified` reporting.
- Updated `crates/op-ai-skills/skills/synapse-design-html/SKILL.md` and `crates/op-ai-skills/skills/synapse-design/SKILL.md`, rebuilt `op-dsh-engine` WASM, synced `packages/dsh-node-runtime/skills/synapse-design-html/` and `wasm/design-skill.md`, and added unit + real-Chromium E2E tests.

## Validation

- Passed: `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh`
- Passed: `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` (`269 passed, 0 failed, 0 skipped`; an earlier piped run observed a one-time transient timeout retry count flake in untouched `packages/dsh-node-runtime/figma-rest-client.test.mjs:59` `an unresponsive request surfaces FIGMA_TIMEOUT naming the node`, which passed on clean re-run)
- Passed: `node --test scripts/check-dsh-runtime.test.mjs` (`15 passed, 0 failed`)
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (`168 packages`)
- Passed: `cargo test -p op-dsh-engine --lib prompt` (`7 passed, 0 failed`)
- Passed: `(cd packages && bun run check-design-evidence)`
- Passed: `./packages/node_modules/.bin/oxlint --config packages/.oxlintrc.json` on all 17 `.mjs` files created or modified by this task (`0 errors`, warnings visible)
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task 4f365fe7-8e49-46d9-81a3-f364f731eaa0` (note: passing `--lint-js` against `HEAD` also lints preexisting dirty `packages/dsh-node-runtime/design-spec-fonts.mjs:51`, which has an unrelated preexisting `unicorn(prefer-string-starts-ends-with)` error left untouched to preserve prior uncommitted changes)
- Skipped / not run: `cargo test -p op-host-web --lib --features canvaskit` and `bash packages/dsh-node-runtime/build-web.sh` (not run because no `op-host-web` or `op-editor-ui` Rust sources were modified in this task).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Documented chrome-cdp.mjs timeoutMs-scaled startup wait, fresh-profile retry, stderr diagnostics, and SIGTERM/SIGINT/exit profile cleanup.",
      "sha256": "88d2cb79cefdec8d056cf79312c81262f4eba86091cae31d5e0140295f958192"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented capture-poc --steps single-browser multi-viewport/interactive verification, stage diagnostics, and honest unverified POC degradation when Chromium fails after retry.",
      "sha256": "1cd7d4e20cba3b75f47bb0e58d86acdb46c8e55de6468670748de92dc585c1fc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "captureScreenshot passes connected:false so HeadlessRenderer restarts an unresponsive render-only Chrome past its startup grace window; MCP tool discovery, editor-control, and script boundaries in runtime-mcp.md are unchanged.",
      "sha256": "b6cdb897f2142a58f025ef0c92b495ec675fb3250dd7f5f186ac65579afa4b46"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- `SIGKILL` from an external supervisor (unlike `SIGTERM`/`SIGINT`) cannot be trapped in-process by Node; keeping `capture-poc.mjs` (`35s` default) and `verify-surface.mjs` (`45s` default) strictly shorter than outer tool timeouts ensures normal internal timeout + cleanup runs before any hard kill.
- Downstream DSH host plugins consuming `poc-evidence-validator.mjs`, `design-discovery-gate.mjs`, and `design-workflow-text.mjs` gain zero-screenshot `unverified` POC handoff support once updated to the rebuilt runtime package (and if an older host wrapper still enforces `args.screenshots.length >= 1` before calling `parsePocScreenshotInputs`, retaining prior valid `shots/*.png` while marking `renderedEvidence` / `visualReview` as `unverified` already passes).

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "694922b259e1ee4ffeb568d86bef94dca1e408f502a4d6840cbfad15e6217227",
      "after": "47dea1bd0fae16c6da9c01f758e822eb7fb44b85f76102c25cdc4f7bb239c2c0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "b137ce4afba69f513623dd997c46c2dc0a9dca9b38aee5672a9a5a295b127f98",
      "after": "32f914b3104e84b4f5ef7d867ba08d6bb61fd2bba683faff1877906e78be3426"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs",
      "before": null,
      "after": "af2780eea3fdd25bd48ffb6238f093a2856c7b1a73fc8415f9e44d4c37f00ed3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-browser.mjs",
      "before": "a4874ce71bc408e2d10d757865af30b17f7378031435900e6a29b23c40b4de23",
      "after": "02dc9d0784f145d4b6e6c1a833c9745f034428662dc2b485d7eba2df1e5c981f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs",
      "before": "dfb227bc69ab4988f26979ec8b062ae83efa3d3ac4b657432f82248ba289fca8",
      "after": "3354d25276378bc2890227e286fc8deb734b61b7b00117ae35e992f4aa421180"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "33474b802009e78a4772a533d8b39d1b7d20eaee09b9caa90b6b01896600792c",
      "after": "f0f07ac2735bdf4c54f5f9e038f6a51fb12dce0cd406f4b63f528cca6a7f1f1c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "72ae0ad4524d437918d92887501598ae246b245ede6ac2af88b831e0abf4e417",
      "after": "531d51a07f79ba87e0a6a9cf3dadfeab2c4a69b7e3c502f00b1b92dfd08475f3"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "5b7624e55c45e57e1c0a8f62faef6e983b5ba6cc441cd9e4d5a9eb0a74eacb65",
      "after": "88d2cb79cefdec8d056cf79312c81262f4eba86091cae31d5e0140295f958192"
    },
    {
      "path": "docs/kb/product.md",
      "before": "a6c3906c3eb876952721b3331c1068ba8ef6dddd5c3209940aae1d0776e7d156",
      "after": "1cd7d4e20cba3b75f47bb0e58d86acdb46c8e55de6468670748de92dc585c1fc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "19aeb0ebe46f3948e145cbaf4abbc7fa1400ad00d7c5da4c00a5a36597a03ecb",
      "after": "b6cdb897f2142a58f025ef0c92b495ec675fb3250dd7f5f186ac65579afa4b46"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "55f483266d2c0b231e4d22329a0f1b972b635e0960ef7541c9c5eabc6fe8419f",
      "after": "01be70a87be77679ab2e7fa92caf16992a7f28afc42b62b2167c86b0f0504fbe"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.test.mjs",
      "before": null,
      "after": "abe8610baf33ba5da6693f673d912419d8524d98c76201d48d1cb21264c336e2"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.mjs",
      "before": "b01a2ea1ba6d7a5179b2eacea9aeb8f718e0571342910f169931778caebf50c3",
      "after": "404f7834e12852f355fff14c85348467169844372e6610bd1d71b55a179b61b5"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.test.mjs",
      "before": "193f241859a2a37a3111920982054dc4a07e8a8ea945fa478593baef1ca66f7a",
      "after": "6cade3889419de5a2706b54160faf7eb169df1f9311cae9f83ccacde8e6a74ed"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "8b93bde875d0937494a49ad7e1b20ab658564e41de1e71b74234a62dfe9c02dc",
      "after": "2380ac8b5428c817544037dcf32a1694271fba185570e4860d282c46e9a8ebbb"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.test.mjs",
      "before": "949bd12174bce315aa14ec1af5072889e06798bbb4ad718ef32e118bb89404f4",
      "after": "ddca0af0da28593b4b4d0f419e53f88973862ea64a539994600c22e438bd25c9"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.mjs",
      "before": "4b4c2811fdf679ddc97449701ade5f0bd238570be81d6db9a060b544bbe7bd6a",
      "after": "53b97127941ac7c7ae9b19fbfc95aee3caa25796a42e1390055edf28e3da5535"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.test.mjs",
      "before": "a7c84f67a702fc2f08599b52eed6e97f38dd3a928033395cf5379b354efc8618",
      "after": "5b58be6e900aa77df8cd5e677d2203a06fc047c193386dfba0ca8c52d01e3dff"
    },
    {
      "path": "packages/dsh-node-runtime/host-render-tools.mjs",
      "before": "03356da0bc79c0abb6ecac56ede2e5753e18458f62ea913c532f323c48a04362",
      "after": "a7ccb2d2689e4920c8a76d9e044399b5a2dd5337181322c98945bc088f1d14b7"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-browser.test.mjs",
      "before": "997a38a2b972bf2b2cac8df0bdf38ce267aad329aba8d9122d588c6f25fa03e3",
      "after": "0c47a4fe10adb47c4915356370501fd1d0f26842143e5a3c3170c0feb7efe515"
    },
    {
      "path": "packages/dsh-node-runtime/plugin-domain-migration.test.mjs",
      "before": "61e5fc074542a6018d50231250ca66479bb234c6e6c212e12aca3e32692f2031",
      "after": "593b5f2dfb9c085a8ebdb88f925efb399a1d73bfe89be0188150d07e3ab9a444"
    },
    {
      "path": "packages/dsh-node-runtime/poc-evidence-validator.mjs",
      "before": "e4a6b754956601eea91fd3a5ae04e994c69d8db00abaccbbcaa203aa54682ec8",
      "after": "9c33e8cfe2c6ee68098e2251af4945f3faa015d5aa978a397d076a816bde8d81"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "694922b259e1ee4ffeb568d86bef94dca1e408f502a4d6840cbfad15e6217227",
      "after": "47dea1bd0fae16c6da9c01f758e822eb7fb44b85f76102c25cdc4f7bb239c2c0"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "b137ce4afba69f513623dd997c46c2dc0a9dca9b38aee5672a9a5a295b127f98",
      "after": "32f914b3104e84b4f5ef7d867ba08d6bb61fd2bba683faff1877906e78be3426"
    }
  ]
}
```

Completed-At: 2026-11-13T03:50:02.308581+00:00
