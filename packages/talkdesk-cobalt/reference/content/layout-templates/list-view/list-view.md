# List View

This local adaptation retains the upstream List View as design provenance. The maintained executable composition is `recipes/list-page.tsx`; read its integration contract at `recipes/list-page.md` from the bundle root. [Open the runnable List page](/recipes/list-page/).

## Component choice

Read and copy the complete `BasicTable` implementation into `src/components/cobalt-extensions/`, then import it from that local directory (never install `@openpencil/cobalt-extensions`) for table columns, sort controls, pagination and loading/error/empty rendering. Read `content/components/extensions/basictable.md` and its runnable examples before changing props. The page applies the sort map to its data and slices the selected page; BasicTable does not fetch or sort data for the caller.

Use default `Toolbar` with named `StartContent`, `EndContent`, `Search` and `Filters` from `@talkdesk/cobalt-marketplace-react-toolbar`. Read `content/components/marketplace/toolbar/toolbar.md`. Both the main controls and the reserved active-filter row use this component. Its design height is 48px; clearing filters keeps the row to prevent the table moving. Put search below the toolbar at small widths.

Read and copy the local Extensions `SidePanel` for record details, including its header, close control, scrollable body and Edit footer. Keep BasicTable flush with the business-page edges: no outer card, rounded corners, border, shadow or horizontal table-parent padding. Retain cell padding and row separators; header, search and form regions keep their own insets. Inspect both list recipes and their complete source through lookup before adapting.

## Adapting the recipe

The source exports `ListPage` as its default and `User`/`SAMPLE_USERS` as named exports. Replace sample data and read the creation/import Dialog workflow in the recipe supporting source. Create and Import open local Extensions dialogs even without callbacks. onCreate(draft) and onImport(file) connect host persistence/import; without them, creation is in-memory and import only records the chosen filename. Unconnected edit/export/bulk/refresh actions remain disabled. Row selection, search, active filtering, sorting, paging and details are local interactions. `scenario` supports success/loading/empty/error/permission/partial and is controlled by the Workspace host toolbar.

The table owns horizontal scrolling within its region. Test the real app viewport, light/dark appearance, column readability, toolbar centers, filter-row stability, pagination, keyboard behavior and requested states. The source and its registry provide the current dependency list. Do not reconstruct the table from the old core Table snippet.

## Provenance and limitations

The migrated upstream recipe is a Cobalt draft, not an approval of this local composition. This owned adaptation selects BasicTable and marketplace Toolbar for reuse. No backend, durable storage or working import/export service is included. Read the recipe contract and actual Props interface before wiring host actions. A build verifies API compatibility; it does not prove finished UX.
