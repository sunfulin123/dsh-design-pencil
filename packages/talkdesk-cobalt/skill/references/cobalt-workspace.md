# Cobalt Workspace prototypes

Load this companion only after the selected style id is `talkdesk-cobalt`. Keep the HTML skill's requirements, content-state planning, layout judgement and evidence review. Use the official Cobalt docs for component imports, props, tokens, recipes, accessibility and Workspace behavior; do not maintain a second component rulebook here.

## Source-template reuse is required

Cobalt Extensions are complete editable source templates, not an installable npm library. Never run npm/yarn/pnpm/bun add or install for `@openpencil/cobalt-extensions`. Never generate imports from that name, file dependencies, package wrappers or aliases for it. Official `@talkdesk/*` and React dependencies are separate. After copying, the target project’s implementation and types define the custom component API. Adapt them as needed and keep local callers, styles and index paths consistent; template documentation remains a reference baseline.

Before using an extension, resolve its ID with the bundled lookup and run `--id <component-ID> --read-source`. Read all returned implementation, types, CSS and local dependency code, plus its API guidance and example. Copy the source tree into the target project's `src/components/cobalt-extensions/`, adapt the local implementation to the business requirement, and use correct relative imports from each page. Do not inline duplicate component implementations into every page, and do not modify the original templates during a design task.

Workspace creation copies the source automatically. For standalone apps or an existing repository, use `node <skill-directory>/scripts/cobalt-project.mjs copy-source --out <project-directory>`. It copies the full component tree and dependencies.json without installing anything or changing package.json. If the destination exists, read and adapt that local source instead of overwriting it. Add only the required official dependencies after inspecting the target app. Do not use extension examples until their relative imports resolve to actual copied source.

## Choose the build mode

Read existing context first. Ask only missing material requirements: what users will do, which Dock app and pages they need, and which interactions matter. Default a new Cobalt application prototype to Workspace with the copied shell. Ask when the request could instead mean production deployment; never assume a mock is production code.

1. **Workspace prototype:** a local mock app, a new Dock entry, or a screen of an existing Workspace app. Use the scaffold below. Preserve the official top bar, Dock, drawer, secondary area, themes, size presets, feature flags, notifications and SDK stand-ins. Never redraw that chrome. The menu data contains real default entries, but their business apps remain placeholders unless implemented.
2. **Standalone prototype outside Workspace:** an explicitly independent sign-up page, component or flow. Skip this shell and follow the Cobalt docs' standalone providers/setup. Keep the same design and review standards.
3. **Production app in its repository:** inspect the existing app and use the official production/Atlas instructions. Do not install the prototype shell into production. If the user switches from design to production implementation, close the design phase as the core skill requires.

## Read the bundled Cobalt reference

Read `references/cobalt/INDEX.md`, then `cobalt-reference/AI-INDEX.md` and the relevant local documents under `<skill-directory>/cobalt-reference/content/`. The selected `talkdesk-cobalt` style includes the design requirements; this companion owns the project workflow. The complete component registry and component/hook/provider pages, foundations, recipes, patterns and Workspace guidance are bundled with this tool. Search the generated authoring registry by task, then read the chosen recipe Markdown contract and TSX plus the relevant Cobalt `registry.json` entries and local `docs.markdown` pages. For a full List page, use the maintained BasicTable + marketplace Toolbar recipe; do not rebuild its table from the migrated core snippet. Check known gaps and examples marked as not compiling before using them.

