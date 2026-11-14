# List page

<!-- Generated from recipes/catalog.json and recipe source imports. -->

A user-management list with selection, search, filters, pagination, an Extensions Dialog creation form, an UploadFile import Dialog and SidePanel record details.

Read and copy [list-page.tsx](list-page.tsx). Default export: `ListPage`.

Supporting source: [recipes/list-page-data.ts](list-page-data.ts). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-page-dialogs.tsx](support/list-page-dialogs.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/list-user-fields.tsx](support/list-user-fields.tsx). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Create user opens the copied Extensions Dialog with a validated FormField/Input/Dropdown form. With no onCreate callback, creation appends an in-memory user; onCreate(draft) delegates persistence and users refresh to the host. Import opens Dialog with Extensions UploadFile (.csv, up to 5 MB); onImport(file) submits to the host. Without onImport, confirmation only records the selected filename and does not parse/import CSV records. Both callbacks may return promises; failures remain in the dialog for retry. Connect onEdit, onExport, onBulkManagement and onRefresh to host workflows; unconnected host actions are disabled. Pass scenario from usePrototypeScenario() in Workspace; controls stay in the host toolbar. Details use the copied SidePanel. Keep table parents flush: no rounded card, outer border, shadow or horizontal insets. Pass batch guidance through messageComponent below the column header.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.basic-table`: [component guidance](../components/extensions/src/basic-table/README.md).
- `cobalt-marketplace:components/toolbar`: look up its exact import and props in the Cobalt registry.
- `extensions.side-panel`: [component guidance](../components/extensions/src/side-panel/README.md).
- `extensions.dialog`: [component guidance](../components/extensions/src/dialog/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.input`: [component guidance](../components/extensions/src/input/README.md).
- `extensions.dropdown`: [component guidance](../components/extensions/src/dropdown/README.md).
- `extensions.upload-file`: [component guidance](../components/extensions/src/upload-file/README.md).

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
- `@talkdesk/cobalt-react-tab` (2.2.5)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Only the official dependencies listed above may need installation.

States covered: success, loading, empty, error, permission, partial, create validation, create submission, import file selection, submission failure.

## Limits and required adaptation

No backend or durable storage is provided. Local creation resets on remount; CSV selection is not a completed server import. The host owns duplicate/persistence validation across sessions and refreshes supplied users after successful creation. BasicTable owns rendering and pagination; the page sorts and slices data. Selection persists across pages/filters. The 48px filter Toolbar reserves space, search moves below it on small viewports, and the wide table scrolls internally.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
