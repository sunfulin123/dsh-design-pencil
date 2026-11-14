# Add editable extension Dialog workflows for ListPage user creation and upload import

Record-Version: 2
Task-ID: 82e684a8-70e7-44f4-bda3-63b476c52a0c
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T16:58:16.855593+00:00
Type: feature
Status: complete

## Context

Add editable extension Dialog workflows for ListPage user creation and upload import

## Changes

ListPage Create and Import buttons open copied Extensions Dialog workflows. The creation form composes FormField, Input and Dropdown for name/email/role/team, validates required values and duplicate email, and appends a local prototype user when onCreate is omitted. onCreate(draft) delegates persistence and supplied-users refresh to the host. Import composes UploadFile for .csv files up to 5 MB; onImport(file) delegates real import, while the default only records the chosen filename and does not parse records. Async submit errors stay visible for retry; loading guards duplicate submit/dismissal and disables inputs.

Dialog now exposes a named modal role, Escape dismissal, busy semantics and a local PortalProvider. A rendered role-selection test reproduced a global-portal/focus-boundary conflict that blocked the confirm button; the local portal fixes normal selection without forced clicks. Dropdown forwards aria-labelledby so the visible Role label names its control. UploadFile keeps a single persistent input and a native named choose-file button, supporting change/remove/reselection and keyboard activation. The earlier suspicion that the original Change file action itself was broken was not established against the old source and is not a claimed defect.

Workflow JSX is a supporting recipe source, excluded from standalone recipe discovery but copied and linked in authoring docs. The source index resolves both .ts and .tsx supports. Recipe catalog, component MDX, AI index and SS sources document the callback/placeholder limits. No upstream, extension package dependency or generated E2E/Cucumber document is introduced.

## Validation

`bun run docs:build`: PASS, strict documentation/example TypeScript checks, React demos and 275 Astro pages. `node --test test/export.test.mjs test/wfm-upgrade.test.mjs`: PASS, 6 tests covering complete exported source paths, deterministic bundles, .tsx support copying and immutable WFM provenance.

`node --test test/list-dialogs-browser.test.mjs test/site-browser.test.mjs`: PASS, 5 tests across the dialog workflows and existing documentation/recipe coverage, including all 199 examples/four recipes and ListPage states. The focused dialog test passes again after adding the named Role locator. It covers field/duplicate validation, real role selection, local creation and search, Cancel/Escape/reset, invalid/oversized CSV, selection/change/remove, filename confirmation and both host-failure branches. Surfaces fit 360/640/1024/1440 in both themes; screenshots are inspected. A separate 424×540 check confirms the create footer remains inside the viewport. The local PortalProvider makes dialog body mounting asynchronous; tests wait for the upload control before counting it.

