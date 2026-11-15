# Correct the copied HTML review Reset SVG arrow geometry and synchronize the SS resource and preview.

Record-Version: 2
Task-ID: 27d601eb-72d2-4529-958a-a8a1ff1f8359
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T07:03:36.117902+00:00
Type: fix-bug
Status: complete

## Context

Correct the copied HTML review Reset SVG arrow geometry and synchronize the SS resource and preview.

## Changes

Corrected the Reset SVG in both the ordinary HTML source library and the Cobalt Workspace review-toolbar template. The circular stroke now connects to the arrowhead; the detached diagonal is removed. Button dimensions, accessible names and behavior are unchanged. Generated SS resources and the live generic preview are refreshed from their source owners.

## Validation

Source inspection reproduced the disconnected diagonal in both templates. Focused source-copy tests pass (3/3). SS runtime staging, plugin/desktop builds and packaged-helper tests pass (1/1). Chrome screenshot inspection confirms the joined arrow and removed spur; the actual Reset action works. The packaged-helper browser regression passes (1/1) across sizes/states/light/dark. Vet reports no issues. Maintenance and final diff checks are completed before task closure. No new behavior or API is introduced.

- `node --test packages/dsh-node-runtime/html-review.test.mjs`: PASS, 3/3.
- `DSH_E2E_CHROME=1 DSH_HTML_REVIEW_HELPER=<SS bundled helper> node --test packages/dsh-node-runtime/html-review-browser.test.mjs`: PASS, 1/1.
- `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <Design source>` and `node --test plugins/ss-dsh-design/tests/html-review.test.mjs`: PASS, 1/1.
- `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS.
- `vet <focused Reset icon scope> --agentic --agent-harness codex`: PASS, no issues found.
- `git diff --check HEAD`: PASS.
- `bash tools/check-maintenance.sh --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 27d601eb-72d2-4529-958a-a8a1ff1f8359`: PASS after the evidence correction.
- Maintained Cobalt preview source copied from the corrected template; `pnpm run build`: PASS, delivery refreshed.
- Initial maintenance failed on missing exact validation commands; corrected this evidence section and reran.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The Reset icon repair preserves documented library ownership, review behavior and engineering contracts.",
      "sha256": "c9a5f7c8eea78c0ac00202bb1b71377fc7163772f50a2493ed2a65937b36feea"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The Reset icon repair preserves documented library ownership, review behavior and engineering contracts.",
      "sha256": "da4d977b0baf914ded15bbf13fcb330d877dc1b762b14742d5e1cb37b7e9b3d9"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The Reset icon repair preserves documented library ownership, review behavior and engineering contracts.",
      "sha256": "41e0f29f606caf7a7a2ee8f29224d3eec8f8c5880758c01ffe42438c76e5211e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Existing generated user projects are not overwritten. No Cobalt upstream edits, commits or pushes. Only the source-owned templates and maintained preview are refreshed.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "ce16e1fc419b2c0d839caf220466d0a4cc439b9e8b85e2f46090e8f0901b411b",
      "after": "c9a5f7c8eea78c0ac00202bb1b71377fc7163772f50a2493ed2a65937b36feea"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "c2ecbbc8eab4a20362cca4ea6637aa68963fea00656a6f942ff3c8b86c6d1636",
      "after": "da4d977b0baf914ded15bbf13fcb330d877dc1b762b14742d5e1cb37b7e9b3d9"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "ecbaf4fa85e62e8646e55839aa21fe429ac6f27099c34c8dd40211a1f47579c9",
      "after": "41e0f29f606caf7a7a2ee8f29224d3eec8f8c5880758c01ffe42438c76e5211e"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.html",
      "before": "e855c6f16df0ed6b86db23e614e86f928040e3622cb80bcf6b0c0c8623000d11",
      "after": "b3e6de9f57b754b1e0e0f04af82cf83eb2d9c4aa49089f3dbbad55c02905dcef"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.tsx",
      "before": "d10136a4a93f2052c9ac8e8c0ab014ce4da17dca586129dc6017a918298daa0f",
      "after": "07109537343953392a0f2bd031512ae2cd666ab51c2a3344c27e7cfe341dd98c"
    }
  ]
}
```

Completed-At: 2026-11-15T07:07:06.455897+00:00
