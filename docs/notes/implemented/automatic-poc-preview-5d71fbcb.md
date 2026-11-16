# Remove manual Preview setup detours; let the Agent install and start its own local POC server without Preview configuration.

Record-Version: 2
Task-ID: 5d71fbcb-c895-4c20-90ce-58d71cebf786
Base-Ref: 46a832cac2538627627adf81999348709176c5e3
Started-At: 2026-11-16T02:22:11.045045+00:00
Type: fix-bug
Status: complete

## Context

Remove manual Preview setup detours; let the Agent install and start its own local POC server without Preview configuration.

## Changes

The Cobalt companion and scaffold continuation required Preview Fill with AI, while the shared HTML workflow assumed a preconfigured managed server. A newly generated project could therefore be treated as blocked by an empty service list even though ordinary shell/process tools could run it. This was a guidance defect, not a Vite dependency on Preview.

Updated the main/HTML Skills, Cobalt companion, helper continuation, owner docs and development CLI wording to use an Agent-started local server. The Agent installs with the pinned manager, starts Vite, reads the actual loopback URL, retains its process handle and checks readiness. It reuses that process for HMR and cleans up only its own processes. Business implementation must continue beyond scaffolding. Existing suitable managed services remain optional; no Preview configuration, UI click or native service API is required. Final static delivery and evidence gates are unchanged.

Added source and packaged-prompt regression checks, rebuilt the embedded Skills and staged the local SS runtime. SS changes are documentation and tests only; its Preview service bundle and process authority are untouched.

## Validation

- Red: `node --test packages/dsh-node-runtime/poc-startup-guidance.test.mjs` failed both policy/continuation checks on the original manual-configuration path; both passed after the fix.
- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-startup-guidance.test.mjs packages/dsh-node-runtime/poc-review-workflow.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs` (22 tests), Cobalt `test:unit` (11) and the focused scaffold suite (3).
- Direct startup trial: created a fresh generated project, copied maintained demo business routes and installed dependencies. Offline installation reported one missing public transitive tarball; ordinary `pnpm install` then completed in 30.7s. `pnpm run dev` started Vite on its reported loopback URL without a preview.json or native Preview call. HTTP readiness passed. Native browser review passed the main page, Create user Dialog and Filters drawer: 3 screenshots, 1 browser, 0 delivery builds. Both the task and project lacked preview.json throughout.
- Passed: engine rebuild, bundled-resource staging, SS packaged prompt/scaffold/ordinary review and handoff compatibility tests, focused ESLint and documentation checks. Native APIs and public transport schemas are unchanged.
- Read-only vet found no issues. Maintenance and final task closure follow the focused acceptance checks; model-authored SS behavior remains a user acceptance scenario.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "POC development uses Agent-owned local installation/startup; Preview configuration is not a prerequisite.",
      "sha256": "6cb2ad66e37afe6d63b077ccadf638c81c069fa7fc1767af077e2127eb64055f"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Clarify local URL consumption and retain frozen static handoff without mandatory managed-service configuration.",
      "sha256": "9f514d8b9fdc03004f2ed9cc4735b1d77fe1a0d8abc6c1fbbec948675994ba23"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Architecture and Commands now distinguish task-owned local development from the unchanged final Preview handoff; maintenance and evidence rules remain unchanged.",
      "sha256": "96e15d7d4ef84fc5f6bee954a3589ca1ce7e057d25bd29a53b5ce7304b2cb3b5"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

This verifies the source guidance and direct local toolchain path, not a live model’s compliance. Missing execution permission, registry/VPN or package access remains a real environment failure; it is not converted into a request for Preview setup. Previously loaded conversation text is not automatically retracted by a runtime update. The final static handoff, protected shell and evidence requirements remain in force. No commit or push is part of this follow-up fix without a new explicit request.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "7c8acd29156336718e52be26518648b444b641f0ad113f7df1487557e958bf8c",
      "after": "213184eec054dea86e808399744ada72e985c5ed875ff41248b4fc2c5c6d2b6c"
    },
    {
      "path": "COMMANDS.md",
      "before": "fc439fbaddb4d86839d98b4d531b7bd35ad6b20744db148d4fa96f46fbe8da08",
      "after": "38e4ada0e4be38e9490a56ecba50c3adbd9af660c6d89a1534c2dd0880b713af"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "f9d5e0c58ff49c9c5032dad4e367e364059ab02b2966f86b446b49362042171c",
      "after": "d1a158920d29a0101b2b1be043666c130f2462f9e7a58e0aff47f58361932223"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "aaeaeb0e90b86aa2058ab74c0afed35f8bcc5480e8fafb4f5526e858a3d8161e",
      "after": "93af5d6c60f4eee298832fe8a9ab6b59c59a722ca700d7cfc3a59d091ff9912b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/review-poc.mjs",
      "before": "d3c9fab6aba15891356744eee98e59fe321436b35db846b0d18bb08c7d9800fc",
      "after": "2e4b3db7273f39d264fc89b8da3626c1e4632c838788bfc492cf5145812f606a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "f0d75e139d52389406f8c056a0eb991f4b12d1ea55bb87f0a86a045ff8e4d2c4",
      "after": "5664f9cbcf768bb3f4c2cace6d559b7e48cf07e1c3f31086edde414f97bd1643"
    },
    {
      "path": "docs/kb/product.md",
      "before": "43e99d4bdf1e55d29025c3fbda5b91702a52f90925ff18fadae0240af3834c97",
      "after": "6cb2ad66e37afe6d63b077ccadf638c81c069fa7fc1767af077e2127eb64055f"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "e6c15b9136ebef742301becd95559bfd7d71172506edc36800bb9158d02b5411",
      "after": "9f514d8b9fdc03004f2ed9cc4735b1d77fe1a0d8abc6c1fbbec948675994ba23"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "b0e26a36eb6006764ae1ef41b3c78a23d229d528234218f5aa27823d71582cde",
      "after": "96e15d7d4ef84fc5f6bee954a3589ca1ce7e057d25bd29a53b5ce7304b2cb3b5"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "39a4f467d102ae68dcc9b200812bcfbc66e543a5421444e9f40d9ab1255b01b0",
      "after": "bec7124fdcba407cd1d3faeb3500cf70cb3aa4076c9f45fb505c1fadcc55b11e"
    },
    {
      "path": "packages/dsh-node-runtime/poc-startup-guidance.test.mjs",
      "before": null,
      "after": "fe9619fe496d6e265a7e7ea5836f7fdfc8950b87950ceb2af9411d0c57f5022d"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "f9d5e0c58ff49c9c5032dad4e367e364059ab02b2966f86b446b49362042171c",
      "after": "d1a158920d29a0101b2b1be043666c130f2462f9e7a58e0aff47f58361932223"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "2e2695a720ce3106b2881514f139ca743cf6df13505c27d4ffb256aba0a39526",
      "after": "d5066b4e62dded01bee280fe6871cf7d638f7f81a6439543380ee657481f69b5"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "016cab09a784c3173c2af0634d0350fb70fe0a6efe89300e8ba1ecd697d12513",
      "after": "23653236857357a0590a9e3b175e511675e166e0b5badc5059c4542f1c1fe927"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "239e1d5bda494fea70ec312c91b852fce4079430f0d849d47404ff326dc36d0c",
      "after": "2c7ba3aef7ae0fbd16915b5980600a00dba2d3744028191bd7ae3cff6de74f4d"
    }
  ]
}
```

Completed-At: 2026-11-16T02:39:42.855867+00:00