`node --test packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: PASS, 9 tests covering the resource and staged-runtime path. A fresh pnpm Workspace project installs and builds with copied workflow helpers; its actual business iframe creates a user via Dialog and accepts a selected CSV through the Import Dialog.

`node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build` and `pnpm run doc-check` in SS: PASS. The helper checks copied Dialog/UploadFile workflow sources. A final byte comparison confirms seven recipe/helper/component/AI-guidance resources match current authoring source.

`node --test test/list-dialogs-browser.test.mjs test/site-browser.test.mjs test/export.test.mjs test/wfm-upgrade.test.mjs`: final PASS, 11 tests after the private field-renderer split and pending-submit focus fallback. The actual copied pnpm project also builds and creates/selects a file through its business iframe after refreshing resources through writeSourceResources, including the same import rebaser as the scaffold.

`bash tools/check-maintenance.sh --lint-js --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 82e684a8-70e7-44f4-bda3-63b476c52a0c`: PASS, source cap, maintenance tests, task/knowledge receipts and lint with warnings only. `git diff --check`: PASS. `vet --agentic --agent-harness codex --max-spend 1` cannot execute its review because the 14,353,281-character aggregate input exceeds the agent's 1,048,576-character maximum. No passing automated review is claimed.

Initial typechecking rejected Flex as a native button; the choose-file action uses a real button instead. The SS helper initially rejected reworded table-edge guidance; the explicit no-rounded-card contract was restored rather than weakening that assertion.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Retain source ownership, focused UI regressions and maintenance evidence requirements without policy changes.",
      "sha256": "10a2e268149079a300dda20d02a88726f5020be5cb4110e17771a25cc4cc8cc6"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Describe source-template creation and upload Dialog workflows with explicit local prototype and hosted persistence limits.",
      "sha256": "beebe937b43a28746f8fd4fdf2da75e6b2494fea4d6930b9a9f0c8490b6a55cb"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record TSX workflow supports, copied user-field renderers and modal-local portal ownership through the existing resource path.",
      "sha256": "92f282790793c7e136155eab57e98c9f202a1f637b1c569a36709002b79ae560"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The source-cap gate initially measured 502 effective lines in ListPage; read-only user field renderers were moved into a cohesive private support module, preserving markup and copying/indexing the new support alongside workflows. A manual fixture refresh initially copied an authoring-relative import verbatim; using the same import rebaser as the scaffold restored the successful build. These were validation/setup fixes, not upstream defects.

No backend or durable storage is provided by a recipe. Host onCreate/onImport callbacks own persistence/import and failure handling; supplied users must refresh after a successful hosted creation. New-project templates update without overwriting authored files. Private Cobalt registry/CDN requirements and existing build warnings remain. No upstream edit, commit, push or release is performed. Restart SS and use a new conversation/project for model acceptance.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "7ab5b9361cc2bd9789becc84ef89e188e861e96045965e52e454d4d1b469a505",
      "after": "beebe937b43a28746f8fd4fdf2da75e6b2494fea4d6930b9a9f0c8490b6a55cb"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "c41e450ec1dab2452fb12ddda3434ca4c878351c536cd9d69da65b7530e4c052",
      "after": "92f282790793c7e136155eab57e98c9f202a1f637b1c569a36709002b79ae560"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "ac595bb28201fbd2ebaf902c76e0c15a8fdabff5634485a6f8c29bd6b4c67c05",
      "after": "10a2e268149079a300dda20d02a88726f5020be5cb4110e17771a25cc4cc8cc6"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/dialog.tsx",
      "before": "338c7dafca8ffbf8531fb43904a2e1b2887de27756347490e0a1a42209113002",
      "after": "25aa3f8551f7ff2b823b3536fc1124a28ac8948250f95dadf845f44b9b49f3e1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/dropdown.tsx",
      "before": "e1b07aef1938e5963920dabccda5e45d288b0502fe7bf3ba8bb3c79ada6610b4",
      "after": "6fb4943517a1315a9dd45d270940b73e55c67e003380b20e9e0a522f4d30209b"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/upload-file/upload-file.tsx",
      "before": "aa54b416c4bf94c8fc2b38ae98abdce2d9bf84c5c31329f15b417125741343bb",
      "after": "fa941f2220bd5234f6b93fb5cbc49eb9964b8a0700ec83f904b48f2472b53432"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dialog.mdx",
      "before": "330d250c21cb8943ae298882b77527353b3cf4bf476caa4361d2115b6032256c",
      "after": "7e2c6f2f4c3bdac367ae890f5bcc9485c8b3322f64fdf7d6f66a038c40588e5a"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dropdown.mdx",
      "before": "8bca871c4d2539969c3340d5859194457928702ba3e0cdb1b94adc4edfe9cb63",
      "after": "80c046b7726f08f583caf6ef8a562d154044e9e8e7f96fdfc0d800798636daac"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/uploadfile.mdx",
      "before": "3e15d0b1cdefffc61ff51e9d4fcf19dffdd6ff2084b4e6d610363a89188b4735",
      "after": "77bf13f4196e582ae8bf12ab369156a97b07eccb9dd8fbf47530e6005aff519e"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/main.tsx",
      "before": "cd0e1ac5f4ca9acd874675bf60db7c001361561b46576feb98e0b82b6a07e57d",
      "after": "f253da3c6012164e0f33d1b950a8f5c1b71190ba252103044076b251bfae1173"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "a157e7ea8693e17b98e65244bc3f1a850d63e8359fd86d7f2440f1b50de83242",
      "after": "e21ec9ac8b197e8b914c73d1d0bc5a9831e6b78b2fdbe2e1f60177fe5fb982a7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "6e0d35a2401497eecb68582e91427c873eb521bb88a302aa73e360af55a4bda0",
      "after": "524b9b259e660d20b22324b3bbcadeb4df02e409fac25aefe795375326da69e7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "4a12679ac33a72b25f9928b77d46dac54ff6d1e1ba637d59a324a46be8b32931",
      "after": "d1e827b21d6f86c44f503502ef24cb3c49a05948d8dd1a433ae6ca76b3956bc2"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "788fcb0085fa1999c6bd3c6ad884609134b1a31e4421b4a03d6cc0e0f40fcfaa",
      "after": "06044fd31c160f1999ab6899b58e3197b43317faa45874085dce9b1fdbbd18a7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-page-dialogs.tsx",
      "before": null,
      "after": "05fad0774d1ef661b216bf83536cc58217bd8f2beefb782874c54ff877f230a0"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-user-fields.tsx",
      "before": null,
      "after": "96183d12de3c0b622ab3c57fdb9542faddadbdb415c45b3d951294bd4dca094c"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "cad8bcb998e57c47901742ddc3e1ba7f75baac7b914ffbc60fcc5cde7bf80400",
      "after": "c887d9da9267221c1fa5b2a22c2f80274556785e144936dc510c15c2b7d14b83"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/layout-templates/list-view/list-view.md",
      "before": "87188f84f0bc22f99592652a5adb92633e5e0b6ff9b0dff1c3b08c6cd877bee6",
      "after": "24206c18fb9d330a6523549f5cfb1f80f2c10230de377667b0fe9959ec1ffbe3"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/source.json",
      "before": "43fc916c00dbf9d2532a232b99cb9529811202cb09a6432269c480b7d71f7648",
      "after": "acd7747ef1a650d23c64b75043dd0f59e02f2b362b1916e020b19b939604116b"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "4ce8a9f568e198b7e3c16f6f0b3b2cd99bcbc2cbeadcf149c04c4027bd3fe7e6",
      "after": "8c1abf2e120b7cd994fdb915c7d9b17e8e28ed1a5f26936a1a5cd960b69876ba"
    },
    {
      "path": "packages/talkdesk-cobalt/test/list-dialogs-browser.test.mjs",
      "before": null,
      "after": "34d3d4d3d1534fd7d4cc0b3d725cb9c8f11a8a4722ce7c960a0427fa2f86b342"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "aac8fb54abfddf05a3bacd17120a56750cda9473e738470e0a4b502bd7ad81ba",
      "after": "85380b63b2eed0a9322ea97f508b89ee6fbc6dae29927d27cf8db81d4291cc25"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/content.mjs",
      "before": "27da5369e0259bd60039c85b27d2e9b548a12222c1a804d41c18a5cb053f54de",
      "after": "d7b9c84eb1a57fdeac983af4ae1156ea5062d5c11a1eec133672458ba397aaef"
    }
  ]
}
```

Completed-At: 2026-11-14T17:29:25.381862+00:00
