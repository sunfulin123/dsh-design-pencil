# Use stable business-name design task directories independently of Chat

Record-Version: 2
Task-ID: 4c1def60-9ee2-4252-88e5-691ff369c53d
Base-Ref: 886eabd43287bc418711312241457e47850c7eb3
Started-At: 2026-11-18T10:33:15.642241+00:00
Type: feature
Status: complete

## Context

Use stable business-name design task directories independently of Chat

## Changes

The runtime locates new HTML and OP artifacts in business-named task directories. The Design Skills use the saved artifact path to reopen and revise a workspace task from another Chat. The release packages these rules with the managed editor refresh and import updates.

## Validation

The command `node --test scripts/check-dsh-runtime.test.mjs packages/dsh-node-runtime/{document-file,design-workflow-text,package,html-fonts,html-state-import,html-frame-snapshot}.test.mjs` passed 40 tests with 18 browser cases skipped. The commands `cargo fmt --all -- --check` and `node scripts/check-dsh-runtime-dependencies.mjs` passed. The locally assembled Electron runtime passed workspace task publication, Cobalt authoring, and opening and saving an existing generated OP from a second Chat.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record current workspace artifact naming, managed canvas, and source import behavior.",
      "sha256": "fddf1a6b95ed350b7aa1f9669ab84c57972fbdbf42a8a2ba531b960500c0b98a"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record current workspace artifact naming, managed canvas, and source import behavior.",
      "sha256": "4db96c217bb7f045e658780f4ffd466d0348bf6c0114169421882b4a31e87907"
    },
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Record current workspace artifact naming, managed canvas, and source import behavior.",
      "sha256": "4c8d9b9ee5c9e99761200d4c679ec359ceecc1fa3198188915acda45f02c1e71"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "updated",
      "reason": "Record current workspace artifact naming, managed canvas, and source import behavior.",
      "sha256": "a0fbeb60fe39409179c5493a9aaabbd14b70c6c6169a749b0c150d14e7d264fd"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Existing task folders and OP files retain their paths. Supplied-source import coverage remains bounded by the states and resources the importer can verify.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "957845dad7447acd0fb12a5696867b6625f8830361321343e6d5f8ec1e89eb8d",
      "after": "3d51f1268b4e613a02de4d14ff246ef2d8d5df660035d69401fdaa4206fba807"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "19c236d28ec350e289537c4e66d312314689c801f54d568909843ec16b5a5cc6",
      "after": "c025ed2cb42f874e25544461d2b21bbedd063ff1165d9b5beafcc03d4d97ddd4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/_index.md",
      "before": "3ee66d211d5e4f54561e560fb4f392556ccca342dd9f70676336440012f7bf64",
      "after": "11f97cdf29d5ae0d784be9a186fb0eba75ebca8a37c80526fa81e657db99adf2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "1df33c2f44de5cb9348505cd827a45445e2750da28139300df2a47fea28cd43c",
      "after": "3cca33419ca621571d6f22dc2e5b7489d6908ba575f1178ce25e84fec886011f"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "a5cd0865530dc3c0a5b30397c1fac8fa61309ce0426b0cb57e8f8b0fb950e097",
      "after": "a0fbeb60fe39409179c5493a9aaabbd14b70c6c6169a749b0c150d14e7d264fd"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "09d6a90ff2dce9d1ddf344995e22eb1a074493b79a6ad7d1e5edfac0c7f08e97",
      "after": "4c8d9b9ee5c9e99761200d4c679ec359ceecc1fa3198188915acda45f02c1e71"
    },
    {
      "path": "docs/kb/product.md",
      "before": "63627a7e3f26625869ce35d5b84cd9b4fd808885f4cc69515a1cd50b9c209811",
      "after": "fddf1a6b95ed350b7aa1f9669ab84c57972fbdbf42a8a2ba531b960500c0b98a"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "3985a521cedd343c82835ce2398612568fd0df0c1fe4d57d2503384fac7f2d48",
      "after": "4db96c217bb7f045e658780f4ffd466d0348bf6c0114169421882b4a31e87907"
    },
    {
      "path": "docs/notes/implemented/chat-generated-op-path-aeff3821.md",
      "before": "4145460d7ef7906b9929d326179d7067dc8ff10631bab42d2be24105d6052d8d",
      "after": null
    },
    {
      "path": "packages/bun.lock",
      "before": "251c03d913f3acca8296c6fa1c3fd6ac6e087bc4936e90e2861b71608fdfae81",
      "after": "b6d549b7f67552d3688e9987e31ae87a9ddee5c1ecb5951bae174a0e4cfa35b5"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "f3e06be149f485ea1ff7e6799c9a3074179ba1b43bca277c2d7ae5ffde848ab6",
      "after": "1141925fe605fcbe7b3bef66c350f06cce5256d8f711c83f88aa82a220c7b1bf"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "5c3450f3006b0921b2e7ed3827752838a6c0fa100f07185ee2a052ebf189b866",
      "after": "1f425fd8e0d40424f8b595f16e404f79acebed0047c7b652c4b406566ecfda79"
    },
    {
      "path": "packages/dsh-node-runtime/document-file.mjs",
      "before": "a1a9e100c7b33779764d6cc5097560a8de2ae3f0ad13adef9d9e90f87e90d00b",
      "after": "ffc461fcf75719d5530643cc82398bae9b65e08aca20c7d0d33ac0f5f0419465"
    },
    {
      "path": "packages/dsh-node-runtime/document-file.test.mjs",
      "before": "842c5685a846ea5f1feac4fe8c1cdd97a8d83d95378a25b99be2b8900732942a",
      "after": "9d6154fbb7ae35b0bd79feef9b8314269fef9b21e4cf8861c32dbab78eab9bde"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "68eefa6c3d1401fc6c62cc0540f15b444ba371234d2fa5f60a8aad55b12987f0",
      "after": "16276105f7912b3e50f875fa6ab84acf3ce313a89c7f5f319c3a951af861cc47"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "90b8b5c84d5bcefde01782d43eecc660b38efd0344d7cc238539ff13dfd53bf3",
      "after": "3a443f54d71e606e4b0dbd74a4e16c31b5bb9977e98f8b69ea2d0c2a4f3de47a"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "19c236d28ec350e289537c4e66d312314689c801f54d568909843ec16b5a5cc6",
      "after": "c025ed2cb42f874e25544461d2b21bbedd063ff1165d9b5beafcc03d4d97ddd4"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "5513eaee70e9da6c19575cb24beb587b7f7d7bc32916767ebe5ef50bf18fd9a5",
      "after": "5214c13057bfcffe071f79402b9e77bda5d68543ce1b4cefe00de1bd04d08a51"
    }
  ]
}
```

Completed-At: 2026-11-18T12:18:47.015221+00:00
