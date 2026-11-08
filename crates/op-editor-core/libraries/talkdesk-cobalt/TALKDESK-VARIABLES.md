# Talkdesk Cobalt CSS variables: complete reference

This document lists every CSS custom property that Talkdesk's Cobalt design system ships in its production theme and base stylesheet. It is the name-by-name companion to [DESIGN.md](./DESIGN.md), which explains how to use these values.

## Sources

| Source | Address | What it contributes |
|---|---|---|
| Theme, light and dark | `https://prd-cdn-talkdesk.talkdesk.com/cobalt/theme-light/4.1.6/styles.css` | 782 light declarations, 471 dark overrides, 19 scoped surface rules |
| Theme, JSON | `https://prd-cdn-talkdesk.talkdesk.com/cobalt/theme-light/4.1.6/styles.json` | 782 entries with camelCase keys (light values only) |
| Base stylesheet | `https://prd-cdn-talkdesk.talkdesk.com/cobalt-design/v27.0.0-1/cobalt.css` | 665 declarations for 218 names, all under `.cobalt--27_0_0-1` |

Versions: 4.1.6 is the current theme in the Cobalt repository. The 4.1.3 theme you referenced has identical light and dark custom property values and identical styles.json entries. The only change in custom properties is in the surface scope rules (section 10): 4.1.6 keeps 7 of the 7 rules from 4.1.3 and adds 12 `@scope` rules.

Totals: 876 distinct names = 782 theme names + 94 base-only names. 124 base-stylesheet names are also theme names.

`styles.json` omits the double quotes in 5 values (the four font-family names and `--cdn-base-url`). This document uses the CSS values, which include the quotes. The rest of the JSON matches the CSS exactly.

Out of scope: SCSS variables in the Cobalt source, Figma variables with no CSS name, React component internals, and Atlas or Meza runtime configuration.

## Read first

1. **Legacy scales are overridden inside the Cobalt root.** `cobalt.css` redefines 122 legacy steps (`--gray-100` to `--gray-900`, `--primary-200` to `--primary-900` and the rest) under `.cobalt--27_0_0-1`. 32 of those values differ from the theme. For example, `--primary-500` is `#1E7BFC` inside the root and `#8635f2` outside it. Use the Colors 2.0 steps 1 to 12 instead.
2. **Legacy scales do not change with the theme.** 0 of 164 legacy names are in the dark block. `cobalt.css` does not reference `data-co-colorscheme`.
3. **Some names are declared more than once.** `--black`, `--illustration-action`, `--illustration-gradient-end`, `--illustration-gradient-start`, `--illustration-subject`, `--white`. The last declaration in a block is the effective value. The illustration tokens depend on this order: the TD recipe is the later declaration.
4. **Semantic names are aliases.** `--primary-N` resolves to `--purple-N` in both themes, and the other roles resolve to their families. Their values change with the theme only through the primitive they point to.
5. **Surface containers redefine `--background-color`.** 4.1.6 has 19 scoped declarations (section 10); 4.1.3 has 7. They all set `--background-color`.

## How to read the tables

- **Light** and **Dark** show the effective value in each theme after `var()` and `calc()` are resolved. `→ --name` shows the alias target of the effective declaration.
- Dark uses its own declaration when the dark block has one, and the light declaration otherwise.
- **styles.json key** is the camelCase key in `styles.json`. `—` means the name is not in that file.
- **Role** is a short usage note from the design file. When the design file says nothing, the row says so.
- Step roles follow the Radix Colors convention, which the design file says the palette is generated with.
- Switch themes by setting `data-co-colorscheme` on `<html>` (see DESIGN.md, Implementation).

## Summary

| Section | Names | In dark block |
|---|---|---|
| 1.1 Solid colour steps | 120 | 120 |
| 1.2 Alpha colour steps | 120 | 120 |
| 1.3 Supporting colours | 40 | 40 |
| 2. Semantic colour roles | 168 | 168 |
| 3.1 Text colours | 9 | 8 |
| 3.2 Surfaces and page | 8 | 6 |
| 3.3 Overlays and focus | 6 | 3 |
| 3.4 Illustration | 4 | 4 |
| 4. Typography | 29 | 0 |
| 5. Spacing | 43 | 0 |
| 6. Radius and border width | 26 | 0 |
| 7.1 Opacity | 10 | 0 |
| 7.2 Shadows | 16 | 0 |
| 7.3 Z-index | 7 | 0 |
| 8. Legacy scales | 164 | 0 |
| 9.1 Workspace shell | 9 | 0 |
| 9.2 Other | 3 | 2 |
| 10. Scoped surface rules | 19 declarations | — |
| 11. cobalt.css names also in the theme | 124 | 0 |
| 12. cobalt.css-only names | 94 | — |

## 1.1 Solid colour steps

Colour primitives, steps 1 to 12 for each family. Step roles follow the Radix Colors convention that the design file says the palette uses.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--red-1` | `red1` | `#fffcfc` | `#201817` | App background. |
| `--red-2` | `red2` | `#fff8f7` | `#261a18` | Subtle background. |
| `--red-3` | `red3` | `#ffebe8` | `#401915` | UI element background. |
| `--red-4` | `red4` | `#ffdbd4` | `#551510` | Hovered UI element background. |
| `--red-5` | `red5` | `#ffcdc4` | `#641b14` | Active or selected UI element background. |
| `--red-6` | `red6` | `#ffbdb2` | `#73271f` | Subtle border and separator. |
| `--red-7` | `red7` | `#f7a89c` | `#8b362d` | UI element border and focus ring. |
| `--red-8` | `red8` | `#ee8d7f` | `#b3473b` | Hovered UI element border. |
| `--red-9` | `red9` | `#db362a` | `#db362a` | Solid background. |
| `--red-10` | `red10` | `#cc2018` | `#b4483c` | Hovered solid background. |
| `--red-11` | `red11` | `#d22b21` | `#ff9080` | Low-contrast text. |
| `--red-12` | `red12` | `#621f18` | `#fed2cb` | High-contrast text. |
| `--orange-1` | `orange1` | `#fefcfb` | `#1f1815` | App background. |
| `--orange-2` | `orange2` | `#fff5ef` | `#271b16` | Subtle background. |
| `--orange-3` | `orange3` | `#ffe9dc` | `#3c2014` | UI element background. |
| `--orange-4` | `orange4` | `#ffd7c2` | `#521d04` | Hovered UI element background. |
| `--orange-5` | `orange5` | `#ffc9af` | `#5f2408` | Active or selected UI element background. |
| `--orange-6` | `orange6` | `#ffb999` | `#6e3117` | Subtle border and separator. |
| `--orange-7` | `orange7` | `#ffa57f` | `#854124` | UI element border and focus ring. |
| `--orange-8` | `orange8` | `#f68c60` | `#aa522d` | Hovered UI element border. |
| `--orange-9` | `orange9` | `#ff6300` | `#ff6300` | Solid background. |
| `--orange-10` | `orange10` | `#f35400` | `#f15600` | Hovered solid background. |
| `--orange-11` | `orange11` | `#d94300` | `#ff9c6e` | Low-contrast text. |
| `--orange-12` | `orange12` | `#5a2c18` | `#ffdbc9` | High-contrast text. |
| `--yellow-1` | `yellow1` | `#fefdfb` | `#1d1a15` | App background. |
| `--yellow-2` | `yellow2` | `#fff9e7` | `#231e16` | Subtle background. |
| `--yellow-3` | `yellow3` | `#fff1c4` | `#332612` | UI element background. |
| `--yellow-4` | `yellow4` | `#ffe7ac` | `#422c00` | Hovered UI element background. |
| `--yellow-5` | `yellow5` | `#ffdc8e` | `#4e3400` | Active or selected UI element background. |
| `--yellow-6` | `yellow6` | `#ffcc61` | `#5a4112` | Subtle border and separator. |
| `--yellow-7` | `yellow7` | `#f7bb52` | `#6e5221` | UI element border and focus ring. |
| `--yellow-8` | `yellow8` | `#e7a200` | `#8b682a` | Hovered UI element border. |
| `--yellow-9` | `yellow9` | `#eda813` | `#eda813` | Solid background. |
| `--yellow-10` | `yellow10` | `#e29d00` | `#e29d00` | Hovered solid background. |
| `--yellow-11` | `yellow11` | `#a26a00` | `#fabc51` | Low-contrast text. |
| `--yellow-12` | `yellow12` | `#4b3718` | `#fbe4c1` | High-contrast text. |
| `--green-1` | `green1` | `#fbfefc` | `#131d17` | App background. |
| `--green-2` | `green2` | `#f4fbf6` | `#16211a` | Subtle background. |
| `--green-3` | `green3` | `#e6f6eb` | `#113320` | UI element background. |
| `--green-4` | `green4` | `#d6f1df` | `#024124` | Hovered UI element background. |
| `--green-5` | `green5` | `#c4e8d0` | `#004e2b` | Active or selected UI element background. |
| `--green-6` | `green6` | `#aeddbf` | `#005c34` | Subtle border and separator. |
| `--green-7` | `green7` | `#90cea7` | `#006d3e` | UI element border and focus ring. |
| `--green-8` | `green8` | `#61b885` | `#008149` | Hovered UI element border. |
| `--green-9` | `green9` | `#00874f` | `#00874f` | Solid background. |
| `--green-10` | `green10` | `#007942` | `#007942` | Hovered solid background. |
| `--green-11` | `green11` | `#00814a` | `#67d093` | Low-contrast text. |
| `--green-12` | `green12` | `#1d3b29` | `#9ff7c0` | High-contrast text. |
| `--teal-1` | `teal1` | `#fafdfe` | `#111c1d` | App background. |
| `--teal-2` | `teal2` | `#f2fbfb` | `#142121` | Subtle background. |
| `--teal-3` | `teal3` | `#ddf7f8` | `#093133` | UI element background. |
| `--teal-4` | `teal4` | `#c9f2f3` | `#003d40` | Hovered UI element background. |
| `--teal-5` | `teal5` | `#b4eaec` | `#00494c` | Active or selected UI element background. |
| `--teal-6` | `teal6` | `#9ddee1` | `#00575b` | Subtle border and separator. |
| `--teal-7` | `teal7` | `#7ccfd2` | `#0c6a6d` | UI element border and focus ring. |
| `--teal-8` | `teal8` | `#3fbabf` | `#0c8387` | Hovered UI element border. |
| `--teal-9` | `teal9` | `#4bc4c9` | `#4bc4c9` | Solid background. |
| `--teal-10` | `teal10` | `#3db9be` | `#3db9be` | Hovered solid background. |
| `--teal-11` | `teal11` | `#008085` | `#57cfd4` | Low-contrast text. |
| `--teal-12` | `teal12` | `#093d3f` | `#b9eff1` | High-contrast text. |
| `--blue-1` | `blue1` | `#fdfdfe` | `#0f1a2e` | App background. |
| `--blue-2` | `blue2` | `#f6faff` | `#0f1c35` | Subtle background. |
| `--blue-3` | `blue3` | `#ecf2ff` | `#062464` | UI element background. |
| `--blue-4` | `blue4` | `#ddeaff` | `#002885` | Hovered UI element background. |
| `--blue-5` | `blue5` | `#cce0ff` | `#00319b` | Active or selected UI element background. |
| `--blue-6` | `blue6` | `#b8d3ff` | `#033cad` | Subtle border and separator. |
| `--blue-7` | `blue7` | `#a0c0fc` | `#0847c5` | UI element border and focus ring. |
| `--blue-8` | `blue8` | `#7fa7f3` | `#0653e7` | Hovered UI element border. |
| `--blue-9` | `blue9` | `#003fbd` | `#003fbd` | Solid background. |
| `--blue-10` | `blue10` | `#002baa` | `#00329c` | Hovered solid background. |
| `--blue-11` | `blue11` | `#275dcc` | `#87b5ff` | Low-contrast text. |
| `--blue-12` | `blue12` | `#162e5e` | `#cbe2ff` | High-contrast text. |
| `--purple-1` | `purple1` | `#fcfcff` | `#1a162c` | App background. |
| `--purple-2` | `purple2` | `#f9f8ff` | `#1c1735` | Subtle background. |
| `--purple-3` | `purple3` | `#f2f0ff` | `#2d1366` | UI element background. |
| `--purple-4` | `purple4` | `#e8e4ff` | `#3c008f` | Hovered UI element background. |
| `--purple-5` | `purple5` | `#ded8ff` | `#4600a1` | Active or selected UI element background. |
| `--purple-6` | `purple6` | `#d1c8ff` | `#4f10b1` | Subtle border and separator. |
| `--purple-7` | `purple7` | `#beb3ff` | `#5c1ec9` | UI element border and focus ring. |
| `--purple-8` | `purple8` | `#a794ff` | `#6e21ef` | Hovered UI element border. |
| `--purple-9` | `purple9` | `#5405bd` | `#5405bd` | Solid background. |
| `--purple-10` | `purple10` | `#4600a6` | `#44009f` | Hovered solid background. |
| `--purple-11` | `purple11` | `#6a41d2` | `#b5a5ff` | Low-contrast text. |
| `--purple-12` | `purple12` | `#331e6b` | `#e1dcff` | High-contrast text. |
| `--midnight-1` | `midnight1` | `#fcfcfe` | `#181a1e` | App background. |
| `--midnight-2` | `midnight2` | `#f8f9fd` | `#1f2025` | Subtle background. |
| `--midnight-3` | `midnight3` | `#eef1f8` | `#262932` | UI element background. |
| `--midnight-4` | `midnight4` | `#e4e9f4` | `#2b303c` | Hovered UI element background. |
| `--midnight-5` | `midnight5` | `#dae0ef` | `#323745` | Active or selected UI element background. |
| `--midnight-6` | `midnight6` | `#d0d7e9` | `#3a4050` | Subtle border and separator. |
| `--midnight-7` | `midnight7` | `#c1cae1` | `#464d60` | UI element border and focus ring. |
| `--midnight-8` | `midnight8` | `#a9b5d5` | `#5c647d` | Hovered UI element border. |
| `--midnight-9` | `midnight9` | `#677291` | `#677291` | Solid background. |
| `--midnight-10` | `midnight10` | `#5a6583` | `#5c657e` | Hovered solid background. |
| `--midnight-11` | `midnight11` | `#5b6584` | `#aab4d1` | Low-contrast text. |
| `--midnight-12` | `midnight12` | `#222838` | `#e6ecf9` | High-contrast text. |
| `--gray-1` | `gray1` | `#fbfcfd` | `#191a1c` | App background. |
| `--gray-2` | `gray2` | `#f8f9fa` | `#1b1d1f` | Subtle background. |
| `--gray-3` | `gray3` | `#eef1f2` | `#272b2f` | UI element background. |
| `--gray-4` | `gray4` | `#e6e9eb` | `#313639` | Hovered UI element background. |
| `--gray-5` | `gray5` | `#dee2e4` | `#3b4044` | Active or selected UI element background. |
| `--gray-6` | `gray6` | `#d6dadd` | `#454a4e` | Subtle border and separator. |
| `--gray-7` | `gray7` | `#cacfd3` | `#51565a` | UI element border and focus ring. |
| `--gray-8` | `gray8` | `#b6bcc0` | `#606569` | Hovered UI element border. |
| `--gray-9` | `gray9` | `#898e93` | `#d7dbde` | Solid background. |
| `--gray-10` | `gray10` | `#7d8287` | `#cdd1d4` | Hovered solid background. |
| `--gray-11` | `gray11` | `#606569` | `#b2b7bc` | Low-contrast text. |
| `--gray-12` | `gray12` | `#1d2123` | `#dee2e5` | High-contrast text. |
| `--neutral-1` | `neutral1` | `#fcfcfd` | `#171b1d` | App background. |
| `--neutral-2` | `neutral2` | `#f8f9fa` | `#1d2123` | Subtle background. |
| `--neutral-3` | `neutral3` | `#eef0f2` | `#25292d` | UI element background. |
| `--neutral-4` | `neutral4` | `#e6e9eb` | `#2b2f33` | Hovered UI element background. |
| `--neutral-5` | `neutral5` | `#dee2e4` | `#313539` | Active or selected UI element background. |
| `--neutral-6` | `neutral6` | `#d6dadd` | `#383d41` | Subtle border and separator. |
| `--neutral-7` | `neutral7` | `#cacfd3` | `#454a4e` | UI element border and focus ring. |
| `--neutral-8` | `neutral8` | `#b7bcc1` | `#5c6265` | Hovered UI element border. |
| `--neutral-9` | `neutral9` | `#888e92` | `#696e72` | Solid background. |
| `--neutral-10` | `neutral10` | `#7e8387` | `#767c80` | Hovered solid background. |
| `--neutral-11` | `neutral11` | `#5f6568` | `#aeb4b8` | Low-contrast text. |
| `--neutral-12` | `neutral12` | `#1c2023` | `#eaeef1` | High-contrast text. |

## 1.2 Alpha colour steps

