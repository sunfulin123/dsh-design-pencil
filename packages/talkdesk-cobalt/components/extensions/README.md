# Cobalt Extensions

Cobalt Extensions is a general-purpose set of reusable components built on Cobalt, suitable for any business application. Its WFM origin does not limit its use. This module adapts the migrated WFM UI components to the Cobalt versions in the toolkit's local reference registry. React remains 18.3.1. `upgrade.json` records each dependency change and `yarn.lock` pins the resolved installation. The source WFM repository and the original snapshot under `vendor/wfm-ui-components` remain unchanged.

These are editable source templates. Read the complete selected implementation, types, CSS and local dependencies, copy `src/` into the application's `src/components/cobalt-extensions/`, then adapt and import local modules. Never install `@openpencil/cobalt-extensions` or configure a package-name alias/file dependency. The package.json in this maintainer directory is only an isolated test/build harness and is not exported to AI. Its official dependencies are exported separately as dependencies.json.

## API adaptation

The implementation uses Cobalt's named Tag, Group/GroupItem, SelectionGroup/SelectionGroupOption and Textarea exports. Controlled selection maps to selected keys, the side panel uses ModalPanel, and typography/table loading uses Skeleton. The wrapper preserves its existing native textarea change callback. A documented local event-type bridge accounts for the upstream Textarea declarations using input-element event types despite rendering a textarea. Legacy WFM DOM identifiers remain stable for existing selectors. Original WFM source import paths are a test compatibility alias; production self-imports use local modules.

## Validation

Run `yarn install --frozen-lockfile`, `yarn typecheck`, `yarn test` and `yarn build` in this directory. `yarn test:browser` starts its own temporary Vite server and uses Google Chrome, or the executable selected by `CHROME_PATH`, to exercise selection, textarea updates, panel open/close and narrow-width overflow. It never uses an existing user browser profile. `yarn demo` opens the small integration example for manual inspection.

The surrounding module exports this source into newly created prototypes and renders its maintained MDX/examples through Astro. See `../../README.md` for the shared documentation, recipe, content revision and SS staging workflow.
