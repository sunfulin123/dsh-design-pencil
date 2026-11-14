# Bundle pinned Cobalt Workspace shell scaffolding and Design guidance

Record-Version: 2
Task-ID: 0a9b619a-d8dd-4c27-a2fb-0222604cd117
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T07:36:51.106110+00:00
Type: feature
Status: complete

## Context

Bundle pinned Cobalt Workspace shell scaffolding and Design guidance

## Changes

Bundled the official ai-docs shell at revision 6605872cd112c71226fe6df921baac1d6f1f50d8 with per-file SHA-256. Added a create/add CLI, owned multi-app and review-toolbar adapters, React 18/Vite templates, standalone frame capture parameters and the Cobalt Design companion. Preserved upstream bytes and the external Cobalt checkout. SS consumes the helper through its existing skill resource and runtime staging paths; no new Host, IPC or slot contracts.

## Validation

- `node --test packages/dsh-node-runtime/cobalt-scaffold.test.mjs`: 3 passed; project creation tests failed before the helper existed.
- `node --test packages/dsh-node-runtime/*.test.mjs`: 263 passed, 13 environment-gated skips.
- `yarn install --network-timeout 20000 --non-interactive` and `yarn build` on disposable generated two-app project: passed. Initial `npm install --no-audit --no-fund --fetch-timeout=20000 --fetch-retries=0` failed on published React peer ranges; the scaffold selects Yarn Classic 1.22.22, which installed successfully with peer warnings retained.
- `SYNAPSE_COBALT_TEST_PROJECT=/private/tmp/ss-cobalt-acceptance-sFtmhC/final node --test plugins/ss-dsh-design/tests/cobalt-browser.test.mjs` from the SS worktree: passed; real Chromium covered two new real Dock apps, in-place Admin replacement with preserved Dock order, drawer navigation, state toolbar placement and propagation, default app placeholders, profile-menu dark theme propagation, 640px sizing and 360px standalone business-page state/theme. An initial test selected Dark as menuitem instead of the actual menuitemradio; corrected the test after checking source.
- `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs plugins/ss-dsh-design/tests/design-policy-registry.test.mjs` from SS: 5 passed, including selected-runtime project creation and the actual DSH skill registry.
- SS `pnpm --filter @synapse-studio/ss-dsh-design build`, plugin `typecheck`, `node scripts/docs/doc-check.mjs`, local runtime staging and `pnpm --filter synapse-studio build`: passed. Both desktop profiles contain the helper. Source ESLint excludes these MJS tests; no ESLint coverage is claimed for them.
- `vet --agentic --agent-harness codex`: runtime and SS incremental reviews passed, no findings. Plain vet could not run without Anthropic API credentials; the agentic Codex fallback completed.
- `bash tools/check-maintenance.sh --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 0a9b619a-d8dd-4c27-a2fb-0222604cd117 --lint-js`: initial run reported missing formatted validation commands and stale runtime-mcp knowledge; corrected documentation and reviewed its source claims before rerunning.
- Final `bash tools/check-maintenance.sh --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 0a9b619a-d8dd-4c27-a2fb-0222604cd117 --lint-js`: passed after installing the pinned missing oxlint via `cd packages && bun install --frozen-lockfile`; 61 maintenance tests, source-size and knowledge/task gates passed, warnings retained. Final default-app replacement change passed the generated Vite build and real browser regression.
- `node --test plugins/ss-dsh-design/tests/design-poc-handoff.test.mjs plugins/ss-dsh-design/tests/design-skill.test.mjs` from SS: 6 passed. Both desktop profiles were byte-compared with the staged helper, companion and final main template. The reproducible three-app browser spec is in SS tests/fixtures/cobalt-apps.json.
- Read-only review applied runtime REVIEW.md and SS baseline/security/architecture/performance perspectives to the source, staging and test diff; no public SS contract, process-control or Client slot changes. Cross-frame content stays isolated from the SS Client. Contract/concurrency/React review focused on the owned runtime adapters; file writes are exclusive, app additions preserve existing pages and demo messages check source and origin. No upstream changes or commits.
- Not run: live-model creation in SS; the user will test the supplied prompts. No Electron acceptance or production readiness claim is made from the browser fixture.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented the pinned Cobalt Workspace scaffold, owned project adapters and existing POC boundary",
      "sha256": "9dcf460c04f3a61a00d207103d7541d2cc98581c2a8df87e679cbf1e726b9f97"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Clarified that the Cobalt scaffold ships as Skill resources rather than a new engine MCP tool, with compiled POC delivery",
      "sha256": "b8ea7140808ae0c5d5f311dafad193c6dbd3d67f94bd323662c256dc351fa8f5"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The helper is available only in a locally staged runtime until a published release is pinned. Cobalt SDK/backend and OS features remain stand-ins. Business component state resets on app switches; persistent mock state is application-owned. Cobalt packages retain old React peer warnings and the shell build emits a chunk-size warning. SS model-driven creation remains the user acceptance step; no live model acceptance is claimed.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "3dfc0e80c5769e4ab9d64cffbbbead2c4e88b8288112613df3e48693319c0893",
      "after": "f6f9673a5216d331c8c07817750f52634717388d6ac80b5e40e2e51a5c020be9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "47dea1bd0fae16c6da9c01f758e822eb7fb44b85f76102c25cdc4f7bb239c2c0",
      "after": "38f97bdeed68c30eb22aa6d43f093c457d260be3548e0465dd9ca353288c4023"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/THIRD_PARTY_NOTICES.md",
      "before": "934edbec42d5d7c328d26f0bdd7c40c91a0e8faf40d0a4a1eb28fa0f243b08b9",
      "after": "b10c1847a19077c31df566ffc291208ecd60db573a3526c12860a4908b6f24e4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/cobalt-workspace.md",
      "before": null,
      "after": "4999eb388c99f4fe0d84e8c7229c86b1ddca730542726413adbcc70ac21355b4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/cobalt-project.mjs",
      "before": null,
      "after": "9c7ff1c5639cc97eb514fcec616b0ee57eafc522017b77bd590eecdaa8608936"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/cobalt-shell-adapter.mjs",
      "before": null,
      "after": "e693f24e5491b93f31e1fafce4d17b3dc2545a5be58bb10d1b486f399280550e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/dependencies.json",
      "before": null,
      "after": "8807aa101afed48b2ff6ef1eb3b7fe75e14481e79bb20763bb96c88ab0dddf10"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/.gitignore",
      "before": null,
      "after": "6bf37d408785b07c5117e75d7ef7ccc565ace0d338a991a4a23abb38736e53ad"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/.npmrc",
      "before": null,
      "after": "0e6558d2295243d10d15ed5589a133809e0f8de4f56df560d52ed5e5e54522dc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/app.tsx",
      "before": null,
      "after": "8ae97889b315f22b02adb47254c9b06dac7e6d9111e4db416424c1f8e684990c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/apps.ts",
      "before": null,
      "after": "845afadf6011dae0b38c25d78b709693716694238e97abac75a7042bdbc277e5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/index.html",
      "before": null,
      "after": "d16fa6f084040dd720d9c2d400196db1bdce22e3ecec1b17045972a87747108a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/main.tsx",
      "before": null,
      "after": "f94883a6c28e172c721ca34859376c9a0e69a5ccdcf103c4d11df4df5544047a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/scenarios.tsx",
      "before": null,
      "after": "c32944899ec78ff503586ad7e7b6b67e33a801e18b04f05a55100c042594634f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/tsconfig.json",
      "before": null,
      "after": "3a044e5eb25d0640b450186fb7fcbe4dd55ca0c680efc77020191b1977d04736"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/project/vite.config.ts",
      "before": null,
      "after": "b72feaa5c93f5ad047aea4b72d4d1eadbc57a4c7f677a02696310e0daf062b72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/cobalt/source.json",
      "before": null,
      "after": "e4a9df304cd31e3b424656477c898377ce271406a2f367699183b891ecf289db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "531d51a07f79ba87e0a6a9cf3dadfeab2c4a69b7e3c502f00b1b92dfd08475f3",
      "after": "251f978a17c0313a69012dc3591c844dc6285cf60fa231568fc374f5a2769dc9"
    },
    {
      "path": "docs/kb/product.md",
      "before": "1cd7d4e20cba3b75f47bb0e58d86acdb46c8e55de6468670748de92dc585c1fc",
      "after": "9dcf460c04f3a61a00d207103d7541d2cc98581c2a8df87e679cbf1e726b9f97"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "af05280b9484358cc2bce2485847fa6c88f0debb8a14dbd69bb615a18f2a87b7",
      "after": "b8ea7140808ae0c5d5f311dafad193c6dbd3d67f94bd323662c256dc351fa8f5"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "4a3b387c08841f7f0cc7354dc1e7e6e1e29d1ff85f7d98cbebac55bf5d858981",
      "after": "eb609e7779cf6429c5d8dcb238198ce6c5261765b7818085c35736ef62904dc7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": null,
      "after": "468d5117a067f29e5ecf7d73007eb8bd76c31c83d17a30f9ffe6afd4a74a5de1"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "47dea1bd0fae16c6da9c01f758e822eb7fb44b85f76102c25cdc4f7bb239c2c0",
      "after": "38f97bdeed68c30eb22aa6d43f093c457d260be3548e0465dd9ca353288c4023"
    }
  ]
}
```

Completed-At: 2026-11-14T07:58:07.056766+00:00
