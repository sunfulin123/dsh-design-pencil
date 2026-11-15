# Talkdesk Cobalt AI authoring entry

All paths in this page start at the bundled cobalt-reference directory. In a generated project, read registry/authoring.json again: recipe/source/README paths have been rebased to that project.

1. Read references/cobalt-workspace.md from the parent HTML Skill for build mode, shell setup and delivery workflow.
2. Search [registry/authoring.json](registry/authoring.json) by purpose, keywords or exact ID. Read only the matching component and recipe docs; this index does not replace API documentation.
3. Read the complete relevant [Cobalt source templates](components/extensions/INDEX.md), including implementation, types, CSS and local dependencies; copy them to src/components/cobalt-extensions/, then adapt and import local modules. Never install @openpencil/cobalt-extensions or import/alias that package name. Official @talkdesk/* packages remain normal dependencies. Otherwise read the matching core/marketplace entry and its exact import/version in [content/registry.json](content/registry.json). Duplicate names such as Button, Table and DatePicker are separate APIs; qualify the library and import. Reuse existing controls for tags, badges, avatars and empty states before adding UI. Retain specialized chart/schedule layouts and requested motion as composition, and document any missing component capability.
4. Use lookup --id <component-ID> --read-source to inspect full source before reuse. Workspace creation copies all templates; standalone/existing apps use cobalt-project.mjs copy-source --out <project>. Read the recipe integration contract, then the actual TSX. Extend the source and connect required callbacks instead of copying old inline snippets from migrated pages.
5. Preserve source qualifications. Migrated examples marked check.ok=false or “Doesn’t compile” are not executable templates. The maintained recipes/examples are checked separately; their build success does not validate all migrated snippets.
6. Test the requested states, callbacks, keyboard behavior, themes and target Workspace app widths. Keep prototype controls in the host toolbar.

## Bounded lookup

Use the HTML Skill script: `node <skill-directory>/scripts/cobalt-lookup.mjs --query "list table filters"`. Then use `--id recipe.list-page` to resolve the current local source, integration guide and API file paths. Search returns at most eight entries by default. Translate the brief into library terms such as users, table, toolbar or validation; retry individual terms when no result matches before assuming a component is missing. Inside a generated project, the same read-only command is `node tools/cobalt-lookup.mjs`. Read the resolved files before coding; do not load the entire large reference registry into context.

## Path conventions

authoring.json source/readme/path/aiDocumentation/authoredDocumentation paths are relative to this bundle; the component documentation field is relative to content/. Recipe paths are rebased in generated projects. Styles are discovered by style ID using get_style_guide; their source paths belong to the authoring repository, not this bundle.

## Verified recipe entry points

### Active call

Screenshot-faithful Conversations voice-call workspace: assigned queue and search, Talking via Sales Number, call quality and recording, Snapshot/Notes/Callbacks, empty callback card, two-entry callback timeline and pinned full call controls.

- Integration: [recipes/active-call.md](recipes/active-call.md); source: [recipes/active-call.tsx](recipes/active-call.tsx).
- Default export: `ActiveCall`; states: success, loading, empty, error, partial, permission, on hold, muted, recording stopped, call ended, callback scheduled, keypad, queue collapsed.
- Limits: Carly Yates, the phone number, history names, historical timestamps, 5 assigned and 6 conversations are screenshot sample content, not live customer data. The sample list contains one active voice contact, so sorting/filtering does not invent five other records. No calling, recording, DTMF, transfers, notifications or persistence are performed. Wire authorized telephony services in the embedding app. Empty refers to callback history; the active contact/header stay visible. Partial shows one history record. Error retries local sample data. Loading/permission disable call actions. The ended state is local and resets on remount. No production audio/network integration.

### Card widgets

Screenshot-based metric and donut dashboard plus reusable template, empty, use-case, sentiment, keyword and shift distribution cards.

- Integration: [recipes/card-widgets.md](recipes/card-widgets.md); source: [recipes/card-widgets.tsx](recipes/card-widgets.tsx).
- Default export: `CardWidgets`; states: editing, saved, widget configuration, deleted widget, shift selection.
- Limits: All values and edits are local demo data. Done saves only an in-memory checkpoint; remount resets it. Corner handles illustrate edit-mode chrome; drag and resize are not implemented. No dashboard API or WFM runtime is imported.

### Detail page

Read-only user details with tabs, grouped fields and host-owned edit/delete/back actions.

- Integration: [recipes/detail-page.md](recipes/detail-page.md); source: [recipes/detail-page.tsx](recipes/detail-page.tsx).
- Default export: `DetailPage`; states: populated sample.
- Limits: The sample is not a backend integration. Loading/error/permission states and routing need target-specific implementation; this recipe does not accept scenario.

### Echart insights

Screenshot-based Insights with date navigation, Day/Week/Month ranges, agent filters and dual-axis Apache ECharts predictions. Includes native split export actions and a Copilot chat side panel.

- Integration: [recipes/echart-insights.md](recipes/echart-insights.md); source: [recipes/echart-insights.tsx](recipes/echart-insights.tsx).
- Default export: `EchartInsights`; states: success, loading, empty, error, partial, permission, summary, collapsed chart, agent filter draft, export options open, Copilot conversation, Copilot input.
- Limits: All predictions, agents and summary averages are deterministic sample data; they are not production WFM metrics. Filtering changes local selection and refreshes the sample renderer; connect agent/date/range to real data for production. New charts share the sample ATA/AWT series. Local changes reset on remount. Do not copy WFM network services, authentication or API hooks. Copilot replies are deterministic local examples, with no model/network connection or durable conversation. Export contains sample summary values only. Wire a real assistant and authorized analytics/export services explicitly for production.

### ECharts gallery

Three real Apache ECharts references: prediction/history, stacked forecast and dual-axis scenario comparison with legends and zoom.

- Integration: [recipes/echarts-gallery.md](recipes/echarts-gallery.md); source: [recipes/echarts-gallery.tsx](recipes/echarts-gallery.tsx).
- Default export: `EchartsGallery`; states: three charts, chart removed, legend toggled, zoomed.
- Limits: Synthetic series reproduce the screenshot shapes; these are not production WFM forecasts. No service, authentication, hooks or stores from WFM are bundled. The sample histories have empty series, as in the reference.

### Form page

Editable profile form with validation and controlled Extensions date, time, date range, checkbox, radio and searchable multi-select examples.

- Integration: [recipes/form-page.md](recipes/form-page.md); source: [recipes/form-page.tsx](recipes/form-page.tsx).
- Default export: `FormPage`; states: form input, validation, calendar open, time editing, range selection, checkbox toggled, radio selection, multi-select search.
- Limits: No backend or persistent save is provided. Async submit/failure and permission states require target-specific implementation; this recipe does not accept scenario. Scheduling examples use local calendar Dates and numeric minutes; do not silently convert to UTC or claim these are production availability data.

### List page

A user-management list with selection, search, filters, pagination, an Extensions Dialog creation form, an UploadFile import Dialog and SidePanel record details.

- Integration: [recipes/list-page.md](recipes/list-page.md); source: [recipes/list-page.tsx](recipes/list-page.tsx).
- Default export: `ListPage`; states: success, loading, empty, error, permission, partial, create validation, create submission, import file selection, submission failure.
- Limits: No backend or durable storage is provided. Local creation resets on remount; CSV selection is not a completed server import. The host owns duplicate/persistence validation across sessions and refreshes supplied users after successful creation. BasicTable owns rendering and pagination; the page sorts and slices data. Selection persists across pages/filters. The 48px filter Toolbar reserves space, search moves below it on small viewports, and the wide table scrolls internally. Pagination stays within the host width and height; only table rows and columns scroll.

### Team Schedule

A Cobalt reference composition for a team day schedule: native responsive Toolbar, badge anchors, searchable timezone selector, metrics and agent timeline.

- Integration: [recipes/team-schedule.md](recipes/team-schedule.md); source: [recipes/team-schedule.tsx](recipes/team-schedule.tsx).
- Default export: `TeamSchedule`; states: success, loading, empty, error, partial, permission, filters, event creation, event editing.
- Limits: The schedule uses 75 synthetic agents and screenshot sample metrics/events. Date navigation and timezone only change labels; no real timezone conversion or server query occurs. Agent filter selection is illustrative and does not model real queue membership. Metrics pin buttons toggle their pressed state; metrics remain visible. Only Day view is provided. Ask Copilot opens a deterministic local event-planning demo. Timezone selection stores an IANA value for the reference UI; implement real conversion when requested. Event colors are screenshot sample domain colors, not native-control overrides. No WFM backend, scheduling engine, drag/drop or durable storage is included.

## Document retrieval

registry/authoring.json also indexes the migrated Markdown documents by category/name and records core/marketplace package availability in the scaffold. Foundations, patterns and Workspace docs remain authoritative for design guidance; component props come from the selected library API. When a required official @talkdesk/* or React dependency is absent, install its pinned version explicitly after checking the target app; extension templates must be copied as source, never installed as @openpencil/cobalt-extensions; do not guess that all documented packages are preinstalled.
