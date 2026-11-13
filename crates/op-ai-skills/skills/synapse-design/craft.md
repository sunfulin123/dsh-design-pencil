# OP craft reference

Load this when a decision in its area comes up; it is not part of the core prompt. The shared judgement guide (`op-design-judgement`) decides what matters; this page gives the specific checks. Each item states why it exists.

## Typography

- Keep to a small set of type sizes and weights (typically one title, one section heading, one body and one caption size; two or three weights). Many near-identical sizes read as noise, not hierarchy.
- Author the `DESIGN`-specified heading and body `fontFamily` onto every text node (there is no CSS cascade on the `.op` canvas), then compare the rendered typeface with the `DESIGN` specification. Read `fontResolution` (including `fontResolution.designSpec`) from `get_design_quality`: `missingFromCanvas` flags `DESIGN` families never authored onto text nodes; `unregistered` means the renderer does not have the specified family; `weight-substituted` means the family is present in another weight or style. Choose an available bundled family, or on direct MCP hosts with network access call `get_design_quality` with `fetchFonts:true` to download missing faces and re-check (isolated DSH drafts forbid network font fetches), or record the difference as a departure. If the result has no `fontResolution`, report the comparison as `unverified` instead of assuming the font is right.

## Colour and tokens

- Use colour by semantic role (surface, text, border, accent, status). One role keeps one meaning on every screen.
- Bind a token for what it means. A literal that happens to equal a variable's value is not a reason to bind it, and a token for one role is not reused for another: when the theme changes, a border that borrowed a text token changes with the text.

## Interaction

- Give every primary action a visible result, and every state a way in and a way out. The unit of review is the task flow; a single screen is one frame of it.
- Author reactions for the primary path with `set_reactions` / `set_prototype` and exercise them with `simulate_prototype`. A control that is only drawn is `visual-only`; say so.

## Content

- Use real, varied content. The layout must hold empty content, a single item, many items, long unbroken names, large numbers and `30–40%` text expansion.
- After building a region, compare three things: the content that was planned, the content on the nodes, and what the screenshot shows. They must agree before spacing is judged.

## Accessibility

- Check contrast against the actual rendered surface, hit-area size, visible labels, a visible focus indication, and state differences that do not rely on colour alone.
- A static canvas cannot prove keyboard order or screen-reader behaviour. Report those as `unverified`.

## Responsive

- At a narrow viewport every secondary region needs a stated destination and a way to reach it (a drawer, a tab, a following section). Hiding it removes the feature.
- Separate boards at several widths show the intended layouts. They do not prove that a browser reflows between them.

## Structure quality

- Name layers by meaning (`Channel List`, `Unread Badge`), so the file can be handed over and edited.
- Keep component masters outside screen content (`reusable:true` with `previewAsScreen:false`), so a screen is not also a definition.
- Express state differences as component variants or instance overrides, not as an extra wrapper added for one case.
- Before changing a shared master, list its instances; after the change, inspect every affected instance and screen. A fix made for one instance changes all of them.
- After setting instance overrides, read the master's actual descendant ids. An override whose key matches no node is ignored silently, and the instance keeps the master's default content.
