# Use project-local Cobalt extension source templates, prohibit package installation, and stage verified SS resources

Record-Version: 2
Task-ID: a236f1bd-8526-40cc-ab94-16f74664e1fb
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T13:43:37.771770+00:00
Type: refactor
Status: complete

## Context

Use project-local Cobalt extension source templates, prohibit package installation, and stage verified SS resources

## Changes

Cobalt Extensions are editable source templates. The scaffold copies the complete implementation/type/style tree into `src/components/cobalt-extensions/` and rebases every recipe/example import to local modules. It emits no extension package.json, npm/file dependency, package wrapper or alias. Official Cobalt/React/tooling dependencies remain normal dependencies. User clarification removes old project compatibility: generated wfm paths/IDs/package aliases and old documentation redirects are removed.

The source-template module owns copying and import/document/registry rebasing. A `copy-source --out <project>` action supports non-Workspace apps without copying a shell, installing dependencies or editing package.json. It publishes the source directory atomically and rejects an existing destination. Maintainer package metadata is not exported; the independent test harness has a distinct private name, and only its external dependencies are exported separately.

The lookup's --read-source returns every selected component implementation/type/CSS file and recursively resolves local imports. It fails on a missing local import rather than returning incomplete code. Component READMEs use source-relative file links that work after copying; API/examples remain explicit reference IDs and paths. The project-local implementation/types become authoritative when adapted. Both source examples and generated examples use real relative imports.

The no-install/no-package-import/no-alias rule is present in the main Talkdesk style guide, companion, reference entry, component indexes and generated integration docs. The production Node/web WASM were rebuilt so selecting the style exposes the guard before code generation. No Cobalt upstream checkout or original WFM snapshot is changed.

The maintained FilterToolbar component, five examples, API page and generated search/navigation/export entries are removed; the immutable WFM provenance snapshot is retained. FormField's shared prefix/suffix slots reserve at least 32px (small) or 40px (medium), use 8px horizontal padding and cannot shrink; the input flexes into remaining space. ListPage details compose the copied Extensions SidePanel with its header, close action, scrollable body and Edit footer.

## Validation

`node --test test/export.test.mjs test/wfm-upgrade.test.mjs` in `packages/talkdesk-cobalt`: PASS, 6 tests covering complete source reading, missing-import rejection, deterministic exports, local paths, absence of extension package metadata/imports, standalone copy safety, removed FilterToolbar entries and original WFM hashes.

`bun run docs:build` in the module: PASS, documentation/example TypeScript checks and 275 canonical Astro pages. `node --test test/site-browser.test.mjs test/form-field-browser.test.mjs`: PASS, 5 tests rendering all 199 examples/four recipes, documentation controls, ListPage interactions and six scenarios, toolbar geometry/stability, extension SidePanel open/close/Escape and prefix/suffix geometry in both sizes and schemes. The new slot test fails before the fix with a 21.6px slot and 0.8px side insets, then passes. Actual detail/date screenshots were inspected after panel animation settled.

