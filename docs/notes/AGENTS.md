# Notes guidance

Scope: this directory and its lifecycle subdirectories. Follow the root
[development harness](../../DEVELOPMENT.md) and the [notes guide](README.md).

- Keep only this file, README.md and the three lifecycle folders at the notes root.
- Before each development task run `tools/task_notes.py start` from the repository root.
  It fills [the template](proposed/_template.md), creates a unique Task-ID and
  `proposed/<slug>-<id-prefix>.md`, and snapshots preexisting changes. Never reuse old notes.
- Fill actual changes, validation and knowledge review. Run maintenance with `--task <Task-ID>`,
  then task check/finish; the tool changes status, saves change receipts and moves to implemented.
  Preserve task history, update links, and include this note's link in the final response.
- End an abandoned active task with `tools/task_notes.py archive <Task-ID> --reason "<reason>"`.
  It preserves truthful status/evidence and archive-time changes, then releases registration.
  Do not move active notes or delete private state manually. Move superseded closed history
  to `archived/`; archiving does not mean completion.
- Use a new/updated proposed or implemented record for current-task evidence.
  Editing this guidance, README, the template or archived history does not satisfy the gate.
- Old-format records remain historical. New tasks require v2 identity and knowledge/change receipts.
  Do not manually flip completion, refresh dates or invent evidence to bypass the tool.
- Keep the required metadata and sections. Record exact commands and truthful
  passed/failed/skipped/not-run results; never rewrite a failure as a pass.
- Do not log credentials, private design data or raw long logs. Put reusable,
  verified lessons in the [knowledge base](../kb/README.md).
