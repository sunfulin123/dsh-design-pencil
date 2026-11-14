# Bulk actions

## Guidance

:::note
This page doesn't map to the spec's Interaction Patterns categories (Forms & Validation, Search/
Filtering/Sorting, Empty States & Loading, System Notifications & Alerts, Onboarding & Wizards, Data
Visualization) — flagged for review. Sourced from the live Cobalt DS's Bulk actions pattern page.
Image-heavy sections have been condensed to their essential guidance — figures/screenshots referenced
by the source page were not migrated in this pass.
:::

Bulk actions let users execute custom actions or logic on a large set of items at once — typically
seen in paginated lists or tables (users, contacts, voicemails, etc.).

## Types

1. **In a list or table** — select at least one item to enable bulk actions on the interface.
2. **Through file import** — apply the same kind of logic via a specific file that contains it.

## Empty and selection states

* **No content yet** — if the screen has no items at all, remove the toolbar's table actions (Search,
  Sort, Table options, Filters), since none of them would change anything.
* **Filtered to nothing** — follow the general Empty state pattern.
* **Error loading results** — use an error state on the results area.
* **No items selected** — the toolbar keeps its default actions (Search, Sort, Table options, Filters).
  These only change how items are shown, not the items themselves; each search/filter/sort still
  triggers a new backend query.

## Enabling bulk actions

Once one or more items are selected via checkboxes, the toolbar updates: the left side shows how many
items are selected, and the right side's table options (search, filter, sort) become unavailable —
re-querying while a selection is active risks showing a list that no longer matches the user's
selection. The bulk actions list sits on the left of the toolbar, with a 12px margin from any other
left-side content.

Clearing an active filter or search while items are selected keeps the selection intact.

## Pagination

Bulk actions work across a paginated list — selections persist as the user navigates pages, so they can
act once instead of per page.

## Overflow

If there are too many bulk actions to fit the toolbar, the ones that don't fit are grouped into a
"More actions" dropdown.

## Destructive actions

Destructive actions (Deactivate, Delete, Logout, etc.) can be part of the bulk actions list. They
should look the same as non-destructive actions for consistency, whether in the toolbar or a "More
actions" popup. Use a confirmation dialog after a destructive bulk action (see below).

## Actions that depend on item attributes

When a bulk action changes an attribute (e.g. voicemail "Status": Open/Resolved):

* **All selected items share the same value** — offer the opposite action, disabling the one that
  doesn't apply (so both actions stay visible for accessibility, one just disabled).
* **Selected items have mixed values** — either present both possible actions, or group them into one
  action that opens a modal where the user picks the specific value to apply.

## Long button labels

Prefer short labels, but when a label doesn't fit (especially after translation), move the action into
a "More actions" button rather than truncating with an ellipsis.

## Confirmation and modal dialogs

* **Non-destructive confirmation** — a simple acknowledge/confirm dialog with a primary action and a
  cancel.
* **Non-destructive, needs input** — the primary button stays disabled until the required input
  criteria are met.
* **Destructive, not critical** — use the standard error modal dialog.
* **Destructive and potentially breaking** (e.g. deleting an account, deleting users in bulk, deleting
  users currently on a call) — use a more deliberate confirmation requiring explicit user input, so the
  action can't be triggered accidentally. Use this sparingly, only when justified.

## Feedback states

After confirming a bulk action, show feedback:

* **Loading** — an info toast; disable checkboxes and actions to prevent duplicate requests.
* **Success** — clear the selection and show a success toast describing what happened to how many
  items.
* **Error** — keep the selection so the user can retry, and show an error toast.
* **Warning (partial success)** — keep only the items that failed selected, so the user can retry just
  those.

## Bulk actions through file import

Useful when users need to change many/all attributes at once, already have a tracking file (CSV,
Excel, etc.), or need to change large sets of items without manually working through the interface —
especially for recurring tasks. Provide an "Import" button that opens a drag-and-drop modal, and
consider a separate "Bulk management" area where users can track import progress (these operations are
often heavier and slower than the user is willing to wait for). Importing can update existing items
(unmatched rows are ignored), add new items (needs a different template), or delete items (needs its
own explicit option and, ideally, its own template) — these are three distinct outcomes and shouldn't
be conflated.

## Limiting selection size

When there's a cap on how many items can be selected at once:

* Once at least one item is selected, show a non-dismissible message stating the limit.
* At 75% of the limit or above, switch that message to a warning, and disable further checkboxes with
  a tooltip explaining why ("Can't select this item because it will go over the selection limit").
