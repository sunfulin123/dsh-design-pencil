## Behavior and locators

Size changes the real iframe width without scaling or reloading it. Fill tracks the available width; Phone is a true 390 × 844 page with outer scrolling when necessary. Readout reports the actual page viewport, excluding the toolbar. The business iframe keeps its own scrolling, media queries and fixed-position controls.

State changes reload the current local business page with `?prototypeState=<id>`. Custom query parameters survive; separate local pages must include the same adapter and compatible state list. Reset restores Fill, the configured default state and original entry, reloading its transient DOM state. It does not erase business localStorage or other authored data. HTTP Preview supports local multi-page navigation; direct `file:` review supports the initial entry and its state presets. An unconnected/external page disables state controls with a visible reason.

The chrome follows the system light/dark preference independently of business styling. Menus close on Escape/outside interaction and return focus to their trigger; labels and stable locators stay available on narrow screens.

| Control | Accessible name / selector |
| --- | --- |
| Size trigger | `Window size`, `[data-testid="prototype-size-trigger"]` |
| Size option | `Window size 1440 px`, `[data-testid="prototype-size-1440"]` |
| Phone option | `Window size Phone · 390 × 844`, `[data-testid="prototype-size-mobile"]` |
| State trigger | `Page state`, `[data-testid="prototype-state-trigger"]` |
| Error option | `Page state Error`, `[data-testid="prototype-state-error"]` |
| Reset | `Reset prototype settings`, `[data-testid="prototype-reset"]` |
| Business frame | `iframe[data-testid="prototype-page"]` |
