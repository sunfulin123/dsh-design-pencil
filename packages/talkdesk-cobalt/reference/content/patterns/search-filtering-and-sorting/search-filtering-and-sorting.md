# Search, Filtering & Sorting

## Guidance

:::note
Merged from the live Cobalt DS's Filtering and Searching pattern pages. Image-heavy sections have been
condensed to their essential guidance — figures/screenshots referenced by the source pages were not
migrated in this pass.
:::

## Filtering

Filtering allows users to hide content that isn't relevant to the task they're performing, keeping
focus on important information. It can be applied to a table, a group of cards, or other kinds of data
collection.

### Multiple filters

Small panels should always be used for multiple filters.

Input default state copy for filtering panels:

| Copy type   | Placeholder default state                                                   | Active default state        |
| ----------- | --------------------------------------------------------------------------- | --------------------------- |
| When to use | Should never be used — replace empty states with placeholders and guidance. | —                           |
| Examples    | "Select options", "Select a category"                                       | "All agents", "Last 7 days" |

### Single filter

When only one filter can be applied, add a single component to the toolbar to apply it:

* **InputGroup with Dropdown** — when the user can filter by choosing 1 or multiple options from a
  list of several options (e.g. filter by country).
* **Toggle** — when the user can filter by a single boolean option (e.g. show in-progress issues). The
  label goes to the right of the toggle.
* **SelectionGroup** — when the user can choose only one option from up to 6 (e.g. filter by issue
  status: to-do, in progress, done). Avoid on small viewports — replace with InputGroup + Dropdown
  instead.
* **Dropdown** — when the user can choose one or multiple options from a longer list (e.g. filter by
  country). Avoid on small viewports for the same reason.

In small viewports, if the toolbar doesn't have room for the filtering component, replace it with an
icon-only filtering button that opens a popup.

## Searching

The Searching pattern lets users find information quickly and efficiently.

### Character limit

By default, search starts at 1 character. Depending on API limitations or other factors, it can start
at 3 or 5 characters/digits.

### Placement of copy

* **Description** — below the field's name; explains the search field's purpose.
* **Placeholder** — inside the search bar. Active state: shows the first result in alphabetical order.
  Default state: guidance on what to search for (e.g. "Search country").
* **Hint** — below the search bar or inside the popup (at the top), depending on context. Guides the
  expected action and offers search tips.
* **Feedback** — depending on context, can replace the hint. Negative: "No results found." In-between:
  guidance on the search process (disallowed characters, remaining characters needed). Positive: shows
  results.

### Best practices

* Use a hint/feedback inside the popup when space is limited — the popup should appear dynamically
  whenever characters are still missing.
* Prefer the hint/feedback below the search input, appearing as soon as the user clicks the input, even
  before typing.
* Avoid relying on empty states for feedback — the message can be missed.

### Result ordering

* **Numbers** — results can appear at the beginning, middle, or end of the value.
* **Names, emails, articles** — primary results start from the first letter typed; secondary,
  contextually relevant results can follow (e.g. searching "call" surfaces "call" first, "recall"
  secondarily; searching "E" for countries surfaces names starting with E, then contextually relevant
  ones like "España" for Spain).

### Behavior

* **Dynamic search** — starts at 1 character/digit; results appear alphabetically; the popup hint
  updates dynamically as characters are typed; secondary results can appear if contextually relevant.
* **Non-dynamic search** — also starts at 1 character/digit; if multiple items can be searched at once,
  explain how in the hint; clearly communicate any digit/character limitations in the hint.

Avoid using empty states as hints or in-between feedback — reserve them for negative feedback only.
