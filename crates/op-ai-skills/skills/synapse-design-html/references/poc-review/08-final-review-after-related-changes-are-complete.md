## Final review after related changes are complete

For Cobalt, the final entry point builds once and serves that static output on a temporary owned loopback port:

```sh
node scripts/review-poc.mjs final --project <task-dir>/project --source <task-dir> --out <task-dir> --temp <temp-dir> --steps <temp-dir>/review/steps.json --scope app
```

For ordinary HTML, pass `--entry <task-dir>/preview.html` instead of `--project`; no build is needed. Handoff still registers the copied preview entry with its business HTML and review resources. Final session URLs may use paths/query strings inside static delivery, never an absolute development URL.

For the canonical ordinary preview wrapper, required surface captures resolve its configured business entry; keep separate planned sessions for wrapper Size/state/Reset integration. For Workspace, keep full-shell captures plus business-frame screenshots for handoff/high-fidelity reference. Use each screenshot metadata width as its actual pixel viewport; a business iframe can be narrower than the outer window.

Final review covers full 390x844, 768x1024 and 1440x900 viewports, supplementing planned sessions only where required coverage is missing. It performs interactions, live DOM inspections (including visible same-origin frames) and screenshots in one browser. Duplicate DOM findings with identical rule, target, frame/session and message are collapsed; different targets or observations remain separate. Visually hidden native helper controls are excluded only when their own or an ancestor's computed visibility/clipping establishes that they are hidden. It waits for generated lazy page loading, visible mask assets and Cobalt icon fonts. Unavailable visible assets fail the capture instead of recording incomplete chrome. Authored sources and editable Extensions receive source lint; compiled delivery and checksum-verified shell copies remain fingerprinted but are not business-style lint targets.

The resulting `<task-dir>/evidence/<run-id>/capture.json` (`review/final/<run-id>/` without `--temp`) binds the source inventory, static entry, inspection scope and PNG hashes. `verify-surface.mjs --capture <capture.json>` verifies and reuses these artifacts without launching another browser. Source additions/deletions/edits, PNG changes, missing full viewports and development captures are rejected. All delivery JS/CSS/assets remain fingerprinted, including generated bundles.

The final ledger deliberately leaves human accessibility, visual/responsive review, content states and action classification pending. Inspect the captured images and actual action results, record only observations made, then run:

```sh
node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json
```

A new final run archives prior records and images under `<temp-dir>/review/history/`, removes earlier runs from `evidence/` once its ledger is published, marks the current record pending during recapture, and preserves history even if build/capture fails. Never copy old pass statuses onto changed inputs. To check an already completed unchanged review, use `--check-evidence`, not another final run. Any edit after final capture requires a new final run after the related fixes are complete.

When Chromium remains unavailable after its built-in retry, retain the existing honest fallback: `verify-surface.mjs --url <static-entry> --source <task-dir> --out <task-dir>` records unverified rendered coverage. Explain diagnostics and unverified checks; do not loop on custom CDP scripts or invent pass statuses. Static delivery, source/style hashes, presentation order and POC handoff contracts remain unchanged.