The same steps with transparency. The design file uses them for borders, component states and colour that lets the background show through.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--red-a1` | `redA1` | `#ff000003` | `#f5000007` | Transparent alpha step 1 (app background). |
| `--red-a2` | `redA2` | `#ff200008` | `#f51b000e` | Transparent alpha step 2 (subtle background). |
| `--red-a3` | `redA3` | `#ff220017` | `#fc15002b` | Transparent alpha step 3 (UI element background). |
| `--red-a4` | `redA4` | `#ff2a012b` | `#fe070042` | Transparent alpha step 4 (hovered UI element background). |
| `--red-a5` | `redA5` | `#ff27013b` | `#fd1d0853` | Transparent alpha step 5 (active or selected UI element background). |
| `--red-a6` | `redA6` | `#ff25004d` | `#fd3b2764` | Transparent alpha step 6 (subtle border and separator). |
| `--red-a7` | `redA7` | `#eb1f0063` | `#ff53417e` | Transparent alpha step 7 (UI element border and focus ring). |
| `--red-a8` | `redA8` | `#de1c0080` | `#fe5d4bab` | Transparent alpha step 8 (hovered UI element border). |
| `--red-a9` | `redA9` | `#d40e00d5` | `#ff3b2dd7` | Transparent alpha step 9 (solid background). |
| `--red-a10` | `redA10` | `#c70900e7` | `#ff5f4dac` | Transparent alpha step 10 (hovered solid background). |
| `--red-a11` | `redA11` | `#cb0c00de` | `#ff9080` | Transparent alpha step 11 (low-contrast text). |
| `--red-a12` | `redA12` | `#520800e7` | `#ffd3ccfe` | Transparent alpha step 12 (high-contrast text). |
| `--orange-a1` | `orangeA1` | `#c0400004` | `#ef000006` | Transparent alpha step 1 (app background). |
| `--orange-a2` | `orangeA2` | `#ff600010` | `#f82c000f` | Transparent alpha step 2 (subtle background). |
| `--orange-a3` | `orangeA3` | `#ff5f0023` | `#ff430026` | Transparent alpha step 3 (UI element background). |
| `--orange-a4` | `orangeA4` | `#ff58003d` | `#fc26003f` | Transparent alpha step 4 (hovered UI element background). |
| `--orange-a5` | `orangeA5` | `#ff530050` | `#ff3c004d` | Transparent alpha step 5 (active or selected UI element background). |
| `--orange-a6` | `orangeA6` | `#ff500066` | `#fe59125e` | Transparent alpha step 6 (subtle border and separator). |
| `--orange-a7` | `orangeA7` | `#ff4c0080` | `#fd6d2f78` | Transparent alpha step 7 (UI element border and focus ring). |
| `--orange-a8` | `orangeA8` | `#f147009f` | `#fe7238a1` | Transparent alpha step 8 (hovered UI element border). |
| `--orange-a9` | `orangeA9` | `#ff6300` | `#ff6300` | Transparent alpha step 9 (solid background). |
| `--orange-a10` | `orangeA10` | `#f35400` | `#fe5900f0` | Transparent alpha step 10 (hovered solid background). |
| `--orange-a11` | `orangeA11` | `#d94300` | `#ff9c6e` | Transparent alpha step 11 (low-contrast text). |
| `--orange-a12` | `orangeA12` | `#491600e7` | `#ffdbc9` | Transparent alpha step 12 (high-contrast text). |
| `--yellow-a1` | `yellowA1` | `#c0800004` | `#da1a0004` | Transparent alpha step 1 (app background). |
| `--yellow-a2` | `yellowA2` | `#ffc00018` | `#eb77000b` | Transparent alpha step 2 (subtle background). |
| `--yellow-a3` | `yellowA3` | `#ffc3013b` | `#fe88001c` | Transparent alpha step 3 (UI element background). |
| `--yellow-a4` | `yellowA4` | `#ffb60053` | `#fd80002d` | Transparent alpha step 4 (hovered UI element background). |
| `--yellow-a5` | `yellowA5` | `#ffb10071` | `#ff8d003a` | Transparent alpha step 5 (active or selected UI element background). |
| `--yellow-a6` | `yellowA6` | `#ffad009e` | `#fda40048` | Transparent alpha step 6 (subtle border and separator). |
| `--yellow-a7` | `yellowA7` | `#f39b00ad` | `#feb22d5e` | Transparent alpha step 7 (UI element border and focus ring). |
| `--yellow-a8` | `yellowA8` | `#e7a200` | `#ffb83b7e` | Transparent alpha step 8 (hovered UI element border). |
| `--yellow-a9` | `yellowA9` | `#eca100ec` | `#ffb413eb` | Transparent alpha step 9 (solid background). |
| `--yellow-a10` | `yellowA10` | `#e29d00` | `#ffb000df` | Transparent alpha step 10 (hovered solid background). |
| `--yellow-a11` | `yellowA11` | `#a26a00` | `#febf52fa` | Transparent alpha step 11 (low-contrast text). |
| `--yellow-a12` | `yellowA12` | `#382200e7` | `#ffe8c4fb` | Transparent alpha step 12 (high-contrast text). |
| `--green-a1` | `greenA1` | `#00c04004` | `#00da0004` | Transparent alpha step 1 (app background). |
| `--green-a2` | `greenA2` | `#00a32f0b` | `#00fa1b08` | Transparent alpha step 2 (subtle background). |
| `--green-a3` | `greenA3` | `#00a43319` | `#00fe511c` | Transparent alpha step 3 (UI element background). |
| `--green-a4` | `greenA4` | `#00a83829` | `#00fc542c` | Transparent alpha step 4 (hovered UI element background). |
| `--green-a5` | `greenA5` | `#019c343b` | `#00ff653a` | Transparent alpha step 5 (active or selected UI element background). |
| `--green-a6` | `greenA6` | `#00943651` | `#00fe744a` | Transparent alpha step 6 (subtle border and separator). |
| `--green-a7` | `greenA7` | `#008f356f` | `#00fd7c5d` | Transparent alpha step 7 (UI element border and focus ring). |
| `--green-a8` | `greenA8` | `#008d3a9e` | `#00ff8373` | Transparent alpha step 8 (hovered UI element border). |
| `--green-a9` | `greenA9` | `#00874f` | `#00fd887a` | Transparent alpha step 9 (solid background). |
| `--green-a10` | `greenA10` | `#007942` | `#00ff7b6a` | Transparent alpha step 10 (hovered solid background). |
| `--green-a11` | `greenA11` | `#00814a` | `#7bffb2cb` | Transparent alpha step 11 (low-contrast text). |
| `--green-a12` | `greenA12` | `#00220ee2` | `#a3fec5f7` | Transparent alpha step 12 (high-contrast text). |
| `--teal-a1` | `tealA1` | `#0099cc05` | `#009ada04` | Transparent alpha step 1 (app background). |
| `--teal-a2` | `tealA2` | `#00b1b10d` | `#00fafa08` | Transparent alpha step 2 (subtle background). |
| `--teal-a3` | `tealA3` | `#00c3cb22` | `#00ecfe1c` | Transparent alpha step 3 (UI element background). |
| `--teal-a4` | `tealA4` | `#00c2c736` | `#00eafc2b` | Transparent alpha step 4 (hovered UI element background). |
| `--teal-a5` | `tealA5` | `#01b8bf4b` | `#00f1fe38` | Transparent alpha step 5 (active or selected UI element background). |
| `--teal-a6` | `tealA6` | `#00aab162` | `#00effd49` | Transparent alpha step 6 (subtle border and separator). |
| `--teal-a7` | `tealA7` | `#00a2a883` | `#00f5fd5d` | Transparent alpha step 7 (UI element border and focus ring). |
| `--teal-a8` | `tealA8` | `#00a4aac0` | `#00f5fd7a` | Transparent alpha step 8 (hovered UI element border). |
| `--teal-a9` | `tealA9` | `#00acb3b4` | `#5af9ffc3` | Transparent alpha step 9 (solid background). |
| `--teal-a10` | `tealA10` | `#00a3aac2` | `#4bf8ffb7` | Transparent alpha step 10 (hovered solid background). |
| `--teal-a11` | `tealA11` | `#008085` | `#65f8fed0` | Transparent alpha step 11 (low-contrast text). |
| `--teal-a12` | `tealA12` | `#003638f6` | `#c2fcfef0` | Transparent alpha step 12 (high-contrast text). |
| `--blue-a1` | `blueA1` | `#00008002` | `#001af817` | Transparent alpha step 1 (app background). |
| `--blue-a2` | `blueA2` | `#0072ff09` | `#002bf91f` | Transparent alpha step 2 (subtle background). |
| `--blue-a3` | `blueA3` | `#0051ff13` | `#0038fd53` | Transparent alpha step 3 (UI element background). |
| `--blue-a4` | `blueA4` | `#0062ff22` | `#0038fd78` | Transparent alpha step 4 (hovered UI element background). |
| `--blue-a5` | `blueA5` | `#0064ff33` | `#0043ff90` | Transparent alpha step 5 (active or selected UI element background). |
| `--blue-a6` | `blueA6` | `#0061ff47` | `#004fffa4` | Transparent alpha step 6 (subtle border and separator). |
| `--blue-a7` | `blueA7` | `#0056f75f` | `#0256febf` | Transparent alpha step 7 (UI element border and focus ring). |
| `--blue-a8` | `blueA8` | `#0050e880` | `#0459fee5` | Transparent alpha step 8 (hovered UI element border). |
| `--blue-a9` | `blueA9` | `#003fbd` | `#004effb6` | Transparent alpha step 9 (solid background). |
| `--blue-a10` | `blueA10` | `#002baa` | `#0045ff91` | Transparent alpha step 10 (hovered solid background). |
| `--blue-a11` | `blueA11` | `#0040c3d8` | `#87b5ff` | Transparent alpha step 11 (low-contrast text). |
| `--blue-a12` | `blueA12` | `#001a4fe9` | `#cbe2ff` | Transparent alpha step 12 (high-contrast text). |
| `--purple-a1` | `purpleA1` | `#0000ff03` | `#1a00f515` | Transparent alpha step 1 (app background). |
| `--purple-a2` | `purpleA2` | `#2500ff07` | `#2b02f91f` | Transparent alpha step 2 (subtle background). |
| `--purple-a3` | `purpleA3` | `#2200ff0f` | `#5305fe55` | Transparent alpha step 3 (UI element background). |
| `--purple-a4` | `purpleA4` | `#2600ff1b` | `#5c00fe83` | Transparent alpha step 4 (hovered UI element background). |
| `--purple-a5` | `purpleA5` | `#2800ff27` | `#6400fe97` | Transparent alpha step 5 (active or selected UI element background). |
| `--purple-a6` | `purpleA6` | `#2a00ff37` | `#6a0bfea9` | Transparent alpha step 6 (subtle border and separator). |
| `--purple-a7` | `purpleA7` | `#2500ff4c` | `#7120ffc3` | Transparent alpha step 7 (UI element border and focus ring). |
| `--purple-a8` | `purpleA8` | `#2e01ff6b` | `#7421feee` | Transparent alpha step 8 (hovered UI element border). |
| `--purple-a9` | `purpleA9` | `#5100bcfa` | `#6c00ffb6` | Transparent alpha step 9 (solid background). |
| `--purple-a10` | `purpleA10` | `#4600a6` | `#6200fe95` | Transparent alpha step 10 (hovered solid background). |
| `--purple-a11` | `purpleA11` | `#3700c3be` | `#b5a5ff` | Transparent alpha step 11 (low-contrast text). |
| `--purple-a12` | `purpleA12` | `#180057e1` | `#e1dcff` | Transparent alpha step 12 (high-contrast text). |
| `--midnight-a1` | `midnightA1` | `#0000aa03` | `#001be705` | Transparent alpha step 1 (app background). |
| `--midnight-a2` | `midnightA2` | `#0025b707` | `#7d90f20d` | Transparent alpha step 2 (subtle background). |
| `--midnight-a3` | `midnightA3` | `#002d9611` | `#8ca8fd1b` | Transparent alpha step 3 (UI element background). |
| `--midnight-a4` | `midnightA4` | `#0030981b` | `#8daeff26` | Transparent alpha step 4 (hovered UI element background). |
| `--midnight-a5` | `midnightA5` | `#002a9125` | `#9ab5ff30` | Transparent alpha step 5 (active or selected UI element background). |
| `--midnight-a6` | `midnightA6` | `#0026882f` | `#a0b9fc3d` | Transparent alpha step 6 (subtle border and separator). |
| `--midnight-a7` | `midnightA7` | `#0026843e` | `#aac1ff4e` | Transparent alpha step 7 (UI element border and focus ring). |
| `--midnight-a8` | `midnightA8` | `#00248356` | `#b2c4fd6f` | Transparent alpha step 8 (hovered UI element border). |
| `--midnight-a9` | `midnightA9` | `#00134798` | `#aec3ff85` | Transparent alpha step 9 (solid background). |
| `--midnight-a10` | `midnightA10` | `#001140a5` | `#b0c4fd70` | Transparent alpha step 10 (hovered solid background). |
| `--midnight-a11` | `midnightA11` | `#001040a4` | `#cedbffcc` | Transparent alpha step 11 (low-contrast text). |
| `--midnight-a12` | `midnightA12` | `#000719dd` | `#ebf1fef9` | Transparent alpha step 12 (high-contrast text). |
| `--gray-a1` | `grayA1` | `#00408004` | `#001ac403` | Transparent alpha step 1 (app background). |
| `--gray-a2` | `grayA2` | `#00254907` | `#459aef06` | Transparent alpha step 2 (subtle background). |
| `--gray-a3` | `grayA3` | `#002d3c11` | `#a4cff918` | Transparent alpha step 3 (UI element background). |
| `--gray-a4` | `grayA4` | `#001f3319` | `#c2e6fc23` | Transparent alpha step 4 (hovered UI element background). |
| `--gray-a5` | `grayA5` | `#001f2f21` | `#cee9fe2f` | Transparent alpha step 5 (active or selected UI element background). |
| `--gray-a6` | `grayA6` | `#00192c29` | `#d8eeff3a` | Transparent alpha step 6 (subtle border and separator). |
| `--gray-a7` | `grayA7` | `#00192c35` | `#ddeffd48` | Transparent alpha step 7 (UI element border and focus ring). |
| `--gray-a8` | `grayA8` | `#00152349` | `#e5f4ff58` | Transparent alpha step 8 (hovered UI element border). |
| `--gray-a9` | `grayA9` | `#000b1676` | `#f6fafedb` | Transparent alpha step 9 (solid background). |
| `--gray-a10` | `grayA10` | `#000a1482` | `#f5fafed0` | Transparent alpha step 10 (hovered solid background). |
| `--gray-a11` | `grayA11` | `#00080f9f` | `#f0f7feb5` | Transparent alpha step 11 (low-contrast text). |
| `--gray-a12` | `grayA12` | `#000507e2` | `#f6fbfee3` | Transparent alpha step 12 (high-contrast text). |
| `--neutral-a1` | `neutralA1` | `#00005503` | `#005ada04` | Transparent alpha step 1 (app background). |
| `--neutral-a2` | `neutralA2` | `#00254907` | `#60bdeb0b` | Transparent alpha step 2 (subtle background). |
| `--neutral-a3` | `neutralA3` | `#001e3c11` | `#9ac8f716` | Transparent alpha step 3 (UI element background). |
| `--neutral-a4` | `neutralA4` | `#001f3319` | `#b5dafe1c` | Transparent alpha step 4 (hovered UI element background). |
| `--neutral-a5` | `neutralA5` | `#001f2f21` | `#c2dffc23` | Transparent alpha step 5 (active or selected UI element background). |
| `--neutral-a6` | `neutralA6` | `#00192c29` | `#c7e4fc2c` | Transparent alpha step 6 (subtle border and separator). |
| `--neutral-a7` | `neutralA7` | `#00192c35` | `#d8eeff3a` | Transparent alpha step 7 (UI element border and focus ring). |
| `--neutral-a8` | `neutralA8` | `#00122448` | `#e3f5fe54` | Transparent alpha step 8 (hovered UI element border). |
| `--neutral-a9` | `neutralA9` | `#000d1677` | `#e8f5ff62` | Transparent alpha step 9 (solid background). |
| `--neutral-a10` | `neutralA10` | `#000a1281` | `#e8f6ff72` | Transparent alpha step 10 (hovered solid background). |
| `--neutral-a11` | `neutralA11` | `#000a0fa0` | `#f1f9ffb0` | Transparent alpha step 11 (low-contrast text). |
| `--neutral-a12` | `neutralA12` | `#000508e3` | `#f7fbfef0` | Transparent alpha step 12 (high-contrast text). |

## 1.3 Supporting colours

Per-family support values. `contrast` is the text colour on a solid step-9 fill.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--red-contrast` | `redContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--red-indicator` | `redIndicator` | `#db362a` | `#db362a` | Indicator colour. Same as step 9. |
| `--red-surface` | `redSurface` | `#fff6f5cc` | `#321a1780` | Tinted surface for this family. |
| `--red-track` | `redTrack` | `#db362a` | `#db362a` | Track colour. Same as step 9. |
| `--orange-contrast` | `orangeContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--orange-indicator` | `orangeIndicator` | `#ff6300` | `#ff6300` | Indicator colour. Same as step 9. |
| `--orange-surface` | `orangeSurface` | `#fff3ebcc` | `#341c1380` | Tinted surface for this family. |
| `--orange-track` | `orangeTrack` | `#ff6300` | `#ff6300` | Track colour. Same as step 9. |
| `--yellow-contrast` | `yellowContrast` | `#2c1f09` | `#2c1f09` | Text colour on a solid step-9 fill. |
| `--yellow-indicator` | `yellowIndicator` | `#eda813` | `#eda813` | Indicator colour. Same as step 9. |
| `--yellow-surface` | `yellowSurface` | `#fff8e1cc` | `#2c221380` | Tinted surface for this family. |
| `--yellow-track` | `yellowTrack` | `#eda813` | `#eda813` | Track colour. Same as step 9. |
| `--green-contrast` | `greenContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--green-indicator` | `greenIndicator` | `#00874f` | `#00874f` | Indicator colour. Same as step 9. |
| `--green-surface` | `greenSurface` | `#f1faf4cc` | `#13281a80` | Tinted surface for this family. |
| `--green-track` | `greenTrack` | `#00874f` | `#00874f` | Track colour. Same as step 9. |
| `--teal-contrast` | `tealContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--teal-indicator` | `tealIndicator` | `#4bc4c9` | `#4bc4c9` | Indicator colour. Same as step 9. |
| `--teal-surface` | `tealSurface` | `#effafacc` | `#0f282880` | Tinted surface for this family. |
| `--teal-track` | `tealTrack` | `#4bc4c9` | `#4bc4c9` | Track colour. Same as step 9. |
| `--blue-contrast` | `blueContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--blue-indicator` | `blueIndicator` | `#003fbd` | `#003fbd` | Indicator colour. Same as step 9. |
| `--blue-surface` | `blueSurface` | `#f4f9ffcc` | `#051e5080` | Tinted surface for this family. |
| `--blue-track` | `blueTrack` | `#003fbd` | `#003fbd` | Track colour. Same as step 9. |
| `--purple-contrast` | `purpleContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--purple-indicator` | `purpleIndicator` | `#5405bd` | `#5405bd` | Indicator colour. Same as step 9. |
| `--purple-surface` | `purpleSurface` | `#f8f6ffcc` | `#1e155080` | Tinted surface for this family. |
| `--purple-track` | `purpleTrack` | `#5405bd` | `#5405bd` | Track colour. Same as step 9. |
| `--midnight-contrast` | `midnightContrast` | `#fff` | `#fff` | Text colour on a solid step-9 fill. |
| `--midnight-indicator` | `midnightIndicator` | `#677291` | `#677291` | Indicator colour. Same as step 9. |
| `--midnight-surface` | `midnightSurface` | `#f6f8fdcc` | `#24263080` | Tinted surface for this family. |
| `--midnight-track` | `midnightTrack` | `#677291` | `#677291` | Track colour. Same as step 9. |
| `--gray-contrast` | `grayContrast` | `#ffffff` | `#0e2433` | Text colour on a solid step-9 fill. |
| `--gray-indicator` | `grayIndicator` | `#898e93` | `#d7dbde` | Indicator colour. Same as step 9. |
| `--gray-surface` | `graySurface` | `#f6f8f9cc` | `#1c202480` | Tinted surface for this family. |
| `--gray-track` | `grayTrack` | `#898e93` | `#d7dbde` | Track colour. Same as step 9. |
| `--neutral-contrast` | `neutralContrast` | `#ffffff` | `#ffffff` | Text colour on a solid step-9 fill. |
| `--neutral-indicator` | `neutralIndicator` | `#888e92` | `#696e72` | Indicator colour. Same as step 9. |
| `--neutral-surface` | `neutralSurface` | `#ffffffcc` | `rgba(0, 0, 0, 0.05)` | Tinted surface for this family. |
| `--neutral-track` | `neutralTrack` | `#888e92` | `#696e72` | Track colour. Same as step 9. |

