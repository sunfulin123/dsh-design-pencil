# Shared Design Judgement & Quality Floor

Engine-neutral design decisions shared by `synapse-design` (editable canvas) and `synapse-design-html` (browser POC) so both routes evaluate hierarchy, states, copy, and craft by the same bar.

**Precedence:** User requirements > Selected product `DESIGN` > Medium-specific build rules (`build.md` or HTML/CSS semantics) > Domain guidelines > This shared judgement guide.

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

- Lead each state with the single fact the user needs now, followed by the next available action and only the context that changes the decision. Do not repeat the heading in helper copy.
- Use specific `verb + object` labels on primary buttons and navigation items, keeping terminology consistent across every screen.
- Preserve user-supplied facts and domain vocabulary. Clearly identify illustrative sample records; never invent customer testimonials, unverified performance claims, real third-party logos, or fake system status.

## 4. Non-Negotiable Quality Floor (12 Checks)

Every POC and high-fidelity screen must clear these 12 checks, evaluated in context of the selected `DESIGN`:

1. **Readable contrast:** Text, icons, and active control boundaries remain clearly legible against their actual rendered surface.
2. **Typographic hierarchy:** Distinct scale and weight steps separate page title, section heading, body copy, metadata, and tabular figures, with comfortable reading line lengths.
3. **Restrained elevation:** Layer surfaces through clean luminance steps or subtle offset shadows; avoid glowing halos and unnecessary nested cards ("don't box everything").
4. **Proximity before borders:** Related items sit closer together (`4–8px`) than separate groups (`24px+`), and headings carry more space above them than below them; use hairline dividers only where whitespace alone cannot separate peers.
5. **Single primary focus:** Each screen has one dominant work or focal region and one unmistakable primary action, without competing primary CTAs or ungrouped option overload.
6. **Earned structure (checked against `DESIGN`):** Choose section and card layouts from actual content rather than automatic equal 3-card icon rows, repetitive uppercase eyebrows above every heading, pill/box soup around every metadata token, or arbitrary `01 / 02 / 03` numbering unless the selected `DESIGN` or content sequence calls for them.
7. **Vocabulary & sibling consistency:** Repeated rows, cards, buttons, inputs, and status badges share one structural anatomy, radius relationship, spacing rhythm, and semantic color meaning across all screens.
8. **Interactive states & hit targets:** Controls communicate interactive affordance (`default`, `active`/`selected`, `disabled`, plus hover/focus where supported) and provide comfortable hit areas (`44px` target recommendation on touch/primary controls, `< 24px` treated as critical) without overlapping or clipping neighbors.
9. **Labels & assistive clarity:** Inputs keep visible labels, icon-only controls carry clear identity, and capabilities not verified by the current renderer (such as live keyboard order on a static screenshot) are reported honestly.
10. **Overflow resilience:** Flexible containers allow long strings, multilingual copy, and multi-column tables to wrap or truncate cleanly without horizontal blowout or clipped actions.
11. **Truthful, complete content:** Data surfaces carry realistic, varied domain content with zero `placeholder` scaffolding, lorem ipsum, mixed-language UI chrome, or dead controls left behind.
12. **Version-bound visual evidence:** Completion requires inspecting actual rendered screenshots of the current artifact version and recording findings honestly.

## 5. Five-Dimension Review Rubric

Record structured visual and quality observations across all five dimensions before finishing:

1. `task_integrity` — All planned screens, primary user flows, and POC/reference scope are present and operable.
2. `structure_overflow` — Zero text/control clipping, element collision, collapsed containers, or broken alignment in rendered output.
3. `hierarchy_density` — Clear focal region, reading order, action prominence, and density matched to the surface mode.
4. `style_consistency` — Typography, color roles, spacing scale, tokens, and linked components match the selected `DESIGN` without drift.
5. `content_states` — Realistic domain copy, language/CJK consistency, and explicit coverage or justified non-applicability of the six content states.
