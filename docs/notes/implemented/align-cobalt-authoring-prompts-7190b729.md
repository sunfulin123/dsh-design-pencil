# Align AI component selection guidance with the public Cobalt extension catalog and verify the exported Schedule page prompt.

Record-Version: 2
Task-ID: 7190b729-4200-4a52-8e1f-8f410f1f2ed3
Base-Ref: a652faa0a182043488fdef046d9f65fbd95c345d
Started-At: 2026-11-20T07:35:27.515165+00:00
Type: fix-bug
Status: complete

## Context

The Workspace companion used Schedule page and was updated to prefer official Cobalt controls. The generated AI index still directed new UI through copied components first, and its recommendations could diverge from the public documentation.

## Changes

- Share the public extension IDs between the documentation website and the generated AI authoring index.
- Guide new UI to official Cobalt APIs first, then to the nine recommended extensions. Keep the lookup and source closure available for recipes that already depend on copied components.
- Point the Workspace companion and its Cobalt reference to the canonical recommendations. Keep Schedule page in the generated recipe index.

## Validation

- `node --test --test-name-pattern='exported source templates' packages/talkdesk-cobalt/test/export.test.mjs` failed before the fix because the exported index lacked the official-first guidance.
- From the Cobalt toolkit, `bun run docs:build`, `node --test --test-concurrency=1 test/export.test.mjs` and `node --test --test-name-pattern='nine shared|Schedule page uses' test/site-browser.test.mjs` passed. The tests cover exported and copied guidance, the displayed label and the nine public extension links.
- The pinned SS release and local bundled guide still identify Team Schedule on runtime 0.8.5-synapse.13.
- SS verified the temporarily staged runtime with `verifyLocalRuntime`. Reading the staged guidance confirmed the official-first rule, the exact nine recommendations and Schedule page in both the index and the companion. The first manual check counted a comma from the next sentence, and the corrected check verified the exact names.
- `bash tools/check-maintenance.sh --base a652faa0a182043488fdef046d9f65fbd95c345d --task 7190b729-4200-4a52-8e1f-8f410f1f2ed3` passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The official-first behavior and Schedule page title recorded in this entry stay current; the prompt now links the canonical AI index.",
      "sha256": "8a3db772ea88f0d6521dc57ed2b41754c9edd6c27ea99f6b39f4f9bb9f0988ab"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record the shared extension list for public docs and AI recommendations while retaining existing recipe source resolution.",
      "sha256": "f6e014a88d5afe6ade419bd28cf59a65827588c71fb4d2762805035bd4f208b3"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The existing SS release lock remains on the published runtime. The source and staged runtime evidence does not establish deployed availability.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "1ab85334a12d18f5201c9e59e78d7594f72d6ec6bc74febf74d18da346b5e9a4",
      "after": "8a3db772ea88f0d6521dc57ed2b41754c9edd6c27ea99f6b39f4f9bb9f0988ab"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "5d1e57ca638763c0484e6d51f7ed168fe3cfa556622971e449f182cf5f7cabc7",
      "after": "f6e014a88d5afe6ade419bd28cf59a65827588c71fb4d2762805035bd4f208b3"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "69a3fbb2473518b59263608c1b194add396e41d55b2107e72130de2298cf793b",
      "after": "f6923bb3ca634148eb04021baae65408a5bd463b4747913240bb0e29678bbcbf"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/public.json",
      "before": null,
      "after": "5f86b29a3f91dd3e1f7207c06c38bd9a740b00cc68c40536638376d89cc9352d"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "940ca411b0dd9227d51e2321078494bcfa2cc269139582bdbb75712e56d8c9c9",
      "after": "918041082aa7d790358b80e8c01f0a0f879043785841998009ee94d72b58a4a5"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/lib/catalog.ts",
      "before": "c4821466adf539cf4ab12932fa4ed9062278ae97d3c7fe0753dfedc13335d52b",
      "after": "5a03283f5c04cdd186b54eeab9ab00a7fbca1956310f741eefda21a668da99d4"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "6582e260382bd0e550a3f048a29775c98e5444fba31fa72f670dd1673decd37f",
      "after": "b7ce89b4c36077939d4af0e116dc60f10c1023106c30e80e1b3208cfc6e1c7e9"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "53267d06781ed6cc5a699f057b4614c0fedd59207846557c479345e27198f6c9",
      "after": "a415d2098d08adc112dec61eb6a5f7d372b14b25b894627219193c713a79c7c5"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "3b7911b36a25c6ad383b951a96cc3f869744f0a09793108a42e0298bd307a555",
      "after": "466f57bb27141539fa5c31076f99fbdad1f169c2e6ef9f400d4ee672546fb731"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "46c9f9b6817d89e1c05040705533b033b0c3fb81d979be794a9a90b7b98dbee2",
      "after": "2f8914dc7fffa90d2da6188c3a6bfb180d469dd700a5ed04f9e4afc920ec5f6d"
    }
  ]
}
```

Completed-At: 2026-11-20T07:38:26.930969+00:00
