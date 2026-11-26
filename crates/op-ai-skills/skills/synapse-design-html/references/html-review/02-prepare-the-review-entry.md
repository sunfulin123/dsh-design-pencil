## Prepare the review entry

After authoring, run from the task directory with its existing `SYNAPSE_DESIGN_TASK_DIR` binding:

```sh
node <html-skill>/scripts/prepare-html-review.mjs \
  --entry <task-dir>/index.html \
  --states success,loading,empty,error,partial \
  --default-state success
```

List only implemented, applicable states. Supported IDs are `success`, `loading`, `empty`, `error`, `partial`, `permission`; labels are Ready, Loading, Empty, Error, Partial, No access. A read-only/static page can declare only `success`; its state trigger is disabled instead of advertising fake variants. Explain non-applicable states in the normal evidence ledger.

The command returns `entry` (default `preview.html`), `businessEntry`, `states`, `defaultState` and the helper's `sourceFiles`. It copies `prototype-review/` next to the business HTML and preserves the business source. It refuses unrelated preview files/directories, path escapes and symlinks. Repeat it after source/template updates. An optional `--out` names another preview HTML in the same directory; do not put runtime assets inside `review/` or `shots/`.

For a bundled/Vite page, include the adapter tag in its source index, build first, then prepare the compiled business entry. Keep the copied review assets beside the compiled entry. Never wrap an existing Workspace shell or add the generic bar twice.
