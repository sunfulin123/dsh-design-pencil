# Discover and import reachable HTML interface states into one design document

Record-Version: 2
Task-ID: 5869e979-9924-40c7-ba40-abc77f5f5123
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-17T15:02:37.756161+00:00
Type: fix-bug
Status: complete

## Context

Discover and import reachable HTML interface states into one design document

## Changes

Added HtmlImportSession with browser-observed candidates and bounded source excerpts, source/resource fingerprints, structured real UI actions, native cumulative snapshots, partial coverage, checkpoints and explicit budget renewal. Readiness uses load/network/font/layout checks without resizing source layout; mutating requests/navigation and WebSockets are blocked in the private profile. Hidden or ambiguous interfaces stay pending; source excerpts expose truncation and line ranges. Click/value/keyboard guards reject occluded/disabled/hidden targets and business submissions. Source PNG bounds/checksums and optional actual CanvasKit comparison keep structural coverage separate from visual approval. Default standalone conversion uses the state engine; no-browser capture preserves partial static CSS fallback. Skill, runtime owner guidance and KB describe same-source single-document delivery. Primary concurrently supplied the visual comparison module and its tests.

## Validation

Red: the standalone converter regression failed before hidden-state integration; additional real Chrome review reproducers failed for CSS-only state deduplication, root scrolling, selector waits, contextual controls and empty mounts. Focused fixes now pass. The final combined command is `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-import.test.mjs packages/dsh-node-runtime/html-state-visual.test.mjs packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/font-fetcher.test.mjs packages/dsh-node-runtime/html-fonts.test.mjs`; it passed 41 tests with zero failures or skips, including real Chrome and CanvasKit. `PATH="$PATH:/Users/franklin/.cargo/bin" bash packages/dsh-node-runtime/build-engine.sh` passed. The source line-cap checker and focused oxlint passed with retained warnings, and `git diff --check` passed. Both the prior and review-fix read-only vet passes reported no issues. Source review findings were handled with focused regressions rather than suppressing evidence. The complete maintenance gate with `--lint-js` passed; warnings remain visible.