## 2. Semantic colour roles

`primary` is purple, `secondary` is neutral, `info` is blue, `success` is green, `warning` is yellow and `error` is red. Each role resolves to its family in both themes.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--primary-1` | `primary1` | `#fcfcff` → `--purple-1` | `#1a162c` → `--purple-1` | Brand. App background. |
| `--primary-2` | `primary2` | `#f9f8ff` → `--purple-2` | `#1c1735` → `--purple-2` | Brand. Subtle background. |
| `--primary-3` | `primary3` | `#f2f0ff` → `--purple-3` | `#2d1366` → `--purple-3` | Brand. UI element background. |
| `--primary-4` | `primary4` | `#e8e4ff` → `--purple-4` | `#3c008f` → `--purple-4` | Brand. Hovered UI element background. |
| `--primary-5` | `primary5` | `#ded8ff` → `--purple-5` | `#4600a1` → `--purple-5` | Brand. Active or selected UI element background. |
| `--primary-6` | `primary6` | `#d1c8ff` → `--purple-6` | `#4f10b1` → `--purple-6` | Brand. Subtle border and separator. |
| `--primary-7` | `primary7` | `#beb3ff` → `--purple-7` | `#5c1ec9` → `--purple-7` | Brand. UI element border and focus ring. |
| `--primary-8` | `primary8` | `#a794ff` → `--purple-8` | `#6e21ef` → `--purple-8` | Brand. Hovered UI element border. |
| `--primary-9` | `primary9` | `#5405bd` → `--purple-9` | `#5405bd` → `--purple-9` | Brand. Solid background. |
| `--primary-10` | `primary10` | `#4600a6` → `--purple-10` | `#44009f` → `--purple-10` | Brand. Hovered solid background. |
| `--primary-11` | `primary11` | `#6a41d2` → `--purple-11` | `#b5a5ff` → `--purple-11` | Brand. Low-contrast text. |
| `--primary-12` | `primary12` | `#331e6b` → `--purple-12` | `#e1dcff` → `--purple-12` | Brand. High-contrast text. |
| `--primary-a1` | `primaryA1` | `#0000ff03` → `--purple-a1` | `#1a00f515` → `--purple-a1` | Brand. Transparent alpha step 1. |
| `--primary-a2` | `primaryA2` | `#2500ff07` → `--purple-a2` | `#2b02f91f` → `--purple-a2` | Brand. Transparent alpha step 2. |
| `--primary-a3` | `primaryA3` | `#2200ff0f` → `--purple-a3` | `#5305fe55` → `--purple-a3` | Brand. Transparent alpha step 3. |
| `--primary-a4` | `primaryA4` | `#2600ff1b` → `--purple-a4` | `#5c00fe83` → `--purple-a4` | Brand. Transparent alpha step 4. |
| `--primary-a5` | `primaryA5` | `#2800ff27` → `--purple-a5` | `#6400fe97` → `--purple-a5` | Brand. Transparent alpha step 5. |
| `--primary-a6` | `primaryA6` | `#2a00ff37` → `--purple-a6` | `#6a0bfea9` → `--purple-a6` | Brand. Transparent alpha step 6. |
| `--primary-a7` | `primaryA7` | `#2500ff4c` → `--purple-a7` | `#7120ffc3` → `--purple-a7` | Brand. Transparent alpha step 7. |
| `--primary-a8` | `primaryA8` | `#2e01ff6b` → `--purple-a8` | `#7421feee` → `--purple-a8` | Brand. Transparent alpha step 8. |
| `--primary-a9` | `primaryA9` | `#5100bcfa` → `--purple-a9` | `#6c00ffb6` → `--purple-a9` | Brand. Transparent alpha step 9. |
| `--primary-a10` | `primaryA10` | `#4600a6` → `--purple-a10` | `#6200fe95` → `--purple-a10` | Brand. Transparent alpha step 10. |
| `--primary-a11` | `primaryA11` | `#3700c3be` → `--purple-a11` | `#b5a5ff` → `--purple-a11` | Brand. Transparent alpha step 11. |
| `--primary-a12` | `primaryA12` | `#180057e1` → `--purple-a12` | `#e1dcff` → `--purple-a12` | Brand. Transparent alpha step 12. |
| `--primary-contrast` | `primaryContrast` | `#fff` → `--purple-contrast` | `#fff` → `--purple-contrast` | Brand. Text colour on a solid step-9 fill. |
| `--primary-indicator` | `primaryIndicator` | `#5405bd` → `--purple-indicator` | `#5405bd` → `--purple-indicator` | Brand. Indicator colour. |
| `--primary-surface` | `primarySurface` | `#f8f6ffcc` → `--purple-surface` | `#1e155080` → `--purple-surface` | Brand. Tinted surface for this family. |
| `--primary-track` | `primaryTrack` | `#5405bd` → `--purple-track` | `#5405bd` → `--purple-track` | Brand. Track colour. |
| `--secondary-1` | `secondary1` | `#fcfcfd` → `--neutral-1` | `#171b1d` → `--neutral-1` | Interactive elements and status tags. App background. |
| `--secondary-2` | `secondary2` | `#f8f9fa` → `--neutral-2` | `#1d2123` → `--neutral-2` | Interactive elements and status tags. Subtle background. |
| `--secondary-3` | `secondary3` | `#eef0f2` → `--neutral-3` | `#25292d` → `--neutral-3` | Interactive elements and status tags. UI element background. |
| `--secondary-4` | `secondary4` | `#e6e9eb` → `--neutral-4` | `#2b2f33` → `--neutral-4` | Interactive elements and status tags. Hovered UI element background. |
| `--secondary-5` | `secondary5` | `#dee2e4` → `--neutral-5` | `#313539` → `--neutral-5` | Interactive elements and status tags. Active or selected UI element background. |
| `--secondary-6` | `secondary6` | `#d6dadd` → `--neutral-6` | `#383d41` → `--neutral-6` | Interactive elements and status tags. Subtle border and separator. |
| `--secondary-7` | `secondary7` | `#cacfd3` → `--neutral-7` | `#454a4e` → `--neutral-7` | Interactive elements and status tags. UI element border and focus ring. |
| `--secondary-8` | `secondary8` | `#b7bcc1` → `--neutral-8` | `#5c6265` → `--neutral-8` | Interactive elements and status tags. Hovered UI element border. |
| `--secondary-9` | `secondary9` | `#888e92` → `--neutral-9` | `#696e72` → `--neutral-9` | Interactive elements and status tags. Solid background. |
| `--secondary-10` | `secondary10` | `#7e8387` → `--neutral-10` | `#767c80` → `--neutral-10` | Interactive elements and status tags. Hovered solid background. |
| `--secondary-11` | `secondary11` | `#5f6568` → `--neutral-11` | `#aeb4b8` → `--neutral-11` | Interactive elements and status tags. Low-contrast text. |
| `--secondary-12` | `secondary12` | `#1c2023` → `--neutral-12` | `#eaeef1` → `--neutral-12` | Interactive elements and status tags. High-contrast text. |
| `--secondary-a1` | `secondaryA1` | `#00005503` → `--neutral-a1` | `#005ada04` → `--neutral-a1` | Interactive elements and status tags. Transparent alpha step 1. |
| `--secondary-a2` | `secondaryA2` | `#00254907` → `--neutral-a2` | `#60bdeb0b` → `--neutral-a2` | Interactive elements and status tags. Transparent alpha step 2. |
| `--secondary-a3` | `secondaryA3` | `#001e3c11` → `--neutral-a3` | `#9ac8f716` → `--neutral-a3` | Interactive elements and status tags. Transparent alpha step 3. |
| `--secondary-a4` | `secondaryA4` | `#001f3319` → `--neutral-a4` | `#b5dafe1c` → `--neutral-a4` | Interactive elements and status tags. Transparent alpha step 4. |
| `--secondary-a5` | `secondaryA5` | `#001f2f21` → `--neutral-a5` | `#c2dffc23` → `--neutral-a5` | Interactive elements and status tags. Transparent alpha step 5. |
| `--secondary-a6` | `secondaryA6` | `#00192c29` → `--neutral-a6` | `#c7e4fc2c` → `--neutral-a6` | Interactive elements and status tags. Transparent alpha step 6. |
| `--secondary-a7` | `secondaryA7` | `#00192c35` → `--neutral-a7` | `#d8eeff3a` → `--neutral-a7` | Interactive elements and status tags. Transparent alpha step 7. |
| `--secondary-a8` | `secondaryA8` | `#00122448` → `--neutral-a8` | `#e3f5fe54` → `--neutral-a8` | Interactive elements and status tags. Transparent alpha step 8. |
| `--secondary-a9` | `secondaryA9` | `#000d1677` → `--neutral-a9` | `#e8f5ff62` → `--neutral-a9` | Interactive elements and status tags. Transparent alpha step 9. |
| `--secondary-a10` | `secondaryA10` | `#000a1281` → `--neutral-a10` | `#e8f6ff72` → `--neutral-a10` | Interactive elements and status tags. Transparent alpha step 10. |
| `--secondary-a11` | `secondaryA11` | `#000a0fa0` → `--neutral-a11` | `#f1f9ffb0` → `--neutral-a11` | Interactive elements and status tags. Transparent alpha step 11. |
| `--secondary-a12` | `secondaryA12` | `#000508e3` → `--neutral-a12` | `#f7fbfef0` → `--neutral-a12` | Interactive elements and status tags. Transparent alpha step 12. |
| `--secondary-contrast` | `secondaryContrast` | `#ffffff` → `--neutral-contrast` | `#ffffff` → `--neutral-contrast` | Interactive elements and status tags. Text colour on a solid step-9 fill. |
| `--secondary-indicator` | `secondaryIndicator` | `#888e92` → `--neutral-indicator` | `#696e72` → `--neutral-indicator` | Interactive elements and status tags. Indicator colour. |
| `--secondary-surface` | `secondarySurface` | `#ffffffcc` → `--neutral-surface` | `rgba(0, 0, 0, 0.05)` → `--neutral-surface` | Interactive elements and status tags. Tinted surface for this family. |
| `--secondary-track` | `secondaryTrack` | `#888e92` → `--neutral-track` | `#696e72` → `--neutral-track` | Interactive elements and status tags. Track colour. |
| `--info-1` | `info1` | `#fdfdfe` → `--blue-1` | `#0f1a2e` → `--blue-1` | Informative content. App background. |
| `--info-2` | `info2` | `#f6faff` → `--blue-2` | `#0f1c35` → `--blue-2` | Informative content. Subtle background. |
| `--info-3` | `info3` | `#ecf2ff` → `--blue-3` | `#062464` → `--blue-3` | Informative content. UI element background. |
| `--info-4` | `info4` | `#ddeaff` → `--blue-4` | `#002885` → `--blue-4` | Informative content. Hovered UI element background. |
| `--info-5` | `info5` | `#cce0ff` → `--blue-5` | `#00319b` → `--blue-5` | Informative content. Active or selected UI element background. |
| `--info-6` | `info6` | `#b8d3ff` → `--blue-6` | `#033cad` → `--blue-6` | Informative content. Subtle border and separator. |
| `--info-7` | `info7` | `#a0c0fc` → `--blue-7` | `#0847c5` → `--blue-7` | Informative content. UI element border and focus ring. |
| `--info-8` | `info8` | `#7fa7f3` → `--blue-8` | `#0653e7` → `--blue-8` | Informative content. Hovered UI element border. |
| `--info-9` | `info9` | `#003fbd` → `--blue-9` | `#003fbd` → `--blue-9` | Informative content. Solid background. |
| `--info-10` | `info10` | `#002baa` → `--blue-10` | `#00329c` → `--blue-10` | Informative content. Hovered solid background. |
| `--info-11` | `info11` | `#275dcc` → `--blue-11` | `#87b5ff` → `--blue-11` | Informative content. Low-contrast text. |
| `--info-12` | `info12` | `#162e5e` → `--blue-12` | `#cbe2ff` → `--blue-12` | Informative content. High-contrast text. |
| `--info-a1` | `infoA1` | `#00008002` → `--blue-a1` | `#001af817` → `--blue-a1` | Informative content. Transparent alpha step 1. |
| `--info-a2` | `infoA2` | `#0072ff09` → `--blue-a2` | `#002bf91f` → `--blue-a2` | Informative content. Transparent alpha step 2. |
| `--info-a3` | `infoA3` | `#0051ff13` → `--blue-a3` | `#0038fd53` → `--blue-a3` | Informative content. Transparent alpha step 3. |
| `--info-a4` | `infoA4` | `#0062ff22` → `--blue-a4` | `#0038fd78` → `--blue-a4` | Informative content. Transparent alpha step 4. |
| `--info-a5` | `infoA5` | `#0064ff33` → `--blue-a5` | `#0043ff90` → `--blue-a5` | Informative content. Transparent alpha step 5. |
| `--info-a6` | `infoA6` | `#0061ff47` → `--blue-a6` | `#004fffa4` → `--blue-a6` | Informative content. Transparent alpha step 6. |
| `--info-a7` | `infoA7` | `#0056f75f` → `--blue-a7` | `#0256febf` → `--blue-a7` | Informative content. Transparent alpha step 7. |
| `--info-a8` | `infoA8` | `#0050e880` → `--blue-a8` | `#0459fee5` → `--blue-a8` | Informative content. Transparent alpha step 8. |
| `--info-a9` | `infoA9` | `#003fbd` → `--blue-a9` | `#004effb6` → `--blue-a9` | Informative content. Transparent alpha step 9. |
| `--info-a10` | `infoA10` | `#002baa` → `--blue-a10` | `#0045ff91` → `--blue-a10` | Informative content. Transparent alpha step 10. |
| `--info-a11` | `infoA11` | `#0040c3d8` → `--blue-a11` | `#87b5ff` → `--blue-a11` | Informative content. Transparent alpha step 11. |
| `--info-a12` | `infoA12` | `#001a4fe9` → `--blue-a12` | `#cbe2ff` → `--blue-a12` | Informative content. Transparent alpha step 12. |
| `--info-contrast` | `infoContrast` | `#fff` → `--blue-contrast` | `#fff` → `--blue-contrast` | Informative content. Text colour on a solid step-9 fill. |
| `--info-indicator` | `infoIndicator` | `#003fbd` → `--blue-indicator` | `#003fbd` → `--blue-indicator` | Informative content. Indicator colour. |
| `--info-surface` | `infoSurface` | `#f4f9ffcc` → `--blue-surface` | `#051e5080` → `--blue-surface` | Informative content. Tinted surface for this family. |
| `--info-track` | `infoTrack` | `#003fbd` → `--blue-track` | `#003fbd` → `--blue-track` | Informative content. Track colour. |
| `--success-1` | `success1` | `#fbfefc` → `--green-1` | `#131d17` → `--green-1` | Positive outcome. App background. |
| `--success-2` | `success2` | `#f4fbf6` → `--green-2` | `#16211a` → `--green-2` | Positive outcome. Subtle background. |
| `--success-3` | `success3` | `#e6f6eb` → `--green-3` | `#113320` → `--green-3` | Positive outcome. UI element background. |
| `--success-4` | `success4` | `#d6f1df` → `--green-4` | `#024124` → `--green-4` | Positive outcome. Hovered UI element background. |
| `--success-5` | `success5` | `#c4e8d0` → `--green-5` | `#004e2b` → `--green-5` | Positive outcome. Active or selected UI element background. |
| `--success-6` | `success6` | `#aeddbf` → `--green-6` | `#005c34` → `--green-6` | Positive outcome. Subtle border and separator. |
| `--success-7` | `success7` | `#90cea7` → `--green-7` | `#006d3e` → `--green-7` | Positive outcome. UI element border and focus ring. |
| `--success-8` | `success8` | `#61b885` → `--green-8` | `#008149` → `--green-8` | Positive outcome. Hovered UI element border. |
| `--success-9` | `success9` | `#00874f` → `--green-9` | `#00874f` → `--green-9` | Positive outcome. Solid background. |
| `--success-10` | `success10` | `#007942` → `--green-10` | `#007942` → `--green-10` | Positive outcome. Hovered solid background. |
| `--success-11` | `success11` | `#00814a` → `--green-11` | `#67d093` → `--green-11` | Positive outcome. Low-contrast text. |
| `--success-12` | `success12` | `#1d3b29` → `--green-12` | `#9ff7c0` → `--green-12` | Positive outcome. High-contrast text. |
| `--success-a1` | `successA1` | `#00c04004` → `--green-a1` | `#00da0004` → `--green-a1` | Positive outcome. Transparent alpha step 1. |
| `--success-a2` | `successA2` | `#00a32f0b` → `--green-a2` | `#00fa1b08` → `--green-a2` | Positive outcome. Transparent alpha step 2. |
| `--success-a3` | `successA3` | `#00a43319` → `--green-a3` | `#00fe511c` → `--green-a3` | Positive outcome. Transparent alpha step 3. |
| `--success-a4` | `successA4` | `#00a83829` → `--green-a4` | `#00fc542c` → `--green-a4` | Positive outcome. Transparent alpha step 4. |
| `--success-a5` | `successA5` | `#019c343b` → `--green-a5` | `#00ff653a` → `--green-a5` | Positive outcome. Transparent alpha step 5. |
| `--success-a6` | `successA6` | `#00943651` → `--green-a6` | `#00fe744a` → `--green-a6` | Positive outcome. Transparent alpha step 6. |
| `--success-a7` | `successA7` | `#008f356f` → `--green-a7` | `#00fd7c5d` → `--green-a7` | Positive outcome. Transparent alpha step 7. |
| `--success-a8` | `successA8` | `#008d3a9e` → `--green-a8` | `#00ff8373` → `--green-a8` | Positive outcome. Transparent alpha step 8. |
| `--success-a9` | `successA9` | `#00874f` → `--green-a9` | `#00fd887a` → `--green-a9` | Positive outcome. Transparent alpha step 9. |
| `--success-a10` | `successA10` | `#007942` → `--green-a10` | `#00ff7b6a` → `--green-a10` | Positive outcome. Transparent alpha step 10. |
| `--success-a11` | `successA11` | `#00814a` → `--green-a11` | `#7bffb2cb` → `--green-a11` | Positive outcome. Transparent alpha step 11. |
| `--success-a12` | `successA12` | `#00220ee2` → `--green-a12` | `#a3fec5f7` → `--green-a12` | Positive outcome. Transparent alpha step 12. |
| `--success-contrast` | `successContrast` | `#fff` → `--green-contrast` | `#fff` → `--green-contrast` | Positive outcome. Text colour on a solid step-9 fill. |
| `--success-indicator` | `successIndicator` | `#00874f` → `--green-indicator` | `#00874f` → `--green-indicator` | Positive outcome. Indicator colour. |
| `--success-surface` | `successSurface` | `#f1faf4cc` → `--green-surface` | `#13281a80` → `--green-surface` | Positive outcome. Tinted surface for this family. |
| `--success-track` | `successTrack` | `#00874f` → `--green-track` | `#00874f` → `--green-track` | Positive outcome. Track colour. |
| `--warning-1` | `warning1` | `#fefdfb` → `--yellow-1` | `#1d1a15` → `--yellow-1` | Warning. App background. |
| `--warning-2` | `warning2` | `#fff9e7` → `--yellow-2` | `#231e16` → `--yellow-2` | Warning. Subtle background. |
| `--warning-3` | `warning3` | `#fff1c4` → `--yellow-3` | `#332612` → `--yellow-3` | Warning. UI element background. |
| `--warning-4` | `warning4` | `#ffe7ac` → `--yellow-4` | `#422c00` → `--yellow-4` | Warning. Hovered UI element background. |
| `--warning-5` | `warning5` | `#ffdc8e` → `--yellow-5` | `#4e3400` → `--yellow-5` | Warning. Active or selected UI element background. |
| `--warning-6` | `warning6` | `#ffcc61` → `--yellow-6` | `#5a4112` → `--yellow-6` | Warning. Subtle border and separator. |
| `--warning-7` | `warning7` | `#f7bb52` → `--yellow-7` | `#6e5221` → `--yellow-7` | Warning. UI element border and focus ring. |
| `--warning-8` | `warning8` | `#e7a200` → `--yellow-8` | `#8b682a` → `--yellow-8` | Warning. Hovered UI element border. |
| `--warning-9` | `warning9` | `#eda813` → `--yellow-9` | `#eda813` → `--yellow-9` | Warning. Solid background. |
| `--warning-10` | `warning10` | `#e29d00` → `--yellow-10` | `#e29d00` → `--yellow-10` | Warning. Hovered solid background. |
| `--warning-11` | `warning11` | `#a26a00` → `--yellow-11` | `#fabc51` → `--yellow-11` | Warning. Low-contrast text. |
| `--warning-12` | `warning12` | `#4b3718` → `--yellow-12` | `#fbe4c1` → `--yellow-12` | Warning. High-contrast text. |
| `--warning-a1` | `warningA1` | `#c0800004` → `--yellow-a1` | `#da1a0004` → `--yellow-a1` | Warning. Transparent alpha step 1. |
| `--warning-a2` | `warningA2` | `#ffc00018` → `--yellow-a2` | `#eb77000b` → `--yellow-a2` | Warning. Transparent alpha step 2. |
| `--warning-a3` | `warningA3` | `#ffc3013b` → `--yellow-a3` | `#fe88001c` → `--yellow-a3` | Warning. Transparent alpha step 3. |
| `--warning-a4` | `warningA4` | `#ffb60053` → `--yellow-a4` | `#fd80002d` → `--yellow-a4` | Warning. Transparent alpha step 4. |
| `--warning-a5` | `warningA5` | `#ffb10071` → `--yellow-a5` | `#ff8d003a` → `--yellow-a5` | Warning. Transparent alpha step 5. |
| `--warning-a6` | `warningA6` | `#ffad009e` → `--yellow-a6` | `#fda40048` → `--yellow-a6` | Warning. Transparent alpha step 6. |
| `--warning-a7` | `warningA7` | `#f39b00ad` → `--yellow-a7` | `#feb22d5e` → `--yellow-a7` | Warning. Transparent alpha step 7. |
| `--warning-a8` | `warningA8` | `#e7a200` → `--yellow-a8` | `#ffb83b7e` → `--yellow-a8` | Warning. Transparent alpha step 8. |
| `--warning-a9` | `warningA9` | `#eca100ec` → `--yellow-a9` | `#ffb413eb` → `--yellow-a9` | Warning. Transparent alpha step 9. |
| `--warning-a10` | `warningA10` | `#e29d00` → `--yellow-a10` | `#ffb000df` → `--yellow-a10` | Warning. Transparent alpha step 10. |
| `--warning-a11` | `warningA11` | `#a26a00` → `--yellow-a11` | `#febf52fa` → `--yellow-a11` | Warning. Transparent alpha step 11. |
| `--warning-a12` | `warningA12` | `#382200e7` → `--yellow-a12` | `#ffe8c4fb` → `--yellow-a12` | Warning. Transparent alpha step 12. |
| `--warning-contrast` | `warningContrast` | `#2c1f09` → `--yellow-contrast` | `#2c1f09` → `--yellow-contrast` | Warning. Text colour on a solid step-9 fill. |
| `--warning-indicator` | `warningIndicator` | `#eda813` → `--yellow-indicator` | `#eda813` → `--yellow-indicator` | Warning. Indicator colour. |
| `--warning-surface` | `warningSurface` | `#fff8e1cc` → `--yellow-surface` | `#2c221380` → `--yellow-surface` | Warning. Tinted surface for this family. |
| `--warning-track` | `warningTrack` | `#eda813` → `--yellow-track` | `#eda813` → `--yellow-track` | Warning. Track colour. |
| `--error-1` | `error1` | `#fffcfc` → `--red-1` | `#201817` → `--red-1` | Error. App background. |
| `--error-2` | `error2` | `#fff8f7` → `--red-2` | `#261a18` → `--red-2` | Error. Subtle background. |
| `--error-3` | `error3` | `#ffebe8` → `--red-3` | `#401915` → `--red-3` | Error. UI element background. |
| `--error-4` | `error4` | `#ffdbd4` → `--red-4` | `#551510` → `--red-4` | Error. Hovered UI element background. |
| `--error-5` | `error5` | `#ffcdc4` → `--red-5` | `#641b14` → `--red-5` | Error. Active or selected UI element background. |
| `--error-6` | `error6` | `#ffbdb2` → `--red-6` | `#73271f` → `--red-6` | Error. Subtle border and separator. |
| `--error-7` | `error7` | `#f7a89c` → `--red-7` | `#8b362d` → `--red-7` | Error. UI element border and focus ring. |
| `--error-8` | `error8` | `#ee8d7f` → `--red-8` | `#b3473b` → `--red-8` | Error. Hovered UI element border. |
| `--error-9` | `error9` | `#db362a` → `--red-9` | `#db362a` → `--red-9` | Error. Solid background. |
| `--error-10` | `error10` | `#cc2018` → `--red-10` | `#b4483c` → `--red-10` | Error. Hovered solid background. |
| `--error-11` | `error11` | `#d22b21` → `--red-11` | `#ff9080` → `--red-11` | Error. Low-contrast text. |
| `--error-12` | `error12` | `#621f18` → `--red-12` | `#fed2cb` → `--red-12` | Error. High-contrast text. |
| `--error-a1` | `errorA1` | `#ff000003` → `--red-a1` | `#f5000007` → `--red-a1` | Error. Transparent alpha step 1. |
| `--error-a2` | `errorA2` | `#ff200008` → `--red-a2` | `#f51b000e` → `--red-a2` | Error. Transparent alpha step 2. |
| `--error-a3` | `errorA3` | `#ff220017` → `--red-a3` | `#fc15002b` → `--red-a3` | Error. Transparent alpha step 3. |
| `--error-a4` | `errorA4` | `#ff2a012b` → `--red-a4` | `#fe070042` → `--red-a4` | Error. Transparent alpha step 4. |
| `--error-a5` | `errorA5` | `#ff27013b` → `--red-a5` | `#fd1d0853` → `--red-a5` | Error. Transparent alpha step 5. |
| `--error-a6` | `errorA6` | `#ff25004d` → `--red-a6` | `#fd3b2764` → `--red-a6` | Error. Transparent alpha step 6. |
| `--error-a7` | `errorA7` | `#eb1f0063` → `--red-a7` | `#ff53417e` → `--red-a7` | Error. Transparent alpha step 7. |
| `--error-a8` | `errorA8` | `#de1c0080` → `--red-a8` | `#fe5d4bab` → `--red-a8` | Error. Transparent alpha step 8. |
| `--error-a9` | `errorA9` | `#d40e00d5` → `--red-a9` | `#ff3b2dd7` → `--red-a9` | Error. Transparent alpha step 9. |
| `--error-a10` | `errorA10` | `#c70900e7` → `--red-a10` | `#ff5f4dac` → `--red-a10` | Error. Transparent alpha step 10. |
| `--error-a11` | `errorA11` | `#cb0c00de` → `--red-a11` | `#ff9080` → `--red-a11` | Error. Transparent alpha step 11. |
| `--error-a12` | `errorA12` | `#520800e7` → `--red-a12` | `#ffd3ccfe` → `--red-a12` | Error. Transparent alpha step 12. |
| `--error-contrast` | `errorContrast` | `#fff` → `--red-contrast` | `#fff` → `--red-contrast` | Error. Text colour on a solid step-9 fill. |
| `--error-indicator` | `errorIndicator` | `#db362a` → `--red-indicator` | `#db362a` → `--red-indicator` | Error. Indicator colour. |
| `--error-surface` | `errorSurface` | `#fff6f5cc` → `--red-surface` | `#321a1780` → `--red-surface` | Error. Tinted surface for this family. |
| `--error-track` | `errorTrack` | `#db362a` → `--red-track` | `#db362a` → `--red-track` | Error. Track colour. |

