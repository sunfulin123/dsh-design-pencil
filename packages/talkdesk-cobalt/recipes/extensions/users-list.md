# Users list with extensions

<!-- Generated from recipes/catalog.json and recipe source imports. -->

A compact extension-based list demonstrating local search, a create SidePanel and prototype scenario rendering.

Read and copy [extensions/users-list.tsx](users-list.tsx). Default export: `UsersList`.


## Integration

Mount the default UsersList export and pass scenario from usePrototypeScenario(). Replace sample records and connect persistence for a real application. Keep AppPageContent padding at zero around BasicTable; inset the search region independently.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `extensions.app-page`: [component guidance](../../components/extensions/src/app-page/README.md).
- `extensions.basic-table`: [component guidance](../../components/extensions/src/basic-table/README.md).
- `extensions.side-panel`: [component guidance](../../components/extensions/src/side-panel/README.md).
- `extensions.form-field`: [component guidance](../../components/extensions/src/form-field/README.md).

- `react` (18.3.1)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Only the official dependencies listed above may need installation.

States covered: success, loading, empty, error, permission, partial.

## Limits and required adaptation

Creation is in-memory only; state is lost on remount. This compact recipe is not the full List page composition. Use ListPage for marketplace Toolbar, row selection and multi-page data.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
