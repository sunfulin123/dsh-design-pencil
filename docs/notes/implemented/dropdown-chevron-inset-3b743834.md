# Add dropdown/select trailing chevron inset guidance, data rules, HTML browser verification, and OP lint checks

Record-Version: 2
Task-ID: 3b743834-ca03-4c66-b62e-103711f1a9b4
Base-Ref: 78a7605ba46e417c49240629dcc9d36410c970f0
Started-At: 2026-11-11T10:22:01.909401+00:00
Type: fix-bug
Status: complete

## Context

User visual inspection caught dropdown/select controls rendering with the trailing disclosure arrow glued against the right border (especially native Chromium `<select>` elements styled with `border`/`padding` but without `appearance: none`, as well as frame-built dropdown triggers with missing right padding). Both skill guidance/datasets and automated HTML/OP verifiers lacked an explicit trailing-chevron inset rule.

## Changes

- Updated shared judgement (`crates/op-ai-skills/skills/synapse-design-html/references/judgement.md`), HTML POC skill (`crates/op-ai-skills/skills/synapse-design-html/SKILL.md`), craft floor (`crates/op-ai-skills/skills/synapse-design-html/references/craft/craft-floor.md`), and OP build guide (`crates/op-ai-skills/skills/synapse-design/build.md`) to require `appearance: none` + `12px–16px` right chevron inset + `36px–40px` right padding on HTML `<select>` controls and `padding: [0, 12..16]` + `gap: 8..12` on OP dropdown frames.
- Added searchable structured CSV rows in `data/ux-guidelines.csv` (`#100 Select & Dropdown Chevron Inset`) and `data/stacks/html-tailwind.csv` (`#56 Select chevron inset`), and updated `migration-manifest.json` hashes.
- Added live Chromium DOM verification (`craft-floor/dropdown-chevron-inset`, P1) in `crates/op-ai-skills/skills/synapse-design-html/scripts/verify-browser.mjs` flagging bordered/filled native `<select>` elements using UA `appearance`, missing chevron indicators, `padding-right < 32px`, or custom combobox/select chevrons within `< 8px` of the right border.
- Added `detect_cramped_dropdown_chevrons` in `crates/op-design-lint/src/detectors/widget_a11y.rs` (wired into `detect_all_for_form`) to flag horizontal boxed dropdown frames whose trailing chevron has `< 8px` right padding.
- Updated native canvas `paint_select` in `crates/op-editor-ui/src/widgets/canvas_viewport_widget.rs` (and extracted `canvas_viewport_widget_helpers.rs`, removing the stale 557-line baseline entry from `tools/code-line-baseline.json`) so native `{type: "select"}` widgets keep a `13px` right chevron inset, `12px` left label inset, and clipped label bounds before the chevron.
- Fixed `packages/dsh-node-runtime/build-engine.sh` inline ESM heredoc under Node 26 so `skills/synapse-design-html` syncs cleanly during WASM builds.

## Validation