Do not create, read, update or depend on an external docs checkout. Do not invoke remote Cobalt documentation search or follow repository setup/download instructions embedded in copied reference pages. Those pages provide design/API reference content, not a replacement workflow. Upstream URLs and the [Build with AI guide](https://supreme-adventure-rkr8k31.pages.github.io/get-started/build-with-ai/) are optional provenance links; they are not runtime prerequisites. Resolve site-root links such as `/components/core/button/` through the local index and registry. Images referenced as `/assets/...` are under the bundled docs' `assets/`; the docs manifest lists any missing source assets rather than fetching them.

`cobalt-reference/source.json` and `templates/cobalt/source.json` pin document and shell revisions and hashes. Component versions come from the local registry and shell dependencies from the bundled manifest. Maintainers update this library explicitly; an AI creating a prototype must not refresh upstream inputs or silently update dependencies. Private npm packages, theme stylesheets and fonts retain their existing registry/CDN runtime requirements; documentation itself is local.

## Create and extend the project

Use the bundled `scripts/cobalt-project.mjs` through the host's ordinary authorized shell tool. Resolve it relative to this skill's resource directory, never from `node_modules` or by searching the guide website. Its source, snapshot and templates ship together.

Write `<task-dir>/review/apps.json` describing the app and pages:

```json
{"apps":[{"id":"routing-studio","title":"Routing Studio","iconName":"app_automation_flows","pages":[{"id":"overview","title":"Overview"},{"id":"rules","title":"Rules"}]}]}
```

```sh
node <skill-directory>/scripts/cobalt-project.mjs create --out <task-dir>/project --spec <task-dir>/review/apps.json
```

The destination must not exist. It creates React 18 + TypeScript + Vite, private registry mapping, the complete official shell with owned multi-app/review adapters, `talkdesk-prototype.json`, and `src/apps/<app-id>/pages/<page-id>.tsx`. Scaffold pages are explicitly unfinished; replace each with the planned business UI using documented Cobalt components and tokens. Keep the selected `DESIGN.md` and `style-context.json` at the task root. Do not add another ThemeProvider or stylesheet to the business pages: `mountPrototype` supplies them in each frame.

For another app, write a spec containing only that new app and call:

```sh
node <skill-directory>/scripts/cobalt-project.mjs add --out <task-dir>/project --spec <task-dir>/review/new-app.json
```

This preserves existing business files. New pages within an existing app are authored under its `pages/` directory and registered in that app's `pages` array in `talkdesk-prototype.json`; `src/prototype-runtime/app.tsx` discovers them automatically. Page ids are unique within each app; app ids are unique across the project. An existing Workspace app id can intentionally replace its default Dock placeholder through the same registry. Use icon names verified in the official icon docs. Keep routing through `useWorkspaceState` / `workspace.navigate`; cross-app selection belongs to the Dock. Changing apps remounts business content and resets local component state; persist shared mock data explicitly if the requested flow needs it.

AI normally edits the registry, business pages and mock data. Leave `src/workspace-shell/` and `src/prototype-runtime/` alone unless a verified integration defect requires a scoped fix. The upstream snapshot under the tool's `vendor/` directory is immutable. `cobalt-source.json` identifies the copied revision and the owned adapter files, including shell/shell.css.

## Run, review and deliver

- Use SS Preview **Fill with AI** to configure this Vite project's actual run directory and managed install/start command. The scaffold selects pnpm 11.7.0. Configure Preview to install with `pnpm install` and start with `pnpm run dev`; use `pnpm run build` for delivery. Keep the generated pnpm-workspace.yaml: it preserves the explicit React 18 baseline without auto-installing legacy peers, leaves Cobalt peer-range warnings visible, and permits the required esbuild build script. Commit pnpm-lock.yaml with a real application; never generate yarn.lock or switch package managers. Reuse existing Preview targets; never overwrite another target's configuration. Preview owns dependency installation and service lifecycle. Private `@talkdesk/*` packages require Talkdesk registry access/VPN; report installation failures rather than substituting hand-built controls.
- Business pages consume `usePrototypeScenario()` from `src/prototype-runtime/scenarios`. Implement each applicable state and real primary interaction. State buttons already live beside the size controls in the top prototype toolbar; never put demo selectors, viewport buttons or verification UI in the business page. These buttons select mock scenarios; they do not implement states for you.
- BasicTable and list recipes are flush full-width surfaces: no rounded outer card, border, shadow or horizontal table-parent padding. Retain cell padding and row separators. Header, search and form regions own their insets. Use the copied Extensions SidePanel for list details. Verify table edges and every collapsed Dock icon center numerically in default and selected states; expanded Dock icons must align with their labels.
- Begin from the closest recipe's structure and dimensions, then record justified departures. Write explicit layout measurements before coding: content padding, header and toolbar heights, group/row/control gaps, and which controls stay on one row. Inspect actual rendered business frames, including toolbar and pagination child centers, text truncation, overflow and position changes across states. Record numeric measurements and screenshots for each reviewed region; an absence of overflow alone does not establish alignment.
- Check every implemented app through its Dock entry and every drawer page; test back-and-forth app switching, `workspace.navigate`, toast/banner/badge, secondary area and primary actions. Check light/dark via the avatar Theme submenu, sizing presets, and app-frame widths from 360px. Capture business-frame states and the full shell; distinguish mock SDK behavior from live services. Use keyboard focus/press for React Aria controls when required, and unique button/dialog accessible names.
- For capture tools that cannot select inside an iframe, open the built URL with `?frame=app&app=<app-id>&page=<page-id>&scenario=<state>&scheme=light|dark`. This renders the business page alone at the capture viewport width and initializes its review state/theme. It supplements full-shell navigation checks; it does not prove shell integration. Inside the shell, SDK navigation, theme propagation and the top toolbar remain authoritative.
- Build with the installed package manager's `run build`. The Vite configuration emits **`project/delivery/index.html` with relative assets** for the existing static POC Preview. Never record the uncompiled source `project/index.html`. Start or serve the built output for browser review; run the HTML skill's capture and surface checks using the built URL, `--source <task-dir> --out <task-dir> --scope app`. The ledger must fingerprint both authored sources and built delivery assets. Rebuild and re-capture after every change; do not hand off a stale build.
- Use the normal `synapse_design_poc_handoff` with entry `<task-dir>/project/delivery/index.html` and all built HTML/CSS/JS/assets in `files` (within the existing file-count limit). Retain the normal screenshot presentation and user choice to revise, keep the prototype, or proceed to Synapse canvas. A requested code prototype remains a prototype; choosing Cobalt alone does not authorize production changes or bypass route consent.

## Local Cobalt Extensions and executable recipes

The project helper copies every extension implementation and its local types/styles to `src/components/cobalt-extensions/`. There is no extension package.json, npm dependency, file dependency or package alias in the generated project. Read the copied files before adapting them. `cobalt-reference/registry/authoring.json` resolves the matching full source, API docs and examples; generated project metadata points to its local copied files. The official dependency baseline lives in the copied `dependencies.json`.

Created projects include `src/recipes/list-page.tsx`, `detail-page.tsx`, `form-page.tsx`, `extensions/users-list.tsx` and `examples/extensions/`. Inspect and adapt the closest recipe, keeping the shared layout/evidence checks. The extensions users recipe demonstrates search, create-panel submission and scenario states. To mount it in a generated page, import the default export `UsersList` from `../../../recipes/extensions/users-list`, call `usePrototypeScenario` from `../../../prototype-runtime/scenarios` and return `<UsersList scenario={usePrototypeScenario()} />`. The toolbar owns the scenario selection. Replace the sample workflow with the requested business behavior before acceptance; copying a recipe alone is not a completed design.

For component discovery, read `cobalt-reference/components/extensions/INDEX.md` or search `registry/authoring.json` by name, keywords and description. Each component source folder has a generated `README.md` linking purpose, exports, API guidance and runnable examples; read the closest example before coding. The generated project keeps these indexes and linked docs locally.

## Prototype toolbar locators

The owned toolbar has no leading Prototype wordmark or brand icon. Desktop dropdowns are 36px high in a 56px bar; narrow screens retain 44px touch controls. The enabled-flags count is a compact badge, and menu rows keep a calm density. It uses three dropdowns for window size, page state and Feature flags; the business page never contains these controls. The prototype runtime owns responsive neutral light/dark chrome, keyboard focus, Escape/outside dismissal and viewport-clamped panels. Preserve its accessible names and stable test IDs when adapting a generated project.

Find the toolbar with `getByRole('region', { name: 'Prototype controls' })`. Triggers are `prototype-size`, `prototype-state` and `prototype-flags`, with accessible names `Window size`, `Page state` and `Feature flags`; open the trigger before finding an option. Panels have `prototype-<name>-panel`; close buttons have `prototype-<name>-close`. Size options use `prototype-size-fill`, `prototype-size-1920`, `prototype-size-1440`, `prototype-size-1280`, `prototype-size-1024`, `prototype-size-640` and `prototype-size-desktop`. State options use `prototype-state-success|loading|empty|error|partial|permission`. Human labels are Ready, Loading, Empty, Error, Partial and No access.

Flag switches use `prototype-flag-<flag-id>` with each documented flag label as its accessible name. `prototype-flags-reset` restores all flags; `prototype-reset` reloads prototype defaults and clears saved shell preferences. Current values have `prototype-size-value`, `prototype-state-value` and `prototype-flags-value`. Use `getByTestId` or scoped role/name locators instead of ambiguous text matching. The business frame remains `iframe[data-primary-frame]`; use `frameLocator` for business actions. Validate the visible business state after selecting a scenario; a control value alone does not prove the page implements it. Check 320/390/768/1024/1440 widths, keyboard operation, both themes and panel bounds before handing off.
