# Add generic HTML prototype size and state review controls without feature flags

Record-Version: 2
Task-ID: 2fda1365-1257-4738-affd-7ad0d52c17fc
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T06:08:09.711556+00:00
Type: feature
Status: complete

## Context

Add generic HTML prototype size and state review controls without feature flags

## Changes

Added an independent private code-copy library at packages/html-prototype-review/. Its canonical HTML/CSS/JS, business-state adapter and preparation CLI export byte-for-byte into HTML Skill resources; generated projects preserve copied JS/CSS hashes and template provenance. Models use the supplied helper rather than recreating controls. Ordinary previews have Size, Page state and Reset only, while Workspace keeps its existing Cobalt controls/flags.

The wrapper resizes an actual iframe, reloads implemented scenarios through a query/adapter contract, supports local HTTP navigation, direct-file review, keyboard/outside dismissal, focus restoration, light/dark and narrow layouts. It preserves authored business HTML and refuses unowned outputs, path escapes or symlinks. Business DOM/screenshots stay separate from review chrome, while complete source fingerprints retain review assets.

Main Design and HTML Skill triggers require copied controls. The high-fidelity build guide and runtime POC continuation explicitly exclude Size/Page state/Reset/flags/preview frames, including strict replicas, while preserving actual business and requested Workspace chrome. SS reuses the existing resource boundary and handoff; no transport, persisted schema or Host/Client API change. Playwright is workspace test tooling only, not a generated-project dependency.

## Validation

- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-review.test.mjs packages/dsh-node-runtime/html-review-browser.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/design-workflow-text.test.mjs`: PASS, 20/20, no skipped checks. Includes canonical library/Skill/project byte/hash equality, safe/idempotent preparation, all six states, real media-query reflow, Phone 390x844, Reset, local navigation, focus/Escape/outside behavior, light/dark, 360/390/640/1024/1440 and direct file mode.
- The outside-iframe dismissal test initially failed; a known-frame focus check on parent window blur repairs the event boundary without transferring privileges or stealing business focus.
- `PATH=/Users/franklin/.cargo/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh`: PASS. Initial shell PATH lacked the installed wasm-bindgen; adding the documented tool directory resolved it. Embedded main/HTML/build skills were rebuilt.
- `node packages/talkdesk-cobalt/tools/build-skill.mjs`: PASS, combined resources include the independent generic library. A stale supporting-guide guard was observed and resolved by rebuilding resource output after the guide edit.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/package.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs`: PASS, 5/5 runtime package/host and unchanged Workspace scaffold checks.
- SS packaged helper/compiled-guidance checks: PASS, 2/2, no skip. Verifies mandatory copy guidance, high-fidelity exclusions and current content hashes through the actual WASM/runtime.
- SS plugin/desktop builds and focused ESLint/doc-check: PASS for the staged change. The final staged refresh also passes helper/compiled-guidance checks (2/2), plugin/desktop builds and actual packaged-helper browser acceptance (1/1).
- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 2fda1365-1257-4738-affd-7ad0d52c17fc`: PASS; source-size and task/knowledge checks pass, JS lint reports warnings only. Both repository `git diff --check HEAD` checks pass.
- Focused `vet` reviews: PASS, no issues found. Outside-dismissal vet review also passes, with no issues found.

- `DSH_HTML_REVIEW_HELPER=<SS-packaged-helper> DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-review-browser.test.mjs`: PASS, 1/1, exercising the final staged library rather than only repository source.
- Generic demo generated through the actual SS helper: http://127.0.0.1:50058/preview.html. Existing Cobalt preview remains unchanged.

Not run: a live-model POC-to-high-fidelity drawing session; code-copy UI, compiled prompting and continuation contracts are verified, while model-driven SS authoring remains user acceptance. No Cucumber or generated E2E operation document is introduced.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record mandatory fixed-code review chrome for ordinary HTML and explicit exclusion from high-fidelity business content.",
      "sha256": "ce16e1fc419b2c0d839caf220466d0a4cc439b9e8b85e2f46090e8f0901b411b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document independent source-copy ownership, true iframe viewport/state behavior and business-only capture with full source fingerprints.",
      "sha256": "c2ecbbc8eab4a20362cca4ea6637aa68963fea00656a6f942ff3c8b86c6d1636"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The user-approved product workflow uses existing module ownership, source-copy and evidence rules; no repository engineering-policy change.",
      "sha256": "ecbaf4fa85e62e8646e55839aa21fe429ac6f27099c34c8dd40211a1f47579c9"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Library source has one owner; runtime and prototype copies are generated. Source-copy guarantees fixed code bytes rather than relying on a model to redraw the toolbar. Business state implementations remain the page author's responsibility and must be verified. Review states remount their page; Reset leaves authored storage intact. Existing authored POCs are not automatically rewritten. Earlier Cobalt/SS user changes remain intact, upstream inputs are untouched, and no commit or push is performed. The live generic demo is recorded in /private/tmp/html-review-demo.json; existing Cobalt preview remains at its own URL.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "f1e136ecdbc61ea2f6c50bd311d9cd1b0fe4a8bda526de18fc3e37bc36c5d4d4",
      "after": "47e1e3bdf352e9577ed54a9b1c3f573ea49f1c68992d819d573549ace2383bed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "38f97bdeed68c30eb22aa6d43f093c457d260be3548e0465dd9ca353288c4023",
      "after": "30c2f054ae484ae07a97a4e29d1dac027d9d11060897681bab259367048d23ab"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review.md",
      "before": null,
      "after": "9ac0daf119efc4dedd55f38e89dff10205e773dca7c196ceb2376a3ab584a031"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "251f978a17c0313a69012dc3591c844dc6285cf60fa231568fc374f5a2769dc9",
      "after": "40b120742f7dab06f5d236c8e9e89410025941af68c73055b04784a3cf6a1427"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": "061fcdd9e0b406be741f799afd8bfa5780ad47b891a0e0539525f282c78db01e",
      "after": "577ff5d148e00137ea0b54a5113e72f23ac429f46b34dbdea9282c2b694e49e3"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8fde3c4b2f655cd540704525a81c0c463bc47d9722d34d52f2fce8f2de9b057f",
      "after": "ce16e1fc419b2c0d839caf220466d0a4cc439b9e8b85e2f46090e8f0901b411b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "e06195bf530aa176d0a2d63e76e91fd75f42af8db4b138b5891ef506c872ec43",
      "after": "c2ecbbc8eab4a20362cca4ea6637aa68963fea00656a6f942ff3c8b86c6d1636"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "3015579a141c8a2e7c737057703fc61ca04b43dd6fe1e59938d3ab411835db5c",
      "after": "ecbaf4fa85e62e8646e55839aa21fe429ac6f27099c34c8dd40211a1f47579c9"
    },
    {
      "path": "packages/bun.lock",
      "before": "6aca3b33570a214f1be840285747ab2a479e3b6f3c630d553b28b10b2baf6297",
      "after": "afb1aa67c917a6424ec7dbc7b7ec392ce7fd14ed72c83c89655ac4382020acbf"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "9742adfd5f2dc3c263d33d0860a91dfc0f1080ce6bde1fd5d41c18c77bc70e6f",
      "after": "23e8c724e200349ee0972260ce8a3088f723f86d39fab802333c699ee61b8fbd"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "2380ac8b5428c817544037dcf32a1694271fba185570e4860d282c46e9a8ebbb",
      "after": "63939f9f789369b3d8e3db05b67be144e2fd406f192f72dc196e1aea72b619a5"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.test.mjs",
      "before": "ddca0af0da28593b4b4d0f419e53f88973862ea64a539994600c22e438bd25c9",
      "after": "024b6fa7ebf57551ae8a73bd76de7c8338244905dc8d2a0ea4e24f66c08f9aa4"
    },
    {
      "path": "packages/dsh-node-runtime/html-review-browser.test.mjs",
      "before": null,
      "after": "395b5efc88371a0b0dbbdae050ccc1b13dad5d933868ce4748d59e04f04713a2"
    },
    {
      "path": "packages/dsh-node-runtime/html-review.test-helper.mjs",
      "before": null,
      "after": "7d346dc7fb2a4158c49a400b42c3cdad52030de199952207b33a86e3f334a8c7"
    },
    {
      "path": "packages/dsh-node-runtime/html-review.test.mjs",
      "before": null,
      "after": "5051b4be3e2674d5f5f4943e778bf3266d11f29237777f1190d21480bff0781d"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "ef79b9bfa67fbed8214547aeab1f5531550f69908dd1b86faa1a7c45a53ae86a",
      "after": "8cf16b450633883576e9466c3ef5820d9ad78b04aecd45cb6a39a0d8bf61bd1c"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "1d5aec6f527a3071691afc0bf8791f4f46e675576eb81fc578bf5d4b346dfcdc",
      "after": "4dfa7f6d1903d1efe98dadc9cdcc902e89cb5f4bea6ab001c8c8e6f6eea072e9"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "38f97bdeed68c30eb22aa6d43f093c457d260be3548e0465dd9ca353288c4023",
      "after": "30c2f054ae484ae07a97a4e29d1dac027d9d11060897681bab259367048d23ab"
    },
    {
      "path": "packages/html-prototype-review/README.md",
      "before": null,
      "after": "b328990ac0937bf93e8c94c5689942377a17ee260b6baf74302b3178168f54c1"
    },
    {
      "path": "packages/html-prototype-review/package.json",
      "before": null,
      "after": "bcb98ebd2476043bf246fdbf137c1e3e39eb3b11988c51d5417b546f043724aa"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/page.js",
      "before": null,
      "after": "280733ad82cd7e1381afcc5a236096900c555e7578b4035f010ced14c33dfaf9"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.css",
      "before": null,
      "after": "035946ccb9969916043ba36cb1227509115f7499d64a347e3042f78414165ef1"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.html",
      "before": null,
      "after": "e855c6f16df0ed6b86db23e614e86f928040e3622cb80bcf6b0c0c8623000d11"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.js",
      "before": null,
      "after": "14f546e4facb31f548bf526bb80850a860171e45b63f22706ea7a17e6caf9fff"
    },
    {
      "path": "packages/html-prototype-review/scripts/prepare-html-review.mjs",
      "before": null,
      "after": "f3ddf6c0f6735d284c4eff8113240143599ef5e3ce5294c927787da110cd9c82"
    },
    {
      "path": "packages/html-prototype-review/tools/export.mjs",
      "before": null,
      "after": "2977e7d07ac375b8b762684d441ba92c2a1d899ded3b181e2900359c15025ab2"
    },
    {
      "path": "packages/package.json",
      "before": "fc6a35c4fdbae5494bc9ec8a1915f0f6ab5433f18835c978327e6309768c2afb",
      "after": "91dccb7c5b0cacd899aac06b712735c3d3ff32ae83e3a8164a41a9ac8f1648d0"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/build-skill.mjs",
      "before": "2d8557d3adf7be743a041d2f009f2ae5244ea2c59ac3d0c68469245b89170e3c",
      "after": "bddda5751033fa88c415c985e9c9ccd707e79647dd41912263153d35018d1e87"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "1c0db3bfcec32556b8e7d6d0b798f8405e932261c0167f7ee51d1fc76da4a577",
      "after": "bba05df06c22238965d555277ac5d5058315dac905a709a1c8ffc2bd20661cdb"
    }
  ]
}
```

Completed-At: 2026-11-15T07:02:56.922816+00:00
