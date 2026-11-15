# Talkdesk Cobalt authoring module

This package owns the local Talkdesk design guidance, pinned Workspace shell, general-purpose Cobalt Extensions, executable examples and page recipes. The HTML Design Skill consumes its exported resources; Astro renders the same documentation and example files. Normal prototype creation requires no `cobalt-ai-docs` checkout. Talkdesk npm installation requires the private registry, and the official shell still loads theme/font resources from Talkdesk's CDN.

## Source ownership

| Directory | Maintained content |
| --- | --- |
| `templates/vendor/workspace-shell/` | Unmodified official `ai-docs` shell snapshot; `templates/source.json` records revision and hashes |
| `templates/project/`, `templates/chrome/`, `tools/cobalt-shell-adapter.mjs` | Our project setup, multiple Dock apps and review controls; adapters change the generated copy |
| `reference/content/` | Migrated Cobalt Markdown, registry and referenced images; `reference/source.json` records provenance and explicit adaptations |
| `components/extensions/src/` | Maintained component implementation upgraded to the pinned local Cobalt registry; copy implementations into their project and use relative imports |
| `content/components/extensions/*.mdx` | Component purpose, API, states, usage and qualifications; `<Example id="…" />` references executable source |
| `examples/extensions/*.tsx` | Runnable usage examples shared by the website, AI reference and generated projects |
| `recipes/` | Maintained list/detail/form/Insights/active-call compositions, supporting sample data and the compact users workflow; `catalog.json` owns intent and integration limits |
| `vendor/wfm-ui-components/` | Original WFM code and docs, unchanged; `wfm-source.json` records provenance |
| `skill/references/` | Local Design workflow and reference index |
| `registry/authoring.json` | Generated component/example/recipe/style index; never edit by hand |
| `site/`, `demos/` | Astro presentation and isolated React 18 demo renderer |

The selected style's design contract lives in `../design-data/styles/talkdesk-cobalt/DESIGN.md`. Generic Design requirement discovery, layout review and evidence rules stay in the shared Skill. No upstream repository is modified.

## AI authoring contract

The primary consumer is the AI creating a business page. The exported `AI-INDEX.md` is its entry; `registry/authoring.json` joins component purposes, exact source/API paths, core/marketplace package availability, migrated example compile qualifications, recipe dependencies and covered states. The read-only `cobalt-lookup.mjs` bounds search results and resolves an ID to actual local source/API paths, so models need not load the whole reference registry. It is bundled as an HTML Skill script and copied into generated projects. Models read the relevant API and source after selecting a match. The extension `documentation` field is relative to `content/`; `aiDocumentation` and other source paths use the bundle root. `pathBases` records that distinction. Style source paths belong to design-data; resolve a style through its tool ID instead of looking for those files in the content bundle.

`recipes/catalog.json` describes purpose, integration and limits; the generator derives each recipe's default export, imports, supporting source paths and dependency list from TSX. It produces adjacent Markdown contracts. The full List page uses Extensions BasicTable and marketplace Toolbar, with page-owned data/selection and table-owned column rendering, sort controls, pagination and loading/error/empty rendering. Detail/form templates keep their original design qualifications. Migrated template pages link the maintained executable source instead of duplicating code. Old API examples retain failed-compilation flags; AI guidance explicitly forbids treating those snippets as working templates.

New projects carry `AI-INDEX.md`, the searchable registry, linked local reference content, component READMEs and recipe contracts. Source and recipe paths/imports are rebased to project locations. `--read-source` returns the complete selected component code and follows its local imports before adaptation. No documentation checkout is needed. Automated checks verify this retrieval graph, dependencies, compilation and browser behavior; they do not certify every model's understanding or every copied upstream API example. Astro is a human-facing view over these same sources.

## Development and documentation

From the repository's `packages/` directory, run `bun install --frozen-lockfile`. Then from this package:

```sh
bun run docs:dev
bun run docs:build
bun run test:unit
bun run test:browser
```

