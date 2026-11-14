# Design data

`styles/<folder>/DESIGN.md` is the source of every built-in style. Add a folder containing a nonempty UTF-8 `DESIGN.md`; no registration list is required. Optional `style.json` sets a stable `id` and `category`; defaults are the folder name and `uncategorized`. Existing metadata preserves all current IDs, including `design-md:apple` and `talkdesk-cobalt`. Original community content and its license are retained.

`tools/catalog.mjs` validates and discovers folders, rejects duplicate IDs and symbolic links, hashes the original bytes and generates the embedding manifest. The Rust `op-ai-skills` build invokes it with Node.js, embeds the generated directory and tracks source changes for rebuilds. The existing style catalogue/discovery tools therefore return newly added styles after rebuilding. This is build-time discovery, not an installed application's filesystem watcher.

Run `node --test packages/design-data/test/*.test.mjs` from the repository root. After a content change, rebuild the engine/web runtime and stage it into SS. The Astro site discovers the same source folders during its content build. Cobalt-specific implementation, docs and templates are owned by `../talkdesk-cobalt/`; this module only owns style data.
