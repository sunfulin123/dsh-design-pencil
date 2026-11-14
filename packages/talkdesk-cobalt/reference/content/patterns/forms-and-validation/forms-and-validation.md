# Forms & Validation

## Guidance

:::note
Merged from the live Cobalt DS's Forms, Editing, and Errors pattern pages. Image-heavy sections have
been condensed to their essential guidance — figures/screenshots referenced by the source pages were
not migrated in this pass.
:::

## Forms

Forms enable the user to create and edit data. They are also used to collect user data.

Forms can be composed of different input types and other components, such as radio, checkbox, or
toggle. Explore each component's own documentation to understand when and how to use it: Checkbox,
DatePicker, DragAndDrop, Dropdown, Input, InputGroup, Radio, SearchInput, SelectionGroup, Textarea,
Toggle.

### Dimensions

Forms should be single-column and consider:

* width = 50% for large and medium viewports
* width = 100% for small viewports

Forms in panels always have width = 100%. Forms in modals should have width = 50% for large modals,
width = 100% for medium and small modals.

### Spacings

* Inputs should be placed at a distance of 16px from the next.
* Items placed next to inputs, like "delete" buttons, should be placed at a distance of 8px.
* When grouping inputs under the same label, use 12px of spacing between them (including the "add
  more" link/button).
* Inline inputs should be avoided — only use them when two or more inputs are related (e.g. ZIP code +
  City). Composed inputs should be spaced by L:24px / M:16px / S:12px.

### When to use

* Use it to gather short text input.
* Use any of the predefined input sizes.
* Keep labels in close proximity above the input field.

### When not to use

* Avoid using inputs side by side in forms — it can cause usability issues.
* Avoid gathering input from users that isn't absolutely necessary.
* For more extended text input, use a Textarea instead.

Placeholder text should be avoided. Dividers in a form should be spaced according to the viewport:
L:24px / M:16px / S:12px.

### Error inputs

In a form, instead of disabling the submit button until all mandatory inputs are filled, use a default
(enabled) button and, after the user submits the form, provide error feedback with a hint on specific
inputs.

Error input messages should be visible:

* **After the user interacts with the input field.** If the user isn't following the input value
  criteria (e.g. email format), the error message should appear once the user has finished with the
  field and moved to the next one. This excludes a required input the user simply hasn't filled in yet —
  that error should only show after submitting.
* **After the user interacts with the input's action**, when the input has no associated value
  criteria (e.g. an invalid password) — the error should show on submit. In this case, show both an
  error message next to each input with an error, and a summary message at the top of the form
  describing what needs fixing (e.g. "Fix these errors to continue: Phone is required. Email format is
  [example@email.com](mailto:example@email.com).").

## Editing

Editing allows you to edit content on a web page directly, in different ways. Not having a visible Edit
button can increase the probability that users accidentally touch things they don't want to change —
which is annoying while setting up something critical or instant. Edit buttons prevent mistouches and
make the user think before changing things.

### Overlay editing

Brings the editing form just a layer above the page (Modal or Panel), without leaving the page.

* **Use it** when a complex edit doesn't fit into the flow of the page, or when the content being
  edited is important enough to warrant interrupting the flow with a solid editing space.
* **With a Panel** — good when not showing all information at once, or when the user needs to keep the
  page's context visible alongside the edit.
* **With a Modal** — keeps the read-only area condensed and the reading experience neat; best for a few
  inputs and quick editing.

### Section-level editing

Best when users tend to edit sections separately rather than all together. Helps focus attention on one
section and prevents users from mistouching others.

### Page-level editing

Best when users tend to edit several related sections together. A page-level editing trigger (often
fixed to the top) saves repeated edit/save clicks.

A complete page-level form that follows this guidance, as code you can copy:
[Form Page](/layout-templates/form-page/).

### Choosing between them

| Pattern         | What it is                                                                                | When to use                                                                               | When not to use                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Overlay > Panel | Editing form opens in a Panel, with or without overlay.                                   | When not showing all information, or the context needs to stay visible while editing.     | If you have several fields to edit, prefer Panel or Page-level editing instead.                       |
| Overlay > Modal | Editing form opens in a Modal (always with overlay).                                      | For a few inputs, quick editing, giving the edit more highlight.                          | If you have several fields to edit, prefer a Panel or Page-level editing.                             |
| Section-level   | An Edit button on a view-only section opens editing mode on a new page.                   | When users edit sections separately; helps focus and prevents mistouching other sections. | If the user needs to edit multiple sections, prefer Page-level editing.                               |
| Page-level      | An Edit button (often fixed on top) on a view-only page opens editing mode on a new page. | For long or complex editing that needs the user's full attention.                         | If the user only needs to focus on a small block of content, prefer Section-level editing or a Modal. |

## Errors

Errors are unexpected outcomes resulting from user mistakes, technical glitches, or design flaws,
leading to frustration and minimal experiences while interacting with digital products. They should be
communicated promptly and transparently — critical situations, user input errors, system failures,
security/privacy concerns, and form validation all need clear guidance and support.

### Types of errors

Errors are organized by who performs the communication:

* **System errors** — performed by the system, exclusively used by Workspace. Sub-groups: System error
  prevention (destructive/irreversible action validation), System error, Cross-application or global
  system communications.
* **App errors** — performed by the apps. Sub-groups: Input errors (user input errors, file upload
  errors, submission input errors), Errors communication (general, multiple, task error communication),
  No content (existing content, non-existent content), and App error prevention (input errors
  prevention, destructive/irreversible action validation).

### Recommended components per error type

| Error group                       | Sub-group                                  | Component                                                              |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| System error prevention           | Destructive/irreversible action validation | OS pattern                                                             |
| System error                      | —                                          | Workspace system error pattern                                         |
| Cross-application / global system | —                                          | BannerMessage                                                          |
| Input errors                      | User input errors                          | Input with hint                                                        |
| Input errors                      | File upload errors                         | Message                                                                |
| Input errors                      | Submission input errors                    | Input with hint + Message                                              |
| Errors communication              | General                                    | Icon + Tooltip, LabeledIcon + Tooltip, Hint, Tag + Tooltip             |
| Errors communication              | Multiple                                   | Message + General error communication component                        |
| Errors communication              | Task                                       | Toast                                                                  |
| No content                        | Existing content                           | EmptyState (app container), Message (sub-container), Hint (components) |
| No content                        | Non-existent content                       | EmptyState                                                             |
| App errors prevention             | Input errors prevention                    | Icon + Tooltip, LabeledIcon + Tooltip                                  |
| App errors prevention             | Destructive/irreversible action validation | ErrorModal                                                             |

### Example use cases

System errors: the user quits the Talkdesk app; 404/403/500/503; browser not supported; no internet
connection; the user tries to call without mic permissions; a bug rollback; RTM system issues.

App errors: invalid input format; a file too large/wrong type/empty was dragged; too many files
dragged; submitting a form (or a modal/panel form) with errors; a list/table item or property has an
error; a chat message failed to deliver; multiple table items or a flow have errors; an app didn't
open; a download failed; a table/card/section failed to load; no results for applied filters or search;
form inputs that depend on each other's values; destructive-action confirmations (deleting data,
changing permissions, leaving unsaved changes, resetting settings, removing items from a group,
deactivating a property, or any destructive action affecting other products).
