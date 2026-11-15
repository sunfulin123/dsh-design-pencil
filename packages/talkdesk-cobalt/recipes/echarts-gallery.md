# ECharts gallery

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Three real Apache ECharts references: prediction/history, stacked forecast and dual-axis scenario comparison with legends and zoom.

Read and copy [echarts-gallery.tsx](echarts-gallery.tsx). Default export: `EchartsGallery`.

Supporting source: [recipes/support/reference-charts.tsx](support/reference-charts.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/widget-gallery.css](support/widget-gallery.css). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Use these cards and charts as composable visual/interaction references for AI exploration; adapt their layout, data and actions to the user request rather than treating the sample as a complete business specification. Copy the recipe and every linked support TSX/TS/CSS file together with the complete local Extensions source closure. Scaffolds already provide Cobalt theme, viewport and portal providers. Use local source imports; never install or import @openpencil/cobalt-extensions. Mount EchartsGallery. Copy reference-charts.tsx and widget-gallery.css. Use echarts at the pinned version in templates/dependencies.json. The prediction/history and comparison charts include a slider; the forecast contains two coordinated plots. Native ECharts tooltips, legends and responsive canvas resizing work in both themes. Reset charts restores removed cards. Read support/recipe-sources.json for the WFM patterns adapted here. Reserve 16px below slider dataZoom so the complete drag handle remains inside the canvas; retain card padding.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.card`: [component guidance](../components/extensions/src/card/README.md).
- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/typography`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `echarts` (6.0.0)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: three charts, chart removed, legend toggled, zoomed.

## Limits and required adaptation

Synthetic series reproduce the screenshot shapes; these are not production WFM forecasts. No service, authentication, hooks or stores from WFM are bundled. The sample histories have empty series, as in the reference.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
