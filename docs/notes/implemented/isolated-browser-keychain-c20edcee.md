# Keep isolated HTML capture and same-state recovery reliable

Record-Version: 2
Task-ID: c20edcee-b6b4-4319-82ba-2b073606fd2e
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-17T16:21:07.714203+00:00
Type: fix-bug
Status: complete

## Context

Actual Electron acceptance exposed a private-HOME local HTTP navigation hang. Controlled probes succeeded for ordinary HOME and data URLs but failed for private-HOME HTTP without request interception. Follow-up review also found incomplete resource warning admission and same-state recovery retaining superseded invalid boards.

## Changes

Throwaway macOS headless profiles use a basic password store and mock keychain; user browser profiles, Preview, Browser Use and Electron production launch remain untouched. Internal checkpoint updates apply structured plans, retain previous boards on failed retries, and atomically supersede the same state after successful capture. Evidence admission subtracts superseded same-state bytes before the storage cap. Per-board warning ownership resolves superseded failures without hiding current failures. Known unresolved font, stylesheet and media warnings block completion and overall visual approval; an empty design cannot pass through all-excluded candidates.

## Validation

Red/green: the real private-HOME local HTTP regression failed at Page.navigate before the two macOS profile flags and passed afterward. A temporary cloned-launcher probe also passed with mock keychain while the direct-proxy control still failed. Resource-warning, invalid-state retry and near-cap replacement reproducers failed before their respective fixes and passed targeted checks. The private-HOME test uses existing page readiness before reading DOM. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/chrome-cdp.test.mjs packages/dsh-node-runtime/html-state-import.test.mjs packages/dsh-node-runtime/html-state-visual.test.mjs packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/font-fetcher.test.mjs packages/dsh-node-runtime/html-fonts.test.mjs` passed 50 tests, with zero failures and skips. `git diff --check` and source line-cap checks passed. Read-only vet passed for both the initial keychain change and the full follow-up changes. `bash tools/check-maintenance.sh --base 5b642aecb4d14fcff5f02037249b44a975bedec3 --task c20edcee-b6b4-4319-82ba-2b073606fd2e --lint-js` passed with warnings retained. No runtime release, commit, push or DMG was performed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The advertised same-document HTML state import and partial completion contract are unchanged; this follow-up enforces those invariants.",
      "sha256": "6f3523c1e39700a187693bf92fc05cd2a0f072d0e0e8b82ebe43d4b89673e856"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "No tool authorization, public MCP shape or Preview launch contract changes.",
      "sha256": "d473d9dccdac4a661452013ee971cc6f7b1536bfff5f95c142793f129587a33e"
    },
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Isolated macOS capture avoids login-keychain waits; successful state retries supersede prior boards transactionally and unresolved resource failures remain completion limitations.",
      "sha256": "db343d2d3c10fc5d978531403781a37fc4919d76334dd273c8aac1eae724075b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

This remains a bounded discovery/import engine, with unknown source states and unresolved source resources reported honestly. Old checkpoints without per-board warning ownership retain conservative limitations until relevant states are recaptured. Actual Electron acceptance is owned by the root integration task and is not implied by source tests. The mock-keychain configuration is restricted to temporary macOS capture profiles; its data is removed with that profile.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "1c47dc7c2e6853b5b7fb90bfd3c8310b08c7987279678858406d89fabf0f01ca",
      "after": "db343d2d3c10fc5d978531403781a37fc4919d76334dd273c8aac1eae724075b"
    },
    {
      "path": "docs/kb/product.md",
      "before": "4a68e03804f4c4d4df0d5b4e29f0cbf8d25601c0a9648c332966bc4df3da88ef",
      "after": "6f3523c1e39700a187693bf92fc05cd2a0f072d0e0e8b82ebe43d4b89673e856"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "d0a12b232cfd695172a0d2ff29a51a136db4fcc81c7932172bebed876deb8468",
      "after": "d473d9dccdac4a661452013ee971cc6f7b1536bfff5f95c142793f129587a33e"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "b0d2a5456a77aca8cba374c446041e04d5a5de5ab06408a7ac716c378abbe78a",
      "after": "cc0b12143e82c7e765e4b599e3b7de01e5f62dfea094ebd94729899948a31a1c"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "848fd7514fe6ec07f8440e9606b7b1194c17dfff1cefcddbba9922157b6fd233",
      "after": "ea055a90273ae6d7b14b3fed11f688f75d7a3e87ea77d88885eefe8869b5b229"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.test.mjs",
      "before": "28865d391d6b0660582fa2b9cf85f005d562532aad45278abfd4f03484f099e3",
      "after": "cc37637ce483a3fb6d543ebd53387480b66a507784737bbc34b3f29ba16d9f6e"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-checkpoint.mjs",
      "before": null,
      "after": "d1f9a7928c4d4a36db222e241a16b1cdcaf4878ad6019a6a9f1a171eed5e9edb"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.mjs",
      "before": "feaa26631a500bc291d8d58b2265461b34f9abfe572e8a7b2d764277cfaf1207",
      "after": "07a8a86f73da3f59f0db3ac79e348ae2eecd775309ca07ffb217eb00ca7987aa"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.test.mjs",
      "before": "a94b397e0d5e17337dcc6c0fd81daa6ef5a603f7deccdd8584c9febb4b3d96c5",
      "after": "c73c523489edd39f3bc5f8ff0481f11db113615e19bf7b65bfd459033f823e43"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-report.mjs",
      "before": "c7ddfdcc94a7d3f36331de8699144afb9f7d975281941c95726ea7b5b48339b2",
      "after": "ddc82acebce2ebe8015242d9f2d8cb419f7af89485d8367c3b70eb3c779eb64e"
    }
  ]
}
```

Completed-At: 2026-11-17T16:37:03.681960+00:00
