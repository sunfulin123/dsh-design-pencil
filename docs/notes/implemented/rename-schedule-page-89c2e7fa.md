# Align Design documentation with the Cobalt Docs schedule and extension catalog

Record-Version: 2
Task-ID: 89c2e7fa-6a0c-4dbd-b90e-e272ef8993ee
Base-Ref: a652faa0a182043488fdef046d9f65fbd95c345d
Started-At: 2026-11-20T07:20:06.028783+00:00
Type: fix-bug
Status: complete

## Context

The Design documentation site displayed Team Schedule and listed 28 extensions. Cobalt Docs PR #42 lists nine extension templates, and its recipe stack uses Schedule page. Several Design-only components are still used by maintained recipes.

## Changes

- Use the recipe catalog title for the index, navigation and documentation heading. Set the public title and demo heading to Schedule page and keep the recipe ID and existing URL.
- Publish the nine shared extensions in the homepage, navigation, and reference routes. Redirect the old extension Button route to its Core reference.
- Retain the recipe source registry and component implementations so documented examples still build.

## Validation

- The running site initially returned Team Schedule on the existing route. The site catalog regression also failed as expected against the original 28 links.
- From `packages/talkdesk-cobalt`, `bun run docs:build` passed and built 260 pages.
- `node --test --test-name-pattern='Schedule page uses|nine shared|every generated|single dropdown, calendar' test/site-browser.test.mjs test/popup-dismissal-browser.test.mjs` passed all four selected regressions.

- Chrome against the live development server verified the nine sidebar links and homepage cards, the old Button redirect and the Schedule page heading in both the documentation and the demo iframe.
- `bash tools/check-maintenance.sh --base a652faa0a182043488fdef046d9f65fbd95c345d --task 89c2e7fa-6a0c-4dbd-b90e-e272ef8993ee` passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Use the Schedule page title for the public recipe while retaining its scheduling behavior.",
      "sha256": "1ab85334a12d18f5201c9e59e78d7594f72d6ec6bc74febf74d18da346b5e9a4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Use the new recipe title in the runtime documentation.",
      "sha256": "5d1e57ca638763c0484e6d51f7ed168fe3cfa556622971e449f182cf5f7cabc7"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The extension allowlist is pinned to Cobalt Docs PR #42 at revision 997390c626affcb7f5aeee94d253bc3f2bdfbc46. Future public extension changes can update the list in site/src/lib/catalog.ts. Recipe implementation migration and runtime publication are outside this documentation change.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "d6645c44afd85b9cf46c94de6415ac9e7c60317f23fa82edd68b0cde663efb33",
      "after": "1ab85334a12d18f5201c9e59e78d7594f72d6ec6bc74febf74d18da346b5e9a4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "72a04239f1d124c13201db62e46c811e908a1d5e75fce292b99d62d6a0f58b09",
      "after": "5d1e57ca638763c0484e6d51f7ed168fe3cfa556622971e449f182cf5f7cabc7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "18943147dbea06dfad0f4310f750e85f003078a8212d2462fbbfb93b86c3dd73",
      "after": "0de0b2a9f833412747c5cb2a8ff251878a7fb612e95c22472a0e46d4cb8fc030"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx",
      "before": "1a354fb3dd88a40eb98e231f11115c74e8c71ed8a369afc4799e669d3e010914",
      "after": "8d00b0d55bda432b84ba09cde09a66204718defcaf6e8acadce406d635db2c29"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "cd14abb753957ca2749be3ffac0cc9b4878cefc805d07b2332ff10012a51ac07",
      "after": "7ef19a88898985e5f401a7d97540fed10ba11fa462f9f2f1886b8552026f72a3"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "e768309db8dbb0a2a7a49f8cb6ed646874185f7be9dbbc2d0afa000c0a0696a8",
      "after": "940ca411b0dd9227d51e2321078494bcfa2cc269139582bdbb75712e56d8c9c9"
    },
    {
      "path": "packages/talkdesk-cobalt/site/astro.config.mjs",
      "before": "790e5ff19d84faff32a185de8613c908b744e8fdf7e7fe3f05a0ccf04e898e6c",
      "after": "b486d5234a99a3761d5d24fb96642842e9d23f29065723d6ba743e0e728618e7"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/lib/catalog.ts",
      "before": "2ff203b0c8ed6420df8f10657069293e47c28282c73c932b4eb14f3aa398a423",
      "after": "c4821466adf539cf4ab12932fa4ed9062278ae97d3c7fe0753dfedc13335d52b"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/index.astro",
      "before": "3ef6519a19d656f1722a4f3b2617a16eea0b17acc49e51b0fecb01bb47d3d1fa",
      "after": "c2e0826bcad68d749c6417b055709f47af361c48d42d2df14216dde7aacf4efc"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes.astro",
      "before": "131295f25fa6585d3307cc315274f4feaf373f6bc2af19b89e52bfb7516e732d",
      "after": "0c8933ee668a1717081d579f2fa8562d2094fa20d7d54e47464faae00a6972e0"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes/[id].astro",
      "before": "0f920ee195933f5db2e2f8e2c9dd7be57aac6833e36786c97aeaba47bc6a43ad",
      "after": "8fa988bd56fe5adac3b754388e127d025b7727bfbb4585ca942571b78e48157c"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/reference/[...slug].astro",
      "before": "12a0ebe99b88664adb59af133f4a527a18c8f9cf1e85e219fa9b431b758d675d",
      "after": "6737a9a043e3ac3decf1ac1dc2409286cf0c3471911214a34f49dc3b7c2b0cde"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "997cce51919ca7efb240120f121bec1f41d95782aaf53aa7816cf4d983b293f9",
      "after": "6582e260382bd0e550a3f048a29775c98e5444fba31fa72f670dd1673decd37f"
    },
    {
      "path": "packages/talkdesk-cobalt/test/popup-dismissal-browser.test.mjs",
      "before": "c5503938a0b9f83c790a7fe4a9b73c3d17cc4cdd96c82ea3f7d0ac47fc560ab0",
      "after": "e5b68b0a80ef3ae3b8b24793229b99ff2278919a54030c44a74687f987926371"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "784d406aa82e61d8f78c307df3d1800747a1f2e12fef73e062ea2bd82d3c475c",
      "after": "76f88c5ef9e1ec166a0f6d08404ecc397ef9e1e2082193d56a3ba63469d7c861"
    }
  ]
}
```

Completed-At: 2026-11-20T07:24:29.919151+00:00