## 3.1 Text colours

Each text token equals one gray or colour step in both themes.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--foreground-color` | `foregroundColor` | `#202830` → `--basic-800` | `#202830` → `--basic-800` | Legacy foreground (basic-800). Use text-default instead. |
| `--text-default` | `textDefault` | `#1d2123` → `--gray-12` | `#dee2e5` → `--gray-12` | Regular text. Gray step 12. |
| `--text-description` | `textDescription` | `#606569` → `--gray-11` | `#b2b7bc` → `--gray-11` | Descriptions, hints and supporting text. Gray step 11. |
| `--text-error` | `textError` | `#d22b21` → `--error-11` | `#ff9080` → `--error-11` | Error text (red-11). |
| `--text-info` | `textInfo` | `#275dcc` → `--info-11` | `#87b5ff` → `--info-11` | Informative text (blue-11). |
| `--text-placeholder` | `textPlaceholder` | `#b6bcc0` → `--gray-8` | `#606569` → `--gray-8` | Placeholder on inputs with a visible label. Gray step 8; contrast about 1.9:1 on white. |
| `--text-primary` | `textPrimary` | `#6a41d2` → `--primary-11` | `#b5a5ff` → `--primary-11` | Purple text (purple-11). The design file gives no usage rule. |
| `--text-success` | `textSuccess` | `#00814a` → `--success-11` | `#67d093` → `--success-11` | Positive outcome text (green-11). |
| `--text-warning` | `textWarning` | `#a26a00` → `--warning-11` | `#fabc51` → `--warning-11` | Warning text (yellow-11). |

## 3.2 Surfaces and page

`--background-color` is the page background. It is redefined inside surface containers (section 10).

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--background-color` | `backgroundColor` | `#ffffff` → `--color-background` | `#1a1a1a` → `--color-background` | Page background. Redefined inside surface containers (section 10). |
| `--black` | `black` | `#000000` | `#000000` | Literal black. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). Declared more than once; the last declaration is used (earlier: `var(--basic-900)`). |
| `--color-background` | `colorBackground` | `#ffffff` | `#1a1a1a` | Base page colour behind background-color. The dark value is not full black. |
| `--surface-elevation-0` | `surfaceElevation0` | `#ffffff` → `--background-color` | `#1a1a1a` → `--background-color` | Lowest level: page background, inputs and headers. |
| `--surface-elevation-1` | `surfaceElevation1` | `#ffffff` → `--background-color` | `#1d2123` → `--neutral-2` | Side panel, or a popup or card over surface 0. |
| `--surface-elevation-2` | `surfaceElevation2` | `#ffffff` → `--background-color` | `#25292d` → `--neutral-3` | A surface over surface 1, such as a dropdown on a side panel. |
| `--surface-elevation-3` | `surfaceElevation3` | `#ffffff` → `--background-color` | `#2b2f33` → `--neutral-4` | Extra overlap level. Typically not used. |
| `--white` | `white` | `#ffffff` | `#ffffff` | Literal white. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). Declared more than once; the last declaration is used (earlier: `var(--basic-000)`). |

## 3.3 Overlays and focus

Scrims and the focus ring.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--border-focus-color` | `borderFocusColor` | `#a794ff` → `--primary-8` | `#6e21ef` → `--primary-8` | Focus ring colour (primary-8). Contrast about 2.5:1 on white, below WCAG's 3:1. |
| `--overlay-color` | `overlayColor` | `#000a1482` → `--overlay-color-1` | `#000a14bf` → `--overlay-color-1` | Scrim colour. Alias of overlay-color-1. |
| `--overlay-color-1` | `overlayColor1` | `#000a1482` | `#000a14bf` | Scrim colour. |
| `--overlay-color-2` | `overlayColor2` | `#000a14bf` | `#000a14cc` | Stronger scrim colour. |
| `--overlay-dark-50` | `overlayDark50` | `hsla( 210deg, 20%, 15.6862745098%, 50% )` | `hsla( 210deg, 20%, 15.6862745098%, 50% )` | Dark scrim at 50% alpha. |
| `--overlay-white-25` | `overlayWhite25` | `hsla( 0deg, 0%, 100%, 25% )` | `hsla( 0deg, 0%, 100%, 25% )` | White scrim at 25% alpha. |

## 3.4 Illustration

Copilot illustration tokens. The effective values are the TD recipe described in DESIGN.md.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--illustration-action` | `illustrationAction` | `#331e6b` → `--primary-12` | `#fabc51` → `--yellow-11` | Copilot illustration action colour (TD recipe). Declared more than once; the last declaration is used (earlier: `var(--primary-11)`). |
| `--illustration-gradient-end` | `illustrationGradientEnd` | `#ffe7ac` → `--yellow-4` | `#6e21ef` → `--primary-8` | Copilot illustration gradient end (TD recipe). Declared more than once; the last declaration is used (earlier: `var(--gray-6)`). |
| `--illustration-gradient-start` | `illustrationGradientStart` | `#d1c8ff` → `--primary-6` | `#4f10b1` → `--primary-6` | Copilot illustration gradient start (TD recipe). Declared more than once; the last declaration is used (earlier: `var(--gray-6)`). |
| `--illustration-subject` | `illustrationSubject` | `#6a41d2` → `--primary-11` | `#b5a5ff` → `--primary-11` | Copilot illustration subject colour (TD recipe). Declared more than once; the last declaration is used (earlier: `var(--gray-9)`). |

## 4. Typography

