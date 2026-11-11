> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Solid Geometry

> **Synapse precedence:** This is a migrated source playbook. `SKILL.md` overrides it. Ignore any rule here about asking the user (Stage 1 asks once), its own workflow order, starter files, screenshot sizes other than 375/768/1440, or CLIs not present in `scripts/`. Use it only for craft knowledge.


Generated from canonical data. Read only the records relevant to the task.

[Back to catalog](../3dviz-catalog-index.md)

Use the optional `scripts/resolve.py <record-id>` helper to read one record with its sources.

- [Double-cone section explorer](../../../data/recipes/conic-slicing.json) — `recipe.conic-slicing`: Relate a movable plane to its intersection with a double cone.
- [Convex hull of a point cloud](../../../data/recipes/convex-hull-construction.json) — `recipe.convex-hull-construction`: Build the hull of an editable point set and keep its degenerate outcomes visible instead of hiding them.
- [Delaunay tetrahedra and the empty sphere property](../../../data/recipes/delaunay-cell-partition.json) — `recipe.delaunay-cell-partition`: Partition space around a point set and let the defining empty-sphere condition be tested rather than assumed.
- [Minkowski sum and clearance envelopes](../../../data/recipes/minkowski-clearance.json) — `recipe.minkowski-clearance`: Turn a clearance question into a solid: grow an obstacle by a moving part so the answer becomes a containment test.
- [Polyhedron net folding](../../../data/recipes/polyhedron-net.json) — `recipe.polyhedron-net`: Keep face identity and shared edges visible while unfolding a solid.
- [Profile to solid of revolution](../../../data/recipes/solid-of-revolution.json) — `recipe.solid-of-revolution`: Connect a nonnegative profile, its sweep and volume slices.
