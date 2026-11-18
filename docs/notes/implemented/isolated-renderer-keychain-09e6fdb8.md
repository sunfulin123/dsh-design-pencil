# Allow actual CanvasKit headless verification under private macOS HOME without login keychain access

Record-Version: 2
Task-ID: 09e6fdb8-2c9d-4b18-adda-82c9af8d36e7
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-17T16:47:12.124811+00:00
Type: fix-bug
Status: complete

## Context

Allow actual CanvasKit headless verification under private macOS HOME without login keychain access

## Changes

Added macOS-only basic password store and mock-keychain arguments to the temporary CanvasKit HeadlessRenderer profile, independently of the source capture launcher. Added platform argument assertions and a real private-HOME NodeHost MCP screenshot regression that requires canvaskit-headless metadata and PNG content. User Browser Use, Preview, Electron production launch and user profiles are unchanged. Updated the renderer owner guidance and runtime README.

## Validation

`DSH_E2E_CHROME=1 node --test --test-name-pattern='headless arguments|private macOS renderer' packages/dsh-node-runtime/headless-renderer.test.mjs` failed both assertions before the fix: missing macOS flags and real MCP screenshot timeout after 12 seconds. The same command passed 2 tests after the fix; actual private-HOME CanvasKit output returned in 1.63 seconds. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/headless-renderer.test.mjs packages/dsh-node-runtime/chrome-cdp.test.mjs packages/dsh-node-runtime/html-state-import.test.mjs packages/dsh-node-runtime/html-state-visual.test.mjs packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/font-fetcher.test.mjs packages/dsh-node-runtime/html-fonts.test.mjs` passed 57 tests with zero failures and skips. `bash tools/check-maintenance.sh --base 5b642aecb4d14fcff5f02037249b44a975bedec3 --task 09e6fdb8-2c9d-4b18-adda-82c9af8d36e7 --lint-js` passed with warnings retained; `git diff --check` passed. Read-only vet completed with no issues found. No runtime release, commit, push or DMG is part of this source task.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Temporary macOS CanvasKit renderer profiles use a mock keychain and basic password store independently of source capture.",
      "sha256": "d6265c472a6ef447fa87cb42b75e0549e911f2cf88217f80dea279f0381ed117"
    },
    {
      "path": "docs/kb/html-import.md",
      "action": "unchanged",
      "reason": "The source capture keychain and cumulative import contracts remain unchanged; actual converted verification now applies the same isolation invariant in its separate launcher.",
      "sha256": "b928a89a4ef007fcbdfbc068d27c683cd6581e473dc85c9675322baf8cada731"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The real CanvasKit rendering contract is unchanged; private-HOME startup now meets that existing promise.",
      "sha256": "32ca888858c62e44333e3ec631fdfb185fd97134ecd4101c00c6ec617025505b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The renderer still uses the existing temporary profile, startup grace, screenshot queue, idle lifetime and cleanup. Linux arguments remain unchanged. This test proves the actual private-HOME CanvasKit path, not the entire root Electron integration; root acceptance is recorded separately.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "db343d2d3c10fc5d978531403781a37fc4919d76334dd273c8aac1eae724075b",
      "after": "b928a89a4ef007fcbdfbc068d27c683cd6581e473dc85c9675322baf8cada731"
    },
    {
      "path": "docs/kb/product.md",
      "before": "6f3523c1e39700a187693bf92fc05cd2a0f072d0e0e8b82ebe43d4b89673e856",
      "after": "32ca888858c62e44333e3ec631fdfb185fd97134ecd4101c00c6ec617025505b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "d473d9dccdac4a661452013ee971cc6f7b1536bfff5f95c142793f129587a33e",
      "after": "d6265c472a6ef447fa87cb42b75e0549e911f2cf88217f80dea279f0381ed117"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "cc0b12143e82c7e765e4b599e3b7de01e5f62dfea094ebd94729899948a31a1c",
      "after": "28f8f47386d308c52b3d797d91156c6dc2a2402bbf252765db43cccf3a8aeed6"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.mjs",
      "before": "ebb07c9f871e9c5806d0eb0ac5e44b2a82bca0e4dc8785e5d43ba68bc735a2c5",
      "after": "60750070ecd164d232417acc47c9d6ef5cbef16e022547aadf762fb59956fd76"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.test.mjs",
      "before": "1c93328f33586507b9dc4d45a9253ac8d15c8d8eef5586dc68f497b4460a89fa",
      "after": "6a6befb9f86d7de290cba53bbbb5a502279c613679a3c6ad425951a62c261227"
    }
  ]
}
```

Completed-At: 2026-11-17T16:57:59.057309+00:00