Font families, sizes, weights and line heights. The mapping to typography roles is in DESIGN.md.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--font-family` | `fontFamily` | `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | Primary font stack (Roboto). |
| `--font-family-base` | `fontFamilyBase` | `"Roboto"` | `"Roboto"` | Base font name (Roboto). |
| `--font-family-base-mono` | `fontFamilyBaseMono` | `"Roboto Mono"` | `"Roboto Mono"` | Base monospace font name (Roboto Mono). |
| `--font-family-fallbacks` | `fontFamilyFallbacks` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | System fallback stack used after Roboto. |
| `--font-family-fallbacks-mono` | `fontFamilyFallbacksMono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | System fallback stack used after Roboto Mono. |
| `--font-family-mono` | `fontFamilyMono` | `"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | `"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | Monospace font stack (Roboto Mono). |
| `--font-size-base` | `fontSizeBase` | `14px` → `--font-size-medium` | `14px` → `--font-size-medium` | Text size step. Same value as `--font-size-medium`. |
| `--font-size-giga` | `fontSizeGiga` | `24px` | `24px` | Text size step. |
| `--font-size-large` | `fontSizeLarge` | `16px` | `16px` | Text size step. |
| `--font-size-medium` | `fontSizeMedium` | `14px` | `14px` | Text size step. Same value as `--font-size-base`. |
| `--font-size-mega` | `fontSizeMega` | `20px` | `20px` | Text size step. |
| `--font-size-small` | `fontSizeSmall` | `12px` | `12px` | Text size step. |
| `--font-size-tera` | `fontSizeTera` | `32px` | `32px` | Text size step. |
| `--font-size-tiny` | `fontSizeTiny` | `10px` | `10px` | Text size step. |
| `--font-size-xgiga` | `fontSizeXgiga` | `28px` | `28px` | Text size step. |
| `--font-size-xlarge` | `fontSizeXlarge` | `18px` | `18px` | Text size step. |
| `--font-size-xmega` | `fontSizeXmega` | `22px` | `22px` | Text size step. |
| `--font-size-xtera` | `fontSizeXtera` | `40px` | `40px` | Text size step. |
| `--font-weight-bold` | `fontWeightBold` | `700` | `700` | Font weight step. |
| `--font-weight-light` | `fontWeightLight` | `300` | `300` | Font weight step. |
| `--font-weight-medium` | `fontWeightMedium` | `500` | `500` | Font weight step. |
| `--font-weight-regular` | `fontWeightRegular` | `400` | `400` | Font weight step. |
| `--line-height-default` | `lineHeightDefault` | `1` | `1` | Line height step. |
| `--line-height-large` | `lineHeightLarge` | `1.42` | `1.42` | Line height step. |
| `--line-height-medium` | `lineHeightMedium` | `1.33` | `1.33` | Line height step. |
| `--line-height-mega` | `lineHeightMega` | `2` | `2` | Line height step. |
| `--line-height-small` | `lineHeightSmall` | `1.2` | `1.2` | Line height step. |
| `--line-height-xlarge` | `lineHeightXlarge` | `1.7` | `1.7` | Line height step. |
| `--line-height-xsmall` | `lineHeightXsmall` | `1.15` | `1.15` | Line height step. |

## 5. Spacing

Spacing in px. The unit is `spacing-base` (4px). Inset steps are equal padding on all sides.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--base-spacing` | `baseSpacing` | `4px` → `--spacing-inset-base` | `4px` → `--spacing-inset-base` | Spacing unit used by the base-spacing-N scale. Same value as `--base-spacing-1`, `--spacing-base`, `--spacing-inset-base` and 2 more. |
| `--base-spacing-0` | `baseSpacing0` | `0` | `0` | 0 times the spacing unit. |
| `--base-spacing-1` | `baseSpacing1` | `4px` → `--base-spacing` | `4px` → `--base-spacing` | Equal to the spacing unit. Same value as `--base-spacing`, `--spacing-base`, `--spacing-inset-base` and 2 more. |
| `--base-spacing-2` | `baseSpacing2` | `8px` | `8px` | 2 times the spacing unit. Same value as `--spacing-inset-micro`, `--spacing-micro`. |
| `--base-spacing-3` | `baseSpacing3` | `12px` | `12px` | 3 times the spacing unit. Same value as `--spacing-inset-xsmall`, `--spacing-xsmall`. |
| `--base-spacing-4` | `baseSpacing4` | `16px` | `16px` | 4 times the spacing unit. Same value as `--spacing-inset-small`, `--spacing-small`. |
| `--base-spacing-5` | `baseSpacing5` | `20px` | `20px` | 5 times the spacing unit. Same value as `--spacing-inset-medium`, `--spacing-medium`. |
| `--base-spacing-6` | `baseSpacing6` | `24px` | `24px` | 6 times the spacing unit. Same value as `--spacing-inset-large`, `--spacing-large`. |
| `--base-spacing-7` | `baseSpacing7` | `28px` | `28px` | 7 times the spacing unit. |
| `--base-spacing-8` | `baseSpacing8` | `32px` | `32px` | 8 times the spacing unit. Same value as `--spacing-inset-xlarge`, `--spacing-xlarge`. |
| `--base-spacing-9` | `baseSpacing9` | `36px` | `36px` | 9 times the spacing unit. |
| `--base-spacing-10` | `baseSpacing10` | `40px` | `40px` | 10 times the spacing unit. Same value as `--spacing-inset-mega`, `--spacing-mega`. |
| `--base-spacing-11` | `baseSpacing11` | `44px` | `44px` | 11 times the spacing unit. |
| `--base-spacing-12` | `baseSpacing12` | `48px` | `48px` | 12 times the spacing unit. Same value as `--spacing-inset-xmega`, `--spacing-xmega`. |
| `--panel-inset` | `panelInset` | `0px` | `0px` | Panel inset. |
| `--spacing-base` | `spacingBase` | `4px` | `4px` | Spacing unit (4px). The base of the spacing scale. Same value as `--base-spacing`, `--base-spacing-1`, `--spacing-inset-base` and 2 more. |
| `--spacing-femto` | `spacingFemto` | `1px` | `1px` | Stack spacing step. Same value as `--spacing-inset-femto`. |
| `--spacing-giga` | `spacingGiga` | `56px` | `56px` | Stack spacing step. |
| `--spacing-inset-base` | `spacingInsetBase` | `4px` | `4px` | Inset padding step, equal on all sides. Same value as `--base-spacing`, `--base-spacing-1`, `--spacing-base` and 2 more. |
| `--spacing-inset-femto` | `spacingInsetFemto` | `1px` | `1px` | Inset padding step, equal on all sides. Same value as `--spacing-femto`. |
| `--spacing-inset-large` | `spacingInsetLarge` | `24px` | `24px` | Inset padding step, equal on all sides. Same value as `--base-spacing-6`, `--spacing-large`. |
| `--spacing-inset-medium` | `spacingInsetMedium` | `20px` | `20px` | Inset padding step, equal on all sides. Same value as `--base-spacing-5`, `--spacing-medium`. |
| `--spacing-inset-mega` | `spacingInsetMega` | `40px` | `40px` | Inset padding step, equal on all sides. Same value as `--base-spacing-10`, `--spacing-mega`. |
| `--spacing-inset-micro` | `spacingInsetMicro` | `8px` | `8px` | Inset padding step, equal on all sides. Same value as `--base-spacing-2`, `--spacing-micro`. |
| `--spacing-inset-nano` | `spacingInsetNano` | `4px` → `--spacing-inset-base` | `4px` → `--spacing-inset-base` | Inset padding step, equal on all sides. Same value as `--base-spacing`, `--base-spacing-1`, `--spacing-base` and 2 more. |
| `--spacing-inset-pico` | `spacingInsetPico` | `2px` | `2px` | Inset padding step, equal on all sides. Same value as `--spacing-pico`. |
| `--spacing-inset-small` | `spacingInsetSmall` | `16px` | `16px` | Inset padding step, equal on all sides. Same value as `--base-spacing-4`, `--spacing-small`. |
| `--spacing-inset-xlarge` | `spacingInsetXlarge` | `32px` | `32px` | Inset padding step, equal on all sides. Same value as `--base-spacing-8`, `--spacing-xlarge`. |
| `--spacing-inset-xmega` | `spacingInsetXmega` | `48px` | `48px` | Inset padding step, equal on all sides. Same value as `--base-spacing-12`, `--spacing-xmega`. |
| `--spacing-inset-xsmall` | `spacingInsetXsmall` | `12px` | `12px` | Inset padding step, equal on all sides. Same value as `--base-spacing-3`, `--spacing-xsmall`. |
| `--spacing-large` | `spacingLarge` | `24px` | `24px` | Stack spacing step. Same value as `--base-spacing-6`, `--spacing-inset-large`. |
| `--spacing-medium` | `spacingMedium` | `20px` | `20px` | Stack spacing step. Same value as `--base-spacing-5`, `--spacing-inset-medium`. |
| `--spacing-mega` | `spacingMega` | `40px` | `40px` | Stack spacing step. Same value as `--base-spacing-10`, `--spacing-inset-mega`. |
| `--spacing-micro` | `spacingMicro` | `8px` | `8px` | Stack spacing step. Same value as `--base-spacing-2`, `--spacing-inset-micro`. |
| `--spacing-nano` | `spacingNano` | `4px` → `--spacing-base` | `4px` → `--spacing-base` | Stack spacing step. Same value as `--base-spacing`, `--base-spacing-1`, `--spacing-base` and 2 more. |
| `--spacing-pico` | `spacingPico` | `2px` | `2px` | Stack spacing step. Same value as `--spacing-inset-pico`. |
| `--spacing-small` | `spacingSmall` | `16px` | `16px` | Stack spacing step. Same value as `--base-spacing-4`, `--spacing-inset-small`. |
| `--spacing-tera` | `spacingTera` | `80px` | `80px` | Stack spacing step. |
| `--spacing-xgiga` | `spacingXgiga` | `64px` | `64px` | Stack spacing step. |
| `--spacing-xlarge` | `spacingXlarge` | `32px` | `32px` | Stack spacing step. Same value as `--base-spacing-8`, `--spacing-inset-xlarge`. |
| `--spacing-xmega` | `spacingXmega` | `48px` | `48px` | Stack spacing step. Same value as `--base-spacing-12`, `--spacing-inset-xmega`. |
| `--spacing-xsmall` | `spacingXsmall` | `12px` | `12px` | Stack spacing step. Same value as `--base-spacing-3`, `--spacing-inset-xsmall`. |
| `--spacing-xtera` | `spacingXtera` | `120px` | `120px` | Stack spacing step. |

## 6. Radius and border width

Corner radius steps, border width steps and component radii (`*-border-radius`).

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--border-radius-base` | `borderRadiusBase` | `4px` | `4px` | Corner radius step. Same value as `--border-radius-xsmall`, `--border-width-thick`, `--tag-border-radius`. |
| `--border-radius-circular` | `borderRadiusCircular` | `50%` | `50%` | Corner radius step. |
| `--border-radius-large` | `borderRadiusLarge` | `24px` | `24px` | Corner radius step. |
| `--border-radius-medium` | `borderRadiusMedium` | `16px` | `16px` | Corner radius step. |
| `--border-radius-micro` | `borderRadiusMicro` | `2px` | `2px` | Corner radius step. Same value as `--border-width-thin`. |
| `--border-radius-none` | `borderRadiusNone` | `0` | `0` | Corner radius step. Same value as `--border-width-none`, `--panel-border-radius`. |
| `--border-radius-pill` | `borderRadiusPill` | `500px` | `500px` | Corner radius step. Same value as `--button-border-radius`, `--selection-group-border-radius`, `--selection-group-option-border-radius`. |
| `--border-radius-small` | `borderRadiusSmall` | `8px` | `8px` | Corner radius step. Same value as `--border-width-heavy`. |
| `--border-radius-xsmall` | `borderRadiusXsmall` | `4px` → `--border-radius-base` | `4px` → `--border-radius-base` | Corner radius step. Same value as `--border-radius-base`, `--border-width-thick`, `--tag-border-radius`. |
| `--border-width-base` | `borderWidthBase` | `1px` | `1px` | Border width step. Same value as `--border-width-hairline`. |
| `--border-width-hairline` | `borderWidthHairline` | `1px` → `--border-width-base` | `1px` → `--border-width-base` | Border width step. Same value as `--border-width-base`. |
| `--border-width-heavy` | `borderWidthHeavy` | `8px` | `8px` | Border width step. Same value as `--border-radius-small`. |
| `--border-width-none` | `borderWidthNone` | `0` | `0` | Border width step. Same value as `--border-radius-none`, `--panel-border-radius`. |
| `--border-width-thick` | `borderWidthThick` | `4px` | `4px` | Border width step. Same value as `--border-radius-base`, `--border-radius-xsmall`, `--tag-border-radius`. |
| `--border-width-thin` | `borderWidthThin` | `2px` | `2px` | Border width step. Same value as `--border-radius-micro`. |
| `--button-border-radius` | `buttonBorderRadius` | `500px` → `--border-radius-pill` | `500px` → `--border-radius-pill` | Button corner radius. Same value as `--border-radius-pill`, `--selection-group-border-radius`, `--selection-group-option-border-radius`. |
| `--card-border-radius` | `cardBorderRadius` | `initial` | `initial` | Card corner radius. Not set in this theme (initial, 0px). Same value as `--input-border-radius`, `--message-border-radius`, `--modal-border-radius` and 2 more. |
| `--input-border-radius` | `inputBorderRadius` | `initial` | `initial` | Input corner radius. Not set in this theme (initial, 0px). Same value as `--card-border-radius`, `--message-border-radius`, `--modal-border-radius` and 2 more. |
| `--message-border-radius` | `messageBorderRadius` | `initial` | `initial` | Message corner radius. Not set in this theme (initial, 0px). Same value as `--card-border-radius`, `--input-border-radius`, `--modal-border-radius` and 2 more. |
| `--modal-border-radius` | `modalBorderRadius` | `initial` | `initial` | Modal corner radius. Not set in this theme (initial, 0px). Same value as `--card-border-radius`, `--input-border-radius`, `--message-border-radius` and 2 more. |
| `--panel-border-radius` | `panelBorderRadius` | `0` → `--border-radius-none` | `0` → `--border-radius-none` | Panel corner radius. Same value as `--border-radius-none`, `--border-width-none`. |
| `--popup-border-radius` | `popupBorderRadius` | `initial` | `initial` | Popup corner radius. Not set in this theme (initial, 0px). Same value as `--card-border-radius`, `--input-border-radius`, `--message-border-radius` and 2 more. |
| `--selection-group-border-radius` | `selectionGroupBorderRadius` | `500px` → `--border-radius-pill` | `500px` → `--border-radius-pill` | Selection group corner radius. Same value as `--border-radius-pill`, `--button-border-radius`, `--selection-group-option-border-radius`. |
| `--selection-group-option-border-radius` | `selectionGroupOptionBorderRadius` | `500px` → `--border-radius-pill` | `500px` → `--border-radius-pill` | Selection group option corner radius. Same value as `--border-radius-pill`, `--button-border-radius`, `--selection-group-border-radius`. |
| `--tab-selection-border-radius` | `tabSelectionBorderRadius` | `initial` | `initial` | Tab selection corner radius. Not set in this theme (initial, 0px). Same value as `--card-border-radius`, `--input-border-radius`, `--message-border-radius` and 2 more. |
| `--tag-border-radius` | `tagBorderRadius` | `4px` → `--border-radius-xsmall` | `4px` → `--border-radius-xsmall` | Tag corner radius. Same value as `--border-radius-base`, `--border-radius-xsmall`, `--border-width-thick`. |

## 7.1 Opacity

Opacity levels and interaction-state opacities.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--opacity-active` | `opacityActive` | `0.92` | `0.92` | Interaction-state opacity. The design file does not say where it applies. |
| `--opacity-disabled` | `opacityDisabled` | `0.4` | `0.4` | Interaction-state opacity. The design file does not say where it applies. Same value as `--opacity-medium`. |
| `--opacity-hover` | `opacityHover` | `0.68` | `0.68` | Interaction-state opacity. The design file does not say where it applies. |
| `--opacity-intense` | `opacityIntense` | `0.56` | `0.56` | Opacity level. |
| `--opacity-light` | `opacityLight` | `0.16` | `0.16` | Opacity level. |
| `--opacity-medium` | `opacityMedium` | `0.4` | `0.4` | Opacity level. Same value as `--opacity-disabled`. |
| `--opacity-opaque` | `opacityOpaque` | `1` | `1` | Opacity level. |
| `--opacity-semiopaque` | `opacitySemiopaque` | `0.8` | `0.8` | Opacity level. |
| `--opacity-semitransparent` | `opacitySemitransparent` | `0.08` | `0.08` | Opacity level. |
| `--opacity-transparent` | `opacityTransparent` | `0` | `0` | Opacity level. |

## 7.2 Shadows

Elevation shadows are black in both themes. Indicator shadows are offsets only; their colour comes from `gray-indicator`.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--shadow-1` | `shadow1` | `0 2px 4px -1px #0000000f, 0 4px 8px 0 #00000014` | `0 2px 4px -1px #0000000f, 0 4px 8px 0 #00000014` | Elevation level 1. Black, same in both themes. |
| `--shadow-2` | `shadow2` | `0 4px 8px -2px #00000014, 0 8px 16px 0 #0000001a` | `0 4px 8px -2px #00000014, 0 8px 16px 0 #0000001a` | Elevation level 2. Black, same in both themes. |
| `--shadow-3` | `shadow3` | `0 8px 16px -4px #0000001a, 0 16px 32px 0 #0000001f` | `0 8px 16px -4px #0000001a, 0 16px 32px 0 #0000001f` | Elevation level 3. Black, same in both themes. |
| `--shadow-4` | `shadow4` | `0 12px 16px -4px #0000001f, 0 24px 32px 0 #00000024` | `0 12px 16px -4px #0000001f, 0 24px 32px 0 #00000024` | Elevation level 4. Black, same in both themes. |
| `--shadow-bottom` | `shadowBottom` | `0 2px 8px 0 #0000001f, 0 2px 4px 0 #0000001f` | `0 2px 8px 0 #0000001f, 0 2px 4px 0 #0000001f` | Scroll-edge shadow, bottom. Black, same in both themes. |
| `--shadow-left` | `shadowLeft` | `-2px 0 8px 0 #0000001f, -2px 0 4px 0 #0000001f` | `-2px 0 8px 0 #0000001f, -2px 0 4px 0 #0000001f` | Scroll-edge shadow, left. Black, same in both themes. |
| `--shadow-level-1` | `shadowLevel1` | `0 1px 2px` | `0 1px 2px` | Indicator shadow level 1. Offsets only; the colour comes from gray-indicator. |
| `--shadow-level-2` | `shadowLevel2` | `0 2px 6px` | `0 2px 6px` | Indicator shadow level 2. Offsets only; the colour comes from gray-indicator. |
| `--shadow-level-3` | `shadowLevel3` | `0 4px 12px` | `0 4px 12px` | Indicator shadow level 3. Offsets only; the colour comes from gray-indicator. |
| `--shadow-level-4` | `shadowLevel4` | `0 8px 20px` | `0 8px 20px` | Indicator shadow level 4. Offsets only; the colour comes from gray-indicator. |
| `--shadow-right` | `shadowRight` | `2px 0 8px 0 #0000001f, 2px 0 4px 0 #0000001f` | `2px 0 8px 0 #0000001f, 2px 0 4px 0 #0000001f` | Scroll-edge shadow, right. Black, same in both themes. |
| `--shadow-scroll-bottom` | `shadowScrollBottom` | `0 1px 4px` | `0 1px 4px` | Indicator scroll shadow. Offsets only; the colour comes from gray-indicator. |
| `--shadow-scroll-left` | `shadowScrollLeft` | `-1px 0 4px` | `-1px 0 4px` | Indicator scroll shadow. Offsets only; the colour comes from gray-indicator. |
| `--shadow-scroll-right` | `shadowScrollRight` | `1px 0 4px` | `1px 0 4px` | Indicator scroll shadow. Offsets only; the colour comes from gray-indicator. |
| `--shadow-scroll-top` | `shadowScrollTop` | `0 -1px 4px` | `0 -1px 4px` | Indicator scroll shadow. Offsets only; the colour comes from gray-indicator. |
| `--shadow-top` | `shadowTop` | `0 -2px 8px 0 #0000001f, 0 -2px 4px 0 #0000001f` | `0 -2px 8px 0 #0000001f, 0 -2px 4px 0 #0000001f` | Scroll-edge shadow, top. Black, same in both themes. |

