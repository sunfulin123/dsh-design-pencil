# Sync the tracked staged copy of the HTML POC SKILL.md that the runtime build regenerates

Record-Version: 2
Task-ID: bc9dac4b-ee21-4dbd-8ce8-67bbc1188ac8
Base-Ref: 3d82a628fa12d23679b94c5bfee8cca35b4c6bb8
Started-At: 2026-11-26T10:18:46.467510+00:00
Type: fix-bug
Status: complete

## Context

PR #3 changed `crates/op-ai-skills/skills/synapse-design-html/SKILL.md`, but `packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md` is a tracked copy that `packages/talkdesk-cobalt/tools/build-skill.mjs` regenerates during `build-engine.sh`. The `runtime` CI job ("Stage checksummed runtime") failed on `git diff --exit-code HEAD` because the tracked copy was still the old text.

## Changes

- `packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md`: copied from the source SKILL.md.

## Validation

- Passed: `cmp` of the source and tracked copy for all four tracked files under `packages/dsh-node-runtime/skills/synapse-design-html/` (`SKILL.md`, `references/harden-and-edge-cases.md`, `references/layout-sections-and-cards.md`, `scripts/capture-poc.mjs`); the other three were already identical.
- Not run locally: `build-engine.sh` and `stage-dsh-runtime.mjs` (no Rust toolchain); the `runtime` CI job reruns them on push.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [],
  "none_reason": "Generated copy synchronised with its source; no knowledge entry describes this copy."
}
```

## Risks and follow-up

Any later edit to one of the four tracked source files needs the same copy before CI.
## Changed files

```json
{
  "files": []
}
```

Completed-At: 2026-11-26T10:19:23.031921+00:00
