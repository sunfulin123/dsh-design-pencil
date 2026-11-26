## Frame-aware actions and detail images

Keep declarative sessions in `<temp-dir>/review/steps.json`. Existing actions remain available. Add `frame: "iframe[data-primary-frame]"` to target Workspace business controls, or an array of selectors for nested same-origin frames (maximum four). Ordinary preview wrappers use their business iframe selector. Missing, inaccessible or not-ready frames fail explicitly; an empty outer DOM is not a successful business review.

`click`, `fill` and `press` use Chromium input; Tab, Shift+Tab and Escape exercise real focus/default behavior. `assertFocused` and `assertValue` check the result. `focus`, native `select` and form `submit` retain their explicit DOM/control semantics. Covered or disabled click targets fail; do not force clicks through modal overlays.

Before a screenshot after a panel transition, use Browser Use `browser_wait` with `kind: "settle"`; it waits for DOM quiet and finite animations, while ignoring infinite loops. In a headless capture plan use `{ "action": "waitFor", "selector": "#panel", "stable": true, "timeoutMs": 5000 }`, with `frame` when needed. This waits for target/ancestor finite motion and stable bounds; it does not alter CSS or stop animation. Then take one screenshot. A timeout is a failed wait, not permission to label an intermediate frame complete.

A screenshot step may name a `selector` for an element crop, `clip: {x,y,width,height}` for a viewport rectangle, or `frame` for a business-frame image. Read detail crops while fixing local defects. Crops supplement full-viewport evidence; they cannot replace final responsive captures. Existing screenshot steps without a region keep their full-viewport behavior.