## 7.3 Z-index

Stacking layers.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--z-index-100` | `zIndex100` | `1100` | `1100` | Stacking layer 100. |
| `--z-index-200` | `zIndex200` | `1200` | `1200` | Stacking layer 200. |
| `--z-index-300` | `zIndex300` | `1300` | `1300` | Stacking layer 300. |
| `--z-index-400` | `zIndex400` | `1400` | `1400` | Stacking layer 400. |
| `--z-index-500` | `zIndex500` | `1500` | `1500` | Stacking layer 500. |
| `--z-index-600` | `zIndex600` | `1600` | `1600` | Stacking layer 600. |
| `--z-index-700` | `zIndex700` | `1700` | `1700` | Stacking layer 700. |

## 8. Legacy scales

Scales from before Colors 2.0. The design file says not to use them in new work. `cobalt.css` redefines many of them (section 11).

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--basic-000` | `basic000` | `#ffffff` | `#ffffff` | Legacy basic step 000. Not a Colors 2.0 step. |
| `--basic-100` | `basic100` | `#fafafa` | `#fafafa` | Legacy basic step 100. Not a Colors 2.0 step. |
| `--basic-200` | `basic200` | `#f2f4f5` | `#f2f4f5` | Legacy basic step 200. Not a Colors 2.0 step. |
| `--basic-300` | `basic300` | `#e8eaeb` | `#e8eaeb` | Legacy basic step 300. Not a Colors 2.0 step. |
| `--basic-400` | `basic400` | `#d7dbde` | `#d7dbde` | Legacy basic step 400. Not a Colors 2.0 step. |
| `--basic-500` | `basic500` | `#aeb3b8` | `#aeb3b8` | Legacy basic step 500. Not a Colors 2.0 step. |
| `--basic-600` | `basic600` | `#6f767d` | `#6f767d` | Legacy basic step 600. Not a Colors 2.0 step. |
| `--basic-700` | `basic700` | `#475059` | `#475059` | Legacy basic step 700. Not a Colors 2.0 step. |
| `--basic-800` | `basic800` | `#202830` | `#202830` | Legacy basic step 800. Not a Colors 2.0 step. |
| `--basic-900` | `basic900` | `#07111b` | `#07111b` | Legacy basic step 900. Not a Colors 2.0 step. |
| `--blue-200` | `blue200` | `#edf4fc` | `#edf4fc` | Legacy blue step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-300` | `blue300` | `#e3edfa` | `#e3edfa` | Legacy blue step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-400` | `blue400` | `#b8d0f2` | `#b8d0f2` | Legacy blue step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-500` | `blue500` | `#1e7bfc` | `#1e7bfc` | Legacy blue step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-600` | `blue600` | `#005cde` | `#005cde` | Legacy blue step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-700` | `blue700` | `#003fbd` | `#003fbd` | Legacy blue step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-800` | `blue800` | `#001597` | `#001597` | Legacy blue step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--blue-900` | `blue900` | `#000079` | `#000079` | Legacy blue step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--brand-100` | `brand100` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy brand step 100. Not a Colors 2.0 step. |
| `--brand-200` | `brand200` | `#f8f5fb` → `--primary-200` | `#f8f5fb` → `--primary-200` | Legacy brand step 200. Not a Colors 2.0 step. |
| `--brand-300` | `brand300` | `#f1edf8` → `--primary-300` | `#f1edf8` → `--primary-300` | Legacy brand step 300. Not a Colors 2.0 step. |
| `--brand-400` | `brand400` | `#d3c4ed` → `--primary-400` | `#d3c4ed` → `--primary-400` | Legacy brand step 400. Not a Colors 2.0 step. |
| `--brand-500` | `brand500` | `#8635f2` → `--primary-500` | `#8635f2` → `--primary-500` | Legacy brand step 500. Not a Colors 2.0 step. |
| `--brand-600` | `brand600` | `#3e048b` → `--primary-600` | `#3e048b` → `--primary-600` | Legacy brand step 600. Not a Colors 2.0 step. |
| `--brand-700` | `brand700` | `#28025a` → `--primary-700` | `#28025a` → `--primary-700` | Legacy brand step 700. Not a Colors 2.0 step. |
| `--brand-800` | `brand800` | `#1c0140` → `--primary-800` | `#1c0140` → `--primary-800` | Legacy brand step 800. Not a Colors 2.0 step. |
| `--brand-900` | `brand900` | `#0a0113` → `--primary-900` | `#0a0113` → `--primary-900` | Legacy brand step 900. Not a Colors 2.0 step. |
| `--error-200` | `error200` | `#fff1f0` → `--red-200` | `#fff1f0` → `--red-200` | Legacy error step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-300` | `error300` | `#ffeae8` → `--red-300` | `#ffeae8` → `--red-300` | Legacy error step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-400` | `error400` | `#ffcdc9` → `--red-400` | `#ffcdc9` → `--red-400` | Legacy error step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-500` | `error500` | `#ff6459` → `--red-500` | `#ff6459` → `--red-500` | Legacy error step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-600` | `error600` | `#ff4538` → `--red-600` | `#ff4538` → `--red-600` | Legacy error step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-700` | `error700` | `#db362a` → `--red-700` | `#db362a` → `--red-700` | Legacy error step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-800` | `error800` | `#b80c00` → `--red-800` | `#b80c00` → `--red-800` | Legacy error step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--error-900` | `error900` | `#9a0a00` → `--red-900` | `#9a0a00` → `--red-900` | Legacy error step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--feature-200` | `feature200` | `#f8f5fb` → `--purple-200` | `#f8f5fb` → `--purple-200` | Legacy feature step 200. Not a Colors 2.0 step. |
| `--feature-300` | `feature300` | `#f1edf8` → `--purple-300` | `#f1edf8` → `--purple-300` | Legacy feature step 300. Not a Colors 2.0 step. |
| `--feature-400` | `feature400` | `#d3c4ed` → `--purple-400` | `#d3c4ed` → `--purple-400` | Legacy feature step 400. Not a Colors 2.0 step. |
| `--feature-500` | `feature500` | `#8635f2` → `--purple-500` | `#8635f2` → `--purple-500` | Legacy feature step 500. Not a Colors 2.0 step. |
| `--feature-600` | `feature600` | `#3e048b` → `--purple-600` | `#3e048b` → `--purple-600` | Legacy feature step 600. Not a Colors 2.0 step. |
| `--feature-700` | `feature700` | `#28025a` → `--purple-700` | `#28025a` → `--purple-700` | Legacy feature step 700. Not a Colors 2.0 step. |
| `--feature-800` | `feature800` | `#1c0140` → `--purple-800` | `#1c0140` → `--purple-800` | Legacy feature step 800. Not a Colors 2.0 step. |
| `--feature-900` | `feature900` | `#0a0113` → `--purple-900` | `#0a0113` → `--purple-900` | Legacy feature step 900. Not a Colors 2.0 step. |
| `--gray-100` | `gray100` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy gray step 100. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-200` | `gray200` | `#f2f4f5` → `--basic-200` | `#f2f4f5` → `--basic-200` | Legacy gray step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-300` | `gray300` | `#e8eaeb` → `--basic-300` | `#e8eaeb` → `--basic-300` | Legacy gray step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-400` | `gray400` | `#d7dbde` → `--basic-400` | `#d7dbde` → `--basic-400` | Legacy gray step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-500` | `gray500` | `#aeb3b8` → `--basic-500` | `#aeb3b8` → `--basic-500` | Legacy gray step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-600` | `gray600` | `#6f767d` → `--basic-600` | `#6f767d` → `--basic-600` | Legacy gray step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-700` | `gray700` | `#475059` → `--basic-700` | `#475059` → `--basic-700` | Legacy gray step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-800` | `gray800` | `#202830` → `--basic-800` | `#202830` → `--basic-800` | Legacy gray step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--gray-900` | `gray900` | `#07111b` → `--basic-900` | `#07111b` → `--basic-900` | Legacy gray step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-200` | `green200` | `#ecf8f4` | `#ecf8f4` | Legacy green step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-300` | `green300` | `#e3f5ef` | `#e3f5ef` | Legacy green step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-400` | `green400` | `#bae7d8` | `#bae7d8` | Legacy green step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-500` | `green500` | `#1fc78f` | `#1fc78f` | Legacy green step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-600` | `green600` | `#00a870` | `#00a870` | Legacy green step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-700` | `green700` | `#00874f` | `#00874f` | Legacy green step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-800` | `green800` | `#006130` | `#006130` | Legacy green step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--green-900` | `green900` | `#00430b` | `#00430b` | Legacy green step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--info-200` | `info200` | `#edf4fc` → `--blue-200` | `#edf4fc` → `--blue-200` | Legacy info step 200. Not a Colors 2.0 step. |
| `--info-300` | `info300` | `#e3edfa` → `--blue-300` | `#e3edfa` → `--blue-300` | Legacy info step 300. Not a Colors 2.0 step. |
| `--info-400` | `info400` | `#b8d0f2` → `--blue-400` | `#b8d0f2` → `--blue-400` | Legacy info step 400. Not a Colors 2.0 step. |
| `--info-500` | `info500` | `#1e7bfc` → `--blue-500` | `#1e7bfc` → `--blue-500` | Legacy info step 500. Not a Colors 2.0 step. |
| `--info-600` | `info600` | `#005cde` → `--blue-600` | `#005cde` → `--blue-600` | Legacy info step 600. Not a Colors 2.0 step. |
| `--info-700` | `info700` | `#003fbd` → `--blue-700` | `#003fbd` → `--blue-700` | Legacy info step 700. Not a Colors 2.0 step. |
| `--info-800` | `info800` | `#001597` → `--blue-800` | `#001597` → `--blue-800` | Legacy info step 800. Not a Colors 2.0 step. |
| `--info-900` | `info900` | `#000079` → `--blue-900` | `#000079` → `--blue-900` | Legacy info step 900. Not a Colors 2.0 step. |
| `--midnight-100` | `midnight100` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy midnight step 100. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-200` | `midnight200` | `#f2f3f5` | `#f2f3f5` | Legacy midnight step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-300` | `midnight300` | `#e8eaed` | `#e8eaed` | Legacy midnight step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-400` | `midnight400` | `#d5dae6` | `#d5dae6` | Legacy midnight step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-500` | `midnight500` | `#a1acc9` | `#a1acc9` | Legacy midnight step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-600` | `midnight600` | `#677291` | `#677291` | Legacy midnight step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-700` | `midnight700` | `#3e4966` | `#3e4966` | Legacy midnight step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-800` | `midnight800` | `#172241` | `#172241` | Legacy midnight step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--midnight-900` | `midnight900` | `#000921` | `#000921` | Legacy midnight step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--neutral-100` | `neutral100` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy neutral step 100. Not a Colors 2.0 step. |
| `--neutral-150` | `neutral150` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy neutral step 150, an alias of basic-100. Not a Colors 2.0 step. |
| `--neutral-200` | `neutral200` | `#f2f4f5` → `--basic-200` | `#f2f4f5` → `--basic-200` | Legacy neutral step 200. Not a Colors 2.0 step. |
| `--neutral-300` | `neutral300` | `#e8eaeb` → `--basic-300` | `#e8eaeb` → `--basic-300` | Legacy neutral step 300. Not a Colors 2.0 step. |
| `--neutral-800` | `neutral800` | `#202830` → `--basic-800` | `#202830` → `--basic-800` | Legacy neutral step 800. Not a Colors 2.0 step. |
| `--orange-200` | `orange200` | `#fff4ed` | `#fff4ed` | Legacy orange step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-300` | `orange300` | `#ffeee3` | `#ffeee3` | Legacy orange step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-400` | `orange400` | `#ffd4ba` | `#ffd4ba` | Legacy orange step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-500` | `orange500` | `#ff821f` | `#ff821f` | Legacy orange step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-600` | `orange600` | `#ff6300` | `#ff6300` | Legacy orange step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-700` | `orange700` | `#de4a00` | `#de4a00` | Legacy orange step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-800` | `orange800` | `#b81c00` | `#b81c00` | Legacy orange step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--orange-900` | `orange900` | `#9a0000` | `#9a0000` | Legacy orange step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--primary-200` | `primary200` | `#f8f5fb` → `--purple-200` | `#f8f5fb` → `--purple-200` | Legacy primary step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-300` | `primary300` | `#f1edf8` → `--purple-300` | `#f1edf8` → `--purple-300` | Legacy primary step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-400` | `primary400` | `#d3c4ed` → `--purple-400` | `#d3c4ed` → `--purple-400` | Legacy primary step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-500` | `primary500` | `#8635f2` → `--purple-500` | `#8635f2` → `--purple-500` | Legacy primary step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-600` | `primary600` | `#3e048b` → `--purple-600` | `#3e048b` → `--purple-600` | Legacy primary step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-700` | `primary700` | `#28025a` → `--purple-700` | `#28025a` → `--purple-700` | Legacy primary step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-800` | `primary800` | `#1c0140` → `--purple-800` | `#1c0140` → `--purple-800` | Legacy primary step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--primary-900` | `primary900` | `#0a0113` → `--purple-900` | `#0a0113` → `--purple-900` | Legacy primary step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-200` | `purple200` | `#f8f5fb` | `#f8f5fb` | Legacy purple step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-300` | `purple300` | `#f1edf8` | `#f1edf8` | Legacy purple step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-400` | `purple400` | `#d3c4ed` | `#d3c4ed` | Legacy purple step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-500` | `purple500` | `#8635f2` | `#8635f2` | Legacy purple step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-600` | `purple600` | `#3e048b` | `#3e048b` | Legacy purple step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-700` | `purple700` | `#28025a` | `#28025a` | Legacy purple step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-800` | `purple800` | `#1c0140` | `#1c0140` | Legacy purple step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--purple-900` | `purple900` | `#0a0113` | `#0a0113` | Legacy purple step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--red-200` | `red200` | `#fff1f0` | `#fff1f0` | Legacy red step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-300` | `red300` | `#ffeae8` | `#ffeae8` | Legacy red step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-400` | `red400` | `#ffcdc9` | `#ffcdc9` | Legacy red step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-500` | `red500` | `#ff6459` | `#ff6459` | Legacy red step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-600` | `red600` | `#ff4538` | `#ff4538` | Legacy red step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-700` | `red700` | `#db362a` | `#db362a` | Legacy red step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-800` | `red800` | `#b80c00` | `#b80c00` | Legacy red step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--red-900` | `red900` | `#9a0a00` | `#9a0a00` | Legacy red step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--secondary-000` | `secondary000` | `#ffffff` → `--basic-000` | `#ffffff` → `--basic-000` | Legacy secondary step 000. Not a Colors 2.0 step. |
| `--secondary-100` | `secondary100` | `#fafafa` → `--basic-100` | `#fafafa` → `--basic-100` | Legacy secondary step 100. Not a Colors 2.0 step. |
| `--secondary-200` | `secondary200` | `#f2f4f5` → `--basic-200` | `#f2f4f5` → `--basic-200` | Legacy secondary step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-300` | `secondary300` | `#e8eaeb` → `--basic-300` | `#e8eaeb` → `--basic-300` | Legacy secondary step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-400` | `secondary400` | `#d7dbde` → `--basic-400` | `#d7dbde` → `--basic-400` | Legacy secondary step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-500` | `secondary500` | `#aeb3b8` → `--basic-500` | `#aeb3b8` → `--basic-500` | Legacy secondary step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-600` | `secondary600` | `#6f767d` → `--basic-600` | `#6f767d` → `--basic-600` | Legacy secondary step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-700` | `secondary700` | `#475059` → `--basic-700` | `#475059` → `--basic-700` | Legacy secondary step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-800` | `secondary800` | `#202830` → `--basic-800` | `#202830` → `--basic-800` | Legacy secondary step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--secondary-900` | `secondary900` | `#07111b` → `--basic-900` | `#07111b` → `--basic-900` | Legacy secondary step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with a different value (section 11). |
| `--success-200` | `success200` | `#ecf8f4` → `--green-200` | `#ecf8f4` → `--green-200` | Legacy success step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-300` | `success300` | `#e3f5ef` → `--green-300` | `#e3f5ef` → `--green-300` | Legacy success step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-400` | `success400` | `#bae7d8` → `--green-400` | `#bae7d8` → `--green-400` | Legacy success step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-500` | `success500` | `#1fc78f` → `--green-500` | `#1fc78f` → `--green-500` | Legacy success step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-600` | `success600` | `#00a870` → `--green-600` | `#00a870` → `--green-600` | Legacy success step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-700` | `success700` | `#00874f` → `--green-700` | `#00874f` → `--green-700` | Legacy success step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-800` | `success800` | `#006130` → `--green-800` | `#006130` → `--green-800` | Legacy success step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--success-900` | `success900` | `#00430b` → `--green-900` | `#00430b` → `--green-900` | Legacy success step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-200` | `teal200` | `#f0f9fa` | `#f0f9fa` | Legacy teal step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-300` | `teal300` | `#ebf9fa` | `#ebf9fa` | Legacy teal step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-400` | `teal400` | `#ceeef0` | `#ceeef0` | Legacy teal step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-500` | `teal500` | `#6ae2e8` | `#6ae2e8` | Legacy teal step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-600` | `teal600` | `#4bc3c9` | `#4bc3c9` | Legacy teal step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-700` | `teal700` | `#2aa2a8` | `#2aa2a8` | Legacy teal step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-800` | `teal800` | `#047c82` | `#047c82` | Legacy teal step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--teal-900` | `teal900` | `#005e64` | `#005e64` | Legacy teal step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-200` | `tertiary200` | `#f0f9fa` → `--teal-200` | `#f0f9fa` → `--teal-200` | Legacy tertiary step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-300` | `tertiary300` | `#ebf9fa` → `--teal-300` | `#ebf9fa` → `--teal-300` | Legacy tertiary step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-400` | `tertiary400` | `#ceeef0` → `--teal-400` | `#ceeef0` → `--teal-400` | Legacy tertiary step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-500` | `tertiary500` | `#6ae2e8` → `--teal-500` | `#6ae2e8` → `--teal-500` | Legacy tertiary step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-600` | `tertiary600` | `#4bc3c9` → `--teal-600` | `#4bc3c9` → `--teal-600` | Legacy tertiary step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-700` | `tertiary700` | `#2aa2a8` → `--teal-700` | `#2aa2a8` → `--teal-700` | Legacy tertiary step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-800` | `tertiary800` | `#047c82` → `--teal-800` | `#047c82` → `--teal-800` | Legacy tertiary step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--tertiary-900` | `tertiary900` | `#005e64` → `--teal-900` | `#005e64` → `--teal-900` | Legacy tertiary step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-200` | `warning200` | `#fffbf2` → `--yellow-200` | `#fffbf2` → `--yellow-200` | Legacy warning step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-300` | `warning300` | `#fff6e3` → `--yellow-300` | `#fff6e3` → `--yellow-300` | Legacy warning step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-400` | `warning400` | `#ffeecc` → `--yellow-400` | `#ffeecc` → `--yellow-400` | Legacy warning step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-500` | `warning500` | `#ffe16b` → `--yellow-500` | `#ffe16b` → `--yellow-500` | Legacy warning step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-600` | `warning600` | `#ffc847` → `--yellow-600` | `#ffc847` → `--yellow-600` | Legacy warning step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-700` | `warning700` | `#eda813` → `--yellow-700` | `#eda813` → `--yellow-700` | Legacy warning step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-800` | `warning800` | `#bf8300` → `--yellow-800` | `#bf8300` → `--yellow-800` | Legacy warning step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--warning-900` | `warning900` | `#996800` → `--yellow-900` | `#996800` → `--yellow-900` | Legacy warning step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-200` | `yellow200` | `#fffbf2` | `#fffbf2` | Legacy yellow step 200. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-300` | `yellow300` | `#fff6e3` | `#fff6e3` | Legacy yellow step 300. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-400` | `yellow400` | `#ffeecc` | `#ffeecc` | Legacy yellow step 400. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-500` | `yellow500` | `#ffe16b` | `#ffe16b` | Legacy yellow step 500. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-600` | `yellow600` | `#ffc847` | `#ffc847` | Legacy yellow step 600. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-700` | `yellow700` | `#eda813` | `#eda813` | Legacy yellow step 700. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-800` | `yellow800` | `#bf8300` | `#bf8300` | Legacy yellow step 800. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |
| `--yellow-900` | `yellow900` | `#996800` | `#996800` | Legacy yellow step 900. Not a Colors 2.0 step. cobalt.css redefines it inside `.cobalt--27_0_0-1` with the same value (section 11). |

