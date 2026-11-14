# Talkdesk Cobalt AI authoring entry

All paths in this page start at the bundled cobalt-reference directory. In a generated project, read registry/authoring.json again: recipe/source/README paths have been rebased to that project.

1. Read references/cobalt-workspace.md from the parent HTML Skill for build mode, shell setup and delivery workflow.
2. Search [registry/authoring.json](registry/authoring.json) by purpose, keywords or exact ID. Read only the matching component and recipe docs; this index does not replace API documentation.
3. Read the complete relevant [Cobalt source templates](components/extensions/INDEX.md), including implementation, types, CSS and local dependencies; copy them to src/components/cobalt-extensions/, then adapt and import local modules. Never install @openpencil/cobalt-extensions or import/alias that package name. Official @talkdesk/* packages remain normal dependencies. Otherwise read the matching core/marketplace entry and its exact import/version in [content/registry.json](content/registry.json). Duplicate names such as Button, Table and DatePicker are separate APIs; qualify the library and import.
4. Use lookup --id <component-ID> --read-source to inspect full source before reuse. Workspace creation copies all templates; standalone/existing apps use cobalt-project.mjs copy-source --out <project>. Read the recipe integration contract, then the actual TSX. Extend the source and connect required callbacks instead of copying old inline snippets from migrated pages.
5. Preserve source qualifications. Migrated examples marked check.ok=false or “Doesn’t compile” are not executable templates. The maintained recipes/examples are checked separately; their build success does not validate all migrated snippets.
6. Test the requested states, callbacks, keyboard behavior, themes and target Workspace app widths. Keep prototype controls in the host toolbar.

## Bounded lookup

Use the HTML Skill script: `node <skill-directory>/scripts/cobalt-lookup.mjs --query "list table filters"`. Then use `--id recipe.list-page` to resolve the current local source, integration guide and API file paths. Search returns at most eight entries by default. Translate the brief into library terms such as users, table, toolbar or validation; retry individual terms when no result matches before assuming a component is missing. Inside a generated project, the same read-only command is `node tools/cobalt-lookup.mjs`. Read the resolved files before coding; do not load the entire large reference registry into context.

## Path conventions

authoring.json source/readme/path/aiDocumentation/authoredDocumentation paths are relative to this bundle; the component documentation field is relative to content/. Recipe paths are rebased in generated projects. Styles are discovered by style ID using get_style_guide; their source paths belong to the authoring repository, not this bundle.

## Verified recipe entry points

### Detail page

Read-only user details with tabs, grouped fields and host-owned edit/delete/back actions.

- Integration: [recipes/detail-page.md](recipes/detail-page.md); source: [recipes/detail-page.tsx](recipes/detail-page.tsx).
- Default export: `DetailPage`; states: populated sample.
- Limits: The sample is not a backend integration. Loading/error/permission states and routing need target-specific implementation; this recipe does not accept scenario.

### Users list with extensions

A compact extension-based list demonstrating local search, a create SidePanel and prototype scenario rendering.

- Integration: [recipes/extensions/users-list.md](recipes/extensions/users-list.md); source: [recipes/extensions/users-list.tsx](recipes/extensions/users-list.tsx).
- Default export: `UsersList`; states: success, loading, empty, error, permission, partial.
- Limits: Creation is in-memory only; state is lost on remount. This compact recipe is not the full List page composition. Use ListPage for marketplace Toolbar, row selection and multi-page data.

### Form page

Editable profile form with validation and save/cancel callbacks.

- Integration: [recipes/form-page.md](recipes/form-page.md); source: [recipes/form-page.tsx](recipes/form-page.tsx).
- Default export: `FormPage`; states: form input, validation.
- Limits: No backend or persistent save is provided. Async submit/failure and permission states require target-specific implementation; this recipe does not accept scenario.

### List page

A user-management list with selection, search, filters, pagination, an Extensions Dialog creation form, an UploadFile import Dialog and SidePanel record details.

- Integration: [recipes/list-page.md](recipes/list-page.md); source: [recipes/list-page.tsx](recipes/list-page.tsx).
- Default export: `ListPage`; states: success, loading, empty, error, permission, partial, create validation, create submission, import file selection, submission failure.
- Limits: No backend or durable storage is provided. Local creation resets on remount; CSV selection is not a completed server import. The host owns duplicate/persistence validation across sessions and refreshes supplied users after successful creation. BasicTable owns rendering and pagination; the page sorts and slices data. Selection persists across pages/filters. The 48px filter Toolbar reserves space, search moves below it on small viewports, and the wide table scrolls internally.

## Document retrieval

registry/authoring.json also indexes the migrated Markdown documents by category/name and records core/marketplace package availability in the scaffold. Foundations, patterns and Workspace docs remain authoritative for design guidance; component props come from the selected library API. When a required official @talkdesk/* or React dependency is absent, install its pinned version explicitly after checking the target app; extension templates must be copied as source, never installed as @openpencil/cobalt-extensions; do not guess that all documented packages are preinstalled.
