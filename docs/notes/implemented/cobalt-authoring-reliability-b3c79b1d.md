# Cobalt prototype authoring reliability runtime

Record-Version: 2
Task-ID: b3c79b1d-f975-4142-b006-540eb16d46d9
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-17T23:13:16.867172+00:00
Type: feature
Status: complete

## Context

Cobalt prototype authoring reliability runtime

## Changes

Implemented task-local canonical Cobalt preparation, exact DESIGN binding, mode-bound Workspace or independent standalone bootstraps, non-overwriting reuse and explicit rejection of unbound migration. Fixed-key configuration hashes cover package/dependency/build/registry settings, canonical checkers and shell metadata. Registry diagnosis uses an owned bounded pnpm metadata request with configured authentication; installation owns its subprocess group and project, propagates cancellation and redacts bounded diagnostics. Registered business pages are inspected through the project-owned TypeScript parser and reachable import/reexport graph, including local CSS, actual JSX/factory use, obvious custom control surfaces, opaque injected markup and symlink containment. Generated build/check commands run the canonical source guard. Skill and owner guidance use the native prototype tool and confirmed registry recovery while retaining local documentation fallback and independent import routes. Prior HTML import changes remain intact.

## Validation

Red: the new helper module contract tests failed before implementation. `node --test packages/dsh-node-runtime/prototype-authoring.test.mjs` passed 8 tests covering canonical reuse and no overwrite, scaffold rejection, standalone controls/provider bootstrap without Workspace, configuration/path-key tampering, actual project-owned TypeScript use versus unused imports/native JSX/factory calls/transitive source, local CSS, process cancellation/timeouts, registry status mapping/redaction and parent symlink escapes. `node --test packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/design-workflow-text.test.mjs` passed 7 tests. `node --test packages/dsh-node-runtime/poc-startup-guidance.test.mjs packages/dsh-node-runtime/design-workflow-text.test.mjs packages/talkdesk-cobalt/test/export.test.mjs packages/talkdesk-cobalt/test/preview-contracts.test.mjs` passed 12 tests. The existing live-text key assertion and startup wording expectations were updated for the prior import-analysis capability and new conditional installation flow; no runtime behavior was weakened. `PATH="$PATH:/Users/franklin/.cargo/bin" bash packages/dsh-node-runtime/build-engine.sh` passed and rebuilt the Skill resources. Final focused oxlint and diff checks passed with warnings retained; maintenance initially found three unused imports, which were removed without behavior changes. `bash tools/check-maintenance.sh --base 5b642aecb4d14fcff5f02037249b44a975bedec3 --task b3c79b1d-f975-4142-b006-540eb16d46d9 --lint-js` then passed. Read-only vet reported no issues.

