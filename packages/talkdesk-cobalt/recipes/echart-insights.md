# Echart insights

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Screenshot-based Insights with date navigation, Day/Week/Month ranges, agent filters and dual-axis Apache ECharts predictions. Includes native split export actions and a Copilot chat side panel.

Read and copy [echart-insights.tsx](echart-insights.tsx). Default export: `EchartInsights`.

Supporting source: [recipes/support/filter-button.tsx](support/filter-button.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/insights-chart.tsx](support/insights-chart.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/insights-filters.tsx](support/insights-filters.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/insights-header-actions.tsx](support/insights-header-actions.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/insights-copilot.tsx](support/insights-copilot.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/insights.css](support/insights.css). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Copy the recipe and all support sources/CSS, together with the complete local Extensions source closure. Install the pinned Apache echarts dependency from templates/dependencies.json. Pass scenario from usePrototypeScenario(). The date/range controls, agent SidePanel, removable chips, Clear all, Add chart Dialog, chart menu, collapse, tooltip and data zoom are interactive. Semantic Cobalt tokens theme the chart and controls in light/dark mode. The page is bounded; only the chart content area scrolls. Keep the date field full-width inside its 220px slot, with an 8px gap to period navigation. Use native Cobalt SelectionGroup/SelectionGroupOption for the single Day/Week/Month selection. Agent filters use the copied searchable MultiDropdown inside SidePanel, with draft Apply/Clear and selectable/removable values. Applied filters and the +N overflow count use the native medium 24px Tag scale; the overflow action preserves the Tag surface inside a transparent Cobalt Button. The header uses native SplitButton with a chevron_down secondary segment opening @talkdesk/cobalt-react-popover. Export downloads the local summary as CSV; the Popover also offers JSON. Ask Copilot opens a Cobalt ModalPanel with ChatBubble messages and a fixed Textarea composer (120 characters). Enter sends, Shift+Enter inserts a newline, and IME composition does not send. Native overlays own Escape/focus restoration. Keep accessible names and insights-* data-testid locators. Copy insights-header-actions.tsx and insights-copilot.tsx with the recipe support sources. Ask Copilot precedes Export and uses native variation="transparent" without a custom resting fill. Sent messages align right with intrinsic-width bubbles and a trailing tiny Cobalt Avatar; bot messages stay left. Keep timestamp alignment, preserved newlines and bounded long-word wrapping. Applied agents use native medium 24px TagGroup with accessible keyboard removal. The +N count uses a native Button and matching medium Tag; no raw button or clickable close icon. Copilot bot and user markers are native Avatar. Keep the applied-filter labels, native TagGroup and +N count inline in a 48px Toolbar: TagGroup width must be auto and flex none, and its items must not wrap. At narrow widths the applied-filter strip scrolls internally without widening the page.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.app-page`: [component guidance](../components/extensions/src/app-page/README.md).
- `extensions.card`: [component guidance](../components/extensions/src/card/README.md).
- `extensions.date-picker`: [component guidance](../components/extensions/src/date-picker/README.md).
- `extensions.side-panel`: [component guidance](../components/extensions/src/side-panel/README.md).
- `extensions.dialog`: [component guidance](../components/extensions/src/dialog/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.input`: [component guidance](../components/extensions/src/input/README.md).
- `extensions.basic-table`: [component guidance](../components/extensions/src/basic-table/README.md).
- `cobalt-marketplace:components/toolbar`: look up its exact import and props in the Cobalt registry.
- `extensions.multi-dropdown`: [component guidance](../components/extensions/src/multi-dropdown/README.md).
- `cobalt:components/selection-group`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/popover`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/chat-bubble`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/panel`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/textarea`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/avatar`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/tag`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-marketplace-react-toolbar` (2.2.2)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-flex` (3.3.0)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-selection-group` (3.1.0)
- `@talkdesk/cobalt-react-tab` (2.2.5)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-message` (2.3.5)
- `@talkdesk/cobalt-react-spinner` (3.1.2)
- `@talkdesk/cobalt-react-menu` (1.2.3)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-marketplace-react-badge-container` (2.2.0)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)
- `echarts` (6.0.0)
- `@talkdesk/cobalt-react-popover` (1.2.1)
- `@talkdesk/cobalt-react-chat-bubble` (2.2.5)
- `@talkdesk/cobalt-react-avatar` (2.3.1)
- `@talkdesk/cobalt-react-panel` (3.0.3)
- `@talkdesk/cobalt-react-textarea` (3.1.2)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: success, loading, empty, error, partial, permission, summary, collapsed chart, agent filter draft, export options open, Copilot conversation, Copilot input.

## Limits and required adaptation

All predictions, agents and summary averages are deterministic sample data; they are not production WFM metrics. Filtering changes local selection and refreshes the sample renderer; connect agent/date/range to real data for production. New charts share the sample ATA/AWT series. Local changes reset on remount. Do not copy WFM network services, authentication or API hooks. Copilot replies are deterministic local examples, with no model/network connection or durable conversation. Export contains sample summary values only. Wire a real assistant and authorized analytics/export services explicitly for production.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
