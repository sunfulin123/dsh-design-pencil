# Detail page

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Read-only user details with tabs, grouped fields and host-owned edit/delete/back actions.

Read and copy [detail-page.tsx](detail-page.tsx). Default export: `DetailPage`.


## Integration

Read the Props interface in the source; pass user, onBack, onEdit and onDelete from the host. Adapt record groups and tabs to the requested domain.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies


- `react` (18.3.1)
- `@talkdesk/cobalt-react-avatar` (2.3.1)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-divider` (3.0.3)
- `@talkdesk/cobalt-react-flex` (3.3.0)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-tab` (2.2.5)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-react-viewport-provider` (2.2.5)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Only the official dependencies listed above may need installation.

States covered: populated sample.

## Limits and required adaptation

The sample is not a backend integration. Loading/error/permission states and routing need target-specific implementation; this recipe does not accept scenario.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
