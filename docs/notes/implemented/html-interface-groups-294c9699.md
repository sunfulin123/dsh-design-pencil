# Arrange same-document HTML boards by business interface and state across resumed batches

Record-Version: 2
Task-ID: 294c9699-e536-4c56-85e8-ac07c1a4ffcf
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-17T17:17:51.714706+00:00
Type: fix-bug
Status: complete

## Context

Arrange same-document HTML boards by business interface and state across resumed batches

## Changes

Page/tab captures establish business-interface groups; overlay and planned states inherit the longest captured route prefix, an unambiguous target-container association, or the base group. The existing checkpoint owner arranges independent roots in group rows and state columns using actual root dimensions, preserves retry membership and source relations, and restores arranged native-engine state after every successful import. The existing editorMeta extension persists grouping and source routes without input values. No SS, Preview or new package/schema boundary changed. Runtime guidance and Product summary reflect the grouped layout; the Skill one-document flow remains valid without modification.

## Validation

Red: the real Chrome grouping/resume regression failed on missing group membership against the flat layout. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-groups.test.mjs` passed 2 tests after the fix, including native EngineSession metadata roundtrip, taller-row reflow, resumed captures and actual grouped CanvasKit pixel verification. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-groups.test.mjs packages/dsh-node-runtime/html-state-import.test.mjs packages/dsh-node-runtime/html-state-visual.test.mjs` passed 26 tests with zero failures/skips. Read-only vet reported no issues. Source line-cap and diff checks passed. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-groups.test.mjs` then passed 3 final tests after canonical action identity was added; its reversed-property-order regression failed before that fix. Action identity includes all allowed fields and ignores JSON property order for both grouping and same-plan idempotency. `bash tools/check-maintenance.sh --base 5b642aecb4d14fcff5f02037249b44a975bedec3 --task 294c9699-e536-4c56-85e8-ac07c1a4ffcf --lint-js` passed with warnings retained; both the grouping and canonical delta read-only vet passes reported no issues.

The supplied read-only HTML was replayed using actual UI controls into one grouped four-board OP at `/tmp/html-state-acceptance/what-if-schedule.op` and reopened through EngineSession. Forecast is at y0, Schedule at y1100, and Comparison empty/populated at y2200 with state columns x0/x1640. Group/source metadata survives the native roundtrip. Source SHA-256 stayed `60669108fbe419b2925e6b8a3014c7728cdb5fe5198e35748c8ab1b98617fc06`; grouped OP SHA-256 is `e9695f8ccdbc4ec7c7ed27831f72143727ddd675e71f1c64d44a2ea0d145737c`. Three representative boards passed actual CanvasKit verification; populated Comparison remains unverified because source internal scrolling clips graphic regions. Seventy-six unresolved candidates and the scroll warning remain explicit, so the sample is partial. Evidence is outside source control in `/tmp/html-state-acceptance/grouped-evidence.json`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Captured interfaces form height-aware rows and state columns; ordered action-field identity preserves group inheritance and valid-plan idempotency independently of JSON key order.",
      "sha256": "2fa875aee2a74fc2cc0cc1954a77945a77659d853762b2e5de3dfa0e65ce9488"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Same-source HTML boards are grouped by business interface and state in one editable document.",
      "sha256": "ffe8007b1133aaf1d7ee93bd024e455d0cca06d739ffb33594702d03dba037a9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Canonical grouping metadata does not alter MCP authorization or actual screenshot semantics.",
      "sha256": "9391652f188620f3ca6f662015b2a458f498ad700d5adb0a2be30185d64bc214"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Grouping uses observed technical routes and candidates; business naming still depends on source evidence and AI interpretation. Unknown states, internal scrolling and clipped graphics remain coverage gaps. Persisted routes omit input values. The source unit does not claim root Electron acceptance, publish a runtime, commit, push or build a DMG.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "b928a89a4ef007fcbdfbc068d27c683cd6581e473dc85c9675322baf8cada731",
      "after": "2fa875aee2a74fc2cc0cc1954a77945a77659d853762b2e5de3dfa0e65ce9488"
    },
    {
      "path": "docs/kb/product.md",
      "before": "32ca888858c62e44333e3ec631fdfb185fd97134ecd4101c00c6ec617025505b",
      "after": "ffe8007b1133aaf1d7ee93bd024e455d0cca06d739ffb33594702d03dba037a9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "d6265c472a6ef447fa87cb42b75e0549e911f2cf88217f80dea279f0381ed117",
      "after": "9391652f188620f3ca6f662015b2a458f498ad700d5adb0a2be30185d64bc214"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "28f8f47386d308c52b3d797d91156c6dc2a2402bbf252765db43cccf3a8aeed6",
      "after": "d6b6566922169e8e573b5e84420f9cdb7e660453ff85ca08156d76aac9a998e9"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-checkpoint.mjs",
      "before": "d1f9a7928c4d4a36db222e241a16b1cdcaf4878ad6019a6a9f1a171eed5e9edb",
      "after": "381f97402a2b9817289935ff930b4af430e6703ee0043d712504c726405f4ffc"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-groups.test.mjs",
      "before": null,
      "after": "6d8d26ad5f35080f187fb5170f04a29097506a886d0d549f14c1e0e389ee5af1"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.mjs",
      "before": "07a8a86f73da3f59f0db3ac79e348ae2eecd775309ca07ffb217eb00ca7987aa",
      "after": "fa14ab1e8dcad2d6f03bf6ac2b077cee5e8e04cdf267df4a8bd9eb29d9d14151"
    }
  ]
}
```

Completed-At: 2026-11-17T17:47:28.811454+00:00
