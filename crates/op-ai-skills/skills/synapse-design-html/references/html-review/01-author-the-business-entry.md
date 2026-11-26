## Author the business entry

Keep the original page structure and selected DESIGN. Add the adapter once in `<head>`, before application scripts:

```html
<script src="./prototype-review/page.js"></script>
```

Implement the applicable planned states. For plain HTML, put `data-prototype-state` on state-specific regions; shared navigation/header content stays outside them. Space-separated values share a region across states. The adapter hides nonmatching regions, even if their authored CSS overrides native `hidden` styles.

```html
<section data-prototype-state="success partial">Populated page content</section>
<section data-prototype-state="loading" hidden>Loading records…</section>
<section data-prototype-state="empty" hidden>No records yet.</section>
<section data-prototype-state="error" hidden>Could not load records.</section>
```

Script-rendered pages read `window.SynapsePrototypeReview.state` before their initial render and supply that scenario to their own renderer. The adapter also emits `prototype:statechange` at DOMContentLoaded, with `{ state }` in `event.detail`; late subscribers must read the initial API value rather than wait for a past event. The API is not a replacement for business interactions or validation. Every listed state needs real corresponding content and a browser assertion.

Do not place prototype state/size selectors in the business page. User-facing filters, tabs, dialogs and actions remain part of the business page.
