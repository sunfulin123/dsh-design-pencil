# Ordinary HTML prototype review controls

This guide is split so the Skill can load it by stage. Read [the summary](html-review/summary.md) when the Skill's Reference Loading table selects this guide, and a section below only when its table row applies.

Use this helper for ordinary HTML POCs, including standalone pages. Workspace prototypes keep their existing Cobalt shell controls. The canonical implementation is the private `packages/html-prototype-review/` code library. Installed sessions already carry the library under `scripts/html-review/`; use the bundled helper without cloning a repository or installing an npm package. The helper copies its fixed sources and verifies JS/CSS hashes; models must not redraw, reimplement or edit the toolbar. The generic controls have no Feature flags, framework dependency, private registry access or influence on the selected business-page style.

- [Author the business entry](html-review/01-author-the-business-entry.md)
- [Prepare the review entry](html-review/02-prepare-the-review-entry.md)
- [Behavior and locators](html-review/03-behavior-and-locators.md)
- [Capture and handoff](html-review/04-capture-and-handoff.md)
- [POC to high-fidelity boundary](html-review/05-poc-to-high-fidelity-boundary.md)
- [Development and final checks](html-review/06-development-and-final-checks.md)
