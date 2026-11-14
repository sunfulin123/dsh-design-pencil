# Empty States & Loading

## Guidance

:::note
Merged from the live Cobalt DS's Empty state, Empty value, and Loadings pattern pages. Image-heavy
sections have been condensed to their essential guidance — figures/screenshots referenced by the
source pages were not migrated in this pass.
:::

## Empty state

Empty states are placeholder content for when content can't be shown or is empty — they appear when
there's no data to display and describe what the user can do next. Use them when a page or list
returns no results, whether because it's the user's first time in that section, or because a search or
filter returned zero results.

### Variations

Empty states can show an icon or an illustration, and can be sized for small, medium, or large
viewports.

### When to use

* By default, display an illustration representing the missing content or action.
* If useful, include an action or link to help the user recover and find what to do next.
* Consider every scenario that could cause the empty state.
* The first time someone views an empty board, suggest samples or recommendations to ease getting
  started.
* When a user finishes all their tasks, the tone can be celebratory and inspiring.
* A general "no results" state (e.g. no search results) should stay more neutral, but still motivate
  next steps.

### When not to use

* Don't use an empty state to give feedback about a state/context change during a task — use a message
  or toast instead.
* When multiple sections on a page can be empty, prefer inline notifications over multiple empty
  states.

### Use cases

No results for applied filters, no search results, no bookmarks, no activity, no wrap-up, no
transcription, no connection (when offline, the EmptyState illustration itself can't be shown).

### Behavior

* Layout scales from large to small based on container width.
* Empty states should be vertically and horizontally centered in the content area they replace.
* Don't use illustrations for panels, modals, cards, or other non-full-page empty states.
* If the main header has no actions, follow the empty state with a primary filled button. If the header
  already has primary/secondary buttons, use a primary outlined button instead.
* When combined with a button/link immediately after, snap them together (0px) — the empty state
  already reserves bottom spacing.

### Fallbacks and white-labeling

Instead of an illustration, any Cobalt icon can be used — for tight spaces or white-labeled
applications. White-labeling requires every illustration to fall back to a given icon, so make sure
developers get the fallback icon for every illustration used. This component isn't directly affected by
internationalization.

## Empty value

An empty value indicates a cell or label is empty, equal to zero, or not applicable. Consider three
cases:

| Use case                                            | What to write                                                                                        | Style                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| The value doesn't exist and will never exist        | N/A, Not applicable                                                                                  | color: secondary600, italic             |
| The value doesn't exist but can exist in the future | ∅ (numbers), — (text), or a short written explanation (e.g. "Not answered", "Skipped", "Not scored") | color: secondary600, italic (text only) |
| The value exists and equals zero                    | 0, 0€, 0%, etc.                                                                                      | color: secondary800, regular            |

* **Never / not applicable** — "Not applicable" is preferred over "N/A" where space allows; always use
  a distinct style so it reads as different from real content.
* **Not yet / future** — prefer a short written explanation of what's missing over a bare symbol where
  possible.
* **Zero** — use numerals (0 is the only option) with the appropriate currency/decimal/fraction/percent
  formatting, still styled distinctly from other text.

## Loadings

A loading pattern indicates content is processing, telling the user data is loading and the screen
isn't frozen. This pattern covers full-screen loading, inline loading, skeleton states, and progressive
loading — see also the 3Dots, Spinner, Skeleton, and ProgressBar components individually.

### Full-screen loading — 3Dots

Use when the entire page or application is processing (often after data is submitted/saved). If the
process will take more than a few minutes, include copy and an action telling the user what to do.

Workspace shows 3Dots while an app loads, and no package lets an app show it itself (see
[App loading](/workspace/app-loading/)). Inside your app, load a whole page with a Skeleton.

### Inline loading — Spinner

Use when a single component is processing (e.g. after clicking a button). Only show a spinner if the
expected wait is more than a second. Place it inside the portion of the page being updated.

### Skeleton states

Non-interactive previews of the actual UI structure, communicating that content is loading. Should only
appear for a few seconds, disappearing once content populates. Use when data takes more than 300ms to
load on an average connection.

### ProgressBar

Represents completion of a task or operation as a percentage. Use for file downloads/uploads,
long-running or background processes (e.g. importing data, exporting reports) — to give the user a
sense of context and duration.

### Load more action

Expands a list where only a few options are shown initially, loading data in progressive batches (a
common pattern inside a DropdownItem, for example).

### Choosing between them

|                 | 3Dots                                                                      | Spinner                                                                                                        | Skeleton                                                                                                       | ProgressBar                                                                                     |
| --------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| What it is      | A progress indicator for a whole journey/page.                             | An animated indicator for a single processing element.                                                         | A non-interactive preview of the UI structure while it loads.                                                  | Continuous progress through a process (e.g. a percentage).                                      |
| When to use     | Loading an entire page or app; a large component; a single modal or panel. | A tiny inline action/feedback where the wait exceeds \~1s; data that can't use skeleton loading (e.g. charts). | Blocks of content loading together, where the page layout is known ahead of time; data taking more than 300ms. | Downloading/uploading a file; a long-running/background process; when duration context matters. |
| When not to use | Small components; inline loading; loading multiple panels/modals.          | An entire page load; multiple spinners on one page; long-running/background processes (use ProgressBar).       | Small components; panels/modals; long-running processes.                                                       | Small components; inline loading; multiple components at once; whole-page feedback.             |

### Combining multiple loadings

Use with caution: a page/app typically starts loading with 3Dots, then its structure loads
progressively with Skeleton. If a page and a Panel/Modal load together, load the Panel/Modal's key
content first with a Spinner, then continue the page's 3Dots loading. Avoid showing multiple loading
components for the same purpose at once (e.g. one Spinner per list item) — prefer a single shared
loading indicator for the group.
