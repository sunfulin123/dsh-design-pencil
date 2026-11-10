# OP quality review

Inspect the relevant node hierarchy and measured layout, then examine a real rendered screenshot. Confirm that the capture shows the intended board and is not empty or stale before judging it. Scope screenshots and diagnostics to the requested design or local edit.

Review in this order:

1. **Task and integrity:** the requested screens and primary action are present; no unrelated content was replaced; prototype paths that were requested can be exercised when the host supports it.
2. **Structure:** inspect reported overflow, collapsed containers, clipping and unexpected empty space. Read back changed nodes instead of assuming a command succeeded.
3. **Visual hierarchy:** identify the main focal point, reading order and action. Check alignment, grouping, spacing, readable type and real content fit.
4. **Style and consistency:** compare typography, palette, surfaces and components against the selected DESIGN and existing document. Check repeated components and applicable states for accidental drift.
5. **Accessibility intent:** inspect text contrast, control size and labels where measurable. State whether each check was actually performed; a screenshot does not prove keyboard behavior or accessibility compliance.

Treat broken tasks, collisions and missing required content as the highest priority; then address legibility, hierarchy and polish. Fix confirmed defects locally and retest the same checks, with a fresh screenshot for visual changes. Structural diagnostics and visual judgment complement one another; neither is a substitute for the other. Report unresolved defects and missing evidence honestly.
