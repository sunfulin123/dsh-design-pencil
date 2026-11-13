# Handling revision feedback

Feedback names a symptom. The work is to find the defect behind it, fix its cause, and show what changed.

1. **Look first.** Read the affected nodes and inspect a current screenshot before editing. Locate the specific defect the comment refers to. If the comment is ambiguous and the evidence does not settle what it means, ask before changing anything; a guess that edits the wrong thing costs a second round.
2. **Find the cause.** Decide why the defect exists (a missing grouping level, a wrong token, an override that did not apply, a master defined incorrectly) and fix that, not only the place that was pointed at.
3. **Look for the same problem elsewhere.** A defect in one row, card or heading usually exists in its siblings and on other screens. Check them and fix them together.
4. **Limit the blast radius.** Before the edit, identify the parent, neighbours, shared components and their instances. Before changing a shared master, state which instances will change. Preserve unrelated content, the established style and manual adjustments.
5. **Re-check the affected scope.** At least: the target, its siblings, its parent, the adjacent regions and every affected component instance, with a fresh screenshot. Earlier evidence no longer describes this version.
6. **Report three things.** What was found, what was changed, and what remains unresolved or unverified.

If the same problem is raised a second time, the first diagnosis was wrong. Diagnose again from the rendered result; do not make a smaller adjustment along the same line.
