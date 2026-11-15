# Add native Cobalt Divider under ActiveCall tabs, a reduced-motion-aware caller ripple, and properly spaced Notes/Snapshot source templates; sync SS and maintained preview.

Record-Version: 2
Task-ID: 312503ec-84ff-401e-8ba6-01a074b284eb
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T07:47:39.418342+00:00
Type: fix-bug
Status: complete

## Context

Add native Cobalt Divider under ActiveCall tabs, a reduced-motion-aware caller ripple, and properly spaced Notes/Snapshot source templates; sync SS and maintained preview.

## Changes

Added the native Cobalt Divider at the call tab boundary. Caller animation uses two staggered 2.4s CSS waves expanding and fading around the unchanged Cobalt Avatar; Hold/end/loading/permission disable waves and reduced motion retains static rings. Notes now uses the copied FormField/Input with 16px section/action and 8px label/control spacing. Snapshot groups its heading and Voice tag above metadata with 24px separation and 4px detail gaps, preserving existing contact content. Updated the recipe catalog integration guidance and generated AI Markdown/index; source ownership remains unchanged.

## Validation

Initial focused regression fails on the missing Divider before implementation. The next check incorrectly expected a data-co-name marker; inspecting the official Divider source/rendered hr established role=separator and the co-divider class instead. Updated the assertion to the actual official contract.

`bun run docs:build`: PASS. `node --test test/active-call-browser.test.mjs`: PASS, 5/5 including Notes save, measured card gaps, native divider geometry, animation timing and Hold/reduced-motion stop behavior. Existing call interactions, all scenarios, dark/narrow and host box-sizing regressions remain passing.

- `node --test --test-name-pattern="call details have" test/active-call-browser.test.mjs`: PASS with additional keyframe checks proving waves scale outward and fade. Reduced motion and Hold remove the running animations.
- Focused vet review for Divider, motion and panel spacing: PASS, no issues found.
- Notes feedback now uses a padded native Cobalt Message with Icon/Text, a 16px separation from the card, and clears when changing tabs; it no longer clings to Snapshot after saving a note.
- Initial preview refresh attempted copy-source as a recipe export; it correctly exports component sources only. Refreshed the maintained preview from a fresh SS create scaffold instead, preserving the existing component directory and app routes.

- Final `bun run docs:build` and focused Notes/Divider/ripple/Snapshot test: PASS after feedback spacing; no page errors.
- Final feedback-focused `vet`: PASS, no issues found.
- SS staging, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` (1/1), `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS.
- Actual 57481 browser acceptance after copying from final SS scaffold: PASS; native Divider, two running outward waves, Hold/reduced-motion stop, Notes save and 16px notice/card separation, cleared transient notice on tab switch, Snapshot 24px heading/detail separation. Zero browser errors. Screenshots: `/private/tmp/cobalt-live-call-notes-updated.png`, `/private/tmp/cobalt-live-call-snapshot-updated.png`.
- `bash tools/check-maintenance.sh --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 312503ec-84ff-401e-8ba6-01a074b284eb`: PASS; earlier lint-js maintenance also passed.
- `git diff --check HEAD`: PASS.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Recipe presentation changes use existing local source-copy and SS resource contracts without runtime API changes.",
      "sha256": "30a1fd3eb94ef55dbc71c58b503ab46b1163f07100f58501d35f63d21d78ade5"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "No engineering policy change; decorative CSS motion follows existing theme and accessibility constraints.",
      "sha256": "924023be0b2e209a9d46a0b59f950cf6ebf98c63251da11688ff424df5584139"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Confirm final native Divider, grouped Notes/Snapshot layout, outward reduced-motion-aware waves and transient feedback spacing.",
      "sha256": "9a9670860d7a8d4546b65a28fc8715bc3ade89bb9407243e67ea220d73109c3f"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

CSS animation is decorative and transmits no call activity; the demo remains local sample data. The screenshot reference informs spacing, not invented language/update timestamps. No Cobalt upstream edits, dependency additions, commits or pushes. Maintained 57481 source and final SS payload are refreshed after validation.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "a0308febc3a103de942599331b7daf9b320a850da229aaa821d5aa2b2d73afd4",
      "after": "9a9670860d7a8d4546b65a28fc8715bc3ade89bb9407243e67ea220d73109c3f"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "747ab3743852b06b4d61124d4ef5e1bf76eb9ba4259805e8de8f4f71cd184128",
      "after": "30a1fd3eb94ef55dbc71c58b503ab46b1163f07100f58501d35f63d21d78ade5"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "26bbc41bfb52c36faa26ef93f684dd9da4e667facae1fcea0b668f0bb9f83a4b",
      "after": "924023be0b2e209a9d46a0b59f950cf6ebf98c63251da11688ff424df5584139"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.md",
      "before": "db6ab627d6805a39ad5eedab5ffe81d109e21166c5df9978ef082323e47ee3fc",
      "after": "d63f3119f09d797fc3fa3378ea30b6fd591cd94f9d9b7d737dfc6ec78dd3ce9e"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.tsx",
      "before": "360cea4b30f199ae7589935789b2e4ab96f8a13c84ac7f2c35109311fb4696b1",
      "after": "2cea59ebe4e4402a21312a058e749aa916b191a7b3c24a6255643fca65489fef"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "e3c84f1738aa9f73faa8391f58ab65c46b40eaaca8c4d32cd299096a8ba82af3",
      "after": "6301a7540ba39f6d9756f6cd8a832fee58c710d6534354eb7494b4d9aca1cbdc"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/active-call.css",
      "before": "0b2a3c8644a97dc1ef9885d794facf552d51a4e491b143826009ac8b7fdafdc4",
      "after": "f59c51bf35cd992764d1eed37967deeb75ff765bc08d046d7d6ea0385a5a496f"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": "b4f266cc081d34c1d7c571b359863b0a35ae32fc53947920c476dc78b4efd5de",
      "after": "bb4a3032136196655f64540e500e991827cd0116be2d954ecefb234567314e3d"
    }
  ]
}
```

Completed-At: 2026-11-15T07:56:23.652628+00:00
