# POC development checks and frozen delivery review

This guide is split so the Skill can load it by stage. Read [the summary](poc-review/summary.md) when the Skill's Reference Loading table selects this guide, and a section below only when its table row applies.

Prefer Browser Use for visible POC interaction and visual review when its tools are available. Keep the bundled `scripts/review-poc.mjs` as the headless fallback and frozen static-delivery verifier for ordinary HTML and Cobalt Workspace POCs. Development checks and delivery evidence serve different purposes; do not run the full handoff gate after every local adjustment.

- [Before implementation](poc-review/01-before-implementation.md)
- [Local revisions](poc-review/02-local-revisions.md)
- [Start and reuse a local development server](poc-review/03-start-and-reuse-a-local-development-server.md)
- [Review the visible page with Browser Use](poc-review/04-review-the-visible-page-with-browser-use.md)
- [Review long content without claiming unseen coverage](poc-review/05-review-long-content-without-claiming-unseen-cove.md)
- [Headless development fallback](poc-review/06-headless-development-fallback.md)
- [Frame-aware actions and detail images](poc-review/07-frame-aware-actions-and-detail-images.md)
- [Final review after related changes are complete](poc-review/08-final-review-after-related-changes-are-complete.md)
