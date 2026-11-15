# Team Schedule

<!-- Generated from recipes/catalog.json and recipe source imports. -->

A Cobalt reference composition for a team day schedule: native responsive Toolbar, badge anchors, searchable timezone selector, metrics and agent timeline.

Read and copy [team-schedule.tsx](team-schedule.tsx). Default export: `TeamSchedule`.

Supporting source: [recipes/support/filter-button.tsx](support/filter-button.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/schedule-data.ts](support/schedule-data.ts). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/schedule-timeline.tsx](support/schedule-timeline.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/schedule-header.tsx](support/schedule-header.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/team-schedule.css](support/team-schedule.css). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Use this as a composable design reference for AI exploration: choose relevant layout and interaction patterns, adapt or omit sample controls for the requested page, and let user requirements define the business flow. Copy the recipe and every linked support TSX/TS/CSS file together with the complete local Extensions source closure. Scaffolds already provide Cobalt theme, viewport and portal providers. Use local source imports; never install or import @openpencil/cobalt-extensions. Mount TeamSchedule with scenario from usePrototypeScenario() and register it under the existing WFM team-schedule page. Preserve the bounded full-height root: only the timeline scrolls, with sticky hour/metric rows and 306px agent column; pagination stays visible. The screenshot uses November 15, 2026, Shanghai, 24 hour columns, 15-minute grid lines, six metrics and 60px agent rows. Search/sort/page size/filter drafts and local event creation/edit/delete demonstrate component composition. Events use copied TimeSelectInput minutes from midnight. Native Cobalt components supply all controls, typography, icons, tags and avatars; our grid is a layout composition because Cobalt has no complete scheduling timeline. Read support/recipe-sources.json for provenance. On phone widths up to 480px, the six metric rows scroll with the timeline so agents remain reachable below the sticky hour header; keep the bottom pagination pinned. Below 360px, pagination wraps into two rows. The controls use official marketplace Toolbar/StartContent/EndContent and wrap within the business viewport as space runs out. Use auto height, zero minimum width and wrapping start/end groups; never hide actions behind horizontal toolbar overflow. Select and intraday adherence are omitted. Requests and Filters use official BadgeContainerWrapper (the default badge-container export), outside the button content. Header timezone uses copied TimezoneDropdown with IANA values such as Asia/Shanghai, searchable region groups and native selection behavior. Keep the compact globe/city/chevron Cobalt Button as TimezoneDropdown customInput; the popup remains the shared grouped/searchable Extensions UI. The applied-filter strip also uses marketplace Toolbar/StartContent/EndContent. Both toolbar rows wrap to keep every control reachable; only the scheduling grid scrolls horizontally. Native BadgeContainerWrapper counts use positioning props to sit above the right edge of the request/filter action, not beside the label. For an attached top-right badge use originPosition="NE", directionPosition="NW", gapX={0}, gapY={8}: the badge extends inward/upward and overlaps the corner. SE extends the badge outside the button to its right. Agent search is a fixed 160px field (flex: 0 0 160px), never stretched to consume remaining Toolbar space. Retain the native small Cobalt control height.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.date-picker`: [component guidance](../components/extensions/src/date-picker/README.md).
- `extensions.dropdown`: [component guidance](../components/extensions/src/dropdown/README.md).
- `extensions.multi-dropdown`: [component guidance](../components/extensions/src/multi-dropdown/README.md).
- `extensions.side-panel`: [component guidance](../components/extensions/src/side-panel/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.time-select-input`: [component guidance](../components/extensions/src/time-select-input/README.md).
- `extensions.textarea`: [component guidance](../components/extensions/src/textarea/README.md).
- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/icon`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/tag`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/avatar`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/pagination`: look up its exact import and props in the Cobalt registry.
- `extensions.timezone-dropdown`: [component guidance](../components/extensions/src/timezone-dropdown/README.md).
- `cobalt-marketplace:components/toolbar`: look up its exact import and props in the Cobalt registry.
- `cobalt-marketplace:components/badge-container`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-pagination` (1.0.3)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-react-message` (2.3.5)
- `@talkdesk/cobalt-react-spinner` (3.1.2)
- `@talkdesk/cobalt-marketplace-react-toolbar` (2.2.2)
- `@talkdesk/cobalt-marketplace-react-badge-container` (2.2.0)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)
- `@talkdesk/cobalt-react-avatar` (2.3.1)
- `@talkdesk/cobalt-react-link` (3.0.1)
- `@talkdesk/cobalt-react-menu` (1.2.3)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: success, loading, empty, error, partial, permission, filters, event creation, event editing.

## Limits and required adaptation

The schedule uses 75 synthetic agents and screenshot sample metrics/events. Date navigation and timezone only change labels; no real timezone conversion or server query occurs. Agent filter selection is illustrative and does not model real queue membership. Metrics pin buttons toggle their pressed state; metrics remain visible. Only Day view is provided. Ask Copilot opens a deterministic local event-planning demo. Timezone selection stores an IANA value for the reference UI; implement real conversion when requested. Event colors are screenshot sample domain colors, not native-control overrides. No WFM backend, scheduling engine, drag/drop or durable storage is included.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
