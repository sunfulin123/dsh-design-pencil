---
name: text-rules
description: Text sizing, typography, and wrapping rules
phase: [generation]
trigger: null
priority: 15
budget: 1000
category: base
---

TEXT RULES:

- Body/description in vertical layout: width="fill_container" + textGrowth="fixed-width" (wraps text, auto-sizes height).
- Short labels in horizontal rows: width="fit_content" + textGrowth="auto". Prevents squeezing siblings.
- NEVER fixed pixel width on text inside layout frames — causes overflow.
- Text >15 chars MUST have textGrowth="fixed-width". NEVER set explicit pixel height on text nodes — OMIT height.
- Typography: Display 40-56px, Heading 28-36px, Subheading 20-24px, Body 16-18px, Caption 13-14px.
- lineHeight: headings 1.1-1.2, body 1.4-1.6. letterSpacing: -0.5 for headlines, 0.5-2 for uppercase. These tiers are LATIN-only — CJK text follows cjk-typography (headings 1.3-1.4, body 1.6-1.8); pure-Latin digits/labels inside a CJK design keep the Latin tiers.
- VERTICAL CENTERING: the renderer already centers text by its glyph INK inside the text box (textAlignVertical defaults to "middle"; works for CJK and Latin). To center a label in a button/badge/tab, center the text BOX in its parent (alignItems/justifyContent="center") — do NOT nudge y, padding or lineHeight to fake it, and do NOT switch to text_input to work around blank space. Use textAlignVertical="top"/"bottom" only when top/bottom alignment is really wanted. If a render still looks off, read the glyph-ink offset in the visual evidence before changing anything.
