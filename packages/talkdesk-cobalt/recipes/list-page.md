# List page

<!-- Generated from recipes/catalog.json and recipe source imports. -->

A user-management list with selection, search, filters, pagination, an Extensions Dialog creation form, an UploadFile import Dialog and SidePanel record details.

Read and copy [list-page.tsx](list-page.tsx). Default export: `ListPage`.

Supporting source: [recipes/list-page-data.ts](list-page-data.ts). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-page-dialogs.tsx](support/list-page-dialogs.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/filter-button.tsx](support/filter-button.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-page-header.tsx](support/list-page-header.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-page-filters.tsx](support/list-page-filters.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-user-fields.tsx](support/list-user-fields.tsx). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Create user opens the copied Extensions Dialog with a validated FormField/Input/Dropdown form. With no onCreate callback, creation appends an in-memory user; onCreate(draft) delegates persistence and users refresh to the host. Import opens Dialog with Extensions UploadFile (.csv, up to 5 MB); onImport(file) submits to the host. Without onImport, confirmation only records the selected filename and does not parse/import CSV records. Both callbacks may return promises; failures remain in the dialog for retry. Connect onEdit, onExport, onBulkManagement and onRefresh to host workflows; unconnected host actions are disabled. Pass scenario from usePrototypeScenario() in Workspace; controls stay in the host toolbar. Details use the copied SidePanel. Keep table parents flush: no rounded card, outer border, shadow or horizontal insets. Pass batch guidance through messageComponent below the column header. Filters opens the copied SidePanel with draft Activation filtering; Apply updates results, Cancel preserves them. AppPageHeader centers the compact title/description group with actions. Bound the AppPage height; pass minTableWidth to BasicTable, never a wide outer wrapper. The header uses copied AppPageHeader and Typography page-title/body variants with compact text spacing; do not recreate these using direct Heading/Text size overrides. Users Filters uses a medium 40px trigger aligned with Search; preserve the 48px toolbar. The panel uses FormField with an 8px label gap and a nonzero direct-control line-height. Users applied filters use the native medium 24px TagGroup with keyboard removal; queue cells use the copied ChipGroup with its complete overflow popup. The compact Users heading uses Typography page-title scale medium (native 24px/32px), body description and Cobalt Flex gap 0; do not restore the large heading line box or add a spacer between the title and description.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.app-page`: [component guidance](../components/extensions/src/app-page/README.md).
- `extensions.basic-table`: [component guidance](../components/extensions/src/basic-table/README.md).
- `cobalt-marketplace:components/toolbar`: look up its exact import and props in the Cobalt registry.
- `extensions.side-panel`: [component guidance](../components/extensions/src/side-panel/README.md).
- `extensions.dialog`: [component guidance](../components/extensions/src/dialog/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.input`: [component guidance](../components/extensions/src/input/README.md).
- `extensions.dropdown`: [component guidance](../components/extensions/src/dropdown/README.md).
- `extensions.upload-file`: [component guidance](../components/extensions/src/upload-file/README.md).
- `extensions.typography`: [component guidance](../components/extensions/src/typography/README.md).
- `extensions.chip-group`: [component guidance](../components/extensions/src/chip-group/README.md).
- `cobalt:components/tag`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-marketplace-react-toolbar` (2.2.2)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-checkbox` (1.1.6)
- `@talkdesk/cobalt-react-divider` (3.0.3)
- `@talkdesk/cobalt-react-flex` (3.3.0)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-link` (3.0.1)
- `@talkdesk/cobalt-react-menu` (1.2.3)
- `@talkdesk/cobalt-react-message` (2.3.5)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)
- `@talkdesk/cobalt-react-theme-provider` (4.6.3)
- `@talkdesk/cobalt-marketplace-react-badge-container` (2.2.0)
- `@talkdesk/cobalt-react-tab` (2.2.5)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: success, loading, empty, error, permission, partial, create validation, create submission, import file selection, submission failure.

## Limits and required adaptation

No backend or durable storage is provided. Local creation resets on remount; CSV selection is not a completed server import. The host owns duplicate/persistence validation across sessions and refreshes supplied users after successful creation. BasicTable owns rendering and pagination; the page sorts and slices data. Selection persists across pages/filters. The 48px filter Toolbar reserves space, search moves below it on small viewports, and the wide table scrolls internally. Pagination stays within the host width and height; only table rows and columns scroll.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