`node --test packages/design-data/test/*.test.mjs`: PASS, 3 tests preserving discovery, IDs and the original 84 community hashes. `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh` with `/Users/franklin/.cargo/bin` added to PATH: PASS. `node --test packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: PASS, 9 tests including the production style guard. The guard test fails before rebuilding and passes afterward. The first build attempt lacked wasm-bindgen in PATH; the matching installed 0.2.117 binary completes both builds without installing tools.

Fresh projects created through SS's packaged script install and build offline using only actual dependencies. Browser acceptance verifies Workspace renders a locally modified BasicTable marker, lookup reads that modified source, host callbacks/scenarios work, and a standalone app uses copied source without a shell. Their package.json and node_modules exclude `@openpencil/cobalt-extensions`. No live model authoring run is claimed; SS user acceptance follows. A fresh project generated after the UI fixes also passes `yarn install --offline --non-interactive` and `yarn build`; real Chromium opens its Dock app and copied ListPage, triggers the SidePanel Edit callback, closes with both button and Escape, and verifies fitted panel bounds in light 1440px and dark 360px viewports. Its source tree and node_modules contain neither FilterToolbar nor the forbidden extension package.

`node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build` and `pnpm run doc-check` in SS: PASS; the packaged-helper test checks copied sources, removed FilterToolbar, local SidePanel composition and updated padding.

`bash tools/check-maintenance.sh --lint-js --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task a236f1bd-8526-40cc-ab94-16f74664e1fb`: PASS, source cap, maintenance tests, task/knowledge evidence and JavaScript lint (warnings only). `node --test packages/talkdesk-cobalt/test/export.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs`: PASS, 6 focused tests after removing two unused test declarations found by lint. `vet --agentic` could not review the 14.2MB aggregate uncommitted input against its 1MB limit; the subsequent direct `vet` invocation fails because Anthropic credentials are unavailable. No passing vet review is claimed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Retain ownership, focused regression tests and explicit verification evidence rules while adapting Cobalt source templates; no engineering policy changes.",
      "sha256": "05bb0db1d1b5a348b9513ecbccb40334d5f6bdb3311d7f72723704fdc44087e0"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Adopt editable Cobalt source templates, local imports, package-free scaffolding and SidePanel-based list composition in the current product contract.",
      "sha256": "c6e6337e643f757683badf98d63c5243970b46e07ba081580416d0fe84b76a40"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record copied source closure lookup, relative imports and the local BasicTable and SidePanel composition through the unchanged SS resource route.",
      "sha256": "d2c643b3c9b61b8cfe303781e4e36a29414b05a654f671e4ad3141a49ae1a8a7"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The user explicitly excludes old project compatibility. Source copying preserves authored files by refusing replacement; this is normal copy safety, not migration support. Original Cobalt examples that fail compilation retain their qualifications. SDK registry/CDN requirements, older React peer warnings and a large Vite chunk remain. No npm extension identity is shipped or installed; normal runtime/tooling dependencies still need installation. No commit, push, release or upstream edit is performed. Restart SS and use a new conversation to load the rebuilt style/runtime snapshot.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "79838529a378ec5cd5c27810478a3c131e3c2d2542350fa14726a3acb685314e",
      "after": "c6e6337e643f757683badf98d63c5243970b46e07ba081580416d0fe84b76a40"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "2a170783bab67c70bcf3a0e28578de9b8fe186824a583272525f6f69730c2701",
      "after": "d2c643b3c9b61b8cfe303781e4e36a29414b05a654f671e4ad3141a49ae1a8a7"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "ab502ecd1062f7b347c5df7f0d8ec384931137f6c0bb1a4b212e33b5a97fa62d",
      "after": "05bb0db1d1b5a348b9513ecbccb40334d5f6bdb3311d7f72723704fdc44087e0"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "609eeaa10345eab18ac6b996d868f769a5599e2a61675ef25be2859664b3039b",
      "after": "de0e54b4783304b06f6b80345448c7cfb63f5ecc408ad85bdfc45e92570ee500"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "7e814412328b98ac80ddafbf8d3821602a101645824fe839f111bac784ec4ba3",
      "after": "9742adfd5f2dc3c263d33d0860a91dfc0f1080ce6bde1fd5d41c18c77bc70e6f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-docs.test.mjs",
      "before": "3e9290cbdbfdfeaad062d572db95ec53ea90a639984ee3bce37d33bd5f9883a3",
      "after": "20fd4f9472b2f39748b891534ac859863dfebf400dec43959a13d4a7ecced667"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "fe644512a460d3834e363f4fcbaf05b8c4b026634a5176504240f6c0afa78221",
      "after": "7bb04cbdca639b1bf77fd54ea008f28dd13f2a1d4b984087b07de8d99f185b63"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "baff16210f3790418c4d58b5aedcbedea1ae99dba72b6d7eaa51b3e58e916399",
      "after": "1d5aec6f527a3071691afc0bf8791f4f46e675576eb81fc578bf5d4b346dfcdc"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "42b0013a040137818420853fa746be6e46308b7661b1e85680afa3444e7f9d25",
      "after": "c946e95f955b3e43cb657169423589629b0e5e063580dadd4ab120ea5f5af71f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/INDEX.md",
      "before": "2d9f59e8434820e43e6e2ad3e432038ed35a4b8ede079f5b0cc8bf297ffdb673",
      "after": "d8d24692c848a1931be151b87f0c67f29a6e0664691a1a486e2cf2ede3622c0e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/README.md",
      "before": "5e374d85632e95499a0edfbd206ae68c8a606764ac020c5ea3278476a75f0230",
      "after": "ef3af2b137f75965338d7dffe03db04e14aa980fccd91e9cfd4a6b8b71bd4d75"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/dependencies.json",
      "before": null,
      "after": "15aa143d8e12641168e25af7ba1e39020bc72dbc9a5a5655de8b729ddf9af2c1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/package.json",
      "before": "d360ea4a7a23e273f9808699b246cebabfbc93a0c18d15ec295accfcda9106a0",
      "after": "2bb2ec8c362d3d8f023be6b164012d611c42420d52ce74d7317dc2b8d44512e3"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/INDEX.md",
      "before": null,
      "after": "51bcbf8a8bec735c23cd064f085761e938aea0bf77e7fe4d708ad39ca3950464"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/app-page/README.md",
      "before": "1bc5c2c4387bb1bedc2222d931f709483971983eaba8435c8ed52bf48316c919",
      "after": "400d996d7f617b253089b5a753e02c60c678f9a8b5ed5086ba648e4bc27c9cf1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/badge/README.md",
      "before": "1be4d84f8514b9fa31454e523090c8ad8f4b60895b74ff08288520f98ef9d753",
      "after": "0e0365c7742f15c40a3b2dcb1425127ddf8c4142cc2ec03c91a024891ddf6eb7"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/README.md",
      "before": "4dbe428e4cd29cfe842214535e9a2f0bba0ac35273d912558eaefaebec59704f",
      "after": "fa709a8329310c0b957092fa964e96a2a9da1d5620efd45916a94d7c3c4b2c71"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/button/README.md",
      "before": "a8a5ff1dc6154bc9d46a59d5ee4a5fba7ea938cdf0e9b540c43278661dc36310",
      "after": "4e1821f48083ab1f115c6a50a6a1359557d0476843dc14eca24d699b97b25a7f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/card/README.md",
      "before": "b324e57240cbe256558e447ed8e8554c6cc8377d896178f20558cdf0f2a8ad52",
      "after": "14ad5f326e90c5d352f40dde28c3b76d4a8eaabeab45254272019116060acdfa"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/chip-group/README.md",
      "before": "9c6c2a44fdb7380283fdfe55c87f6a88a3866cb797027e7bd790a5c3f18d8702",
      "after": "3a3acf9ef2efcef9ddbcc9d16e9ca0ae61788aa7f663c8365db5491fd2ee6c92"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/choice/README.md",
      "before": "7bb6c38e6949135e28bbe6257204c0e6c25f929b60f063742ec0752ed4eb1965",
      "after": "c6bccee012d1e032e54a9f904b6cca231cbe6577919b7254cf9bffe218b429a9"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/collapse/README.md",
      "before": "3f283d8e428c95579506cac4dfdbecee2914b41a403296e745437302b38fa74a",
      "after": "e10546051a285f23a80d06a5db2e7a94338ae1d3a02be1e95de245910cf67e85"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/confirm-modal/README.md",
      "before": "cdb373d321d0a0dcdf8381cfc4374aa5eded05762e68a70f723937d26e1883be",
      "after": "c4a1737fce4d1f54613a42023a6af43b0fd2315b4ecf40121a5555624ab4999f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-picker/README.md",
      "before": "a50945901dc4a7df2c76c19917e70ca08cfa2b2d7c3a546f22b3b4b2a1b283c8",
      "after": "4346e6a23c7f90bdfc80f25d8b7adc2ff8fc92c4f0fa5f3a02e978f8ee2426d0"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-range-picker/README.md",
      "before": "8457266101f3fa7e480cff7e2ebcc582db5d413b578b2fce9ad999b748d25ace",
      "after": "474b0296ca20d7f2311a90c6362488b8db8ba930cbe628ed96c806c02b4bfcb5"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-time-picker/README.md",
      "before": "278195d5dead3b80de022fd8731a249297c10b95c0265a791214b27dfcabc086",
      "after": "3aa0652b0b8ddafb8d07ecef9cb5d7418b7e14f6f8f16820e648b44788edefa3"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/README.md",
      "before": "bba6cf03bdf42a50bd99d8ca5be7bb28447af4099a1e7b2e523d8e68ecb45651",
      "after": "9adfa9dd53e0f54057899c326d2c2f53b20b8709b53679b0f2fe77558db97742"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/README.md",
      "before": "ddf6cac9a461aaa92773c27ac13e3f1df09744a14134e4dd6ad443267c72fa0f",
      "after": "9ed34b0bc1a79df1a04deedf431cfb48c4e80c29b737780693cfeb0cdda25278"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/README.md",
      "before": "5d7f03a7c5009e6eaa090667bb508d85dbc0e6402d1c2ffb984887b9dfaa27b2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/filter-toolbar.tsx",
      "before": "35642b9a33a4215ab9a142329259cf46243ee8dae315c32c211ee1565f0ff199",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/index.ts",
      "before": "cf78396fe6168ca2f8c1510d684d31eb73326c83a7263abf4c6986b484b6e322",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/README.md",
      "before": "f7d817c46d028e39a0ce77e321ccd2dfb3eefe13bdfbea723adf6e3f059049d0",
      "after": "a5bb0875c76d649edddcd03cffc74099d83a70906d132799714f442c25951091"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/form-field.tsx",
      "before": "88492e8ea27d9c8d3868b12bc8c480e5c7e3ed923ca3dce7d7077e425eadc3af",
      "after": "14f40d118e20a5707f884b535bd7fb7da2d9c42390f5608eca9646e1f28e6b3e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/index.ts",
      "before": "152bc5f897a7c1847245b2f032852b1029f4b02bb3ee0f4fc3a28ce562ee6319",
      "after": "096bbc9eb6f30fffe80eaf597e7ad31f975100e6c27bca4012c33b4869cadd83"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/input/README.md",
      "before": "005cb03b4e5a45e41b52793e2607a6c7cb6f0a62b42be1c79c81d45c9e43336b",
      "after": "752b2aa2c47b077e7bd2aa0819fa806d1566ea10c54b82067536328247867147"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/interactive-message/README.md",
      "before": "7288250082c9e612e784a8f1f3951ddbd5a1c6e03ace424caa8745e9de175852",
      "after": "d26726a50b1b5e6b56c046f64e7e25a94eb3664ead3a309471d9988eb18febec"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/README.md",
      "before": "4cab5ac2b6064e76307a6214e3de4aa08ab804e01956a8261f8bfbffdb9afe26",
      "after": "b13b07a59be3e2a603d5dc8e87d52b653f1b8f8cdc77ed09ca0563c9665de2dd"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/popup-trigger/README.md",
      "before": "93176fc2f63a8627cb1c2e8aac4f1eb30105a8734a1ef070332d115a6b0c8394",
      "after": "010705e4d698eaa3770b79836510ebeeff29ab5af70ea5c4f19d61e0c22af1fb"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/select-group/README.md",
      "before": "4778ed0416a750a05f7119c09b0a4a9297c7da4d8d3138df5f660f4cff6091f4",
      "after": "f322ca2168e2d394a82312bec15991f7489dd234574fcb092b9037e2fcbeb7f5"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/README.md",
      "before": "cf063b30ceb29b2f50a9734fe3122f3e76800a811f9c528678c51045eca2b175",
      "after": "21551bd5948fc7aebe82000e25053b2e6aa3d61bc0b399f30e4ebd6a94c928b4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/stepper/README.md",
      "before": "3976a2a478c79255ac593cf4145acb6ea3447503ac45357d0a498c7ac4f22aa1",
      "after": "ad3eaf27d9f8d3760f0af0ab7c7c7be6bd50c7ef41d6a434751c33c7346be220"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/textarea/README.md",
      "before": "6284937bdfd2e0789f3a3142a89aba1dab68ba2bb8c2d54f80e370d37a54c0d2",
      "after": "f32a9f536336013ef8f955cb8bf95e79c293c345e783e11ec7a719cfb1aa65af"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/time-select-input/README.md",
      "before": "6e60faa9470fec3f184f75d8f3dd2d6c643fbb6f68aed129f1b9a73b0e6bce55",
      "after": "5b5505a68fef83ba07437b62c921eafd5fa57c2fe5b211c9a7a647f4e42b794d"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/README.md",
      "before": "7f3553824613832bbe92916f7683f35a4835f25fe96fc904ddd05d96cbc6e4d6",
      "after": "27693c8190918b27c525e414e7882c51edff4124833765bfcea687fb48be684e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/toolbar-wrapper/README.md",
      "before": "704f341393bb94bb8d6a53b4150bd231ce57c08ba36606e3041330504df33c6f",
      "after": "8f694d52c0833cf56127737c5f7f8612250cbbc671ef60bbf6bb0f39af611004"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/typography/README.md",
      "before": "fb7efe685e6bbb028aad6a9c4104b62b00cd3978a2175de182c184382ed54e4a",
      "after": "2ed3aab55727ccd850008e1cc1ce35408740737c752e2960c15a3c2302f57095"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/upload-file/README.md",
      "before": "9ba6ecd20bb6470ea01ab807e65da904d06a26b637c92e0832295f2ab90c9d43",
      "after": "172007c1613cb2a06d54e65f0c6efe2d55399ebb9f691589d1eb000bee38654d"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/apppage.mdx",
      "before": "487cbd6df6838159fcb5fd4448ed6bd044da987499a68a2831eacb9a17369777",
      "after": "12023a07c3710000bf5d85deb0820e5ca5d40a8306798fc79f7ba4e105790930"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/badge.mdx",
      "before": "1aae3092e8fbcdccc14c3388316ffb09cf81da142a10e276546f4ad5a7dac887",
      "after": "a5e380d8a628c047da1cab95669ff6e99c815f543a158325789d28d109076b55"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/basictable.mdx",
      "before": "c5df3d7b20a60dac30fd76e1a4b930584435641ede1710a8a5ece0cc0f4b036c",
      "after": "b594f4cd3b45f56929d19638bc22861f394b341232b8d65422f7e743722e92d7"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/button.mdx",
      "before": "190c523f7bec59b592a9b7e3bcec594e55f8a83020d42070d9331c5a84ffaa75",
      "after": "744fd39fee0ca495d1bc440aa93bed84de5deccddaf96b91918d4e3bb5fc93b9"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/card.mdx",
      "before": "1bc1a15d86681012493df0e9770b911f6f239372dcdf7140b0ad41372939c4db",
      "after": "2447f56152634fd3f5491882ce86649153d4c8cc2043dfd0aa296bbd075687b4"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/chipgroup.mdx",
      "before": "c73b28622f4aa2fdf250a4633ac3d2dae88eab3cfe9f25cce2106d26b2eb7632",
      "after": "8dcea41e11c9a300134c22cf16c8e028698f7bc6e6b9a485bdd58ceefe94d5f2"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/choice.mdx",
      "before": "ca2ae3b592c7332c3eb8e2a200a9cc0572568d02eed24f19927bd7bcf2366b7c",
      "after": "c81f709f19b4bf8809138a3ec92c9bc72dbfe1589031ddfaaab9df53ae9767c5"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/collapse.mdx",
      "before": "44f98fbf44605cc0b55c360a54ac11eb3217887b1dc5517e9793402164203860",
      "after": "4746f49aa75f345b0be97112e9dac4f52e43fcde57d548a374f3a4fbfc1171fe"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/confirmmodal.mdx",
      "before": "a671565c87b62f7d351e8afd3f5f6b9070b7b140dfe62862d498e6c0df071bb9",
      "after": "7571efc2cf56945b325548a393386b436438c88a58434939e6377c78d4ea19d6"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datepicker.mdx",
      "before": "33b9020efd11b8be1e6113a6326c7d90d36ad527722b64afc350ac10edfc4587",
      "after": "b1445fa4cffa187230e88e25a06bd769071a832c86f81f71627bf25f5b643000"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/daterangepicker.mdx",
      "before": "0033c972c0ae80a5d75466907a0c0ffc2ce8c859beb93e7a5b26fde29dbc6150",
      "after": "6ad17afefc77ddef932d9fa0ff24d69c69a888f0c6fe963800ee3f823b6586be"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datetimepicker.mdx",
      "before": "40e0fbdabf312599d87d7322e2f51739d529e7466d98277d089020e65888559f",
      "after": "81173d8d92ea95e48fc79976e3f47ad08a6724137631a17453dc895d59eedae4"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dialog.mdx",
      "before": "b22b9f67fc6a3b346108ffedf1425dc5fec35dfbf307d2358248f5d0b58dad20",
      "after": "330d250c21cb8943ae298882b77527353b3cf4bf476caa4361d2115b6032256c"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dropdown.mdx",
      "before": "a49b3a550f2a98582f5da8fb3f2ffae09e1efd11897d0637960b3b3b0ea6f160",
      "after": "8bca871c4d2539969c3340d5859194457928702ba3e0cdb1b94adc4edfe9cb63"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/filtertoolbar.mdx",
      "before": "a0e2e99fecd203d525bd7d994339eaaaa1ba3ad59a9f351b7786eb99a7143862",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/formfield.mdx",
      "before": "4fe3af143194145c13c48cb1006b73487a9b19591a1fa6d35b6586e61c8d3398",
      "after": "c4980f2f71dc7331471250df537a57f877f8d525c76aaeb46d60e5a02b192730"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/input.mdx",
      "before": "4a7fcc27a985bab90a13e76cd50e6ded54f4aaf53082e597e24094967e306205",
      "after": "6cfb2e608ea0b23303ab28881b200b4526a3eb340e91351ca03accdf95de52a0"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/interactivemessage.mdx",
      "before": "ff086672b294e0cefc3c2c27bc17067c5638bbd7778031b97aa1a660f7e9986d",
      "after": "1460c9f5dcc21d54744d22b12cdad346c6780ec2872405a9e20f5ce717570577"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/multidropdown.mdx",
      "before": "ad01d523e617b66d2f4036e5d9e7a156ce497d097562b848bc7f875b6a9cab03",
      "after": "c6b1475a3ee9cdcb7ffee1d4dc52521d1c5540db5b912ba870ed52d326c6d7a4"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/popuptrigger.mdx",
      "before": "354e794bee697c4e92edfe7aeeea5d7b7e1dfeb0aba7ddb8a8030adf8ffe35f8",
      "after": "0bc5ed24da7cb4115aeec98e52914e1c978b47f4b04431840128275a458ae9dc"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/selectgroup.mdx",
      "before": "a7bdab17488695e4dbde6867a7ae8b5c31c2550e970922b347fab817169ba941",
      "after": "7b40e78b3aa442d1b8f3769403ce0ea0949bd0a69a2bbc60c66a83a8cf6b1686"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/sidepanel.mdx",
      "before": "2f901290fd6c72a81b61fe9f749ba753b5a40f4c9823964272c1414e6cf7d565",
      "after": "0a8ccd96916165883ea739deb9df47b6cf4dcf61ccf3d4c62b4a5e63d0bf962c"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/stepper.mdx",
      "before": "fd8c4978fac75b2b19efe7ac74b8895d95d72a86c31a803b662724ee257e3d1f",
      "after": "b8b10f39f7499cf5920f1247fee03d01f45a0d57216f49d1a8b90e92a9a0e545"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/textarea.mdx",
      "before": "ab123cd75ea42eca068d035f26dcb8fb0cb63ca7c8c2c47d8a3f1fdcd2d10291",
      "after": "d5864bee5b8d4c01b8952326fcfda45e17bc13a04813e07b733df280a79d11de"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timeselectinput.mdx",
      "before": "942220dd5204ec359a65fdec88d54de746cc7ca093aad57c37c4644af864a9de",
      "after": "a681542e6c612acc9158a4db5130d41a799a1eeeac3871c143ee9582675418dc"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timezonedropdown.mdx",
      "before": "c81f018f5dc4af4ff9491eb436daf870de82f31b59334bd4021407a33c6488ea",
      "after": "39ea44bffcae6f111019d7b2642ae61a732c2e1be259c00a32ee034b1d89c50a"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/toolbarwrapper.mdx",
      "before": "d52e310342c0aa192a0a6e68806ad57b8189f888f6db6141f2246d4ae6a21b18",
      "after": "e9431633f3345dd42468d05ca5de36bdff3236f062f0cf60659656825f817bcf"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/typography.mdx",
      "before": "3a2052152e64bda4c33263418400426aa825c343652e0e01c5409f94ea4c6b2e",
      "after": "3c8248e18b4ae6659bf05655326897d729d81726836b5a5b53a32a79f9316ea7"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/uploadfile.mdx",
      "before": "8243c753d9f5d8b38d8a4d87ff68b161ccc2c067c96ec8d9daa3f9a8df918440",
      "after": "3e15d0b1cdefffc61ff51e9d4fcf19dffdd6ff2084b4e6d610363a89188b4735"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/main.tsx",
      "before": "62a3d398cae3b6d7abc0849a3a0e73198150527dd168afe3d21de686b8039098",
      "after": "cd0e1ac5f4ca9acd874675bf60db7c001361561b46576feb98e0b82b6a07e57d"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/tsconfig.json",
      "before": "a81949499a13d6f4ba92afc63efb9b313596c685bb8727a40208e03b2475f4ac",
      "after": "4d103e09c84a4d6b441b7bbf4a464538768d71dbbc014824f4a9f89f16cb43d8"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/vite.config.mts",
      "before": "80dcb42c7b5401b77a3c6eab30ed057a6215e2e50fc58a71d1656cecd83dd55f",
      "after": "10f735ad5bf05008fbbeded9a621ac6f1dd47be97c3e31389d5c2925e044f600"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-1.tsx",
      "before": "ae9c1946f021aa4f29b911e88550d90aea84004eeabb1e9019806cc51183d22a",
      "after": "e977d8dcb1bd7dc6a992147362125c5cebce309f1d991d341f11dae23b558c25"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-2.tsx",
      "before": "4ca78417a5e24dd76cfe3652e834161bbbb1c9124a491bd0fa7af4c0373bc2a3",
      "after": "5d6212a2e96f4dadd1c965bd0391d46dd9ea0f218a265b1df30037753e8383d1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-3.tsx",
      "before": "57141621d067253949cbcb48710911dd095b432b5625111f9a63b4c42674871d",
      "after": "8e6ffea2a97c597b02b13b905a3132bd649fc68fa484c546ef4a5f415da0f2b9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-4.tsx",
      "before": "d2c71a8fc9ee86f55fdbbe23849301038c9841bf205e2325279cccbc185a1341",
      "after": "a9a5dd1f0eb793b1d9c0e393cbff14b65a081c70208cdbbf4cb3855ce9f95c1d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-5.tsx",
      "before": "845befb2d213a7882ba1a638e8bd08164f71f3667805546bd256c6712e734401",
      "after": "8511ffe6d9aa28534bc00a4f192b0ecfbeb3f51c68901168b427c4d41b50f7c7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-6.tsx",
      "before": "ae23693c2c66358c4ab0e13052790dbb9a2ed3f55d2a079dcaa62817d42167cd",
      "after": "a83f6467e6e0540277fb584ae2f2890630b9a388cb1a045da7e76287abab0dc4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-1.tsx",
      "before": "40722b5617dee2082173bcf81f57e900dd3007fb49e485c87d50b5ac95775617",
      "after": "c78c7bfa1b9ae822e69f94384e8c155c8fca3c0f74dece4bdfa0ce340f2a60ba"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-2.tsx",
      "before": "b55e9df2f2504b4e29106d0365afe5dcbf5fd5171609093e6acac5518a5b7448",
      "after": "da3102b7d54d717b9a96e4165dbe3f317e1d2d83c239bfd71ef4e231f0f18eea"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-3.tsx",
      "before": "783c8a5e740f77fe55aec9dd9b2828fb86714ccbd9b83773abf8bc203458ebf0",
      "after": "5cdc9640fb0d60dfd71854427901da1fa2877e8d97216f9bce18174d7ed56636"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-4.tsx",
      "before": "ecc7de5be1fa99fa4243f937d6e479913749a20b13c2b6ffe613b7da78b9ed7a",
      "after": "731da8582c276d87e9c8e7ce0ffd6898ca7004d5743499fffa608bca0d2189de"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-5.tsx",
      "before": "decaf0330ba0c2ff5da55c2943a5529c9a31e29dbb92d8b21fd1a465c85eab64",
      "after": "0a86dd174722543f68129d223ba0733e577086bc865687c2e3dcf7f3c3f77f7b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-6.tsx",
      "before": "6c480d1cbdcb535dbd312af3c71e29ad9b105eba9224a1d4ab0313f2e9523f58",
      "after": "b90425219d2a50ea181b1b1f1a30a877191ff1d2bd397f97d15c4fc951875c6c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-1.tsx",
      "before": "cba9e5a1eaf6ab511f1718d9546d0a4c6f29f59dffaa74c22761ec09c1853bb8",
      "after": "cf676021a5c96dc1ea40d921a86451e9af1397615262eff53c8534fed9c8e740"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-10.tsx",
      "before": "a0b4ee8b3b2906cc9e6afae71349feea65c87a6bcae06c48d110739980b77954",
      "after": "513e94a784115e174b4b84ec19a88214d47443780992c6bd2ce663604e3c2345"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-11.tsx",
      "before": "d378d0deec5c1719c4b6d18ebcc90f21599352328e06eeb818745203059fbc98",
      "after": "c2bff628631614090ef342f94849d8e3b98b4542e3a1b228bd320b12b55c97eb"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-12.tsx",
      "before": "277d3bdeec75e95244201598244b4a9c8561992d9f3dd271d7969702d3ace1c4",
      "after": "4fb7b4b8379f246552d2ff90d6d4b84ccb8e90a02d9b3567b1ee7597837cb59d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-13.tsx",
      "before": "c0af9eb3091329469e88f02bc55cd1f7ed1373c72b55d1fc7f7eff54cab83a81",
      "after": "00b87a91b7b913c46f07064795b1206d96069fb774927debd5586d636d0478d6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-2.tsx",
      "before": "e7873d189f25826bc325678e4da0d803e88f82055fb6d92529dbfff7acab3d79",
      "after": "fb15f6c36064803041609bb1c9aaab7285b524855a097735d4b42afb42a64e22"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-3.tsx",
      "before": "060298619a85f6dfb7e7c042b3a1d99aeedd0daf3730c46fc82ab7a1d315b405",
      "after": "1641a58a682e410c53d0c7b5a82e868b9085e6ca233fa0cba5293d1317bd8f05"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-4.tsx",
      "before": "f1dd7f6613a657052062b7d0a3846ded007f8ee4f0d5272ed26abaea62aa75f7",
      "after": "debdc4f513e304374522714bb50b2e43a3c060b8d0e6cb01637ce6563dacc643"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-5.tsx",
      "before": "2e119dacfc069474234f9e0c66322f4b1ff7040a60bf2e8aab9509173962ab46",
      "after": "59d1f52f3574f572df48bec6a6663618173ff4dfd8c7bd76b519234cc85c2fec"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-6.tsx",
      "before": "df2effd19631663969e5d74a0429ac7c28e854ce175429dbd8b3425c12007f9d",
      "after": "ee501fb0eda08b5685640e710843f5aac708312f1386394226f7e652b82ff884"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-7.tsx",
      "before": "e4ec3b07b7dd84dcf3ef2c0541026450a6f1105164500aae1c0a2a699bba0ed3",
      "after": "5a4e49d1b92e4869da1016b63f3728dc1c8db53fae27a18fcbe540e44b5f22cd"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-8.tsx",
      "before": "8cac66d9499fcef0dd428cbfc6098b62bae2c6738969cede575a6d2d6590d5f8",
      "after": "38ad0fda9cc9ab31996b087149d8356a0254f88ecbd1067c16c596448306fdba"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-9.tsx",
      "before": "f53a2294727076169a6f866d30005625f5f5c4c0644d4951cfabc716d4fa7e53",
      "after": "b12786314494bc33c659b92c11cbafe3c96dd9e8d3e1f3601c0c02b4d2300267"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-1.tsx",
      "before": "47247e7d40b33cf0b9bd10e2f361d90c3ee6fbefcbb75670ad1746ce6f641d5c",
      "after": "95482109d88a571cd9995aea1584a9a3a445b902887b9a3a45ef0a385ebc98f4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-2.tsx",
      "before": "86e1428b11eea542ee6dca0933bd058b8c44f1d93dce785c061ebf4c4b009adf",
      "after": "60e0b2beb5842255a85a60bdbd6ba712b16b4be1df47c2be516757162a08315d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-3.tsx",
      "before": "cc755995d8e0100f48378cab3e0c974cae2049ef37854b04c16d5e34221b7bda",
      "after": "cbec9ca7504be779158f2d3bd948cb22f100e85febc7017ad54acacde7d3d8a3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-4.tsx",
      "before": "810b8dfd6d842ee3ea9a0cafa7641146e4a10c13eb6798d35e1de5765fbb9bfa",
      "after": "d1e7f4437a4e2b35212a5b8dcb85f406446d9bfeb424f7956d1d1dda4be415da"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-5.tsx",
      "before": "454ad6e4eeba6a2604231c72c306132213ee1a85e5f1339bf540047ccbe46444",
      "after": "4a7f4502aeeee71ebbc40591031a38590653fc87b228ba04a827f70f3dd753aa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-6.tsx",
      "before": "54beb42b31422f9abb8f954b55d745a87b4f056aca7f928ae3068d8eee010872",
      "after": "553c937ddc451fa0fe57e2cfed445f64e72e3e4cd2db2b045c234013f95089ec"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-7.tsx",
      "before": "910a8bbf648fbcba37ca976ee8738ace7c75602839ce87a8316d17af4af9bedc",
      "after": "100716d62e1fed965360b1b8a9a37e2356cc4de32eb85250be804bede9462893"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-8.tsx",
      "before": "12fb3aeceb87eaaf69a475cf06cf90d933f15a3f81936b70b3d6aff235924f16",
      "after": "95020ca83f7f7379e3e644d8fce99485f4261ff98ab01a909d4d716e285dbd23"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-9.tsx",
      "before": "d7bb4966f1da6fd19785d0666ac1d027b55b33c18c1fbd45646b3011da334dda",
      "after": "75e2866b66290bc5f1991c6c7d91f36c694512583d3819901ad27d71311e92ed"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-1.tsx",
      "before": "e9ebee8328168820a70f89fc6d7c463e8aff4ec89f8fad6219d26dbb4a343cdf",
      "after": "0710c7145fa6178ed29c2bd321d58df44779084ddb2d5a4e8a35e2ac28ce9eb9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-2.tsx",
      "before": "5162ff9fd54f800de57d4c3cabc573647c722e78b04dd898b36254cf966b7a9b",
      "after": "99d4d63e9722be1ffe9e6983adcbbc2b0427fa9af3faa0e4ecb127451efccb4f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-3.tsx",
      "before": "08ee84408097b9c668525a0169a994de36a830e4e2d9b8b171d6764f9ec4f130",
      "after": "12876e0db9ccaa3958af7babf094b34ab489a243dd8716c40ab496099be93194"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-4.tsx",
      "before": "614ea3b871aa5c807804679b6d8fef4da0ec3aaf70084ca9fd347bc2ba651103",
      "after": "4a7ceeac37825e9cacb34bc65e98d004b96602ad67e3c4d07538213089846afa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-1.tsx",
      "before": "f5cf6bfa29b23cc6a509ef111b22bf9027f20a8f9c923dc04871a469e9b3f8e5",
      "after": "5b0ba99a3f6b3c04ca5f2f5f6ff07073c0b52181d87607bbd015cd8f9a948af9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-2.tsx",
      "before": "6d44da041bd2129ecd743cd212cc6956ceca08698530e8bc18c407af7fb186ae",
      "after": "575013ab941e6d7a038f21b8244b899895b414a4589ef1923edb167d1e5beae6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-3.tsx",
      "before": "5163685896c73f797e977e175ac96fab18a21e2487512324781debdc4782bf78",
      "after": "0ab4f92ed58bc501369b3b00cdbaf37cb9b9e51cbf0df1c498254cd06e239766"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-4.tsx",
      "before": "a83a809c2683d055b083028342edc0a74e7ade8b4bba4759362d61fb808afcee",
      "after": "6a84da9ce3d5070c5f01d63704a6dff39eec5f4309cf8d0483f0f78fbd708567"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-5.tsx",
      "before": "e32c28ab20358f289646f14ce1448481ae2d8353d1e77a2c441964220dec956f",
      "after": "22a623ce3cf2d1722656d95815b036dfa53d475e3599d08a09996d6f70d7fc45"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-6.tsx",
      "before": "869840aed3417080f48730a841992770e40c051de0f73eae0e7b5cc660e5aa26",
      "after": "a065f01af671d18e27ddd81454979fafda420b3d0f13e4bfd0d03b18ed9bdf77"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-7.tsx",
      "before": "b2661f71a82ea9ca305a812823b58f61b9c4dfec4f4cb22789318e8b26327404",
      "after": "533258edb746d6833034cae7c1df69f28f2181890d8e681923137dc83fb7314a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-1.tsx",
      "before": "7cce33fbee99f13004c75ec3fa8f8b0e6f82084425ee1ac103ec72bb073a116d",
      "after": "5e7cd4f2053c8906b72d001571b23becbdd7d9b72f816eed9bcc013c484c8c15"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-2.tsx",
      "before": "410938c46a54778cdc98f952dec6fb7e54b84c5bec120dc620f9fb1614f3a1a7",
      "after": "7528fd0ede8be578917838303a1cb6ab6003a75d1f935aacaa39fdac26e245f2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-3.tsx",
      "before": "83436145089fde6543fee70989508c95b099105a05adb0f21b09b44c568e8fdf",
      "after": "96aebc3f8fdf71fc5c2770851e95f836d40308620ba4cb23ab0047d507c812bc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-4.tsx",
      "before": "73b2201f96ce0bfbae3dc572841a37f4a9e834411e26ada723a70131ba261c84",
      "after": "82db65f6158f48e78b5b8347cc7bafb3a482c02efbb4d767ce9745b2f678d94e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-5.tsx",
      "before": "f2893f97e974f43b8f09c39439a8eefd59b3d5b65ab0d9e9d14acc0545f19a19",
      "after": "622a1bc674cc2932d5f9ea383fd7e75301817267f2ee5b42f3be4baa8deefd51"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-1.tsx",
      "before": "2e92d5f13dbe3e1f4e1d945805f279b91f9272e57121ce36abd1d48b37ac293f",
      "after": "844029256207341d664dceedcd957c1aba309a9abf55f777d2cc2ff867f1e62e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-2.tsx",
      "before": "9f6d50bd1a58bf0f29dd063738d20926f94573469630c711bbd08187ebbc2042",
      "after": "716379eb213bc25ff2b7f7ba76d31c4b1303a51d5f07def43685eeb45dbf2393"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-3.tsx",
      "before": "c0f401d062c35bda1b8711a6ef93c9a3c6b9957b9677d5be46370a69ad975256",
      "after": "11376831fc028f71cf49709d9f4c0affaa3bfa61687e1ca8c8887d0be5c5f8e5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-4.tsx",
      "before": "e384980bc074adc46bbcd12ee1ac81895304e15df4520c57298e4a5d3d80d5c0",
      "after": "c5d504f1df69c9ebde6c4a0663de061d34fb2188c47b1c88cda07a9b9dd0cbf6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-5.tsx",
      "before": "3551d2aa93840eae618a51618fe2d6ecef444fe538094be80da031d66d83e634",
      "after": "b1f07daf33470fd7505958de50cebaa38b701ae1fa75b2fd6327acb4648f0649"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-6.tsx",
      "before": "6f8ed7fd4f90c5ec2f8a9cf2a07c0df6ed6516945d723e53c115826d6f48da10",
      "after": "65116216e8a3e7676fa40bb2136d4846ace0e5600de092a67d50d36f384f2c97"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-7.tsx",
      "before": "7c3ee32509bf3b269f19b4fa1c549c21392177d80ad61afaff958d7663ffac4a",
      "after": "4045745d667bdf21344463abc3e57130b5a935f76564cea8db87d6950d068e08"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-1.tsx",
      "before": "758909c9030181fa883ccf184ec23315f5a250e89542c71fdb11d5cf68e11103",
      "after": "e220b646b6fd2375bba23564df5250c598386914c75376d02e590f0b201095c7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-2.tsx",
      "before": "8c3360c72cbea5bbabb7e2ba42486dd986956fb4d7ff5175a75beba195ee8d7e",
      "after": "fe4e07efcbfc7d1b3e9e097090ca1a0ba0b95d8c2b4daf67f99620d6eb905279"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-3.tsx",
      "before": "800fb165df501724225a041a3dadce3de8137add1bc0625fcb4deedf92246900",
      "after": "1ff558a14a9c5e1cb219379b8f42137c0f4b411040de39ffb0165ead52ddc527"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-4.tsx",
      "before": "cb72f61395689611a8b66c5b1c9e400cad1bda6690079052f929d75bce0bc53c",
      "after": "60411f008044a1d8d681d1fb7adfa44269a8d5756377eb9939642e45f5d37254"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-1.tsx",
      "before": "916a0fca533ab5f96d41c7403df5cdd3ddac1e840fb28a3a350c87f299639fc8",
      "after": "a6b7a97ee7ae30258462a65832490e3bfc157636bcb34de5a31bcebae2dd3773"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-10.tsx",
      "before": "6702798083fb049104750fa7c8496194071bff24be52ed139ccde9d0a48ce6a0",
      "after": "23b3faade6fab63f313b269d1e3521a1efc5b4d1f23b86f6ee37a18781fc78ca"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-11.tsx",
      "before": "470d314f0414a62930f9d34e7d331ce892e17f7ed32390ba9275bc18d99cd930",
      "after": "66eec8eb70de7cc1eadfff72ea8df82d5784425028a9e569953c7bfea50c8d2f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-12.tsx",
      "before": "23077a7778f9ac128119e87d31e9ea4266c159c66544d7e97ac65781636d197e",
      "after": "78580ad6f637c7b2083b2d0cb5deea26d740f1fa8a30cdbd5ec7707aa30a4dbd"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-2.tsx",
      "before": "55402433ce2d7b101f402f37b4df9a7cf6a920eff4d6f5f2f7a3c1e04b366bf3",
      "after": "10f3f09d12953b380c38cb6d148c2ddac340ab7d86b07c768d1acfa6d34107c0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-3.tsx",
      "before": "458f46506042fca7159e43f0ce3ca5694fb6f649a7470958f48aafe0de58e13c",
      "after": "683e046beee0f15812d75316b61692f24d5a19ddae2f6ec4208a3a272b97d7b9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-4.tsx",
      "before": "d3460452bce63a6c9ee53b1295c168091ac5862b7d340fe3a29fbfb696b9b516",
      "after": "bcdc9300504859d4367b4c2547b5e803a20d42b19db17c8aeb748b6183816249"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-5.tsx",
      "before": "083dd8a572ddd5f6536cae065d170c05a1b16b790b8e41e7a897d384c35e6f22",
      "after": "e49ddb3fc79b574ecc42a0afb5ccbc58ce449c46c49f662f17b9f4e100f293f4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-6.tsx",
      "before": "c6e7c6a368322b793d21dc60fb7ed4cd77bf3244053c9dd674467ec898afad5c",
      "after": "9b6eb116ce10b7bbc80eaab9b1201d6dba82a85e4c7b454416ffb78095c37319"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-7.tsx",
      "before": "16ae35fae12ce3f9a84c1cb383a4c006cb451aeb48d5d468238162745d797c02",
      "after": "9fd15bd55256c1dba198607c3c76fa25eb09b8fbbfe49b5658a103682b33cf33"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-8.tsx",
      "before": "58ae4000580650b4ddc85ccd34cd79c6fb0e3b2c3714c339f8feeb3b0c95ebe7",
      "after": "a0ac4573d566eddbebb8290fc53960b217abdc1dd981ae454d36c115d7e7bfc7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-9.tsx",
      "before": "c3e0af278d709e709d74fe04b9964e72cdb179c4e43ae2c0a2c04edcbb7074b0",
      "after": "f8a71f1df95efc6b4ea73bb35e2cbcffce5a616a04653a1c7d5a941df975881a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-1.tsx",
      "before": "04b70db543ab5435c1c211fa331ba5f07144807b85ba12d8c959991c28d4fcd4",
      "after": "51dc36263bdd68bb82ee388aa0256f021e34bc8614f1ec649fed10c05b3b16fa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-10.tsx",
      "before": "d638c3fe6c0eae8ba4e2e731ad74af6a47f2277a664ce72f57f313ae4c23996b",
      "after": "29dfbfc205f30b9a5aa32a861d7a2c1ee27c32018f6f9f6a2b7c3a88df098234"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-11.tsx",
      "before": "a316751fc211c6106dd8cb8d480d5d50d6aeda5899d59ec2c645442389cc01dc",
      "after": "6ae91f8d5ca6a5b48d777b0082c6d89182ccfb9b6bbac4b42c677125134fea47"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-12.tsx",
      "before": "544c3423a28def596f61fa3543ac1653450cf339e7425722c19a970e482110f8",
      "after": "642092d0b3db35f7e30b6078ad7e7cb4366e5f1511d85c9e5e613668bb212707"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-13.tsx",
      "before": "1d0cac86eb4f577e5f16349afa4dc1141947fc43f87c20e37dfdf7bdd1630ff2",
      "after": "2a5465adc07a2a7005556a1c1b80e66450bea9e3fc9b5a7372c79ed471e30179"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-2.tsx",
      "before": "e188ab506d29f294217eb650f5057919205f456d37a1b1eba809b33e396396b2",
      "after": "d818bb3fe0a9c32add191a252dfb99c6de8c3c7aa3d0144a6b004819b0d90bce"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-3.tsx",
      "before": "682a4cf1479f10f5cac558ef22707748ded879f568c38def180c2e3c8e3e2c0f",
      "after": "294cc4d6950d3455a61811be8f502f5e81ff106d203a93ebba6a026904f408a3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-4.tsx",
      "before": "22a0363981ed9717a1377841af7695a45bfb76c4d8cfc074cf5e7b3ebed6f93a",
      "after": "9ff8284a67325817f8dcfa2ebd6f7ebf5b7cc61ad2222ffb032c52719bbe3b6e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-5.tsx",
      "before": "58a49cb5d56b48efaf6a6d8c2da9bd2b75ab97f278b6c54db1d8165df7866d7a",
      "after": "a5f5c814f770ce0d54c1a1a1c35c4c714f69b0248c65525b0fcdd2fe2af32156"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-6.tsx",
      "before": "8c516af126354b475697773e7fdcd81b31906852cb1a0a623b7c778225967ec6",
      "after": "14b55ebbb6db63d9b063e561e2bab95fb07b1c47fadeb76c9a23cb6232f80861"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-7.tsx",
      "before": "afbcd58cb97b0739539b940ce6ea281b758866e8f86b4701ba2854c44bf34da5",
      "after": "a7b1b7601f7e224fd9f1d56474c9180e55eadf590e27051a49ebc3ca4fc9fd41"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-8.tsx",
      "before": "2cc254053006a1c9f18ed68746d1fc93684a369fb46dba26eeb0145d33204573",
      "after": "1aa2dc09179ede1ea259bd6211bc40c3644608cfe55407fc864a80e32182b2aa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-9.tsx",
      "before": "c058a3ae6f2333aa77dfaca6c54c93a0f440a26da8340e57b5fbfcb0b4ea6274",
      "after": "f931a173ea51136a2d81fbfcfbd393d512705e1eee659b4f3e5176844364f987"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-1.tsx",
      "before": "4a68b417d8e403b99f6e3b43abbb5f21df392f920aa57bd0deb33838a6fca294",
      "after": "133dc7eb0d3d6dc750950b07893b1d7e6c24a5edaf829c93b3f13d8b4bb448f5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-10.tsx",
      "before": "2353bd8c3ba7fe64e939a0c3f843a506c031f4e003c0df5c840beb4454eb794c",
      "after": "665701a01afea073ed5db6d4b06b7ddda6083b675d008bd4d596ac24e752557e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-11.tsx",
      "before": "0518fb33cfb6d804d67f4c6e0daca45a7986c1e9d0c94e477e3ce9718c90bc15",
      "after": "a6939678c170108601e8673da5e57e0d8f0e42f08456fe6bbbe0f2be3f8e0dc6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-12.tsx",
      "before": "1b309b17f69896b18ee74e1925561ce104512830f0d3cba0f70b3ef86a545c08",
      "after": "2da885642d70da89d828d674f690288dc58970997be243ef94caf1b11c96f584"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-13.tsx",
      "before": "566b7ed614d8af4cc2b5a267fa49f9af88d5ef88ab9555ce78dd7b719878a395",
      "after": "8c7ca824eb9aad724a2d3b02d09689d07d50066151476bea87c77586faa17703"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-14.tsx",
      "before": "5b1423c0299d98a58b7b239e945bb11acf53e9c771d384a0da564869fdc5fcdc",
      "after": "74a20fb866d1ee5e2e428f9da605011038ed85666a4df0f648309d4f4349169b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-2.tsx",
      "before": "900a541c5c51998cc162a5ec441d6e4e028acb8068cbe9a03d2073e619b47ea6",
      "after": "c5850390a020c61a64ef7c30f9728bd5eb9073bf6a9b9f9e2f73e12ad985841c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-3.tsx",
      "before": "9f061a99f44a6c6124f8ff5159bfbf775762b09609a467a9750febcc6fc51dd7",
      "after": "a289df2a6f2db1a8bc4cc29970b6f0c12a666ec9c4174f67ba6e949ad1a7acc3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-4.tsx",
      "before": "7a11ba484e35b8b7345cdd0eb00f5d690755b703f0d2259ed4e0eac55fd9ebfe",
      "after": "393e7858afa231688695afe8835ea4cfa9ccf8f927206124488e9c429e797c2a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-5.tsx",
      "before": "e6c3d133f5476ffa3fb8c78441c8a31da89355ff59aeec38ac0a7a8b548d4ca7",
      "after": "04771559cfaa8449a1bc9d1480cebe16681520334e1796272a02dce31d4a6242"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-6.tsx",
      "before": "a0d5c6e26bb200b707dec8f8543c390ecfb7a4db3f01ebee937a326f34d932e8",
      "after": "dce64dccd1e9f599232604b226c07716eb91f662791aae72d152525c57cb94c3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-7.tsx",
      "before": "8362d72930a7d4dc0c9b46f0bbe88cb6dc430ce1e8f0a71d409ae89ba93ffbb3",
      "after": "4a1ebf062cc0af1ac585874efab7cddb469552cf8ed3d09b45958477b8a6d890"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-8.tsx",
      "before": "7ee56622503440e429b0f744987420dbc585b520260d6f5e4791aa14766d88ad",
      "after": "26b591c27557ae0e3913419e7fd2b8489176da1d93e63fc8dec2a32031d4b65c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-9.tsx",
      "before": "c62777c885419aa1ce39197db04cff09baabc5bc8e5191001b3f665d9bef47b0",
      "after": "9b6582635444cb67e77cb683a030f286c51990a27f52e91693a6a2783a88406c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-1.tsx",
      "before": "2935f99adeef36f215db384a7686cca163ffd075143359a073d4fafa162c5a41",
      "after": "ffd20c1c8530436b2c4d0d62ae7984fa29f0df50d4ccf7cc84194fa35d5f0390"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-2.tsx",
      "before": "07634e3d5910b026a6515cc7e7f7fd4e0d61d1269728b1e4119e45203c1f6621",
      "after": "aaa82d8c88f2fe07e3bd5a08adade57db77d2f82631fd5e8b04678e8afe1ae2c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-3.tsx",
      "before": "eb60bc8e585e077ab90c711a1e673ec263b242791ee7c1fdf9a5fa0415a77fc0",
      "after": "2ac82f85eae7342456bf2b65a334f0d71937daf6c132f2af43c958fee7561926"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-4.tsx",
      "before": "811de9b4236a55fd53e1340449b48feefcc6e695039fdaae55600877488b4841",
      "after": "7a75bc3249cffb24f2252e2cf51c477da815759b20e5eeaf78a0524974404ed5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-5.tsx",
      "before": "69406ea206d7b90b63bdd490d08169a07702d569e38637f219c7560e3a9ade81",
      "after": "2b695b602c6b4d73fc4a570ce898c591a89218529b686fa3a93f21c1c070a436"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-6.tsx",
      "before": "a7dcec2961d208c1b0d30fbf25e47a449612806060d3dbd7b8f072e543fb7d1b",
      "after": "1692a7334b7a00fdd804b7556d89438bbbf8523647bb45c324476352a9ff1a6a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-1.tsx",
      "before": "317696d72f0ee43d551ed5e1950456fda8957c6944f47b32e93c25ca852095b8",
      "after": "c0495a3956efda44c64b733710e7fa5b97cc47767835dcf7bd996d253c9d50d5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-2.tsx",
      "before": "7095565824e574533490b979fee5747d6a8f244d4b8c818ca491d35be81d4113",
      "after": "9b56158c6e0fd0c903c718c078f0519ab02eed59cc609f25580393de63ea6de4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-3.tsx",
      "before": "a9e1c47df466488fecc15f2da11ec1077a038f4fd1c2a5c88b30065215b2179b",
      "after": "9c37ea719156d8365080e1e74f58fe32c02f63cc8ff014756c9ed9f057add1c5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-4.tsx",
      "before": "4ad4958ebb57b871b34cc571ae3782e4836db83fad7f98f763475930e661a5f9",
      "after": "598ad8d8df50dac9fda99a0beae325ac06f79b2c4c06bab106f0da7001beb17d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-5.tsx",
      "before": "55b5edc345622bd793ef8a9679502124a37ae9bcafa87981b9641220dec34612",
      "after": "d74d548e3771a8b2a8e128e3a8d82455c4e7001eda0d4d18fbce818846fc4f34"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-6.tsx",
      "before": "fb60677c7ec61713ce0f9f55ffbf8ab1a4a67c657fca83271d3d7e0e14123d50",
      "after": "04b23f5414892a637bf94b66186b79d62bc32a72de20d8afe20053317269c73d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-7.tsx",
      "before": "03c3441759821bc82df578009f7a239f0cc65fa998dd81670aeac08969a0b904",
      "after": "162e610c12290d5555938624fe16f2f290ea24e6d2a5db7d47111290eb731108"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-1.tsx",
      "before": "15358b4ab20189909c4eb1fdcf9497febc649b3e86db0941144cf4611475b3bf",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-2.tsx",
      "before": "c01a81f7691aafdde377fa008bb13f2982fc29d4d9fd13f184a2a4c7cfbb7ca1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-3.tsx",
      "before": "69c99804837f51f39e165ac3963a884aa665ca8fc58808567196810baeea802d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-4.tsx",
      "before": "fc6ea354628a3aa0585997489c81e42357a0de3f19e758607ce7d6671be036b1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-5.tsx",
      "before": "1e2d35c1fd231ff3b696178cca48db77db4dabf65fcb395dd9481f343979d1bb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-1.tsx",
      "before": "955e2b6ed7724ec402b75cef762a4d87ad9fbad414eee902b11699d23041471c",
      "after": "c090dddf1ca03175a8e1bca19a81009d27680ca4a50836758f87a4606650c874"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-2.tsx",
      "before": "cad8412bcb6a5f0b56026fce8f1193165583fb82b0ff4c7a58ce98f6415e6037",
      "after": "f75cf81ecd3aec0cff302a93db71de43c0ebe882f2ae85cdb8738e6b5e02e57a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-3.tsx",
      "before": "a47480f71d40ccd95847d3a564b3dfb6a4585466fa7be58ee7df4f2b75eb01e4",
      "after": "7940dd288034a810ef59645cbb89c9ce97248a8c79ab060f7f3e488429d565fc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-4.tsx",
      "before": "3a81fe29d9731a88ee5429720fe0851a52e398460ab5779d47a05d3c6b001ae5",
      "after": "c0f29d7fca0a9458494b63357a1e45f48515ce43cc7225e11895ee5a78b5f8e2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-5.tsx",
      "before": "75124aebad752b12ad23a9512e0912d0c9c679cabbc2cf84912a6ed497158f1a",
      "after": "df2a9ebb6ee3c21b798f1d58f8320d985dc27930344b535fb62924d7abbfd72d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-1.tsx",
      "before": "d65adce5a6a2a553b116462aab0dab5b7f0d7cc41f2db304600353a37f69900f",
      "after": "def8d4f02cfa01bf0158f17cf0e4f33db841ec956ff26435f8f60259f69bcb61"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-2.tsx",
      "before": "326cf7926a30e939dc83dbb3d28028836fc62da3b3b92697c5b6d23b0f3556a7",
      "after": "b270f65f282300d8575600ac7a004d042fbdc2b3626e9c6109b8a8da5a8fc739"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-3.tsx",
      "before": "e9aa3486159854c1dd5521e5b03aa43621edb90e4ef3cc3c8453918eccf9c357",
      "after": "8d86ee6cb56ba17ba51ef7ce15c9b155df0a522d8d7900c19e5a3ca10a585909"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-4.tsx",
      "before": "657c647a87c2b832b6d0101c4d6b8120dd00e38ccd078f7cdab3a786569aded3",
      "after": "cb1400c2367800384b46dbf0e464e0ad112eda4c799513fd7742ca7a620522d2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-5.tsx",
      "before": "ce38746e046810e07801d16b85b48c3308f2532d969af3b19787813efb5b6460",
      "after": "c34272ab5683ebeff9ecb72da31339572386b877fc1e60c6602a2c3057debf4b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-6.tsx",
      "before": "bf5b55bfc03074b787835acc7d3f5aeb53c9d8ec13449467eb83101ec56c3702",
      "after": "d8147d034324acee3d89b72c9b12134bb79a5a7998677915d106eb8c41a199df"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-1.tsx",
      "before": "85d37bf70b40eef9701a2b105a3a5082defab8e2e7a6a6850c81ecb73082af9f",
      "after": "32d12cec94a6b74efebdc20d1c60bcb647a816d3fe3896b52920629d586713c8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-2.tsx",
      "before": "458aea8503ee06186dcb7253c39f2fbfd03a26158d3d4d06bbc9b94fca064e28",
      "after": "3b4b7f686fe1563654677a6b502a6b76ebd3293e50d4f75dd3f6c99cbb6b4289"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-3.tsx",
      "before": "001490ee28c1824af74df3d6c7e765f67bf4453b192dfce4a09b3eebb7e2ecda",
      "after": "6506956ba16c54177c5a292f60ae4fa2aabcb837909b649c13320fc430507336"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-4.tsx",
      "before": "99cbf08f48db5f05a50de2ad1fad3fcfd8e84c35acdf7486efb56f608ea3940c",
      "after": "72c8adce828a15438d7054a55871ea86d529e2be84fb8896e6018e3d8f7bc90b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-5.tsx",
      "before": "67835e8096a503980e804472701bcc574971b1b5a61e237a3b24bffd67be8fbb",
      "after": "09aba6adc873915a390f528e5de2b6d09ff20ac80291d8f44a903c4014cd5e20"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-6.tsx",
      "before": "13e63cb6e359d1d04c3635f755edc03d33efe20a541ca82b542342f4858d062a",
      "after": "733995b01249086eb963d0a2dcf2740e7c1ec434e0767d8b24a0e3d54fdf7334"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-1.tsx",
      "before": "e28390b71403648d5f388001e67b26314526b6ece16573f142617691efae4a59",
      "after": "2fa662de65f1cf5634f055d74ff18c8c507b143b7f98d5990c9c860b93733b55"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-2.tsx",
      "before": "9dcef47507e64f99d7b5146978d0112a2a3a34bd9d03191a8e0ba813b044dac9",
      "after": "d903deb76c0f3988380144b8ede637aeb717ce1febe34766637ac8a69fc0d9a9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-3.tsx",
      "before": "befeac9150a25c5687ee58205e9c4f35c7afef34f483b8269c77cc33d7850d43",
      "after": "e0aafa125cbb7326cee271f5b077896b43d0daaf6781d89f974cef920edd3d5b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-4.tsx",
      "before": "b6ffa8bd87b17bbdf09cc73c2a9747161acb7be901df2a387d32a09746660dd5",
      "after": "4720322c17bf191ce92460558b128c3fb4c6fb8f9769dd61914b903c3bc69df1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-5.tsx",
      "before": "8d10a63881b7fd571679775b104b54b128366429c472078ff3e95e0beb32d2ab",
      "after": "0b3b1f0ff680e715284b8494f8a41a2054fafbc19776dc20a2057b21b40a8cb7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-6.tsx",
      "before": "f900fece54c13b9c5aa586a052126d9e2da2a9d030262a6c0d429de54369f00b",
      "after": "8e7376b446995e71ad06052374f1e2a1a96074c43152d528ccee6b1e1e55e4b7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-7.tsx",
      "before": "8b17ee6573d52b1a86bb0e3bc2cd2b89a44522545f76e7879c8a4433ea6042cc",
      "after": "7e2dabedcea8fbc3f75a8711fecf1278371bbfd101410e65bbd1f67d05a5f1c2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-1.tsx",
      "before": "0a257b51883edc2ed201314196f96500e3935de073d2e1f028f6ef2ba8b2dfe8",
      "after": "3fd886678323c3d595d57c0a08f1da405fda55a7893d60bd8ff2ca40d7dcba43"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-2.tsx",
      "before": "b2894142edca13c3520a62385fa4089ba9eb7e4c134a903e877b542ce356be5a",
      "after": "ffbc1d61dffd3a1716588189144c76ca2d7817a8218ece52fa6e653811809262"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-3.tsx",
      "before": "bc745b07bed589881cb8b0f561b1873a970bd0af86731eca038f28dca734eee4",
      "after": "2442b1b866f561e4fb577defc7907c24c2ffe7bcc30d1b17732858277c87bbb0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-4.tsx",
      "before": "d83264d2777620237a5e6a8d5e751456b0b2d1dba1c0af242e32c21bd2600507",
      "after": "51147c97605a2eb6653f7fce0070f442313243834d4db725af958c97c1366a86"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-5.tsx",
      "before": "119e6ab818b432227dc6084f6737396ed32514dd0bee90a6a920722ee6df265e",
      "after": "74899ed1f00563c286337ad2578da7a8628ee666588b995d1acbfbb637673242"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-6.tsx",
      "before": "5cfdb3e9069f993ebb61fb250881e48de18de5e90e97f5794e7abdd5f01633f7",
      "after": "7485fca77ae9cbfc5bea5c0e0a083b43d10f28befe4bdb6181e77ec820b01450"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-7.tsx",
      "before": "6c7e1f231483ea89c4c99c68945414e07d31da6e5c9cee7b07fccedcaad0eee0",
      "after": "171d60adafa9a1e7a0f9500d20d157a1cf4c245e2f94567b66940b48839b6e34"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-8.tsx",
      "before": "fa4ae67294879920cc1611f402ee1117594643d674d11188a3b946487ab81bde",
      "after": "445c4167828d8572b49d1b4dd2b4fc00e1d894b745ee8781117f8c52684c5ba9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-1.tsx",
      "before": "ba01d10d91b3e40f8e26039988d1abd1bae4805111c0922ad734b49c02b61f62",
      "after": "f7df3c269c25b495838c0b9854fe0f7cb521c8cf1a32063f6ce6d7fbf0bb6422"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-2.tsx",
      "before": "4f97ca2d93edc520c9bd5db178cc6eb5d02258cbae1740c5b78ed78ade6748a0",
      "after": "ddf3d1df24826ae5c94880aa96557089db4cc5f81e510890bda68187ca80a49a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-3.tsx",
      "before": "0d31251f8d6b59468e5e2b230e91b727a61cf8dc514f103a6c12c6fd2c261cab",
      "after": "c36655ce70bf23bb8895cbb7ba847b9bebedfadb71c2d653d7e5858906271f5f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-4.tsx",
      "before": "f488420f157cda852785457e3e88bef157d0cd9336282093b24f8483ce36e6f1",
      "after": "6c5a62b24a271cc920f259a45adb8afaebb3d9e4dbc83b1e767d81a40a7086f2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-5.tsx",
      "before": "2a990d4b4bcde1e9da10f2957c1047e52420c62e364235ca6c2a332ce14172c2",
      "after": "6ceab6aa70916b0bf59c89251e46f88aee1321e4b800ca1e998a34f90e4d8b4a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-6.tsx",
      "before": "e905878848ad47b6845d94c9cdf662930a5ecd7cd8137989610f78986c3ce9ba",
      "after": "59be4197d7680bdd0e283e9fbf1f80a0ab7da1635d8581888efa1ceb996e2789"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-1.tsx",
      "before": "51b176826e78fe482b2e250a330559d8571621581685d0dddc17fef983215671",
      "after": "7d32dbebe13487bb43e8a879f16ef0ea8cbc204951d3a3d1e7c22d3802d684ba"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-2.tsx",
      "before": "c759f6ad92d9139013ed9c88bd23f8cc84793f85b4a79c6017e66640f02f8b54",
      "after": "6588d88386f7c1e1358646cf9fafa9f9388b1dc750211ada69c55c91c5fcd37e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-3.tsx",
      "before": "697c50f8a9cc81ca5da0c887fd85de7d6a5353f9b9c5418905224e48c8675914",
      "after": "13bf52045083985a4f00d66fdca3a73fd8d8d40b436574c9e69f13f6d4cbde97"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-4.tsx",
      "before": "ee7afded8fac73fffea23dd85376910fe835db0e908411a4b053fcb61705ad88",
      "after": "ad2fa1326c14061d851e41a6aa5e0f640c135f02ab5b4d1416816cdb170e1d2b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-5.tsx",
      "before": "bffe42f11621c171fd86e7b99475e7d534f2b44d4b7431021d379df075eb3eff",
      "after": "388d34703dab90fa1dc7f71deac1349890140737ab18f87c0225876ee5bb59bc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-1.tsx",
      "before": "9e7d435aeb9138a3f4e718a4a1fa8d64bc7d08a304596fc11a1b4d7d82311e86",
      "after": "31e17611cb6a7f74c5f4853591dec8f842f18d4421ab9e0f6ffa0d2d1d22cf8a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-2.tsx",
      "before": "ed4904d0991a76ebc4180e0d803d7aaf7907cc713a2044896644c4bfd810db94",
      "after": "71281ddc8d1974988460fe2342d130a1617a7c8d2889e3292104caddd10db54d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-3.tsx",
      "before": "dec7086ff0801763bb39a1434340cf5f5c4e96faf0873a9ea001140afcaabe63",
      "after": "814cee8e138a40bd03eaa771ede3e36583ebd169f4b847191a8f898c6492ef3b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-1.tsx",
      "before": "c1a4ec067807d330bb5d7a2976b27cd73d2b81d313605d79a4a1fbf8a02b7e9a",
      "after": "396781457690f0d25b73b743b583a323ee644fb6ee3ea33f483ffec518f50d63"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-2.tsx",
      "before": "0844991cd13f3e838df2b990acd58544e71402d12cd1bd2e4bb273fbc1345616",
      "after": "14670fda6877b716d83fc04d873709be31e9844b90ad81f5fc87de0659326bd4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-3.tsx",
      "before": "78097606cacaeb524d48ebdf284b8e064c27518573cdec872572ae7ab5516fc3",
      "after": "e4897574f7d5dd7b864ddc915d4882c2e2994a34723cda1e722fe82c4149f254"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-4.tsx",
      "before": "fb6e2d5548509129cd08ef1cf551cbf29c287055bf563313f2b8b4c02580de30",
      "after": "fdbdf5271abebf369a075c15da9131bc14913d59e438ff4b4c6b1073bf5b41d1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-5.tsx",
      "before": "842805042ce6b34295bae8a5383bbf8bbca341f6d665fdeb44027f030077e212",
      "after": "f1b497db87ff6baf1332b92d53785a22b43a34b96968109b66252dfd61b53fed"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-6.tsx",
      "before": "2e0bbf86d507e09b3d56d5c1279137a2f6f16bde57ca6592d076ded99377d6fa",
      "after": "29930171821d16aaaed2e702297a559f1a1c8051efb7bd85db494498b683d846"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-1.tsx",
      "before": "e01a867d17b73502e11df9d222b9f1272b35c0fbea4797a2616b78217fb698c4",
      "after": "5a6bcd7b924c8227570ee40e8b3fb4ccb56b435ab2ff642898089788de2861ff"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-2.tsx",
      "before": "e481dd373d3ea1f3f72b439250f411b443b3a6a69b816b35e5aa4f502cbea773",
      "after": "fc2129273257c94349be27bdbecde3085f8e02efa03da2576b66f9e4b0e65db8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-3.tsx",
      "before": "fe441fefd2e3e50cd8a6e9d23f4d7e2213e8a567513478a3b31570b78bdaf45e",
      "after": "1980f582ab7c730531bf09b518744c3d2c462d0c9688b15c81342b82883711ad"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-4.tsx",
      "before": "7b2fdc749afd7cb1c932010e8239dc88dc5c6f0f0f82e2ec074248a70e3f016e",
      "after": "0877e1c4d10f3584e881d5830d98efba300be72584cf48621e9b61cc39d77c89"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-5.tsx",
      "before": "75bf5e67f1c23ee90a95bb963506f04358d2bd833f970b79b8c7360f5336b665",
      "after": "88c1cd9fa98cefcb9f819c0c88a218edf71f95d9139988343c75ecae72564b38"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-6.tsx",
      "before": "1a1f7410e28343da3de895658952e1c5986aebfbce42c3a2de7965a5a25f695a",
      "after": "0df37938d0ddc2e1cbabb2af213122c038f1c3ce99a7576229b573e3e43f6082"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-1.tsx",
      "before": "29d5a20889a098334c11f79a6434f8c5a81b9aad5d996ac112c74149f4f9ff51",
      "after": "c0b6679bde7ad3f8ef9acca764d22171e89964b6f6b43f6f5aaf7ed286d37f77"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-2.tsx",
      "before": "abc85932344938d40f2e5375329eeb5cc4047e7484a115d0d9e4eaac689ddf02",
      "after": "39005b32a6d43b36d47c28d986928977293ca4cf4bb05a1957127f06a23a92c4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-3.tsx",
      "before": "9acb927a0aa0f4c1821c2c4119e35f0343d1fc41c86d4ef6d0978158ada2f448",
      "after": "4ff4a88a5e7a15426115b8397db766bd796b84e52ae05bed51315472ecc82ba9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-4.tsx",
      "before": "5c2e7fd22d48bf98ee145d03cb7350bffe7ed4f768d1d12e6d2d0704f2a0b8a9",
      "after": "e664ed4b186432d018cc4782c4f6c93238620ae49536bf6e243242f2e7bdd8f3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-1.tsx",
      "before": "ba68bd4df6055404842b2e15170c73aa840bcf41a4b5d79109cd77648abb0af1",
      "after": "8263cf1f053e2ef7250e0c48434c983bb9d6f3c02ab7ddedf61bb896d90d5e8f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-2.tsx",
      "before": "2bc0362db6fc57eda63636bb1d5f0d4bf574be5d3c709548acf5386507139b4e",
      "after": "3ae10ecf0210cd4dbd72594e6e9cd3d6628b98bd83d77a7695d6f1db005bc7f3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-3.tsx",
      "before": "4a4c93329123f029952a209248f50531233c5185e5931b679f49a48ef6d442d9",
      "after": "fe60b29150213fcc980bdd6cd5c1ef6e0ab6b8be3a2a20d00406db3c2df36507"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-4.tsx",
      "before": "665139a9ac28d83df8162f69727061420e64a9de1bc8fcf500c5b7bb0f570466",
      "after": "e7d9f52e79b3066914ef7a5f580d3b4ffff212ba7f8537e3474c3e352073b3b8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-5.tsx",
      "before": "894f7886da2cf6aa2a68c92f2b6a9d805d52c47cd533f3a585b0e8a4a0fff10d",
      "after": "ec01d5cd35f6633b402789354d25833ac493b962e5e8d0abb260e23d6bdfad83"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-6.tsx",
      "before": "29119523a1ef952673eb4474353709e2661e2dafb7905c2bde1c46995dfa37e2",
      "after": "4d07a7d500e396c561dc0db071c72f1a39165a3ecade3c5acc51beb6c7b43348"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-1.tsx",
      "before": "7d9174378febca9e565775b84d75cea6c96b72466e660a8ccef6e6ec22389daa",
      "after": "4dd645e2a8f5b7ca1ba1ef083adbff0978968ec2972183b05ebee3426197814a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-10.tsx",
      "before": "e0e7858f80cd6af0457aaf07df3bc17825435f4230e400e6b44b0be93fc41bfd",
      "after": "5648a4714f7e6c2de7ff5c32daccb691eb004ff66de9b302f709cc97c944e47e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-11.tsx",
      "before": "20b6af39cb9902d379944fac023febf3d6bd0f4def97b4a38402442e93adca15",
      "after": "82b879a1b762eb301755a89b60bc55a1186856620f144e0c9dcf4e06ff901cee"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-2.tsx",
      "before": "7da14ae653d7dc469bc9d23a200182bad060212e4b84e43632fb96053bcf5d5b",
      "after": "7edee753d873ad4b24085febeb19d704800343bbab60141fc3c7d86d4f292be3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-3.tsx",
      "before": "a06f986d9789e317328d1d2ccd67a36dc6c4eff34082abc49811afb0e7733fca",
      "after": "ed8ee60d50292105d3210fbaa0d9ca583f198181d56ca378b8b5191d86bd0c97"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-4.tsx",
      "before": "24d8cf7651a842ac25a72c0301d0439b8a97e8c3200fced818030368664ea82b",
      "after": "92c4c2b63ffe3ff2389ee6466a7d86da0077f861da469ef3ccf6d1bfaf144279"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-5.tsx",
      "before": "fde5d68746c307c5c7099cd5e555bc1e5cb81a0549dc1ad57d3468e03b5410b9",
      "after": "84e0d18ef784372aa1926c181abeaa1b25e6b2feb2c725659b40468c6905e2bb"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-6.tsx",
      "before": "b53cc6eb30032c388dc20ba810296c9b884ffef3f5f94cd12e24be09385770eb",
      "after": "ec45b7aff5f8617e2a19ffd10891af9966bffe5c70ab2e33b72db0cb8930d292"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-7.tsx",
      "before": "6354ed872f0218b0577ffce91ce6c7a087869ae02f18e8bf795e8f6f43457104",
      "after": "882c5aba96fc99ba1a503f57b4c69b5d821da88b3c2b78103dde3a3c051c5af4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-8.tsx",
      "before": "0915967f59d17445116c91ce3961328a8ac3f375ca26f4c0bfaf4b2d7a0af683",
      "after": "5c0b51fffc13258a43a7ff10e2f525d6d19b238826ed5293292932fcb92fa9f4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-9.tsx",
      "before": "56cf4b04dc63653cee36541d60b17402c34615049629b1f472cd1291bd7c0723",
      "after": "7b24726369cd24ce875dd254cf9551176d00236ba41dfedf836c56d5667a9a4b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-1.tsx",
      "before": "0b24e638245435d7d99a6e65e94f19093e52b5ccff2a50d7168cf7f44a778405",
      "after": "2f009e0a3a88c64ab4ed854d6c6a967dce9d394e92574adbcef800c15dc05f14"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-2.tsx",
      "before": "2a2df558fbe874a5b6f077024693ec4b1416e2ae1f7e85d51593176482897ede",
      "after": "223d693036c3dbd7da559e3f8a5adbe206c26acdb31e578a434c311c683cd263"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-3.tsx",
      "before": "df33f30f0c883dc3c58ebcfd955f1f6253980e1baec09fe49fdd16982ae2c048",
      "after": "c628cf6a3c1ec70b11615283563b4fe007a95ad1d47031e2afc743de25b922dd"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-4.tsx",
      "before": "5a2135f6e231770dfd651b02500ef5601bee1b269f4cd3500b06aedabddf4f8a",
      "after": "191f0a5bac88a53d01740e5447b06d95df83edbaac655de966ad523f55df8274"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-5.tsx",
      "before": "391b2e4d03dd5e2d6f02f7635ac195a8b47d94f3ed69066f7d7670caf2f0b75e",
      "after": "3f8019a87c0762b7b70eb196119ed59a4e2d85faa1a32970b4dfcfe4009e6a80"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-6.tsx",
      "before": "ceda1c4401c63a6822f69e49d82026405f28675017c23a992177aff667e1fad9",
      "after": "69f591625320007a8ca1b529ed17d30563ab726be1ccf9cc0e196711f028bc6a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-7.tsx",
      "before": "e013560843d1b2e7430682d74a4452a2350c70bc6072f5481270e2c72de76db6",
      "after": "08ff0a0c3070963d807dfff2431791202dc627abd114dec801802a501281f157"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "5b5a5321a42ebdf79edf86cea5771120f1417ee4618a7e91d5e27d1fb8e10948",
      "after": "08cfbde01810335255dfef6e80e709d6c1d0540bc7a4a767c1a60dcf61487d5f"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "46007df05e577bbc570e776c7f84873dadb948293c5c7f5fcdd56d30a31814cf",
      "after": "4602a8097f453a304794abaa50d2b2ffd8e15ceeafddbc18984b5e31950f60f3"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/detail-page.md",
      "before": "4310c2e563616fedf2790cfd1c6696585b9ebdec0c898978df550aab7ec63f7c",
      "after": "aca20ec515e2158182bcce918472291b1b0e9c38549ea137f1c617b39ddaa231"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.md",
      "before": "6c3029412d42e0c9d4cc01c1e359475b629f226899c8fcbab535c319107b7d35",
      "after": "144ca5ba9c9244e8d3f988d80305b92dbf479c687d68a2d34e94d9b33bc5f5be"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.tsx",
      "before": "c7559966c669a5786f1ca1fe2ec3d47d2ec7eebd85ca96d3bd4bbea15a969dbf",
      "after": "da5d705d8cb745b306f592ec7eca19b16ce041d05a3e63555780cf581d0af80c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.md",
      "before": "afa9bb690464676dbc9240f53c6c3ed1b0ab205933bb39075dc6620b8b31087b",
      "after": "a77e0b663e0f67b6b5ab167fc5f4ecbd50a0fca4c5cf019ba1945d4421bfb948"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "fa47fb257b47308971dad0f6b03a099967dc15149f38c481ce9919cf7781461b",
      "after": "d78c187928114bd4b73463dcdca6f495272c5e2e61f51d05b65ac60e9d733041"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "0fc13844fed92a6eaf5a2025fbb99aefb67978b1d6edd6aa37b32d4f989f562b",
      "after": "43b6e1f1045739812db75f819c2b9f87ce09ae779baed38de3656b34dee31f9f"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "1a4c716b3b955fb5cff6affa54d9922f6fadee7b60067d860e969661f28da687",
      "after": "cad8bcb998e57c47901742ddc3e1ba7f75baac7b914ffbc60fcc5cde7bf80400"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/layout-templates/list-view/list-view.md",
      "before": "225d5fb62b68cae1b58090959ed9c2155bd186a54a00218037e760d48a923c2e",
      "after": "3116252e46ebdf7f1ee025dbad081ab266c215742bbfb0ffbe30bb182567d00a"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/source.json",
      "before": "5697453e87a21a17ffd0800984317c154656c65d22e2f62611fb8c07ca378da2",
      "after": "55f6d285807f38818838f5974dc3e02236385a9331ee1c779832a3df73b07bf8"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/components/Example.astro",
      "before": "426636d3ad73e7e02f4a4ea10b6668504d69fb7159f4e41f3b3e0566b276e857",
      "after": "a56f855bff60427b5471f762210d84b0f37fa582aaa209a689aa2afe1db86261"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes/wfm-users-list.astro",
      "before": "6724b9fc7e7f85e54f154d2c9b1700f75bb17d6881b1faeddb855abdc7f7ffef",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/reference/components/wfm/[slug].astro",
      "before": "d5b0ce59248174642fad32bdf1798fc1a2f08b742d6b46941ac2d505e9152934",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "8220e007f37f944f134d71bb67dd2c2d6df56aac8d408d5d8b9271bf8ac06f4d",
      "after": "162f8b6f0bf062142307fb21a32ea683153e0875798bcbf980ed68421d27972c"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "e9a203ebb992b493c0793bbe5f96d98945b46146aa09568e82a8a9ec7ba58790",
      "after": "df75359834548ab8cb49c237ee341443e22aa88c373bfccebc28fc1768da6a49"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "3522aa4b9bc3abfe2212e8ade871a345232bc6732907dc8ce4ec44b60673b284",
      "after": "1cd9b5bcfb54e6339dc98e6a9db476539c00baf5f8c9e070891403a38fb1bbdd"
    },
    {
      "path": "packages/talkdesk-cobalt/test/form-field-browser.test.mjs",
      "before": null,
      "after": "df70868be41973055043d30093cdfe3a8883663719a53a7ca522cb946b4e80bc"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "b9000db66426cacd88b23df55d371c5b9bf4d2a30217224d069c7f1359c28e19",
      "after": "7b6d5668e88e3bf400e50d89a4e4daf1479ca2b5ee3c480ac6c24c8995f05f47"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "e2e107c3a77fb06d5814537719cd77516e4fa315f713e42ac7a351fa4580d11b",
      "after": "aac8fb54abfddf05a3bacd17120a56750cda9473e738470e0a4b502bd7ad81ba"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-lookup.mjs",
      "before": "565b133040ae7d34cda6976c2f2440433ef1b5f38244303aac55e0fa0d7e234c",
      "after": "e0851b36e8c8b10a1bbe6e1548c4aaeecdac9535e054869262b05eeadde407ee"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "c37191a133c062a86666073b37b1260773f1697461cbf9de25f5ae4557408cf6",
      "after": "8eade06485de7266326a2f2fe9bb97310199c52aa899ab15d3405248dfcd7dd2"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-source-templates.mjs",
      "before": null,
      "after": "6585fca5a1a23ab52d2b9785c425dbf0cc645a9e2761e9f62ce890bed4ce20cc"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/component-index.mjs",
      "before": "f708daabb20462b64579a9fe1e195b4dc1a7b701f8b9d4f288132f4daba78c53",
      "after": "1ee6e21def1544c27d0eb73cff59d71c43f06c9c7a1913206e6b0ffcd164d44b"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/content.mjs",
      "before": "0ea0f092b31c1c85b9ad9a7a6b109c8c57c4ea3eb0d6d315d27ea84d9a32fd3f",
      "after": "27da5369e0259bd60039c85b27d2e9b548a12222c1a804d41c18a5cb053f54de"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "b06a724aa8e7ea129ec5a989aa93ab9648abce43a48d534ab5db4b2b629abe13",
      "after": "b5c6293a0803a728927b87d222b62e71f031b8675ab8723f3fc09c0f8f479fe6"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/import-examples.mjs",
      "before": "019c4bff573816c648d9c7949ccdb61cccbe8c54959b45d3055aec80fb94bf3e",
      "after": "cfddbf3756f7c7f4037eba9e69ae8f1fb59d71d3aa0283c7aaa6abf5e386e476"
    }
  ]
}
```

Completed-At: 2026-11-14T14:55:09.143384+00:00
