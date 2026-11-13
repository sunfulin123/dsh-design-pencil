# Shared Design Judgement & Quality Floor

Engine-neutral judgement shared by `synapse-design` (editable canvas) and `synapse-design-html` (browser POC). It is deliberately short: it says how to decide and how to prove a decision, and leaves medium-specific technique to `build.md`, HTML/CSS semantics and the on-demand craft reference.

**Precedence:** User requirements > Selected product `DESIGN` > Medium-specific build rules (`build.md` or HTML/CSS semantics) > Domain guidelines > This shared judgement guide. One exception: where a `DESIGN` value would make content unreadable or a control unusable on this surface, keep the content usable, then record the departure and its reason (see Style translation).

## 1. Surface Mode Selection

Choose the surface mode from the user's immediate goal on each screen, never from the company's industry:

- **`Operate` (dashboards, enterprise lists, chats, consoles, editors, settings):** Task completion, scanability, and earned familiarity outrank artistic expression. Establish the product shell, navigation, and dominant work surface first (`width` allocated to the primary work zone; subordinate chrome fixed). The visual style contributes four things only: typography, palette, density, and at most one signature move. Never insert a marketing hero into an operational tool, invent unfamiliar form controls, or put display fonts on UI labels and table cells. Commit to one coherent density tier per screen (compact for dense tables/monitoring, medium for general workspaces, airy for settings/onboarding).
- **`Persuade` (landing pages, product introductions, campaigns, pricing):** Make the offer, audience, proof, and one working primary action unmistakable in the first viewport. Commit to one strong focal demonstration rather than competing gimmicks or generic equal-card templates.
- **`Read` (documentation, articles, reports, changelogs):** Express identity in the frame, navigation rail, and section openers while keeping the reading column calm, legible, and anchored by clear wayfinding.
- **`Experience` (portfolios, showcases, interactive explainers):** Let the artifact or subject occupy the primary viewport immediately while navigation chrome stays quiet and secondary.

## 2. Content States & Edge-Case Resilience

Evaluate all six content states for every journey and data surface: `loading`, `empty`, `error`, `partial`, `success`, and `permission`.

- Design applicable states explicitly and record concrete reasons for any state marked `not-applicable`.
- **Actionable empty states:** Distinguish first-time use, zero filter results, restricted access, and failure. Never write bare *"No data"*; state what belongs here, why it is empty, and offer one clear next action (such as creating the first record or clearing filters).
- **Forms & destructive actions:** Every input requires a persistent visible label (placeholders are examples, not labels). Dropdown and select controls must keep a `12px–16px` trailing inset between the chevron indicator and the right border plus an `8px–12px` gap after the selected value text—never leave a browser UA `<select>` arrow or custom chevron flush against the right border. Validation messages sit beside the offending field and state both what failed and how to fix it. Destructive actions name the target object and consequence rather than using bare `OK`, `Yes`, or `Submit`.
- **Extreme data & localization:** Verify layouts survive long names/titles without spaces, `0` / `1` / `100+` items, large formatted numbers in aligned columns, and `30–40%` text expansion without clipping, colliding, or breaking row alignment.

## 3. Interface Copy & Truthfulness

- Write all authored interface copy inside the design in **English by default**, regardless of the conversation language, unless the user explicitly asks to design in another language (or when preserving the established language of an existing non-English design during a local edit). Never mix half-translated languages on the same screen.
- Lead each state with the single fact the user needs now, followed by the next available action and only the context that changes the decision. Do not repeat the heading in helper copy.
- Use specific `verb + object` labels on primary buttons and navigation items, keeping terminology consistent across every screen.
- Preserve user-supplied facts and domain vocabulary. Clearly identify illustrative sample records; never invent customer testimonials, unverified performance claims, real third-party logos, or fake system status.

## 4. Design Judgement

Each rule states its reason so it can be applied to cases it does not name.

- **Intent.** Before drawing, state who the user is, the task they are completing and what counts as success. Every major decision should trace back to one of these; an element with no such reason is removed. A layout can be tidy and still fail the task, and a decision without a reason cannot be defended or revised.
- **Structure before style.** Settle information hierarchy, which content belongs to which group, and reading order before choosing surfaces, colour or decoration. Borders, cards and extra whitespace do not repair unclear structure; they hide it.
- **Three levels of space.** Distinguish distance between groups, distance within a group, and distance inside a component (content to its own edge). The same relationship uses the same value everywhere; different levels differ visibly (within a group `4–8px`, between groups `24px+`). A heading sits closer to the content it introduces than to the group above it. Sibling groups share one heading indent and one heading-to-content distance. Badges, counters and corner controls keep a clear inset from the edge of their container and never touch or straddle it. One global gap cannot express these relationships, and an empty spacer node used to push content apart hides the relationship instead of stating it; express spacing through grouping, `gap` and `padding`.
- **Hierarchy.** Each screen has one primary region and one primary action. Build priority from scale, weight, position and space, not from colour alone, and keep decoration from competing with the task.
- **Consistency.** Sibling headings, repeated rows, cards, controls and states share anatomy, alignment, size, type level, radius relationship and behaviour across every screen. A difference is allowed only when its purpose can be stated.
- **Geometric and optical alignment.** Establish alignment with layout constraints, then judge the rendered result: icons, CJK glyphs, Latin text and digits have different visual centres, so mathematical centring can still look off. Check icon-to-text baselines, digits inside badges, the visual weight of adjacent buttons, and avatar, icon and text sizes together. Do not centre every child against its container; the two lines of a two-line title belong above and below the centre, and a per-line centring measurement is evidence about that line, not an instruction to move it.
- **Style translation.** A selected style may come from a different kind of surface. Inherit its colour roles, type character, radius language and restraint; set density, type size and component size from the task on this surface. Applying a marketing scale to an operational table, or drifting from the style without saying so, both fail. Record each deliberate departure with its reason.
- **Readable and usable first.** Check contrast, line length, line height, wrapping, icon recognisability, hit areas, visible labels and focus indication. A design must survive content growth, localisation, text scaling and other viewports; it may not depend on ideal-length sample copy.

