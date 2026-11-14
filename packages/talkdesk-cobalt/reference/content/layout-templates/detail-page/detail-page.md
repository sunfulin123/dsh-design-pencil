# Detail Page

## Guidance

A detail page shows one record, read only: a page header with Back, the record's name and its destructive
action; tabs for the record's areas; and in each tab, a section header with Edit, a summary of the record, and
its details in titled groups. The recipe below is a complete, working detail page built with Cobalt. Copy it
and replace the record, the tabs and the groups.

It follows the user profile in the [Users app Figma](https://www.figma.com/design/xx5MASNpf0DrwR9kWHHjBD/Users-app?node-id=1868-61318)
(Profile tab), with the differences listed below. The
[phone number details in the Admin Numbers Figma](https://www.figma.com/design/KsYLRdJgfSm46sIlCTokaf/Admin-Numbers?node-id=709-871676)
show the same template on another record. Edit opens the record's edit mode, which is the
[Form Page](/layout-templates/form-page/) recipe.

:::note
Draft for review by the Cobalt team. The recipe follows the Figma layouts and the live Admin pages and was
checked in a browser, but the composition hasn't been agreed as the standard yet.
:::

![The detail page recipe: Back, "Avery Example" and Delete user; Profile, Classic settings and Wrap-up settings tabs; the Profile header with Edit; a large avatar with the initials, the name and an Active tag, and Role beside it; Contact information with Email; Employee information with External ID shown as an N/A tag, and Additional information with the team after its parent team](/assets/recipes/detail-page.jpg)

## What it follows

* **Page header.** Back as an icon button on the left, then the record's name as the page title, and the
  destructive action on the right. The tabs sit under it, then a full-width divider.
* **Section header.** Each tab starts with its title, a one-line description and Edit, the page's one primary
  button.
* **Summary row.** A large avatar with the initials, the name and a status tag, then the record's most
  important attribute (Role) with an icon. A full-width divider closes it.
* **Groups.** Small uppercase titles, with a medium-weight label above each value. Groups sit in 360px
  columns, two side by side when they're short; on small viewports they stack in one column.
* **Empty values** show as a small light-gray tag ("N/A", "None"), so they can't be mistaken for real text.
* **A team with a parent team** shows the parent's name before the team's tag ("Support: Team Alpha").

From the Figma notes on the same page:

* **Edit and save.** Edit opens the edit mode. If saving fails, the user stays in edit mode to try again;
  when it succeeds, they're back here and a toast confirms it.

## The same template on other records

The same template shows other records too. The phone number details in the Admin Numbers Figma keep the
page header, the tabs and Edit, and change the rest:

* **A pre-title** above the name says what kind of record it is: a flag, the country and the number type.
* **Status tags sit beside the title** ("Active", "New"), and there's no summary row.
* **Help** (with an icon that says it opens in a new tab) sits before Delete, which is a transparent danger
  button with an icon, as in the recipe.
* **Each group is a section** with its own large title and a full-width divider below it: Basic information,
  Product assignment and Coverage. Edit sits on the first section only.
* **One column of label-and-value pairs.** Lists of values are small tags (Origin, Teams; Products with an
  icon in each). Assigned flows are a list of names, each with a description under it.
* **Coverage is a list of checks**: a check icon for what the number supports and a warning icon for what it
  doesn't.

Keep the page header, the tabs and the section headers in the same places; change only what's inside the
sections.

## Differences from the Figma layout

* **Delete user is a transparent danger button with an icon**, as in the Numbers Figma and the live pages, not
  the filled red button in the Users Figma: Edit is the page's primary action, and a filled red button would
  compete with it.
* **Contact information shows Email**, as the live page does. The Figma frame repeats Role there.
* **The second group is "Additional information"**, as in the Figma edit layout and the live page. This
  Figma frame titles both groups "Employee information".

## What it uses

One row per component, with the library it comes from.

| Component                                  | Library                                              | Used for                                                                         | Notes                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Typography](/components/core/typography/) | Core | The page title, the tab's title and description, group titles, labels and values | The tab title is a level-2 heading; group titles are level-3 headings styled small. Labels are text, not form Labels: there's no control to name. |
| [Button](/components/core/button/)         | Core | Back, Delete user, Edit                                                          | Back is icon only and named "Back to users". Edit is the page's one primary button; Delete user is a transparent danger button.                   |
| [Icon](/components/core/icon/)             | Core | The icons in the buttons and beside Role and Email                               | Use the default export: it loads the icon font itself.                                                                                            |
| [Tab](/components/core/tab/)               | Core | Profile, Classic settings, Wrap-up settings                                      | In a `nav`; the current tab sets `aria-current="page"`.                                                                                           |
| [Avatar](/components/core/avatar/)         | Core | The initials in the summary row, and the circle behind each field icon           | Large `light-theme` for the initials, small `basic` behind an icon. Avatar is hidden from screen readers, and the label names the value.          |
| [Tag](/components/core/tag/)               | Core | The status, empty values and the team                                            | Small. `light-green` when active; `light-gray` for empty values ("N/A", "None") and the team.                                                     |
| [Divider](/components/core/divider/)       | Core | Between the header, the summary and the groups                                   | Full width.                                                                                                                                       |
| [Flex](/components/core/flex/)             | Core | The layout: rows, columns and gaps                                               |                                                                                                                                                   |
| [ViewportProvider](/get-started/develop/)  | Core | The responsive width                                                             | `useViewport`: on small viewports the groups take the full width.                                                                                 |

## Before you copy it

* Set up the app as in [Develop](/get-started/develop/): the theme stylesheet and the three providers.
* Install the packages listed at the top of the file.

## Open questions

* **Delete style.** The Users Figma uses a filled red button; the Numbers Figma and the live pages use a
  transparent one with an icon. The Cobalt team should pick one.
* **Delete confirmation.** Deleting a record can't be undone, so it should ask first, but no confirmation is
  designed for it yet. The recipe only calls `onDelete`.
* **Where the status goes.** Under the name in a summary row (users) or beside the title (numbers). The
  Cobalt team should say which, or when to use each.
* **Empty values.** The Users Figma shows a tag ("N/A", "None"), the Numbers Figma gray text ("Unknown"),
  and the live number page a dash. The Cobalt team should pick one.
* **No Header component in code.** The page and section headers come from Figma's HeaderPattern, which is
  design only, so the recipe builds them from core parts.

## Maintained recipe source

Read `recipes/detail-page.md` for integration and limitations, then copy the default `DetailPage` export from `recipes/detail-page.tsx`. These paths start at the bundle root. [Open the executable recipe](/recipes/detail-page/).

The maintained TSX is the executable authority; this migrated design page does not maintain a second inline copy. Preserve the draft qualification above, adapt the sample to the requested workflow, and verify callbacks and states in the target app.
