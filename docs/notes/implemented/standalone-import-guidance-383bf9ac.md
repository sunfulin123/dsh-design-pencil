# Clarify that explicit imports of supplied HTML and Figma sources remain supported independently of the new-design authoring workflow

Record-Version: 2
Task-ID: 383bf9ac-1a52-42e7-b4ae-b30823d0dce1
Base-Ref: ff99f5a37c74b656baa1a5b8d24519f70aece84c
Started-At: 2026-11-17T12:41:45.907260+00:00
Type: fix-bug
Status: complete

## Context

Clarify that explicit imports of supplied HTML and Figma sources remain supported independently of the new-design authoring workflow

## Changes

Clarify standalone user-source HTML/webpage and Figma file/link imports in the authoritative Skill and dedicated tool description. Preserve the ban on AI-authored intermediate HTML shortcuts and host source/write authorization. Update the product and runtime knowledge entries to distinguish imports from new-design stages.

## Validation

- Passed: `bash packages/dsh-node-runtime/build-engine.sh` (existing Rust warnings remain visible).
- Passed: `node --test packages/dsh-node-runtime/design-workflow-text.test.mjs` (4 tests).
- Passed: read-only Codex-backed vet review (no issues).
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base ff99f5a3 --task 383bf9ac-1a52-42e7-b4ae-b30823d0dce1 --lint-js`.
- The companion SS fix passed 539 plugin tests with 22 optional skips, including dedicated import policy and mock Figma REST coverage; the supplied HTML converted to 432 nodes without changing its source.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Document explicit supplied-source import as independent of new-design stages without allowing AI-authored intermediate shortcuts.",
      "sha256": "4224c6b11093ba0a2c4d708236bdf4fc2339dd2b5f0d1c1c47436ac9bcdbc2c9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Clarify dedicated host import boundary while preserving sensitive generic dispatch and source/write access checks.",
      "sha256": "fccfcd1636b16c6dd18320cd64a877f2310479f122de141c3c658dc880aa4da4"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

No runtime API, capability access classification or release version changes. This source guidance reaches installed consumers through a future checksummed runtime release; the SS policy and REST-adapter fixes work with the existing published .7 runtime. No new DMG or runtime release is requested.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "74d3302244cde8170051c6413ba66ce29d5568deb85a7bef114e17b5ab2c68ef",
      "after": "30661ddf0c8e972b05afd8eb435dce5f0a7f4a6a401ea2931ca02f9d1832748e"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8164dff9023db6682e2bb1fad53168a7bd3d8b91a5ed5b5a5ae538b41e96d513",
      "after": "4224c6b11093ba0a2c4d708236bdf4fc2339dd2b5f0d1c1c47436ac9bcdbc2c9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "2a3ea9f2f0d38ff2fa45452613388ab7390818162fc4323cee4a53fcaf737319",
      "after": "fccfcd1636b16c6dd18320cd64a877f2310479f122de141c3c658dc880aa4da4"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "e8c897a47d44cafb115c9822934328cb9a66ba964dd9b9f35055c33dc0217c0b",
      "after": "2fa84bc3bd34c01ed2843b1d65e0a7e1dbbd5bf1d62f9da264b9a4e2b9a586c1"
    }
  ]
}
```

Completed-At: 2026-11-17T12:49:58.758531+00:00
