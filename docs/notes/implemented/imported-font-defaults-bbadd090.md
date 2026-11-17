# Capture linked HTML fonts and avoid blocking missing-font selection where safe defaults exist

Record-Version: 2
Task-ID: bbadd090-99e6-4a40-8f8f-8b5afecb2aa5
Base-Ref: 798cb5b127b118e060631973d8d689c83df8dc5a
Started-At: 2026-11-17T12:56:41.591803+00:00
Type: fix-bug
Status: complete

## Context

Capture linked HTML fonts and avoid blocking missing-font selection where safe defaults exist

## Changes

Standalone HTML conversion now runs the same source-font registration flow as managed imports. CSSOM discovery includes inline/linked sheets and nested rules/imports; inaccessible cross-origin sheets are downloaded with bounded size, time and redirect validation. CSS @import and extensionless font URLs are supported without provider-specific discovery rules. Source TTF/OTF bytes persist for editor reopening, and per-face atomic records preserve independent registrations while running hosts refresh their inventories. Ordinary imported text retains its original family first and gains Inter/sans-serif only where the source has no generic fallback; icon families/private glyphs retain their face. Skill and owning runtime/KB guidance require autonomous acquisition and honest warning/fallback reporting.

## Validation

- Red: `DSH_E2E_CHROME=1 node --test --test-name-pattern='standalone HTML conversion registers' packages/dsh-node-runtime/html-import.test.mjs` failed because no font registration survived conversion. CSS import discovery and already-running editor inventory tests also failed before their respective fixes.
- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-fonts.test.mjs packages/dsh-node-runtime/font-fetcher.test.mjs packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/engine-session.test.mjs packages/dsh-node-runtime/node-host.test.mjs packages/dsh-node-runtime/design-workflow-text.test.mjs` — 65 passed, zero failures/skips, including real Chrome, generic CSS imports, extensionless URLs, size/error/redirect rejection, reopened/running editors and concurrent registrations.
- Passed: `PATH="$PATH:/Users/franklin/.cargo/bin" bash packages/dsh-node-runtime/build-engine.sh` after the initial unqualified shell attempt could not find wasm-bindgen; the post-build suite above passed.
- Passed: `node /tmp/live-html-fonts.mjs` resolved original Google stylesheets to Roboto 400/500/700 and Material Icons 400, with zero font warnings. `node /tmp/user-html-font-proof.mjs` resolved the supplied HTML's same four faces without changing its source hash; the existing scroll-container clipping warning remains.
- Passed: `node /tmp/font-editor-acceptance.mjs` using isolated local copies of the downloaded real fonts registered Roboto and Material Icons in the real web editor and captured a viewport without a missing-font modal. Earlier exploratory external-page captures were unstable/blank and do not count as visual fidelity evidence; this check does not claim pixel-perfect icon/layout restoration.
- Passed: focused oxlint (zero errors; existing and sequential-I/O warnings retained), `git diff --check`, and the source line-cap checker. Read-only vet reviews reported no issues. `bash tools/check-maintenance.sh --base 798cb5b127b118e060631973d8d689c83df8dc5a --task bbadd090-99e6-4a40-8f8f-8b5afecb2aa5 --lint-js` passed (87 notes, zero errors); detailed temporary logs remain outside source control.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Standalone and live HTML imports collect original stylesheet fonts, preserve concurrent font registrations and keep icon faces while adding text fallbacks.",
      "sha256": "05f650228f2538c39f375ef3a937126883dea0e1393ea8989b465be034b6a3d7"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documents autonomous imported-font resolution and ordinary fallback while preserving source import authorization and design-phase boundaries.",
      "sha256": "0ed54c1e23eea50d0284e1642ab4f8a576a4947be9dc296596bdc4c6885fcf5e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The imported-font Skill paragraph adds source acquisition guidance; it does not change renderer evidence, fontResolution reporting, POC phase gates or import authorization.",
      "sha256": "c8ca80afdf997b68764aa686ac77c733cd41f51572dfb62df3ba351fc65e433e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

WOFF/WOFF2-only sources, private/unreachable font files and the static no-browser path retain their limits and warnings. Discovery is bounded to eight inaccessible stylesheet requests and existing face limits. Fonts remain in the local cache rather than embedded in portable documents. Icon-name/private-use detection conservatively protects familiar icon faces, but cannot prove arbitrary glyph semantics. No DMG or runtime release is produced by this task; installed SS snapshots require a subsequent release update. Unrelated Preview/dev-server/Talkdesk behavior is untouched.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "30661ddf0c8e972b05afd8eb435dce5f0a7f4a6a401ea2931ca02f9d1832748e",
      "after": "85885ba13e0ba3d58c8dd4e5b1d72328f553cedde2f784b00a41ef5524525a06"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "d697442a67cd750bc628d8056c193807519806613ccd4e41a8931a587fb22485",
      "after": "05f650228f2538c39f375ef3a937126883dea0e1393ea8989b465be034b6a3d7"
    },
    {
      "path": "docs/kb/product.md",
      "before": "4224c6b11093ba0a2c4d708236bdf4fc2339dd2b5f0d1c1c47436ac9bcdbc2c9",
      "after": "0ed54c1e23eea50d0284e1642ab4f8a576a4947be9dc296596bdc4c6885fcf5e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "fccfcd1636b16c6dd18320cd64a877f2310479f122de141c3c658dc880aa4da4",
      "after": "c8ca80afdf997b68764aa686ac77c733cd41f51572dfb62df3ba351fc65e433e"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "06c62e85940cef1578ac256b1f29e0474c9e5cd2b488f6f4357cc47ebc626612",
      "after": "d7e55c38142a79b30396faf32bd2f05dee6f4f6ef1e2e18864147869a5a415cd"
    },
    {
      "path": "packages/dsh-node-runtime/font-fetcher.mjs",
      "before": "4b7da6d787592599cb89e82f90d1765f2416874c82a12bbd8ee14e09dab2b793",
      "after": "838ddc98cccc8554390fb6394fd32e2766c3250680f17348ae1dd891b5154fba"
    },
    {
      "path": "packages/dsh-node-runtime/font-fetcher.test.mjs",
      "before": "7d6417fdfaa386e25bf308e830882beef663fd79feb6149256a79abe8e3b49c2",
      "after": "222796aaed75a308a91982fd87903d67e3dd785d3edf09092157393b99449659"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": "d794de1e13082e19e77c9f50970e1e06edc629815e167ceeaa4971868e787a81",
      "after": "cc7a7134a3e34a14ea7df301a2f408e327cc7f4fd8a1154e7ecb99b527478d2d"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": "8a681b2cd9467eb53b51744cf3acfdc20096d489df414cce9ca070df5c269a23",
      "after": "647002c03182773771978e078e62c6ed8e40fc83cfa6c237610801b85af142fb"
    },
    {
      "path": "packages/dsh-node-runtime/html-font-defaults.mjs",
      "before": null,
      "after": "c7b21f10a58bb74c9131ec620ad171a938b4f167f2f11170b3ab7c78176f8671"
    },
    {
      "path": "packages/dsh-node-runtime/html-font-stylesheets.mjs",
      "before": null,
      "after": "ebb58989cdcdc87096ded6a9aadd789c8a7b1c414543729449362416365bb903"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.mjs",
      "before": "b52f5b6b2b43c5fddb1b884429df3ae996f0d55df596370eeb824a25c3b0c679",
      "after": "9969a15d196e1bd19aae25fa85f582a0c8af1cc0f19df9e49d0ddaf6b1ce8c3c"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.test.mjs",
      "before": null,
      "after": "253e52003e303bfa39e34bf13e867b4476697917929a161c3301419360ab3fb8"
    },
    {
      "path": "packages/dsh-node-runtime/html-import-tool.mjs",
      "before": "42ab3b44fcadc6669d64a4c2382218b3daa2f3a3cb3b617842fd36cb7e9feb69",
      "after": "c83c4b54ad208661e1bf55be66dc6ba329d12d03876939a2d8712a5aacad9089"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.mjs",
      "before": "117fc49e42cf4d9b888bd014ac521f96f72098cad69b624e30ae092bcd21ed51",
      "after": "80ad3183c686aab78dea2442f4e644fd2e7d49606fbb3d3ee15e8c8b93f93143"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.test.mjs",
      "before": "738198c3dbda2a1d3ad4950a98de37690a971f47efcfc20644f91c8d10174384",
      "after": "417a8f97cd660f5fe52acdd690ec9f4fa5ac6a1b1855fa016edd6314231570f2"
    }
  ]
}
```

Completed-At: 2026-11-17T13:33:02.175367+00:00