The supplied HTML was replayed read-only through real UI inputs in a private browser and saved to `/tmp/html-state-acceptance/what-if-schedule.op`, reopened through EngineSession with four distinct root IDs (`n1`, `n433`, `n849`, `n958`). Boards cover its base/Forecast, Schedule, Comparison empty and Comparison populated states. The populated board has three large rendered SVG regions and six body rows plus its header; source SHA-256 is `60669108fbe419b2925e6b8a3014c7728cdb5fe5198e35748c8ab1b98617fc06`, unchanged across replay. Saved document SHA-256 is `d275f13a6fffb39487643880ae572415b8f46dd3ea2fddd4a984b64d9d92fc8b`. Seventy-three remaining source/UI candidates are explicitly pending; this sample is partial and has not received full visual approval. Logs and artifacts are outside source control.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Source-bound multi-interface inventory and native cumulative imports now separate structural coverage and actual regional CanvasKit comparison; structured actions preserve scroll and visible waits.",
      "sha256": "1c47dc7c2e6853b5b7fb90bfd3c8310b08c7987279678858406d89fabf0f01ca"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Same HTML delivers one cumulative document with independent boards and honest coverage, including partial static fallback.",
      "sha256": "4a68e03804f4c4d4df0d5b4e29f0cbf8d25601c0a9648c332966bc4df3da88ef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "HTML imports use the existing real renderer and do not change raw MCP, font quality or new-design phase contracts.",
      "sha256": "d0a12b232cfd695172a0d2ff29a51a136db4fcc81c7932172bebed876deb8468"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Discovery is bounded and cannot prove arbitrary application-state exhaustiveness. Unknown controls, source truncation/external scripts, internal scrolling, frames and authentication require follow-up. Source/read method restrictions are not a general security sandbox; GET side effects remain a limitation. Pixel comparisons include localized candidate graphic regions but do not prove business semantics or arbitrary hidden state exhaustiveness. No source file or existing editor is edited during capture. No runtime release, commit, push or DMG is performed here; primary owns isolated packaged acceptance and SS integration.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "85885ba13e0ba3d58c8dd4e5b1d72328f553cedde2f784b00a41ef5524525a06",
      "after": "e4a25dc069373347653c451414e0c1a72633133b2af19b923e791aaeb1a38175"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "05f650228f2538c39f375ef3a937126883dea0e1393ea8989b465be034b6a3d7",
      "after": "1c47dc7c2e6853b5b7fb90bfd3c8310b08c7987279678858406d89fabf0f01ca"
    },
    {
      "path": "docs/kb/product.md",
      "before": "0ed54c1e23eea50d0284e1642ab4f8a576a4947be9dc296596bdc4c6885fcf5e",
      "after": "4a68e03804f4c4d4df0d5b4e29f0cbf8d25601c0a9648c332966bc4df3da88ef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "c8ca80afdf997b68764aa686ac77c733cd41f51572dfb62df3ba351fc65e433e",
      "after": "d0a12b232cfd695172a0d2ff29a51a136db4fcc81c7932172bebed876deb8468"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "d7e55c38142a79b30396faf32bd2f05dee6f4f6ef1e2e18864147869a5a415cd",
      "after": "b0d2a5456a77aca8cba374c446041e04d5a5de5ab06408a7ac716c378abbe78a"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "2fa84bc3bd34c01ed2843b1d65e0a7e1dbbd5bf1d62f9da264b9a4e2b9a586c1",
      "after": "cb69699f9b1e99f7646b0cafac2109383179421539dedd2e4ccbdcd058c944b6"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": "cc7a7134a3e34a14ea7df301a2f408e327cc7f4fd8a1154e7ecb99b527478d2d",
      "after": "fa7baf1c2fd0550410f4e5fa9a3094aa543ce9f6f38d5018e329e30bd6229739"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": "647002c03182773771978e078e62c6ed8e40fc83cfa6c237610801b85af142fb",
      "after": "e6a42fb86c4214b17934ca9f83151c2b14ae015cebe27fc98db9404321f6ac69"
    },
    {
      "path": "packages/dsh-node-runtime/html-font-stylesheets.mjs",
      "before": "ebb58989cdcdc87096ded6a9aadd789c8a7b1c414543729449362416365bb903",
      "after": "d9a6afb775c8cff92e0a13b97cc7ac194e13b98a648a0d0e7365ab5cb58494a1"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.mjs",
      "before": "9969a15d196e1bd19aae25fa85f582a0c8af1cc0f19df9e49d0ddaf6b1ce8c3c",
      "after": "07353531c9cef3cda0f56d5fe777245712fd1ca75b689874fdb687f63cc33603"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.mjs",
      "before": "80ad3183c686aab78dea2442f4e644fd2e7d49606fbb3d3ee15e8c8b93f93143",
      "after": "5a7ca4ef1f8758134d75d1a642cfbdf4a1e6739c3e2a7d28bd03720446d5e790"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-actions.mjs",
      "before": null,
      "after": "1adbae6a3ba7fe5cb321f83b8a52337f168bc2b29cf8093fbcf8243ac8523bbb"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-discovery.mjs",
      "before": null,
      "after": "7c7dbb7ee22dcbf2f5b31968884f13e83ba01ea2adf3f7ff04014d6ad4b28a99"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.mjs",
      "before": null,
      "after": "feaa26631a500bc291d8d58b2265461b34f9abfe572e8a7b2d764277cfaf1207"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.test.mjs",
      "before": null,
      "after": "a94b397e0d5e17337dcc6c0fd81daa6ef5a603f7deccdd8584c9febb4b3d96c5"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-input.mjs",
      "before": null,
      "after": "5d81a1a101b181f25a4c9e4253234a63651d2910a785a69db4435211975096ba"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-report.mjs",
      "before": null,
      "after": "c7ddfdcc94a7d3f36331de8699144afb9f7d975281941c95726ea7b5b48339b2"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-visual.mjs",
      "before": null,
      "after": "2a56091139db33c016c2765cf3640ad72bcbe0e245e66ced4614466e6f9f07a4"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-visual.test.mjs",
      "before": null,
      "after": "923a6b775faf10a3d9bede18b9bdd96ab97e8f45ca913761f3767e6b003bb075"
    }
  ]
}
```

Completed-At: 2026-11-17T16:09:39.539758+00:00
