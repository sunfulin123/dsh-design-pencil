# Form page

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Editable profile form with validation and save/cancel callbacks.

Read and copy [form-page.tsx](form-page.tsx). Default export: `FormPage`.


## Integration

Read the Props interface in the source; pass initial, onSave and onCancel. Connect submission and routing before delivery.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies


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

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Only the official dependencies listed above may need installation.

States covered: form input, validation.

## Limits and required adaptation

No backend or persistent save is provided. Async submit/failure and permission states require target-specific implementation; this recipe does not accept scenario.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
