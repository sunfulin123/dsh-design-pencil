# Knowledge guidance

Scope: this knowledge base. Read the [index](README.md), current product and
standards entries, and only the additional knowledge relevant to the task.

- Check provenance before relying on facts. A changed/missing source means review is required;
  a recent date alone proves nothing. Never treat stale knowledge as an implicit default.
- Update product, architecture, commands and standards in their authoritative documents.
  Keep this KB focused on current scope, links, verified constraints and their reasons.
- During implementation update affected facts, not only at the end of a task.
  New features may affect knowledge even if no existing source mapping names their files.
- After checking facts, use `tools/knowledge.py review` with the active Task-ID,
  a specific reason, and truthful source/test evidence. It records source hashes and
  automatically adds the knowledge receipt to the task note; it does not verify prose for you.
- Use `unchanged` only after review and explain why. If nothing is affected, record a
  specific no-impact reason in the task note. Do not generate meaningless documentation diffs.
- Do not erase historical evidence or copy entire standards into a second authority.
  Do not store private designs, credentials or raw logs. Finish only after the gate passes.
