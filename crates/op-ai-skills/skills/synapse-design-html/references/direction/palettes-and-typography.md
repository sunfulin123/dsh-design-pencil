# Colour and typography review

The selected product style is the authority for colours, typefaces, type scales,
and their intended roles. Read its complete DESIGN first and reuse existing
document tokens. This reference adds review methods; it is not a theme or a
fallback palette. When a specification is missing, derive the minimum needed
for the task from the selected style and user requirements, and document it.

For typography, check role hierarchy, line height, readable line lengths,
available font weights, international characters, and layout at target sizes.
Use tabular numerals where changing figures must align. For colour, check text,
icons, focus indicators and states against their actual rendered backgrounds;
consider transparency, gradients, images, and the active mode. Do not judge a
brand colour negatively because another design guide dislikes it.

For HTML, validate the actual DOM and browser rendering. For Synapse, distinguish
measurable document properties from visual judgments and checks the canvas does
not support. A contrast check does not by itself establish WCAG conformance.

Adapted from the typography and colour review guidance in Impeccable,
design-taste-frontend, and ui-ux-pro-max; see `../../THIRD_PARTY_NOTICES.md`.