The dev command generates content and builds the demo iframe bundle before starting Astro. Use `astro dev --ignore-lock` when an agent environment automatically backgrounds the CLI. MDX/prose changes use Astro live reload; rerun the command after changing demo code or adding a source file. The static site is `site/dist/`; `/recipes/` lists the runnable page recipes and each recipe has its own page. A persistent left navigation groups Cobalt Extensions/core/marketplace components, foundations, patterns, Workspace and styles. Search filters that navigation. Below 960px it becomes a keyboard-accessible drawer. Top-bar controls persist light/dark/system appearance and the document accent; examples follow the page scheme unless individually overridden. Preview/Code tabs expose the live component and its exact source. Document accent choices do not recolor the Cobalt implementation inside the preview iframe. Component pages show API guidance, interactive examples with light/dark selection and the exact example source. Cobalt reference snippets retain their original draft/known-gap qualifications; they are not all standalone demos.

For wrapper implementation changes, also run `yarn install --frozen-lockfile`, `yarn typecheck`, `yarn test`, `yarn build` and `yarn test:browser` in `components/extensions/`. Its lockfile pins that independently testable package. Run `bun run docs:build` to typecheck and rebuild all migrated examples against the pinned versions. The WFM migration also fixes table-width shrinkage and repeated self-measurement in unconstrained layouts. It corrected old example typing, renamed Tag exports, calendar weekday values, invalid icon names and stale wrapper props; the original snapshot remains available for comparison. `tools/import-examples.mjs` is a one-time migration helper and refuses to overwrite maintained examples.

Component folders contain generated `README.md` files with purpose, exports, API links and runnable example links. `components/extensions/INDEX.md` is the human-readable search entry; `registry/authoring.json` includes descriptions, keywords and README paths for AI lookup. `tools/content.mjs` derives both from authored MDX and source exports, so API rules have one owner. Generated projects include these indexes and their linked documentation.

Cobalt Extensions are source templates, never an npm dependency. AI must read the full selected implementation/types/styles/local imports, copy the source tree to `src/components/cobalt-extensions/`, adapt it there, then use relative imports. Never install `@openpencil/cobalt-extensions`, add a file dependency/package wrapper or alias it. The `components/extensions/package.json` belongs only to the maintainer test harness and is not exported. Official `@talkdesk/*`/React dependencies are listed separately in generated `dependencies.json`. Source origin records retain WFM provenance; no old project package/path/ID compatibility is provided.

## Runtime and project export

`bun run bundle:build` assembles the existing `packages/dsh-node-runtime/skills/synapse-design-html/` payload. Existing paths remain `scripts/cobalt-project.mjs`, `templates/cobalt/`, `references/cobalt-workspace.md` and `cobalt-reference/`. Component sources, MDX, examples and recipes are local Skill resources. `cobalt-reference/bundle.json` contains a deterministic content revision and SHA-256 file index, separately from package versions. The runtime staging tool exports the module again into the verified SS payload.

The project helper's `create` command copies the shell, the complete `src/components/cobalt-extensions/` source tree, `src/recipes/` and `examples/`. Its generated `package.json` contains only actual official/runtime dependencies; the copied component directory has no package.json. `copy-source --out <project>` atomically copies just the source templates and dependency list for standalone/existing apps, without a shell, dependency installation or package.json edits. Existing source directories are never replaced. `add` only registers new apps and pages; it preserves authored pages and the project's existing dependency snapshot. See `skill/references/cobalt-workspace.md` for the app specification and scenario hook. Prototype scenario selectors belong in the top review toolbar, never inside business pages.

## Updating content

Edit the owning source above, then run the focused component checks, `docs:build`, `test:unit`, `test:browser` and `bundle:build`. MDX and example edits regenerate the plain AI references and registry; do not edit those generated extension Markdown pages. Documentation-only edits do not require changing a component version. Rebuild and stage the runtime to update a locally installed SS instance; deployed static documentation can be rebuilt separately.

For an upstream refresh, explicitly select a revision and compare it with `reference/source.json` or `templates/source.json`. Import the approved documents/assets or pristine shell files, regenerate hashes and record each local document adaptation; run the provenance tests and real browser acceptance before staging. Keep shell adaptations in our adapter. For a WFM refresh, compare with `wfm-source.json`, port changes into the maintained component, MDX and example owners, then update provenance and both dependency lockfiles when versions change. Never copy old dependencies over the upgraded baseline.

Remote content refresh is not implemented. `bundle.json` format/requirements/revision fields leave a compatibility boundary for a later data-only refresh; executable tools and component code currently travel in the locally verified runtime. An installed runtime continues to work without contacting a documentation service.