## 9.1 Workspace shell

Workspace aliases of legacy scales, and the workspace white.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--workspace-primary-600` | `workspacePrimary600` | `#3e048b` → `--primary-600` | `#3e048b` → `--primary-600` | Workspace alias of the legacy primary scale. Not a Colors 2.0 step. |
| `--workspace-primary-700` | `workspacePrimary700` | `#28025a` → `--primary-700` | `#28025a` → `--primary-700` | Workspace alias of the legacy primary scale. Not a Colors 2.0 step. |
| `--workspace-primary-800` | `workspacePrimary800` | `#1c0140` → `--primary-800` | `#1c0140` → `--primary-800` | Workspace alias of the legacy primary scale. Not a Colors 2.0 step. |
| `--workspace-secondary-100` | `workspaceSecondary100` | `#fafafa` → `--secondary-100` | `#fafafa` → `--secondary-100` | Workspace alias of the legacy secondary scale. Not a Colors 2.0 step. |
| `--workspace-secondary-150` | `workspaceSecondary150` | `#fafafa` → `--secondary-100` | `#fafafa` → `--secondary-100` | Workspace alias of the legacy secondary scale. Not a Colors 2.0 step. |
| `--workspace-secondary-200` | `workspaceSecondary200` | `#f2f4f5` → `--secondary-200` | `#f2f4f5` → `--secondary-200` | Workspace alias of the legacy secondary scale. Not a Colors 2.0 step. |
| `--workspace-secondary-300` | `workspaceSecondary300` | `#e8eaeb` → `--secondary-300` | `#e8eaeb` → `--secondary-300` | Workspace alias of the legacy secondary scale. Not a Colors 2.0 step. |
| `--workspace-secondary-800` | `workspaceSecondary800` | `#202830` → `--secondary-800` | `#202830` → `--secondary-800` | Workspace alias of the legacy secondary scale. Not a Colors 2.0 step. |
| `--workspace-white` | `workspaceWhite` | `hsla( 0deg, 0%, 100%, 100% )` | `hsla( 0deg, 0%, 100%, 100% )` | Workspace shell white. Its opacity variable falls back to 100%. |

## 9.2 Other

Names that do not fit the groups above.

| Variable | styles.json key | Light | Dark | Role |
|---|---|---|---|---|
| `--cdn-base-url` | `cdnBaseUrl` | `"https://prd-cdn-talkdesk.talkdesk.com"` | `"https://prd-cdn-talkdesk.talkdesk.com"` | Talkdesk CDN base URL. A configuration value, not a design token. |
| `--dark-to-light` | `darkToLight` | `#000000` → `--black` | `#ffffff` → `--white` | Flips between black and white across themes. The design file does not describe its use. |
| `--light-to-dark` | `lightToDark` | `#ffffff` → `--white` | `#000000` → `--black` | Flips between white and black across themes. The design file does not describe its use. |

## 10. Scoped surface rules

Declarations inside surface containers. 4.1.6 has 19; 4.1.3 has 7 and uses no `@scope` rules. Each one sets a variable for a `data-co-surface` level.

| Selector | Variable | Value |
|---|---|---|
| `:where([data-co-surface]:not([data-co-surface="0"]))` | `--background-color` | `var(--surface-elevation-1)` |
| `:where([data-co-surface]:not([data-co-surface="0"])) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-2)` |
| `:where([data-co-surface]:not([data-co-surface="0"])) :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="0"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-1)` |
| `@scope ([data-co-surface="0"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-2)` |
| `@scope ([data-co-surface="0"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="1"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-2)` |
| `@scope ([data-co-surface="1"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="1"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="2"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="2"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="2"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="3"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="3"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `@scope ([data-co-surface="3"]) to ([data-co-surface="0"], [data-co-surface="1"], [data-co-surface="2"], [data-co-surface="3"]) > :where([data-co-surface]) :where([data-co-surface]) :where([data-co-surface])` | `--background-color` | `var(--surface-elevation-3)` |
| `[data-co-surface="0"]` | `--background-color` | `var(--surface-elevation-0)` |
| `[data-co-surface="1"]` | `--background-color` | `var(--surface-elevation-1)` |
| `[data-co-surface="2"]` | `--background-color` | `var(--surface-elevation-2)` |
| `[data-co-surface="3"]` | `--background-color` | `var(--surface-elevation-3)` |

## 11. cobalt.css names that the theme also declares

These names are in both the theme and `cobalt.css`. `cobalt.css` declares them under `.cobalt--27_0_0-1`, so inside a Cobalt root its value applies instead of the theme's. 32 of the 124 values differ. 0 of them are in the dark block, so the theme switch does not change them.

| Variable | Theme (light, effective) | cobalt.css value | Same? | cobalt.css scope |
|---|---|---|---|---|
| `--black` | `#000000` | `#000000` | Yes | `.cobalt--27_0_0-1` |
| `--blue-200` | `#edf4fc` | `#F0F7FB` | **No** | `.cobalt--27_0_0-1` |
| `--blue-300` | `#e3edfa` | `#E8F3FA` | **No** | `.cobalt--27_0_0-1` |
| `--blue-400` | `#b8d0f2` | `#C9E3F2` | **No** | `.cobalt--27_0_0-1` |
| `--blue-500` | `#1e7bfc` | `#55B8F0` | **No** | `.cobalt--27_0_0-1` |
| `--blue-600` | `#005cde` | `#3699D1` | **No** | `.cobalt--27_0_0-1` |
| `--blue-700` | `#003fbd` | `#1578B0` | **No** | `.cobalt--27_0_0-1` |
| `--blue-800` | `#001597` | `#00528A` | **No** | `.cobalt--27_0_0-1` |
| `--blue-900` | `#000079` | `#00346C` | **No** | `.cobalt--27_0_0-1` |
| `--error-200` | `#fff1f0` | `#FFF1F0` | Yes | `.cobalt--27_0_0-1` |
| `--error-300` | `#ffeae8` | `#FFEAE8` | Yes | `.cobalt--27_0_0-1` |
| `--error-400` | `#ffcdc9` | `#FFCDC9` | Yes | `.cobalt--27_0_0-1` |
| `--error-500` | `#ff6459` | `#FF6459` | Yes | `.cobalt--27_0_0-1` |
| `--error-600` | `#ff4538` | `#FF4538` | Yes | `.cobalt--27_0_0-1` |
| `--error-700` | `#db362a` | `#DB362A` | Yes | `.cobalt--27_0_0-1` |
| `--error-800` | `#b80c00` | `#B80C00` | Yes | `.cobalt--27_0_0-1` |
| `--error-900` | `#9a0a00` | `#9A0A00` | Yes | `.cobalt--27_0_0-1` |
| `--gray-100` | `#fafafa` | `#FAFAFA` | Yes | `.cobalt--27_0_0-1` |
| `--gray-200` | `#f2f4f5` | `#F2F4F5` | Yes | `.cobalt--27_0_0-1` |
| `--gray-300` | `#e8eaeb` | `#E8EAEB` | Yes | `.cobalt--27_0_0-1` |
| `--gray-400` | `#d7dbde` | `#D7DBDE` | Yes | `.cobalt--27_0_0-1` |
| `--gray-500` | `#aeb3b8` | `#AEB3B8` | Yes | `.cobalt--27_0_0-1` |
| `--gray-600` | `#6f767d` | `#6F767D` | Yes | `.cobalt--27_0_0-1` |
| `--gray-700` | `#475059` | `#475059` | Yes | `.cobalt--27_0_0-1` |
| `--gray-800` | `#202830` | `#202830` | Yes | `.cobalt--27_0_0-1` |
| `--gray-900` | `#07111b` | `#07111B` | Yes | `.cobalt--27_0_0-1` |
| `--green-200` | `#ecf8f4` | `#ECF8F4` | Yes | `.cobalt--27_0_0-1` |
| `--green-300` | `#e3f5ef` | `#E3F5EF` | Yes | `.cobalt--27_0_0-1` |
| `--green-400` | `#bae7d8` | `#BAE7D8` | Yes | `.cobalt--27_0_0-1` |
| `--green-500` | `#1fc78f` | `#1FC78F` | Yes | `.cobalt--27_0_0-1` |
| `--green-600` | `#00a870` | `#00A870` | Yes | `.cobalt--27_0_0-1` |
| `--green-700` | `#00874f` | `#00874F` | Yes | `.cobalt--27_0_0-1` |
| `--green-800` | `#006130` | `#006130` | Yes | `.cobalt--27_0_0-1` |
| `--green-900` | `#00430b` | `#00430B` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-100` | `#fafafa` | `#FAFAFA` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-200` | `#f2f3f5` | `#F2F3F5` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-300` | `#e8eaed` | `#E8EAED` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-400` | `#d5dae6` | `#D5DAE6` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-500` | `#a1acc9` | `#A1ACC9` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-600` | `#677291` | `#677291` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-700` | `#3e4966` | `#3E4966` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-800` | `#172241` | `#172241` | Yes | `.cobalt--27_0_0-1` |
| `--midnight-900` | `#000921` | `#000921` | Yes | `.cobalt--27_0_0-1` |
| `--orange-200` | `#fff4ed` | `#FFF4ED` | Yes | `.cobalt--27_0_0-1` |
| `--orange-300` | `#ffeee3` | `#FFEEE3` | Yes | `.cobalt--27_0_0-1` |
| `--orange-400` | `#ffd4ba` | `#FFD4BA` | Yes | `.cobalt--27_0_0-1` |
| `--orange-500` | `#ff821f` | `#FF821F` | Yes | `.cobalt--27_0_0-1` |
| `--orange-600` | `#ff6300` | `#FF6300` | Yes | `.cobalt--27_0_0-1` |
| `--orange-700` | `#de4a00` | `#DE4A00` | Yes | `.cobalt--27_0_0-1` |
| `--orange-800` | `#b81c00` | `#B81C00` | Yes | `.cobalt--27_0_0-1` |
| `--orange-900` | `#9a0000` | `#9A0000` | Yes | `.cobalt--27_0_0-1` |
| `--primary-200` | `#f8f5fb` | `#EDF4FC` | **No** | `.cobalt--27_0_0-1` |
| `--primary-300` | `#f1edf8` | `#E3EDFA` | **No** | `.cobalt--27_0_0-1` |
| `--primary-400` | `#d3c4ed` | `#B8D0F2` | **No** | `.cobalt--27_0_0-1` |
| `--primary-500` | `#8635f2` | `#1E7BFC` | **No** | `.cobalt--27_0_0-1` |
| `--primary-600` | `#3e048b` | `#005CDE` | **No** | `.cobalt--27_0_0-1` |
| `--primary-700` | `#28025a` | `#003FBD` | **No** | `.cobalt--27_0_0-1` |
| `--primary-800` | `#1c0140` | `#001597` | **No** | `.cobalt--27_0_0-1` |
| `--primary-900` | `#0a0113` | `#000079` | **No** | `.cobalt--27_0_0-1` |
| `--purple-200` | `#f8f5fb` | `#F4F0FC` | **No** | `.cobalt--27_0_0-1` |
| `--purple-300` | `#f1edf8` | `#EFE8FC` | **No** | `.cobalt--27_0_0-1` |
| `--purple-400` | `#d3c4ed` | `#D9CAF8` | **No** | `.cobalt--27_0_0-1` |
| `--purple-500` | `#8635f2` | `#925CFF` | **No** | `.cobalt--27_0_0-1` |
| `--purple-600` | `#3e048b` | `#763CE8` | **No** | `.cobalt--27_0_0-1` |
| `--purple-700` | `#28025a` | `#551BC7` | **No** | `.cobalt--27_0_0-1` |
| `--purple-800` | `#1c0140` | `#2F00A1` | **No** | `.cobalt--27_0_0-1` |
| `--purple-900` | `#0a0113` | `#110083` | **No** | `.cobalt--27_0_0-1` |
| `--red-200` | `#fff1f0` | `#FFF1F0` | Yes | `.cobalt--27_0_0-1` |
| `--red-300` | `#ffeae8` | `#FFEAE8` | Yes | `.cobalt--27_0_0-1` |
| `--red-400` | `#ffcdc9` | `#FFCDC9` | Yes | `.cobalt--27_0_0-1` |
| `--red-500` | `#ff6459` | `#FF6459` | Yes | `.cobalt--27_0_0-1` |
| `--red-600` | `#ff4538` | `#FF4538` | Yes | `.cobalt--27_0_0-1` |
| `--red-700` | `#db362a` | `#DB362A` | Yes | `.cobalt--27_0_0-1` |
| `--red-800` | `#b80c00` | `#B80C00` | Yes | `.cobalt--27_0_0-1` |
| `--red-900` | `#9a0a00` | `#9A0A00` | Yes | `.cobalt--27_0_0-1` |
| `--secondary-200` | `#f2f4f5` | `#F4F0FC` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-300` | `#e8eaeb` | `#EFE8FC` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-400` | `#d7dbde` | `#D9CAF8` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-500` | `#aeb3b8` | `#925CFF` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-600` | `#6f767d` | `#763CE8` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-700` | `#475059` | `#551BC7` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-800` | `#202830` | `#2F00A1` | **No** | `.cobalt--27_0_0-1` |
| `--secondary-900` | `#07111b` | `#110083` | **No** | `.cobalt--27_0_0-1` |
| `--success-200` | `#ecf8f4` | `#ECF8F4` | Yes | `.cobalt--27_0_0-1` |
| `--success-300` | `#e3f5ef` | `#E3F5EF` | Yes | `.cobalt--27_0_0-1` |
| `--success-400` | `#bae7d8` | `#BAE7D8` | Yes | `.cobalt--27_0_0-1` |
| `--success-500` | `#1fc78f` | `#1FC78F` | Yes | `.cobalt--27_0_0-1` |
| `--success-600` | `#00a870` | `#00A870` | Yes | `.cobalt--27_0_0-1` |
| `--success-700` | `#00874f` | `#00874F` | Yes | `.cobalt--27_0_0-1` |
| `--success-800` | `#006130` | `#006130` | Yes | `.cobalt--27_0_0-1` |
| `--success-900` | `#00430b` | `#00430B` | Yes | `.cobalt--27_0_0-1` |
| `--teal-200` | `#f0f9fa` | `#F0F9FA` | Yes | `.cobalt--27_0_0-1` |
| `--teal-300` | `#ebf9fa` | `#EBF9FA` | Yes | `.cobalt--27_0_0-1` |
| `--teal-400` | `#ceeef0` | `#CEEEF0` | Yes | `.cobalt--27_0_0-1` |
| `--teal-500` | `#6ae2e8` | `#6AE2E8` | Yes | `.cobalt--27_0_0-1` |
| `--teal-600` | `#4bc3c9` | `#4BC3C9` | Yes | `.cobalt--27_0_0-1` |
| `--teal-700` | `#2aa2a8` | `#2AA2A8` | Yes | `.cobalt--27_0_0-1` |
| `--teal-800` | `#047c82` | `#047C82` | Yes | `.cobalt--27_0_0-1` |
| `--teal-900` | `#005e64` | `#005E64` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-200` | `#f0f9fa` | `#F0F9FA` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-300` | `#ebf9fa` | `#EBF9FA` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-400` | `#ceeef0` | `#CEEEF0` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-500` | `#6ae2e8` | `#6AE2E8` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-600` | `#4bc3c9` | `#4BC3C9` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-700` | `#2aa2a8` | `#2AA2A8` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-800` | `#047c82` | `#047C82` | Yes | `.cobalt--27_0_0-1` |
| `--tertiary-900` | `#005e64` | `#005E64` | Yes | `.cobalt--27_0_0-1` |
| `--warning-200` | `#fffbf2` | `#FFFBF2` | Yes | `.cobalt--27_0_0-1` |
| `--warning-300` | `#fff6e3` | `#FFF6E3` | Yes | `.cobalt--27_0_0-1` |
| `--warning-400` | `#ffeecc` | `#FFEECC` | Yes | `.cobalt--27_0_0-1` |
| `--warning-500` | `#ffe16b` | `#FFE16B` | Yes | `.cobalt--27_0_0-1` |
| `--warning-600` | `#ffc847` | `#FFC847` | Yes | `.cobalt--27_0_0-1` |
| `--warning-700` | `#eda813` | `#EDA813` | Yes | `.cobalt--27_0_0-1` |
| `--warning-800` | `#bf8300` | `#BF8300` | Yes | `.cobalt--27_0_0-1` |
| `--warning-900` | `#996800` | `#996800` | Yes | `.cobalt--27_0_0-1` |
| `--white` | `#ffffff` | `#FFFFFF` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-200` | `#fffbf2` | `#FFFBF2` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-300` | `#fff6e3` | `#FFF6E3` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-400` | `#ffeecc` | `#FFEECC` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-500` | `#ffe16b` | `#FFE16B` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-600` | `#ffc847` | `#FFC847` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-700` | `#eda813` | `#EDA813` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-800` | `#bf8300` | `#BF8300` | Yes | `.cobalt--27_0_0-1` |
| `--yellow-900` | `#996800` | `#996800` | Yes | `.cobalt--27_0_0-1` |

