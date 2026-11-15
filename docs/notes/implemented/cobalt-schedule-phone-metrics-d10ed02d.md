# Allow schedule metrics to scroll on narrow phones so agent rows remain reachable below the pinned hour header and footer.

Record-Version: 2
Task-ID: d10ed02d-7149-46f5-8306-42167555bfb6
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T09:03:29.460188+00:00
Type: fix-bug
Status: complete

## Context

Allow schedule metrics to scroll on narrow phones so agent rows remain reachable below the pinned hour header and footer.

## Changes

At widths up to 480px, the metric block participates in timeline scrolling rather than remaining vertically sticky. The hourly header, horizontal agent column and footer retain their existing behavior. Desktop reference geometry is unchanged. The Team Schedule integration contract documents the phone exception and two-row pagination. Source templates/docs are exported through the existing SS path; upstream code stays read-only.

## Validation

Regression: `node --test --test-name-pattern="phone timeline can reveal" test/reference-recipes-browser.test.mjs` failed before the CSS fix: no agent link could be hit below the sticky header in a 331x798 frame.

Passed: `bun run docs:build`; `node --test test/reference-recipes-browser.test.mjs` (5/5, including the same hit-test assertion, 331/390/640/1125/1440px, light/dark and unchanged desktop metrics geometry); source-copy export. The parent implementation record contains the 17-test integration/browser regression and SS/new-project builds. Final SS staged scaffold test passed 1/1; plugin and desktop builds and SS doc-check passed. The updated helper created a further new project whose recipe integration guide was copied to the maintained preview. Actual 57481 Phone preset reached a clickable agent row after timeline scroll. Vet reported no issues; maintenance/source-line/JS gates passed with nonblocking warnings.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Document reachable agent rows when short phone viewports cannot hold all sticky schedule metrics.",
      "sha256": "72a24d103376b46eaad33cce6469cab3621a6026477eb6ec624554f4576c9d2c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Phone metric scrolling is a copied recipe layout exception, with the same exporter, runtime and host navigation contract.",
      "sha256": "15636a1012a4a22c4116dd1f0019814d0eb4a5a0c22d471013b30ad4666c56a1"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Existing lightweight bug-fix and source-template verification rules cover this responsive fix.",
      "sha256": "b0a6ac41f25e2d1fae1b1e150a25efb77204449f208166f9ddf8ef6a1052decc"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Phone users scroll metric rows away to reach agents; the hour header stays pinned. Desktop retains sticky metrics. All schedule data remains synthetic and local, as documented in the parent recipe task. No change to public runtime contracts or existing project migration behavior. The parent implementation record is [Cobalt recipes](../implemented/cobalt-widget-chart-schedule-recipes-f888d1cd.md).

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "ddef9a03614462cc554f5c327a599f238767702632118724c7d64a54bfa350f6",
      "after": "72a24d103376b46eaad33cce6469cab3621a6026477eb6ec624554f4576c9d2c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "fcde82fdface39621f857b3394a2243ba3a5d1824973f429d018e3bf07a2ae98",
      "after": "15636a1012a4a22c4116dd1f0019814d0eb4a5a0c22d471013b30ad4666c56a1"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "28dae2894e6a70371e64c17f5739356c1893a7345c42a872d7e563976e84b5ff",
      "after": "b0a6ac41f25e2d1fae1b1e150a25efb77204449f208166f9ddf8ef6a1052decc"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "a99499f6126374731b20f2196181a8e068e67c30b2adbeb759b96d1c3629a37e",
      "after": "3022650e85d2e0c3993bc66559d6ca3fc2113f2776462bd72303d439975bc211"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": "c87d08d0e1e445ace1c3183e979d6b9085a2be0d2aac9ed64ed56d6b81d22977",
      "after": "1cc104ffa715b83e557c0fcbe34529ffa6fe7885085d5902bf28a4cd4eab197d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "2d60f060a88f5efb264e0f8a727c9b423ce067cb41e2159bec77564005e24c8f",
      "after": "4758975bd2a97402ad2b60ef9c52a128a10450ac4e3bf01f6b64048f677724ba"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "91f9e7af529bd0ddfdd53bcf52e1af218058364fd987258d4a3470028c87d30c",
      "after": "c43739614ae23d6c356d80368ccf8a6e63b0ffe3e487268ffccff82f03f423b4"
    }
  ]
}
```

Completed-At: 2026-11-15T09:07:48.088599+00:00
