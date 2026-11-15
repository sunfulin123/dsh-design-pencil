# Add a source-copy active-call recipe reproducing the supplied Conversations/Callbacks screenshot with Cobalt controls and icons, documentation, AI discovery and SS packaging.

Record-Version: 2
Task-ID: 52f8a127-a3e4-48e6-bfb2-88fd16057972
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T07:12:31.233758+00:00
Type: feature
Status: complete

## Context

Add a source-copy active-call recipe reproducing the supplied Conversations/Callbacks screenshot with Cobalt controls and icons, documentation, AI discovery and SS packaging.

## Changes

Added the Active call recipe and explicit source-copy contract. Conversations owns its local queue state; call dialogs own callback/keypad/target/confirmation forms; the composition owns call status, tabs and pinned actions. The reference content, two historical entries, all footer actions and original sample counts are retained. All controls/icons use Cobalt or copied Extensions, with token-based light/dark styling. Astro navigation/preview, generated recipe Markdown, AI registry/index and Cobalt style guidance expose the same sources. No upstream or telephony service is modified.

## Validation

Initial TypeScript checks caught old Text/Message/FormField API assumptions and were corrected against installed Cobalt source. The first browser glyph assertion expected the wrong font-family; actual Cobalt uses Material-Icons-TD and data-co-project=cobalt. The corrected browser checks verify all reference strings, pinned geometry, local workflows, dark/narrow and all scenario states. Exact final commands/results are recorded below.

- `bun run docs:build` in `packages/talkdesk-cobalt`: PASS, TypeScript/demo/Astro build, 277 pages.
- `node --test test/active-call-browser.test.mjs test/export.test.mjs`: PASS, 6/6, no skips; reference text/geometry, local actions, all scenarios, dark/narrow and complete source-copy closure.
- `node tools/build-skill.mjs`: PASS; active-call registry/Markdown/TSX/support sources included.
- `.venv-lint/bin/python tools/check_code_line_cap.py --baseline-ref ff6ba7446a201959e8419684d4c4720922cb3f3c`: PASS.
- `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <Design source>` and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS, 1/1.
- SS bundled `cobalt-lookup.mjs --id recipe.active-call` and `cobalt-project.mjs create`: PASS; all three support sources resolve and copy. Initial disposable smoke assertions expected four files instead of three and used macOS's linked `/var`; corrected the harness count and resolved the temporary root with realpath, preserving the tool's safe-path checks.
- Screenshots visually inspected: `/private/tmp/cobalt-active-call-final.png`, `/private/tmp/cobalt-active-call-dark.png` and `/private/tmp/cobalt-active-call-narrow.png`.
- Live recipe: http://127.0.0.1:55240/demos/?entry=recipes/active-call.tsx.

- `PATH=/Users/franklin/.cargo/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh`: PASS, embeds the active-call style hint; runtime resources rebuilt.
- Fresh SS-packaged scaffold with copied ActiveCall: `pnpm install --offline` and `pnpm run build`: PASS, no new dependencies or Extensions package installed.
- `vet <active-call scope> --agentic --agent-harness codex`: PASS, no issues found.

- After visual dark review, timeline icon colors use semantic `--text-primary`/`--text-info` rather than fixed shade tokens. `bun run docs:build` and `node --test test/active-call-browser.test.mjs`: PASS, 3/3 after the color repair.
- Initial maintenance rejected the CSS source hash changed by that dark-theme correction; re-reviewed the affected source and refreshed provenance before rerunning.

- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 52f8a127-a3e4-48e6-bfb2-88fd16057972`: PASS after final theme provenance review; warnings only.
- Final SS `EngineSession` / `get_style_guide`: PASS; compiled Cobalt guidance names `recipe.active-call`. Final bundled lookup resolves the updated semantic-theme CSS and all support sources.
- Final focused theme `vet` review: PASS, no issues found.
- `git diff --check HEAD` in both repositories: PASS.

- Final SS staging, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` (1/1), `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS; desktop bundled payload refreshed from final sources.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "New business recipe uses existing lookup, source-copy and SS resource boundaries; no runtime API changes.",
      "sha256": "fc369a1cbe04e95b7dc1568e69f684c35e37833c5ace0fe0c490564d52b4afdc"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "No engineering standards or unit boundaries change for the new recipe.",
      "sha256": "4d5e5a9d3b4be4d08af9fcd1e230dca3971258d6cd8ce9a6594a36810d539543"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Active-call source-copy composition uses Cobalt semantic theme colors; screenshot content and local-only behaviors remain documented.",
      "sha256": "cc3ca569633d3cf0e2289a02d57ed6fd3d9be58be54f9532348c6b251e82384c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Screenshot content is sample data. No live telephony, recording, DTMF, transfer or backend persistence occurs. Existing user projects are not overwritten. No model-driven SS authoring session, upstream edits, commit or push. Full reference layout is tested at 1386x861; smaller sizes use explicit responsive adaptation rather than shrinking the page.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "c9a5f7c8eea78c0ac00202bb1b71377fc7163772f50a2493ed2a65937b36feea",
      "after": "cc3ca569633d3cf0e2289a02d57ed6fd3d9be58be54f9532348c6b251e82384c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "da4d977b0baf914ded15bbf13fcb330d877dc1b762b14742d5e1cb37b7e9b3d9",
      "after": "fc369a1cbe04e95b7dc1568e69f684c35e37833c5ace0fe0c490564d52b4afdc"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "41e0f29f606caf7a7a2ee8f29224d3eec8f8c5880758c01ffe42438c76e5211e",
      "after": "4d5e5a9d3b4be4d08af9fcd1e230dca3971258d6cd8ce9a6594a36810d539543"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "62f262b5ce59aff19def2699825a39465326158e68065950f2e5125df35b6bc1",
      "after": "7792d69f8047490c2cc8e0cc3a3e9b90dbeecefd3a19575d39d7b37b2b6a0d25"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "f13bd2797127d05a257b47b974a38355a5fd4aa0de7ad26817e32ace902506b1",
      "after": "2dfdd618ef2406b15819f91f936669056d9efaa39450d819595dc08ca96ea247"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "6cdcc76670fb46c8c7313d84eacbb31e7787628925c8880a0c7c303e0b718eb8",
      "after": "17e74cab6376b2fff2143b8c7f449583dc290e1632871d4fe3ca13a2ba6dfdf2"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.md",
      "before": null,
      "after": "db6ab627d6805a39ad5eedab5ffe81d109e21166c5df9978ef082323e47ee3fc"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.tsx",
      "before": null,
      "after": "360cea4b30f199ae7589935789b2e4ab96f8a13c84ac7f2c35109311fb4696b1"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "2b74b7a5c70d650b0d0ee664a793e00750881d2c4205f09d20adde97ea0ccf74",
      "after": "e3c84f1738aa9f73faa8391f58ab65c46b40eaaca8c4d32cd299096a8ba82af3"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/active-call.css",
      "before": null,
      "after": "70e4e2f3bc1d493cfb62b7c443c0cb0370f613be4b014b54e2c5332bb4668070"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/call-dialogs.tsx",
      "before": null,
      "after": "2f58529fce8ea43dfa0b9a6e97a6000c9faacde9ec5b4c31270aa844781c18ee"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/conversation-queue.tsx",
      "before": null,
      "after": "1b1192496825a09b015a3437b3d678913855fe7bb994a9ed16fc11b06c5f1552"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "03d656ac31b0e1a25c3229b54dd0a418a44627650ba4caab605d845d3ded5d47",
      "after": "fead74fda97dc7b8c43491835c8c8f849045bafaf31da5a3f9f6e7992036950c"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/lib/catalog.ts",
      "before": "d25fb4ed267a46bbc87e15a1709490865a8ef32a30135ce2e17d42a36a6dfd8b",
      "after": "83fab739d43f6d5c05d38240838d1ebb6e63578a39d41358246c1af84b325ed9"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes.astro",
      "before": "6b963182f8252fafff41ff0975194737eacaf800b3712dae0fc2d409ff61ba87",
      "after": "be4b4a68fbe2d5161c9ed8720df15c13662c0523135c6e14b839e100a8b26eba"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes/[id].astro",
      "before": "f232423148c03f7a89e51c4b91f0f8feef65d3d288089764c6449c1d7a6b4fe1",
      "after": "0f920ee195933f5db2e2f8e2c9dd7be57aac6833e36786c97aeaba47bc6a43ad"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": null,
      "after": "70f4a36c227d0f699d9964237ac8ad0fdc5c3f95c8bc9547ea0030b9fbccdbb7"
    }
  ]
}
```

Completed-At: 2026-11-15T07:33:59.246853+00:00