- `cargo fmt --all -- --check` — passed.
- `cargo clippy --workspace --all-targets` — passed (0 errors).
- `cargo test --manifest-path crates/op-design-lint/Cargo.toml` — 265 unit + 14 parity tests passed.
- `cargo test --manifest-path crates/op-editor-ui/Cargo.toml --lib canvas_viewport_widget` — 29 tests passed.
- `cargo test -p op-dsh-engine --lib` — 56 tests passed.
- `cargo test -p op-host-web --lib --features canvaskit` — 788 tests passed.
- `bash packages/dsh-node-runtime/build-engine.sh && bash packages/dsh-node-runtime/build-web.sh` — passed.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` — 211 passed, 0 failed, 11 skipped.
- Restaged `synapse-studio-dsh/plugins/ss-dsh-design/runtime` and verified `verify-surface.mjs` + Chromium 1440px screenshot visually (`view_image`) before and after fixing `.select` CSS, plus ran `ss-dsh-design` plugin test suite.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented dropdown/select trailing 12-16px chevron inset rules across shared judgement, HTML POC, and OP build guide",
      "sha256": "c19213914129866d9c8e80ef89f676c1b9f8e43fb5a61d7fac89ac9776848c6c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Documented cramped dropdown chevron right-padding lint warning in widget_a11y",
      "sha256": "0f9d3e3ee4398875bd259b161d9c8e17003e332838fdb0e015491668953ac2af"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- `verify-browser.mjs` checks computed `appearance`, `backgroundImage`, `paddingRight`, and overlay/combobox icon bounds at desktop viewports (`>= 1280px`) when Chromium is available; headless-free static-only runs still rely on source/visual review.
- `detect_cramped_dropdown_chevrons` inspects horizontal boxed frames ending in a down-chevron `icon_font`; custom SVG `path` chevrons still rely on Stage F visual review.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "4f0902796d17da331e6c542408c185f1b7fb1c9e89f471c748a480b624547ff1",
      "after": "3854686ccd861f10ae536585d6dcc1896bc37a8bc76ef21d501629dd2d9beb3d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/html-tailwind.csv",
      "before": "7aef38e75c53559470afcfa91580a9917ca8b7dbf8b92110389e23e93703ac52",
      "after": "79a6b29aab72c4a3a0d878f79c1c8954b6d370651340b5339eac1cca8611a793"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/ux-guidelines.csv",
      "before": "1870ee048f2a2bdd60709f8f7adf7f3b6dcad560bc005c8b2915a8ac8639820d",
      "after": "ea73e1a9ebd81dfd96ec99612dcea158cd16a4f385fd4c7dfb3326354ec2bd40"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json",
      "before": "a06e391268dd0e86825fc8cae03af218315b2d9f65bca59d09d78bacb003bda2",
      "after": "ce0d957cc81269c2834354c9b103b11560144f9c47f492492fa73a1c3d5bcac4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/craft-floor.md",
      "before": "d1ffb88b1b4d8eb50c845dcef2ba65868206624ed50ae0fa6fe5d573411630bf",
      "after": "2b429fc4d99dffa196562bd8271868ade588e809e0bae6a8f538d310539d38ee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement.md",
      "before": "fa1d74d7999fa6062f845a46f9702cb1cd5162a49cc9d6d5fe70c5a605241120",
      "after": "939e401cffb76071c10f8a5bc007f62d9130bfd825a8865f37be45f35f242cbd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-browser.mjs",
      "before": "47dec7f1f593eb257ba586be67836ec8ed2460aa35ee5fcfa2b9de0ab9b1fc94",
      "after": "a4874ce71bc408e2d10d757865af30b17f7378031435900e6a29b23c40b4de23"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": "8fe009a62413c85ce7a5841c0374faea86c9a93e0430f8d8c23e72a491ec6902",
      "after": "33e70a4089f9334c758b690b0b8f3dac7dd08e06106712f7aeb5dab06febf8b7"
    },
    {
      "path": "crates/op-design-lint/src/detectors/mod.rs",
      "before": "64769694ed39917a0736d5df2ebf726b75a91d21f11939eea3a39edb851edf72",
      "after": "50d062427839dbd1c35d42d46b28d3d9798645781e26fd908cb816d66be0ab6b"
    },
    {
      "path": "crates/op-design-lint/src/detectors/widget_a11y.rs",
      "before": "2b922d0e31e423b35909413cc45601574d0b6b73203bcaf4ffbeb06035587423",
      "after": "5b37dd82ebbd4c7cc00cf94f40923e887b86205d6301249559ca332c0781dd31"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_widget.rs",
      "before": "9956f4774aee13673a2cf2ce20c845608c4469397b257af41effb801dc86c935",
      "after": "ede0e05de7b047fff2c850dfc35f3936eb741ae246915b43b8ce467d12db8d32"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_widget_helpers.rs",
      "before": null,
      "after": "9a27c7021de0bffa0edfff994a826696884aeebb09485379702301c57f1f2f58"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_widget_tests.rs",
      "before": "156b4e13b6089345c4625f517f23d62c4434bcff19e87e685d4d5cfe03bb6740",
      "after": "5b79eb99d976cb0d05a8576dbb87ba2ee2021689b0df522e2169b1bb0c63663e"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/mod.rs",
      "before": "c6d4aa1f7f457d5dad9687dd23ea2debf1d923473f27fa4e8631ef687f7f5e24",
      "after": "773ac1ff60617cae1d9a4425522d7efd5cec8c908d167c447550f251e2b24363"
    },
    {
      "path": "docs/kb/product.md",
      "before": "81391b4f5f85c8bef46bf465209dd3f17995a09605e12858a0ef9b252a008688",
      "after": "c19213914129866d9c8e80ef89f676c1b9f8e43fb5a61d7fac89ac9776848c6c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "5b089d8dd2d0dc1136f5d89618b15cee8733972dd2f9f6c6ca6b74d76169c8a9",
      "after": "0f9d3e3ee4398875bd259b161d9c8e17003e332838fdb0e015491668953ac2af"
    },
    {
      "path": "packages/dsh-node-runtime/build-engine.sh",
      "before": "11e0db5c2831c247bccb14d8b216d6cfd5f4864a3e492861cb7ba15b8250b222",
      "after": "44421eeb9caed9824137272953317a344c2323046a9a40fc6c8906ace566e90a"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "192676e621d8b7a37d4df1e36b4c2799b6f683e7098fca47de5ec2d987db205e",
      "after": "d616a10a2286432bbf3bf762d3eb431dbdbc9ea69d37767c5ddcc31080d43759"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "4f0902796d17da331e6c542408c185f1b7fb1c9e89f471c748a480b624547ff1",
      "after": "3854686ccd861f10ae536585d6dcc1896bc37a8bc76ef21d501629dd2d9beb3d"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "b5d80ed27548dd4052c0a599c923d18164bdf9d4075f49727c48c55e3b21c2e4",
      "after": "3012a143050f964909799017e948bce9e7f488b58d215233a2234ce0fe960cfd"
    }
  ]
}
```

Completed-At: 2026-11-11T13:14:43.977974+00:00