The actual canonical private-registry probe returned network_unavailable, so a real private dependency installation and full Cobalt/provider build were not performed. The generated standalone neutral review index/assets were exercised in actual Chrome with a clearly isolated business HTML fixture: 390px iframe sizing, error-state remount and Reset passed; this is review-control evidence, not a compiled Cobalt business-page claim. Native SS acceptance belongs to the coordinating SS task. No commit, push, runtime publication or DMG was performed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "unchanged",
      "reason": "Independent HTML/Figma/SVG import behavior and multi-board coverage rules remain unchanged.",
      "sha256": "39d60860b757f659720b069c5f5da2a5c69acdec4dc4e7a16aba0e5362248a8f"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "POC startup stays autonomous without Preview configuration, while confirmed private registry recovery uses its existing native Question.",
      "sha256": "7a081decb3ee8a9ef1cfb64dd7f98e239121e224a630a71700bf1db842a65caf"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Canonical preparation and source checks retain the same contract after unused-import cleanup; runtime and source hashes are current.",
      "sha256": "7a8691d66f26e73f7783837b1d2c87fe404ca73710a26b5459436d8149c72a19"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The AST guard is bounded static evidence, not full visual or behavioral acceptance. Installed owned TypeScript is required; missing or foreign dependencies cannot yield a source pass. Dynamic/injected business markup and unresolved source remain findings. A local editable binding catches accidental configuration weakening but is not a signature against an adversarial workspace owner. Existing unbound projects require explicit migration and are not overwritten. Private-registry availability prevented real private installation/build verification in this environment.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "be6adcccb12adae363d6ea87b4a5324ad7ad6304e4151474ca9c2ede1154979e",
      "after": "f917c718a10fe988110f95e0a2be65acbfd022c18065246f10136a4425e14119"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "b116537d2c3bbef561cf8111941d778522c7c647f623e489ce1ab7d549f04b9e",
      "after": "f6e297f3b8ccd4e04a834a77e1d1f93ab62e99d55050671748324a11c1827ca0"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "2fa875aee2a74fc2cc0cc1954a77945a77659d853762b2e5de3dfa0e65ce9488",
      "after": "39d60860b757f659720b069c5f5da2a5c69acdec4dc4e7a16aba0e5362248a8f"
    },
    {
      "path": "docs/kb/product.md",
      "before": "ffe8007b1133aaf1d7ee93bd024e455d0cca06d739ffb33594702d03dba037a9",
      "after": "7a081decb3ee8a9ef1cfb64dd7f98e239121e224a630a71700bf1db842a65caf"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "9391652f188620f3ca6f662015b2a458f498ad700d5adb0a2be30185d64bc214",
      "after": "7a8691d66f26e73f7783837b1d2c87fe404ca73710a26b5459436d8149c72a19"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "d6b6566922169e8e573b5e84420f9cdb7e660453ff85ca08156d76aac9a998e9",
      "after": "033f2c7db77950c1561fefea625f5a0fdbdb24c36be72970924c54ddfe595285"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.test.mjs",
      "before": "024b6fa7ebf57551ae8a73bd76de7c8338244905dc8d2a0ea4e24f66c08f9aa4",
      "after": "9cab82e4371091d77c86bfb7d221a8e969a92b9e02fd950b7d0010c2f44eaa25"
    },
    {
      "path": "packages/dsh-node-runtime/poc-startup-guidance.test.mjs",
      "before": "fe9619fe496d6e265a7e7ea5836f7fdfc8950b87950ceb2af9411d0c57f5022d",
      "after": "65ea0e46c681b4112decfe54157980c3e04b8cfc1c04a23c34af21b2e48fd86d"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.mjs",
      "before": null,
      "after": "22dc3fd28dbf385553330e1cc6edec5243d0e3aa38c9207aaf2a7cc845584b53"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.test.mjs",
      "before": null,
      "after": "a42782c914321f08510f5e21c8a4eef9171c82db5c395e53bf05956575ae703f"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-process.mjs",
      "before": null,
      "after": "380d7565451642de4e413eb7e0045714869e0c1caeff4558ce4e2ff62995824d"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-standalone.mjs",
      "before": null,
      "after": "de0e9b8aae0d38c64bab1a05873b10a37cd176a7f280b353fcd521ec396ef2fe"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "be6adcccb12adae363d6ea87b4a5324ad7ad6304e4151474ca9c2ede1154979e",
      "after": "f917c718a10fe988110f95e0a2be65acbfd022c18065246f10136a4425e14119"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "1facdf27ff36e482ffd57524f3baf653b4997c22ad26a6772a7e316a8b6da5f6",
      "after": "85a6bf590ad85dacaef5b35c6e70caf20cae98c9f0a6611762dbdbddd9f63fb1"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "89c25cebde5deb29acd02b618d1dd82bec892d624d67f6b18d4770d977f99813",
      "after": "5b7cf09f6587b82b01dd9bfd6c7b31bd725f7d53df6bb65db86e493892dac903"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "a7b0475adf1146f0764e3b3786b6bc42aa7e06d82fb437ba1cc2a85850bd0cbd",
      "after": "9f2c0390df7fa16443eb24182fd90b7cc2f9390d05d6d020d52452fa5eaf3e57"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/inspect-business-source.mjs",
      "before": null,
      "after": "62cbf360cbd4efff14340fa431763218a66ac89d058f97a54ee777eb06d937f4"
    }
  ]
}
```

Completed-At: 2026-11-18T00:03:43.226695+00:00