## 12. cobalt.css-only names

These names exist only in `cobalt.css`: 94 names, all under `.cobalt--27_0_0-1`, and 15 of the declarations sit inside `@media` queries (responsive sizes such as `--header-width` and `--card-left-padding`). They are component tokens, mainly for `dock`, `input`, `drawer`, `step`. The design file does not describe them. `cobalt.css` does not reference `data-co-colorscheme`, so these values do not change with the theme.

| Variable | cobalt.css value | Declarations | First scope |
|---|---|---|---|
| `--avatar-size` | `3.375rem` / `1.5rem` / `2.25rem` / `6.75rem` | 4 | `.cobalt--27_0_0-1 .co-avatar` |
| `--border-radius` | `0.25rem` | 1 | `.cobalt--27_0_0-1 .co-selection-group__label` |
| `--card-left-padding` | `85px` / `77px` / `69px` | 3 | `@media screen and (min-width:961px) > .cobalt--27_0_0-1 .co-card__content--indented` |
| `--chat-entry-bg-color` | `var(--midnight-700)` / `var(--gray-300)` / `var(--teal-700)` | 3 | `.cobalt--27_0_0-1 .co-chat__message` |
| `--chat-entry-font-style` | `italic` | 1 | `.cobalt--27_0_0-1 .co-chat__message.co-chat__message--bot` |
| `--chat-entry-text-color` | `var(--white)` / `var(--gray-800)` | 3 | `.cobalt--27_0_0-1 .co-chat__message` |
| `--day-bg-color` | `initial` / `var(--gray-300)` / `var(--primary-600)` | 3 | `.cobalt--27_0_0-1 .co-calendar__days` |
| `--day-font-color` | `inherit` / `var(--gray-500)` / `var(--white)` | 3 | `.cobalt--27_0_0-1 .co-calendar__days` |
| `--dock-000` | `#FFFFFF` | 1 | `.cobalt--27_0_0-1` |
| `--dock-400` | `#D5DAE6` | 1 | `.cobalt--27_0_0-1` |
| `--dock-500` | `#A1ACC9` | 1 | `.cobalt--27_0_0-1` |
| `--dock-600` | `#677291` | 1 | `.cobalt--27_0_0-1` |
| `--dock-700` | `#3E4966` | 1 | `.cobalt--27_0_0-1` |
| `--dock-750` | `#293148` | 1 | `.cobalt--27_0_0-1` |
| `--dock-800` | `#172241` | 1 | `.cobalt--27_0_0-1` |
| `--dock-900` | `#000921` | 1 | `.cobalt--27_0_0-1` |
| `--dock-bar` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-bar-bg` | `var(--dock-800)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-button` | `var(--dock-400)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-button-active` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-button-bg-active` | `var(--dock-700)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-button-hover` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-button-outline` | `var(--dock-500)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-close` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-close-bg` | `var(--dock-800)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-close-bg-hover` | `var(--dock-900)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-divider-bg` | `var(--dock-700)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-drawer` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-drawer-bg` | `var(--dock-700)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-drawer-link` | `var(--dock-400)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-drawer-link-bg-active` | `var(--dock-600)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-drawer-link-hover` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-margin` | `0` / `24px` | 4 | `.cobalt--27_0_0-1 .co-dock` |
| `--dock-open` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-popup` | `var(--dock-000)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-popup-bg` | `var(--dock-750)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-popup-item-active-bg` | `var(--dock-700)` | 1 | `.cobalt--27_0_0-1` |
| `--dock-popup-item-bg-hover` | `var(--dock-700)` | 1 | `.cobalt--27_0_0-1` |
| `--drawer-after-display` | `inline-block` / `none` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-after-opacity` | `1` / `0` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-cursor` | `initial` / `pointer` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-layer-opacity` | `0` / `1` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-layer-pointer-events` | `none` / `auto` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-layer-transition-delay` | `initial` / `0.35s` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-left` | `100%` / `0` | 2 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-position` | `absolute` / `static` | 3 | `.cobalt--27_0_0-1 .co-dock` |
| `--drawer-width` | `0` / `24px` / `222px` / `30px` | 4 | `.cobalt--27_0_0-1 .co-dock` |
| `--feedback-color` | `var(--error-700)` / `var(--warning-700)` | 4 | `.cobalt--27_0_0-1 .co-form__field.co--error .co-form__feedback` |
| `--header-width` | `100%` / `1440px` | 4 | `.cobalt--27_0_0-1 .co-header` |
| `--icon-color` | `initial` / `var(--green-600)` / `var(--yellow-600)` / `var(--red-600)` / `var(--primary-600)` / `var(--secondary-600)` | 6 | `.cobalt--27_0_0-1 .co-label-icon` |
| `--input-background-color` | `var(--gray-200)` / `var(--white)` / `transparent` | 29 | `.cobalt--27_0_0-1 .co-color-input.co--disabled` |
| `--input-border-color` | `var(--primary-500)` / `var(--error-700)` / `var(--warning-700)` / `var(--gray-400)` / `transparent` | 53 | `.cobalt--27_0_0-1 .co-color-input:focus,.cobalt--27_0_0-1 .co-color-input:focus-within` |
| `--input-color` | `var(--gray-500)` | 5 | `.cobalt--27_0_0-1 .co-color-input .co-color-input__mask.co--disabled` |
| `--input-height` | `32px` / `56px` | 20 | `.cobalt--27_0_0-1 .co-color-input.co--small` |
| `--input-hover-border-color` | `var(--primary-500)` / `var(--error-500)` / `var(--warning-500)` / `transparent` | 48 | `.cobalt--27_0_0-1 .co-color-input:focus,.cobalt--27_0_0-1 .co-color-input:focus-within` |
| `--input-padding-bottom` | `.282rem` / `.782rem` / `.5rem` / `.375rem` / `.75rem` | 12 | `.cobalt--27_0_0-1 .co-form__field.co--small textarea` |
| `--input-padding-left` | `calc(.5rem + var(--input-height, 42px))` / `0` / `2.5rem` | 4 | `.cobalt--27_0_0-1 .co-color-input input[type=text]` |
| `--input-padding-right` | `0` / `2.5rem` | 3 | `.cobalt--27_0_0-1 .co-checkbox input[type=checkbox],.cobalt--27_0_0-1 .co-checkbox input[type=radio…` |
| `--input-padding-top` | `.282rem` / `.782rem` / `.5rem` / `.375rem` / `.75rem` | 12 | `.cobalt--27_0_0-1 .co-form__field.co--small textarea` |
| `--input-text-size` | `0.75rem` / `1.125rem` | 18 | `.cobalt--27_0_0-1 .co-color-input.co--small` |
| `--item-title-background` | `var(--gray-200)` / `transparent` | 2 | `.cobalt--27_0_0-1 .co-accordion` |
| `--label-background-color` | `transparent` / `var(--primary-600)` / `var(--gray-200)` / `var(--gray-300)` / `var(--primary-500)` / `var(--white)` / `var(--primary-300)` | 12 | `.cobalt--27_0_0-1 label.co--error` |
| `--label-color` | `var(--error-700)` / `var(--warning-700)` / `var(--white)` / `var(--black)` / `var(--primary-500)` / `var(--primary-600)` | 16 | `.cobalt--27_0_0-1 .co-form__field.co--error` |
| `--label-text-size` | `0.75rem` / `1.125rem` | 8 | `.cobalt--27_0_0-1 .co-form__field.co--small` |
| `--menu-bottom` | `auto` / `100%` | 2 | `.cobalt--27_0_0-1 .co-dropdown` |
| `--menu-transform-origin` | `top center` / `bottom center` | 2 | `.cobalt--27_0_0-1 .co-dropdown` |
| `--message-bg-color` | `var(--primary-200)` / `var(--green-200)` / `var(--yellow-300)` / `var(--red-200)` / `var(--purple-200)` | 5 | `.cobalt--27_0_0-1 .co-message` |
| `--message-border-color` | `var(--primary-300)` / `var(--green-300)` / `var(--yellow-400)` / `var(--red-300)` / `var(--purple-300)` | 5 | `.cobalt--27_0_0-1 .co-message` |
| `--message-font-color` | `var(--primary-700)` / `var(--green-700)` / `var(--gray-800)` / `var(--red-700)` / `var(--purple-700)` | 5 | `.cobalt--27_0_0-1 .co-message` |
| `--month-bg-color` | `transparent` / `var(--primary-600)` / `var(--gray-300)` | 3 | `.cobalt--27_0_0-1 .co-datepicker__months` |
| `--month-font-color` | `inherit` / `var(--white)` | 2 | `.cobalt--27_0_0-1 .co-datepicker__months` |
| `--option-size` | `var(--input-height, 42px)` | 1 | `.cobalt--27_0_0-1 .co-rating` |
| `--popup-buffer-margin` | `.5rem` | 1 | `.cobalt--27_0_0-1 .co-popup` |
| `--popup-width` | `18.75rem` / `200px` / `400px` | 3 | `.cobalt--27_0_0-1 .co-popup` |
| `--range-bg-color` | `var(--primary-300)` / `linear-gradient(to left, var(--primary-300) 50%, transparent 50%)` / `linear-gradient(to right, var(--primary-300) 50%, transparent 50%)` | 3 | `.cobalt--27_0_0-1 .co-calendar__days--range` |
| `--range-border-radius` | `initial` / `0.25rem` / `0.25rem 0 0 0.25rem` / `0 0.25rem 0.25rem 0` | 4 | `.cobalt--27_0_0-1 .co-calendar__days--range` |
| `--range-day-bg-color` | `transparent` / `var(--gray-400)` / `var(--primary-600)` | 4 | `.cobalt--27_0_0-1 .co-calendar__days--range` |
| `--range-font-color` | `initial` / `var(--white)` | 3 | `.cobalt--27_0_0-1 .co-calendar__days--range` |
| `--scrollbar-background-color` | `var(--gray-100)` / `var(--gray-200)` / `var(--gray-300)` / `var(--gray-400)` / `var(--gray-500)` / `var(--gray-600)` / `var(--gray-700)` / `var(--gray-800)` / `var(--gray-900)` / `var(--primary-200)` / `var(--primary-300)` / `var(--primary-400)` / `var(--primary-500)` / `var(--primary-600)` / `var(--primary-700)` / `var(--primary-800)` / `var(--primary-900)` / `var(--secondary-200)` / `var(--secondary-300)` / `var(--secondary-400)` / `var(--secondary-500)` / `var(--secondary-600)` / `var(--secondary-700)` / `var(--secondary-800)` / `var(--secondary-900)` / `var(--tertiary-200)` / `var(--tertiary-300)` / `var(--tertiary-400)` / `var(--tertiary-500)` / `var(--tertiary-600)` / `var(--tertiary-700)` / `var(--tertiary-800)` / `var(--tertiary-900)` / `var(--purple-200)` / `var(--purple-300)` / `var(--purple-400)` / `var(--purple-500)` / `var(--purple-600)` / `var(--purple-700)` / `var(--purple-800)` / `var(--purple-900)` / `var(--teal-200)` / `var(--teal-300)` / `var(--teal-400)` / `var(--teal-500)` / `var(--teal-600)` / `var(--teal-700)` / `var(--teal-800)` / `var(--teal-900)` / `var(--green-200)` / `var(--green-300)` / `var(--green-400)` / `var(--green-500)` / `var(--green-600)` / `var(--green-700)` / `var(--green-800)` / `var(--green-900)` / `var(--yellow-200)` / `var(--yellow-300)` / `var(--yellow-400)` / `var(--yellow-500)` / `var(--yellow-600)` / `var(--yellow-700)` / `var(--yellow-800)` / `var(--yellow-900)` / `var(--orange-200)` / `var(--orange-300)` / `var(--orange-400)` / `var(--orange-500)` / `var(--orange-600)` / `var(--orange-700)` / `var(--orange-800)` / `var(--orange-900)` / `var(--red-200)` / `var(--red-300)` / `var(--red-400)` / `var(--red-500)` / `var(--red-600)` / `var(--red-700)` / `var(--red-800)` / `var(--red-900)` / `var(--blue-200)` / `var(--blue-300)` / `var(--blue-400)` / `var(--blue-500)` / `var(--blue-600)` / `var(--blue-700)` / `var(--blue-800)` / `var(--blue-900)` / `var(--midnight-100)` / `var(--midnight-200)` / `var(--midnight-300)` / `var(--midnight-400)` / `var(--midnight-500)` / `var(--midnight-600)` / `var(--midnight-700)` / `var(--midnight-800)` / `var(--midnight-900)` / `var(--success-200)` / `var(--success-300)` / `var(--success-400)` / `var(--success-500)` / `var(--success-600)` / `var(--success-700)` / `var(--success-800)` / `var(--success-900)` / `var(--warning-200)` / `var(--warning-300)` / `var(--warning-400)` / `var(--warning-500)` / `var(--warning-600)` / `var(--warning-700)` / `var(--warning-800)` / `var(--warning-900)` / `var(--error-200)` / `var(--error-300)` / `var(--error-400)` / `var(--error-500)` / `var(--error-600)` / `var(--error-700)` / `var(--error-800)` / `var(--error-900)` / `var(--white)` / `var(--black)` / `var(--dock-popup-bg)` | 126 | `.cobalt--27_0_0-1 .co--bg-gray-100` |
| `--scrollbar-width` | `12px` | 1 | `.cobalt--27_0_0-1` |
| `--selection-padding` | `40px` | 1 | `.cobalt--27_0_0-1 .co-form__field.co--large` |
| `--step-bg-color` | `var(--gray-300)` / `var(--primary-500)` | 4 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-bg-color` | `var(--gray-300)` / `var(--white)` / `var(--primary-500)` | 3 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-border-color` | `var(--gray-300)` / `var(--primary-500)` | 3 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-box-shadow-color` | `var(--white)` | 2 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-cursor` | `default` / `pointer` | 2 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-font-color` | `var(--gray-700)` / `var(--primary-500)` / `var(--white)` | 3 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-margin` | `0 3px` / `0 2px` / `0` | 3 | `.cobalt--27_0_0-1 .co-stepper` |
| `--step-target-size` | `25px` / `31px` / `14px` / `10px` | 4 | `.cobalt--27_0_0-1 .co-stepper` |
| `--stepper-height` | `8px` / `5px` | 2 | `.cobalt--27_0_0-1 .co-stepper` |
| `--td-hover-bg` | `var(--gray-100)` / `var(--gray-200)` / `var(--primary-300)` | 4 | `.cobalt--27_0_0-1 .co-table.co-table--striped .co-table__body .co-table__row.co-table__row--clickab…` |
| `--tooltip-buffer-margin` | `10px` | 1 | `.cobalt--27_0_0-1 .co-tooltip` |
| `--tr-bg-color` | `var(--primary-200)` / `rgba(227, 245, 239, 0.5)` / `rgba(255, 246, 227, 0.5)` / `rgba(255, 234, 232, 0.5)` | 4 | `.cobalt--27_0_0-1 .co-table .co-table__body .co-table__row.co--info,.cobalt--27_0_0-1 .co-table .co…` |
| `--tr-hover-bg` | `var(--gray-100)` / `var(--gray-200)` / `var(--primary-300)` | 4 | `.cobalt--27_0_0-1 .co-table.co-table--striped .co-table__body .co-table__row.co-table__row--clickab…` |
