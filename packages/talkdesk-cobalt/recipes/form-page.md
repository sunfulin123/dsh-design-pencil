# Form page

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Editable profile form with validation and controlled Extensions date, time, date range, checkbox, radio and searchable multi-select examples.

Read and copy [form-page.tsx](form-page.tsx). Default export: `FormPage`.

Supporting source: [recipes/support/form-control-examples.tsx](support/form-control-examples.tsx). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Read the Props interface in the source; pass initial, onSave and onCancel. Connect submission and routing before delivery. Copy support/form-control-examples.tsx as well. Scheduling and preferences uses existing Extensions DatePicker, TimeSelectInput (24-hour, total minutes from midnight), DateRangePicker, Choice checkbox/radio and searchable MultiDropdown. FormPage controlExamples is controlled and returned by onSave, with a default sample when omitted. Field names, group accessible names and form-* data-qa selectors support review; native choice labels are clickable and radios share a unique name. Local Dates are sample calendar values; the embedding app owns timezone/serialization and persistence.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.date-picker`: [component guidance](../components/extensions/src/date-picker/README.md).
- `extensions.time-select-input`: [component guidance](../components/extensions/src/time-select-input/README.md).
- `extensions.date-range-picker`: [component guidance](../components/extensions/src/date-range-picker/README.md).
- `extensions.choice`: [component guidance](../components/extensions/src/choice/README.md).
- `extensions.multi-dropdown`: [component guidance](../components/extensions/src/multi-dropdown/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/typography`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-divider` (3.0.3)
- `@talkdesk/cobalt-react-dropdown` (4.1.1)
- `@talkdesk/cobalt-react-flex` (3.3.0)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-text-input` (1.3.0)
- `@talkdesk/cobalt-react-toggle` (3.1.1)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: form input, validation, calendar open, time editing, range selection, checkbox toggled, radio selection, multi-select search.

## Limits and required adaptation

No backend or persistent save is provided. Async submit/failure and permission states require target-specific implementation; this recipe does not accept scenario. Scheduling examples use local calendar Dates and numeric minutes; do not silently convert to UTC or claim these are production availability data.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