## 5. Non-Negotiable Quality Floor

Blocking defects. A screen showing any of these is repaired and re-checked before delivery; if it cannot be repaired, report the unfinished scope instead of declaring the work complete.

1. **Missing content.** Planned content, components, states or primary actions are absent or not visible. Blank text, an empty component, an instance override that did not apply, or an unloaded asset is missing content — never treat the gap it leaves as whitespace.
2. **Unreachable action.** A primary action is absent, hidden, covered or has no usable hit area (`44px` recommended on touch and primary controls; below `24px` is critical).
3. **Clipped or overflowing content.** Text or controls are cut off, or a container blows out horizontally.
4. **Overlap.** Elements collide or cover one another unintentionally.
5. **Missing key state.** A state the journey depends on is neither designed nor justified as not applicable.
6. **Broken hierarchy.** No identifiable primary region or action, or competing primary actions.
7. **Unreadable text.** Text, icons or active control boundaries are not legible against their actual rendered surface.
8. **Untruthful content.** Placeholder scaffolding, lorem ipsum, mixed-language chrome, invented claims or dead controls remain.

Below the floor, judge against section 4: restrained elevation without nested cards, structure chosen from real content instead of automatic equal card rows or eyebrow labels above every heading, visible control states, labelled inputs and identifiable icon-only controls.

## 6. Evidence and Delivery

A check proves only what it actually covered. These distinctions are the ones most often blurred:

- A screenshot was produced ≠ it was inspected.
- Automated diagnostics are clean ≠ the design passes. No finding is not a pass; a finding is not automatically a defect. Diagnostics are leads to weigh against the rendered result and the intent.
- A basic tab-order check ≠ accessibility verified.
- An approximate preview ≠ exact canvas evidence.
- A change was applied ≠ the file was saved. A preview generated, a change applied and a file saved are three facts; report each.

**Status of every check:**

- `pass` — the check was executed and its evidence supports the result.
- `fail` — a defect needing repair was found.
- `unverified` — not executed, or the evidence is insufficient. Say what was not covered and why.
- `not-applicable` — irrelevant to this task, with the reason.

Never report `pass` to satisfy a gate. An honest `unverified` is a correct result; a false `pass` is a defect in the delivery.

**Evidence for each check:** what was examined and its scope, the method or tool, what was found, and what was not covered. Name something a reader can verify: a node, a measured size, a place in a screenshot. "Looks correct" is not evidence.

**Version binding:** evidence describes one version of the artifact. Any later change invalidates it for the affected scope, which is checked again.

**Delivered capability:** distinguish a static design, an interactive prototype and a production implementation. Classify each primary action as `verifiable` (it produced an observed result), `visual-only` (it is drawn but does nothing) or `not-implemented`. A notice saying a feature is unavailable shows that the feature is not implemented; it is not a successful verification of that feature.

**Scope fidelity & design upgrade:** when continuing from a confirmed prototype or reference, preserve its confirmed scope (screen list, state range, copy/core flow, and verifiable actions) while elevating visual hierarchy, typography, spacing, and component craft (`deviation: "upgrade"` recorded with `{what, why}`—no user approval needed). Leaving out a screen or surrounding shell, expressing a state differently, or reducing copy/actions is a `substantive` scope deviation: ask before delivering it; a sentence in the handover is not consent.

## 7. Five-Dimension Review Rubric

Report one check per dimension, each with a status and evidence as defined in section 6:

1. `task_integrity` — all planned screens, primary flows and reference scope are present, visible and operable.
2. `structure_overflow` — no clipping, collision, collapsed container or broken alignment in rendered output.
3. `hierarchy_density` — clear focal region, reading order, action prominence, the three levels of space, and density matched to the surface mode.
4. `style_consistency` — typography, colour roles, tokens and linked components follow the selected `DESIGN`, with recorded departures; siblings are consistent.
5. `content_states` — real, complete, visible content in English by default (or the user's explicitly requested UI language, kept consistent in one language), and the six content states designed or justified.