Workspace prototypes use pnpm 11.7.0 (`pnpm install`, `pnpm run dev`, `pnpm run build`). The generated workspace settings keep React 18 explicit, warn on legacy Cobalt peer ranges and allow esbuild. The immutable shell snapshot is adapted only in generated copies; owned CSS centers collapsed Dock icons. BasicTable has no decorative outer card or radius; both list recipes keep table edges flush and inset other regions independently. The separate component maintainer harness retains its own lockfile and is never copied into a prototype.

The owned `templates/project/review-toolbar*` and `review-dropdown.tsx` supply responsive prototype-only controls. The shell adapter redirects the copied PrototypeBar to that runtime; no upstream toolbar file is edited. The companion owns accessible-name and test-ID guidance for dimensions, scenarios and Feature flags.

Prototype review controls use 36px desktop triggers and 44px narrow-screen touch controls in a 56px bar, without a leading Prototype wordmark/icon. Accessible names and prototype-* locators are independent of visual density.

New Workspace projects apply the pinned Atlas redesign through owned `templates/chrome/` sources. Their source manifest records Atlas provenance separately from the immutable ai-docs input. The adapter updates presentation, layout geometry and accessible locators while retaining SDK stand-ins and review controls. No new-UI flag or Atlas service dependency is introduced. Small prototype windows use compact search below the production 414px minimum. `add` preserves existing shells. See `skill/references/cobalt/workspace-chrome.md` for the geometry and review contract.

Content generation and runtime staging regenerate shared authoring indexes. Complete builds/exports before starting readers or browser checks; run combined runtime packaging/scaffold tests with `--test-concurrency=1` because packaging also exports those resources.

Atlas title-bar primitives and their CSS are copied byte-for-byte from the pinned revision under `templates/vendor/atlas-titlebar/`, with per-file hashes checked before project publication. Owned trigger compositions retain mock menus/actions while using those primitives. Cobalt Button supplies all control colors and states; the adapter styles only shell geometry. The official Tooltip and classnames dependencies are declared, not shimmed.

The pinned Atlas frame imports Tag v2 by default; the generated copy changes only that import to the named Tag export required by Cobalt v3. Original primitive bytes and hashes remain intact, and `primitiveAdaptations` records this API-only adjustment.

The Echart insights recipe uses Apache echarts 6.0.0 and Cobalt controls, with local sample predictions, agent filters and Summary. Recipe indexing includes support-file imports and CSS so AI can retrieve the complete source closure. List page uses the local AppPageHeader, a draft filter SidePanel and BasicTable minTableWidth; pagination is outside both row scrolling and horizontal column scrolling. The review Phone preset is fixed at 390 × 844. Notifications show compact, theme-aware sample history rows.

Insights uses the native @talkdesk/cobalt-react-selection-group for Day/Week/Month, an 8px date-to-navigation gap and the copied Extensions MultiDropdown for Agent selection. Applied Agent tags and the +N overflow tag share core Tag size small; retain the count button accessibility while leaving its surface to Tag.

Users list headers reuse copied AppPageHeader and Typography page-title/body semantics. The Users Filters trigger is medium (40px); the compact Insights toolbar keeps its small trigger. FormField leaves 8px below labels and gives direct controls a 20px line-height so checkboxes retain their painted height. Verify these dimensions in the rendered page and modal, including both schemes.

Compact Users title/description groups use copied Typography page-title with native Cobalt scale medium (24px/32px) and body text in a Flex gap 0 stack. Preserve h1 semantics and center the complete text group with actions; inspect the visible typography spacing rather than relying only on a nominal gap value.

Insights header actions use native SplitButton, chevron_down and core Popover for CSV/JSON sample exports. Ask Copilot is a native transparent action before Export and opens a native ModalPanel with ChatBubble messages and a fixed 120-character Textarea composer. Replies are local examples; Enter sends and Shift+Enter inserts a newline. Preserve insights-* locators, keyboard/focus behavior and both schemes when adapting.

The Active call recipe reproduces the reference Conversations/Callbacks surface with Cobalt components and glyphs, a bounded queue/content layout and pinned call controls. Its local Hold/Mute/Recording, keypad, callback and confirmation workflows are examples; the embedding application owns authorized telephony and persistence. Read `recipes/active-call.md` and copy all listed support sources.
