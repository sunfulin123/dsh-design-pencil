# Fix installed Cobalt scaffold copying, deterministic animation waits and hidden-control review noise; streamline bounded revisions and local documentation fallback

Record-Version: 2
Task-ID: 2642cbb5-6288-45b6-9932-63a39c8e25f9
Base-Ref: 1191cf5eacfd3d080a1438c7c9af09b624893b63
Started-At: 2026-11-16T06:09:15.621233+00:00
Type: fix-bug
Status: complete

## Context

Fix installed Cobalt scaffold copying, deterministic animation waits and hidden-control review noise; streamline bounded revisions and local documentation fallback

## Changes

Component copy filtering is relative to the source root and validates registry-declared files and copied bytes inside staging. Exported tooling is tested below a node_modules installation ancestor. Capture plans add bounded stable waits for finite target/ancestor animations; live inspection excludes ancestor-hidden/clipped controls and deduplicates identical findings. Source Skill, generated AI index and component/runtime guidance describe local documentation fallback and focused revision checks without weakening final source/PNG fingerprints.

## Validation

- `node --test packages/dsh-node-runtime/cobalt-source-copy.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs` — passed, 7 tests; installed paths failed before the copy fix.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-stability.test.mjs packages/dsh-node-runtime/poc-review-workflow.test.mjs packages/dsh-node-runtime/cobalt-source-copy.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/poc-browser-guidance.test.mjs packages/dsh-node-runtime/poc-startup-guidance.test.mjs` — passed, 25 tests, no skips; finite-transition assertion failed before stable waiting.
- `node --test packages/talkdesk-cobalt/test/export.test.mjs` — passed, 3 tests, including complete creation from an export below node_modules.
- `PATH="/Users/franklin/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh` — passed; existing op-figma dead-code warning.
- `vet` agentic review — passed after the copy, stable-wait and dedup logical units; no issues reported.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-stability.test.mjs packages/dsh-node-runtime/poc-review-workflow.test.mjs` — passed, 11 tests after viewport-aware deduplication.
- `bash tools/check-maintenance.sh --lint-js --base 1191cf5eacfd3d080a1438c7c9af09b624893b63 --task 2642cbb5-6288-45b6-9932-63a39c8e25f9` — passed; existing lint warnings remain non-blocking.
- SS `node --test plugins/ss-dsh-design/tests/*.test.mjs` — passed, 535 tests with 22 optional skips. After the final resource sync, the three Cobalt/HTML/POC runtime contract tests passed without skips.
- Isolated inspection of a copied user delivery reported three documents and no DOM findings; the original project was not modified.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Verify copied sources and viewport-aware duplicate findings, finite-motion waits, fixed local docs fallback and unchanged final evidence boundary",
      "sha256": "4e0d7e5148e115b8c53e0e7b761d3e2b2e2c1463123f97ed9f8f2366fc13cc51"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Final DOM dedup keys retain distinct viewport observations and the source/PNG evidence boundary is unchanged; fixed-version documentation fallback does not change the existing prototype product boundary",
      "sha256": "8164dff9023db6682e2bb1fad53168a7bd3d8b91a5ed5b5a5ae538b41e96d513"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Cross-revision dependency-aware evidence reuse is deferred: current fingerprints cover all authored sources and delivery assets, and do not establish per-screen dependency independence. Focused development sessions cannot authorize carrying historical final review forward. No automatic commit/push or installed-profile mutation. The source change introduces no Preview background lifecycle, managed server, Talkdesk routing or upstream Cobalt changes.


## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "ef0946ab3e241dd7174fa5d023defdb339e701fd2466c2f1d5d53ac8e26b8234",
      "after": "be6adcccb12adae363d6ea87b4a5324ad7ad6304e4151474ca9c2ede1154979e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "38a97b20b9e6a6e2842c8be71f2f4af4aad5792e5e5db8b5f610204a825cbdde",
      "after": "b116537d2c3bbef561cf8111941d778522c7c647f623e489ce1ab7d549f04b9e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs",
      "before": "39d4b17d1409f272de9f62d287230d22477ce8ed7acf8fe7d05bafb65148dc0f",
      "after": "498597e5dedf6a6a5d5bfa72b4376d6f9ca568f94baa6aa07ef3bc8b6f5af2f9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-stability.mjs",
      "before": null,
      "after": "1aecbf9c63e4fc518abf2adc97b59c1e6851994265779e4d81887aa9cae7323a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-capture-plan.mjs",
      "before": "f0e9d3ac9d4f6a7936f9875e6f30e7c7e0e5b91f268d899960d63f9ba6898d0a",
      "after": "b1a211b156d570fbfc7826b047fa49be67744ab65cac6bb2adc8de1fb4150f0c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-surface-inspection.mjs",
      "before": "7d47e1cf7316f79397aa200ebfc00c9575b76adf54a75ad8395680b7f9b85139",
      "after": "f29c2dd4d11a880ce2aaa97260d3aa1b9197a943765feb0713dd723fe222f5d7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "79874bdb037c93fff38238df4fa6c51e72941e1753943cee7807717c3779cbdd",
      "after": "efeb75ade57d2227fe3aea730e3a605eea828dc1b598fd63279acc2215f56b1e"
    },
    {
      "path": "docs/kb/product.md",
      "before": "3796fb0016753d12ebc93409d223459feafef87fede74ea49b900b7617f9e528",
      "after": "8164dff9023db6682e2bb1fad53168a7bd3d8b91a5ed5b5a5ae538b41e96d513"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "ddf4f59bf3d9ccfde990bcc25e24610f0e07b7b0617c15a1ff988a3c987e6e43",
      "after": "4e0d7e5148e115b8c53e0e7b761d3e2b2e2c1463123f97ed9f8f2366fc13cc51"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "beb00ca271fe0d43bfde04a35f41adcc286cf8181587db8194940d5962444e75",
      "after": "6196ced1ff4b2d9f349846a110afbe8cc8a5e95cc7700355850a2d9468f971b5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-source-copy.test.mjs",
      "before": null,
      "after": "a763a6410e9f6acc1e8ad833b477bdefb8de7fed889bdb6caa93820a71799576"
    },
    {
      "path": "packages/dsh-node-runtime/poc-stability.test.mjs",
      "before": null,
      "after": "7a6c9218bf59afcd41be3bf6a900aeba7c221514da4d2c200200af4e33fc16ec"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "ef0946ab3e241dd7174fa5d023defdb339e701fd2466c2f1d5d53ac8e26b8234",
      "after": "be6adcccb12adae363d6ea87b4a5324ad7ad6304e4151474ca9c2ede1154979e"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "c40fbdc05d1cf26fd763913f4c16f4acc4b9a2bcb6eada496cdb2775edbf80ba",
      "after": "c927c4adb3e6f74314198c7d068f7fbef70bb5229d6ac777cb8a37b46810493e"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "fa4452a0ea8f05a021a24475db62fdb4b68d64055c17078b8144abb12ab34e99",
      "after": "e768309db8dbb0a2a7a49f8cb6ed646874185f7be9dbbc2d0afa000c0a0696a8"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "e986269a8fc1fe2a6b49a401f099113191957881b1fb3b0e66876605ec86ea76",
      "after": "1facdf27ff36e482ffd57524f3baf653b4997c22ad26a6772a7e316a8b6da5f6"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "f06e3140f0e3281c7fe27acb1528841ce30eeddd4aef25c08bcb3d5033b4e48d",
      "after": "cef4f733f95154705795ff754e0ed1cdba3bb55cba51e21e0d025fd25295394b"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "20406742dfa1b43636086d30baec932b39400e0183dde61c78627ca68b61b637",
      "after": "46c9f9b6817d89e1c05040705533b033b0c3fb81d979be794a9a90b7b98dbee2"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-source-templates.mjs",
      "before": "6585fca5a1a23ab52d2b9785c425dbf0cc645a9e2761e9f62ce890bed4ce20cc",
      "after": "5df71ea6d76e40cc59a51ba2baaddab43efcb035342fc9b5e1644212760b513f"
    }
  ]
}
```

Completed-At: 2026-11-16T06:46:00.301222+00:00
