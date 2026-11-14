# Form Page

## Guidance

A form page edits one record on its own page (page-level editing in
[Forms and validation](/patterns/forms-and-validation/)): a page header with Cancel and Save, and the form in
sections separated by dividers. It's the edit mode of a [Detail Page](/layout-templates/detail-page/). The
recipe below is a complete, working form page built with Cobalt. Copy it and replace the fields.

It follows the [Edit user - Form layout](https://www.figma.com/design/xx5MASNpf0DrwR9kWHHjBD/Users-app?node-id=15-5678)
in Figma, the reference developers use, with the differences listed below.

:::note
Draft for review by the Cobalt team. The recipe follows the Figma layout and the documented guidance and was
checked in a browser, but the composition hasn't been agreed as the standard yet.
:::

![The form page recipe after pressing Save with First name empty: "Profile" above the name, Cancel and Save; the form in one column with the error "Enter a first name."; sections separated by full-width dividers; External ID shown as an N/A tag; Team set to None](/assets/recipes/form-page.jpg)

## What it follows

From the Figma layout:

* **Header.** "Profile" as a small pre-title above the record's name, Cancel and Save on the right, and a
  full-width divider below.
* **Sections.** Separated by dividers that span the whole page, with 24px above and below. Each section
  title sits 16px above its first field.
* **Read-only values.** A label above a small tag (External ID: "N/A"), not a disabled input.
* **Optional choices** start at "None".

From [Forms and validation](/patterns/forms-and-validation/):

* **One column**, half the page wide on large and medium viewports and full width on small ones.
* **16px between inputs**, and no placeholder text.
* **Save stays enabled.** A field shows its error once the user has left it; pressing Save shows every
  error and a line saying to fix the highlighted fields.

## Differences from the Figma layout

* **Last name sits below First name**, not beside it: the guidance asks for one column and to avoid inputs
  side by side.
* **Fields fill the form column** (half the page) instead of Figma's fixed 360px, so they keep one width in
  one column; Role is already about that wide in Figma.

## What it uses

One row per component, with the library it comes from.

| Component                                  | Library                                              | Used for                                                | Notes                                                                                |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Typography](/components/core/typography/) | Core | The pre-title, the record's name and the section titles | Section titles are level-2 headings styled small.                                    |
| [Button](/components/core/button/)         | Core | Cancel and Save                                         | Save is the page's one primary button and stays enabled.                             |
| [TextInput](/components/core/text-input/)  | Core | First name, Last name, Email                            | `isRequired`, `isInvalid` and `errorMessage` show the required marker and the error. |
| [Dropdown](/components/core/dropdown/)     | Core | Role and Team                                           | Role is required; Team starts at "None".                                             |
| [Toggle](/components/core/toggle/)         | Core | Activation                                              | In a `ToggleGroup`: the group's label names the setting.                             |
| [Tag](/components/core/tag/)               | Core | External ID, a read-only value                          | Small, light gray, under a medium-weight label.                                      |
| [Divider](/components/core/divider/)       | Core | Under the header and between sections                   | Full width.                                                                          |
| [Flex](/components/core/flex/)             | Core | The layout: rows, columns and gaps                      |                                                                                      |
| [ViewportProvider](/get-started/develop/)  | Core | The responsive width                                    | `useViewport`: on small viewports the form takes the full width.                     |

## Before you copy it

* Set up the app as in [Develop](/get-started/develop/): the theme stylesheet and the three providers.
* Install the packages listed at the top of the file.

## Open question

The pages this recipe was modelled on disable Save until something changes. The guidance only says not to
disable submit until required fields are filled, so this recipe keeps Save enabled. The Cobalt team should
say whether "disabled until changed" is fine on edit forms.

## Maintained recipe source

Read `recipes/form-page.md` for integration and limitations, then copy the default `FormPage` export from `recipes/form-page.tsx`. These paths start at the bundle root. [Open the executable recipe](/recipes/form-page/).

The maintained TSX is the executable authority; this migrated design page does not maintain a second inline copy. Preserve the draft qualification above, adapt the sample to the requested workflow, and verify callbacks and states in the target app.
