# Bind Figma imports to saved receipts and preserve conflicted browser edits

Record-Version: 2
Task-ID: fb9e87bd-a3ab-4501-af0b-e372427760cf
Base-Ref: 886eabd43287bc418711312241457e47850c7eb3
Started-At: 2026-11-18T08:27:04.081677+00:00
Type: fix-bug
Status: complete

## Context

A partial Figma conversion retains editable content in its engine session. Opening an unrelated project file after an interrupted import can target the wrong design. The normal save snapshot also stops at a synchronization conflict before the owning host can capture the current browser edits.

## Changes

Synapse Design tool text and Skill use the current import receipt to identify the editable output. Interrupted calls require an explicit target with matching import provenance before reuse. The embedded browser serves the existing snapshot result for the explicit recovery purpose without a daemon push or conflict resolution.

## Validation

The first focused browser snapshot regression failed to compile before the new action existed. `cargo +1.96.0 test --locked -p op-host-web --lib --features canvaskit vscode_bridge::document_snapshot::tests` then passed all four tests. `node --test packages/dsh-node-runtime/figma-import-jobs.test.mjs packages/dsh-node-runtime/package.test.mjs` passed 13 tests with the rebuilt runtime. `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh` rebuilt the packaged Skill and browser assets. Git signing was disabled only in the maintenance command environment because its temporary fixture repository cannot use the system signing configuration.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Standalone Figma import reports partial results and binds output opening to saved provenance.",
      "sha256": "d01c2e139b3e89a4d38cd91214a42114ac2428e5b001c2601bb80ea0cd8c85d0"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Describe the Host save receipt and the browser recovery-only snapshot purpose.",
      "sha256": "4eed69fc720b7f6effe8dbecfb415ce8b25175498068fc60f5fb7cb48b65f9f3"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The browser response retains its existing fields and request correlation. The host owns recovery storage and source validation. Desktop-level editor and close acceptance belongs to Synapse Studio.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "8bb5583151d6661708698f567e32c8627894de5cbc9e68b0ddcc40c8ed778fc9",
      "after": "a6c34352005f0293588016099f5713cfa21ed3944c076d968ef41bd166e0e84f"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge.rs",
      "before": "c946a25829b0fee6890c63ef47b820c2e5cb3c0bca351560dc4dfde72604669b",
      "after": "c4fb7289658a6b6acdc3086c19ebababf1be43fabbc9ae0d9f3fbf2d7056c8da"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge_snapshot.rs",
      "before": "c7ca8b1a47fb342f52160e8fcb6ee6cd3c293c1be6c0f6e3896692de2e4206e9",
      "after": "a8a7e6d799e170d1ad234c1c5c436a3b1145a0a14013a0ce1771c30cc18f4719"
    },
    {
      "path": "docs/kb/product.md",
      "before": "9c5cfaafa6b365b19951e3c4a75b46bb02c485b0cfec3a38a29dd1302255a36c",
      "after": "d01c2e139b3e89a4d38cd91214a42114ac2428e5b001c2601bb80ea0cd8c85d0"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "08b6a10b431c9387d6d1d4a63c5a4d8e6f7de3449a7deaac1be82e03c136575a",
      "after": "4eed69fc720b7f6effe8dbecfb415ce8b25175498068fc60f5fb7cb48b65f9f3"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "46016ee098bda668e06d1c0f59839deccd19ce98fb25e42a8b4a283cc53b1b7f",
      "after": "097c500afcc892552bbd10d774bfe9a90db9eaa4033e61feb7783f45f8dbff58"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "c4a6658d126d18c3bd8b28007c111da1337cfcc6ef327e1c5b7498e2b14fd4a6",
      "after": "df7706ecf9bc825e74855922459d0d6aae0147474dc1b0e06757024a70ca2dd8"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "83ae3f99b4e7a6ef2b1f079e3135b7ad6d6dc65a342dc6fa58449ad78d3c15c8",
      "after": "6bf7a00567145df8912881c1e857219d24ab7c1ae03493ac6f0f3efe8b0d2361"
    }
  ]
}
```

Completed-At: 2026-11-18T08:35:15.369730+00:00
