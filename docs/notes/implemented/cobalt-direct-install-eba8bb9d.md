# Install Cobalt dependencies directly from the prepared project

Record-Version: 2
Task-ID: eba8bb9d-1971-4733-841d-4d22c1cd02e2
Base-Ref: d064e824d0742c9d7e0e616f94b6d2e21a9fd16a
Started-At: 2026-11-18T03:55:08.941988+00:00
Type: fix-bug
Status: complete

## Context

Install Cobalt dependencies directly from the prepared project

## Changes

Remove the private metadata probe and its Question text from the runtime. The SS caller returns after canonical preparation, then invokes the existing bounded pnpm installer directly. Runtime guidance tells agents to surface the actual install failure and reuse the task project on retry.

## Validation

`node --test packages/dsh-node-runtime/{prototype-authoring,poc-startup-guidance}.test.mjs` passed ten tests covering the pnpm command, project ownership, redacted failure, retry, cancellation and startup guidance. The real installer also succeeded in a fresh canonical project with pnpm forced to use its offline store.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "The Cobalt authoring boundary runs pnpm directly and returns install diagnostics.",
      "sha256": "de02826ba638ce44419b891000a72057f6cbdfc745c561ba776a26eea9d0e454"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The modified guide changes install error handling, without changing the product knowledge entry’s Workspace shell, recipes or owned Vite startup.",
      "sha256": "439bcbca3d2a5fb6d8b9413d8b8876c3766f7f12113eef4f416fa092615bb19c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The packaged local runtime is exercised through the SS desktop integration. The public runtime lock still identifies the existing published release.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "f6e297f3b8ccd4e04a834a77e1d1f93ab62e99d55050671748324a11c1827ca0",
      "after": "aaa86e2ea65b0cb853124399610a843866a78995419007d4b1f4747e211e84d0"
    },
    {
      "path": "docs/kb/product.md",
      "before": "7a081decb3ee8a9ef1cfb64dd7f98e239121e224a630a71700bf1db842a65caf",
      "after": "439bcbca3d2a5fb6d8b9413d8b8876c3766f7f12113eef4f416fa092615bb19c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "914af65d0c51cde44ac68749da2733637f35083c33e6ad38a403f76f88e9512f",
      "after": "de02826ba638ce44419b891000a72057f6cbdfc745c561ba776a26eea9d0e454"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "f51bb304fff2a6939ca8b97ea0853c37e40f72821d069b2de72bcd1d9dbe610b",
      "after": "143fff9a2829ad69f2d2b64cc1d8f769058a3bd2aa7891bb72893d4d63976ab1"
    },
    {
      "path": "packages/dsh-node-runtime/poc-startup-guidance.test.mjs",
      "before": "65ea0e46c681b4112decfe54157980c3e04b8cfc1c04a23c34af21b2e48fd86d",
      "after": "be0ff9752c45905dd72a8ac59f6ec4ee830fccc136cea3c5a7b27b7de93142c9"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.mjs",
      "before": "22dc3fd28dbf385553330e1cc6edec5243d0e3aa38c9207aaf2a7cc845584b53",
      "after": "72d050a9d2f9ef52b754ee77f6d2c5683bb14bb4189ad3a3372827c05803ada1"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.test.mjs",
      "before": "72bc959d71b0681e084a8c8ef20e7e82e7a1e28639598f47189d3e0a767f1f3c",
      "after": "192b248a11005da2dfaae17accd8fce07f62b8c65da48a79e1cc840873c6d6da"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "85a6bf590ad85dacaef5b35c6e70caf20cae98c9f0a6611762dbdbddd9f63fb1",
      "after": "ea4affed93e8392179240b2434754d75009173064c686d7fbea60cad8ef4b618"
    }
  ]
}
```

Completed-At: 2026-11-18T04:03:37.643173+00:00
