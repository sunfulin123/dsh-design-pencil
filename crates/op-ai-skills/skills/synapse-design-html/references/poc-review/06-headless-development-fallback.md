## Headless development fallback

Batch related fixes, then check two or three representative sessions: the main view, its principal dialog and its principal drawer. Choose actual selectors from the implementation. Do not omit requested features to make verification shorter.

```sh
node scripts/review-poc.mjs dev --url http://127.0.0.1:<preview-port>/ --source <task-dir> --out <task-dir> --temp <temp-dir> --steps <temp-dir>/review/steps.json --sessions main,dialog,drawer
```

Without a plan the tool captures desktop and phone main views. With a plan it defaults to the first three sessions; `--sessions` selects exact names. `--viewports 1440,390` runs the selected sessions at those widths. `--scheme light|dark` emulates the browser appearance; applications with an explicit theme menu still require their own theme actions. Each run launches one browser and reports counts/timings.

Development output stays under `<temp-dir>/review/dev/` and `<temp-dir>/review/dev-report.json` (under `<task-dir>/review/` when no `--temp` is given). It never builds delivery, overwrites `evidence-report.json` or supplies handoff evidence. A source change during capture fails rather than producing mixed-revision evidence.
