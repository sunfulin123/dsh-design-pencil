---
description: "Verify the current development task against its acceptance criteria, maintenance gates, review checklist and notes."
---

Read [DEVELOPMENT.md](../../DEVELOPMENT.md), [COMMANDS.md](../../COMMANDS.md)
and [REVIEW.md](../../REVIEW.md). Determine the task's scope and base ref without
discarding existing worktree changes. Run the smallest relevant tests and the
maintenance gate with that ref; explicitly enable required host features.
For visual/MCP changes, use an isolated test host and verify actual output.
Use this task's generated Task-ID, not an old note from the diff. Update its actual
commands/results, knowledge-impact receipts and remaining risks. Check current
[knowledge provenance](../../docs/kb/README.md); refresh affected facts or explain why
they are unchanged. Run maintenance with `--task <Task-ID>`, task check and finish.
Include the completed note's link in the final response.
Do not claim skipped checks passed, alter user documents, or automatically commit/push.
