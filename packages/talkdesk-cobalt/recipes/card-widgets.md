# Card widgets

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Screenshot-based metric and donut dashboard plus reusable template, empty, use-case, sentiment, keyword and shift distribution cards.

Read and copy [card-widgets.tsx](card-widgets.tsx). Default export: `CardWidgets`.

Supporting source: [recipes/support/reference-charts.tsx](support/reference-charts.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/widget-patterns.tsx](support/widget-patterns.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/widget-gallery.css](support/widget-gallery.css). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Use these cards and charts as composable visual/interaction references for AI exploration; adapt their layout, data and actions to the user request rather than treating the sample as a complete business specification. Copy the recipe and every linked support TSX/TS/CSS file together with the complete local Extensions source closure. Scaffolds already provide Cobalt theme, viewport and portal providers. Use local source imports; never install or import @openpencil/cobalt-extensions. Mount CardWidgets. Add/configure/delete widgets, commit with Done, or restore the last local checkpoint with Discard. The first six widgets reproduce the supplied dashboard. Further down, WidgetPatterns shows every additional card reference. Shift days use the copied SelectGroup; shift and break use Dropdown. Donuts use the pinned Apache ECharts dependency and theme tokens. Read support/recipe-sources.json for provenance. Keep the bounded content scroller positioned so native hidden form/focus nodes cannot create a second outer scroll area or a blank tail. Empty cards use marketplace EmptyWidget for centered title/message/icon composition.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.card`: [component guidance](../components/extensions/src/card/README.md).
- `extensions.dialog`: [component guidance](../components/extensions/src/dialog/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.dropdown`: [component guidance](../components/extensions/src/dropdown/README.md).
- `extensions.select-group`: [component guidance](../components/extensions/src/select-group/README.md).
- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/icon`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/tag`: look up its exact import and props in the Cobalt registry.
- `cobalt-marketplace:components/empty-widget`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-divider` (3.0.3)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `echarts` (6.0.0)
- `@talkdesk/cobalt-marketplace-react-empty-widget` (2.2.2)
- `@talkdesk/cobalt-react-tag` (3.0.2)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: editing, saved, widget configuration, deleted widget, shift selection.

## Limits and required adaptation

All values and edits are local demo data. Done saves only an in-memory checkpoint; remount resets it. Corner handles illustrate edit-mode chrome; drag and resize are not implemented. No dashboard API or WFM runtime is imported.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
