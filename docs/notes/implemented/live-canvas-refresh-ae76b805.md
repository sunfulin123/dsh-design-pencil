# Add guarded in-place browser refresh and same-Chat managed editing guidance

Record-Version: 2
Task-ID: ae76b805-e9bb-4a90-8f89-7ca6e153c439
Base-Ref: 886eabd43287bc418711312241457e47850c7eb3
Started-At: 2026-11-18T09:26:35.327797+00:00
Type: fix-bug
Status: complete

## Context

Add guarded in-place browser refresh and same-Chat managed editing guidance

## Changes

Added a request-correlated refresh bridge for managed OP editors. The browser checks the exact document baseline before and after the daemon read and acknowledges saved revisions only for a matching confirmed daemon version. Managed content updates retain the view and valid selection. Recovery snapshots report the captured revision’s dirty bit. Managed save snapshots report their daemon version so the host can reject stale writes. The accessible refresh control is attached to the CanvasKit top bar immediately left of Palette, with host-provided busy and result status. The English design Skill and tool text route same-chat edits through the open canvas and describe publishing a waiting HTML import.

## Validation

`RUSTUP_TOOLCHAIN=1.96.0 cargo test --locked -p op-editor-core --lib bridge_protocol` passed 10 tests. `RUSTUP_TOOLCHAIN=1.96.0 cargo test --locked -p op-host-web --no-default-features --features canvaskit --lib live_sync_glue` passed 29 tests, including a managed same-page selection/camera regression. The same command with `vscode_bridge::document_snapshot` passed five. `node --test packages/dsh-node-runtime/design-tools.test.mjs packages/dsh-node-runtime/html-state-import.test.mjs` passed 22 tests with the 16 optional browser scenarios disabled for that run. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-import.test.mjs` passed 21 browser tests. `bash packages/dsh-node-runtime/build-web.sh` and `bash packages/dsh-node-runtime/build-engine.sh` built the local browser, engine, and Skill payloads. `PYTHON=.venv-lint/bin/python bash tools/check-file-line-cap.sh --ratchet` passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record immediate persistence for saved canvas edits and unchanged checkpoint handling for unpublished drafts.",
      "sha256": "cc4e171cc8ca838114a25b9138d8fe17107dd283991677afffc61c57c260afe7"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record the CanvasKit toolbar control, guarded refresh, and exact save version acknowledgement.",
      "sha256": "0b853596d76772bdcf9f81e2ab235fae492203f9cbe7cb26959417801368a29d"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "unchanged",
      "reason": "CanvasKit repaint now positions the managed refresh button, without changing context teardown, resize or tile lifetimes.",
      "sha256": "a5cd0865530dc3c0a5b30397c1fac8fa61309ce0426b0cb57e8f8b0fb950e097"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The SS host opts in for file-backed OP editors. It owns the refresh button, disk writes and fingerprint checks, post-refresh baselines, duplicate request handling, and Electron acceptance.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "a6c34352005f0293588016099f5713cfa21ed3944c076d968ef41bd166e0e84f",
      "after": "e241b144618702a9dad30a90b97cb7ffb7d6b09658e7d4ba70fd48df11f6fcd0"
    },
    {
      "path": "crates/op-editor-core/src/bridge_protocol.rs",
      "before": "7797cc7ac863d799a8358049a334dfbfea052fbd78e56eb4aa2bad55aec409be",
      "after": "5fd7696ddc93d57db1a187faf765617604708d81804d9660a7458286f7278ab9"
    },
    {
      "path": "crates/op-editor-core/src/sync_gate.rs",
      "before": "97d338ea87087d107f6b4e1a11457ccaebd0f272e7396b07297a0505e49646f0",
      "after": "f8c42a65569c6b2dafc9e38cd40a81a86e3aba89ecf63a7fffc94cdda68f9e49"
    },
    {
      "path": "crates/op-host-web/src/canvaskit.rs",
      "before": "f4b8d56a4705bc36207abbb80eae8c61f5961c5cbf51112bf9e1b429e9452948",
      "after": "00bc7394d04d22513fb3a272387d4de58c1fd37deac36c764fd242160a98f752"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/inner.rs",
      "before": "c3605933aeedc32e5acd0db1c7f6ff98002e7f87cdc16398692f67502e86252b",
      "after": "6482879780c2b52121926450404342be63c53956576a4d6126422ab92869b98e"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/mount.rs",
      "before": "9d6639241c7051702903219a1f18fb31b15befc4b50f262a4e4f8cdd5f3dc092",
      "after": "edfa674c16ac8b52e6a950bb97114eef66d5720fe0f9d2a22fbf22a7c8219d62"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/refresh_toolbar.rs",
      "before": null,
      "after": "d3cd89630e845ad92d07f14edf69c735442a2c4e826df0135d2604c47ce1f002"
    },
    {
      "path": "crates/op-host-web/src/live_sync_apply.rs",
      "before": null,
      "after": "e030c986ef59fb038f894503d7b4317ae4419c35ffd8c4286ed31af5b974f566"
    },
    {
      "path": "crates/op-host-web/src/live_sync_controller.rs",
      "before": "e71dfc160086491d806b96ddbaa3092447926dcffb17371c374b937338d8bc0f",
      "after": "40a70e39b5bf1416ea05cac101bc391094a886ea14bc7f6cbdfca82524439154"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue.rs",
      "before": "b9f40e8fa63bd2a15a3da359444ccac9f919ee7b4e980dc72040a22689d7f0b0",
      "after": "4c0e9e6f39a63cc9eee8a9a0f9d08484004431b9502a78a8415560de3dd8233c"
    },
    {
      "path": "crates/op-host-web/src/ui_scale_handshake_tests.rs",
      "before": "354cb127c4655408f0a216b143009121938e12cb47588a734bef609032b52641",
      "after": "fba2e56d5afcf0dcb02df9f17cfe186bfcfba1106bd82c1f5ee797c49e4681ee"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge.rs",
      "before": "c4fb7289658a6b6acdc3086c19ebababf1be43fabbc9ae0d9f3fbf2d7056c8da",
      "after": "6c597a1d77b380ec41e974db99c237a18b510797ba748fc932441eb810f6a36c"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge/early_listener.rs",
      "before": "dce0d012e27a5b35419319bf7f3edc5442d1444529e65176979c25e654225a76",
      "after": "d67eb39a9796330519eae3ec79f61e8a60c0b73f41f9464d2a52ddbee8f3f115"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge/helpers.rs",
      "before": "5941c715dccf600520c9b1ce5b2de49bcce99378150820de894f4ccb22e02d56",
      "after": "d95700434e495edd4b9e83c9f43ffe6294ddc48dbfeb4c19cd05608291aff432"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge_snapshot.rs",
      "before": "a8a7e6d799e170d1ad234c1c5c436a3b1145a0a14013a0ce1771c30cc18f4719",
      "after": "255a9ee42bb21a47786d261db9782d5ae04a1566eaa27435022beedbe0d5f9b8"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "e7eeb21f219b7683a543bcd915312d1b693369e50fc32988f2a38df52456e923",
      "after": "a5cd0865530dc3c0a5b30397c1fac8fa61309ce0426b0cb57e8f8b0fb950e097"
    },
    {
      "path": "docs/kb/product.md",
      "before": "d01c2e139b3e89a4d38cd91214a42114ac2428e5b001c2601bb80ea0cd8c85d0",
      "after": "cc4e171cc8ca838114a25b9138d8fe17107dd283991677afffc61c57c260afe7"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "4eed69fc720b7f6effe8dbecfb415ce8b25175498068fc60f5fb7cb48b65f9f3",
      "after": "0b853596d76772bdcf9f81e2ab235fae492203f9cbe7cb26959417801368a29d"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "097c500afcc892552bbd10d774bfe9a90db9eaa4033e61feb7783f45f8dbff58",
      "after": "f3e06be149f485ea1ff7e6799c9a3074179ba1b43bca277c2d7ae5ffde848ab6"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "df7706ecf9bc825e74855922459d0d6aae0147474dc1b0e06757024a70ca2dd8",
      "after": "83fd53ade6a1a976850cc878ecfeba05b5a114c1a683cd5163474216238bd92e"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "b0876a147f90affe22fd07021918a46951f5f7d1a53f6b1540553bd33fcab0e8",
      "after": "11665501f72add369a8eddb1f938413f0524b08e689a55a7190be3d152b310db"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "6bf7a00567145df8912881c1e857219d24ab7c1ae03493ac6f0f3efe8b0d2361",
      "after": "e25fd00f6bdb016605b84a1b6713efe31d865db18c1f4a6424e491d2fafc7064"
    }
  ]
}
```

Completed-At: 2026-11-18T09:59:14.916486+00:00
