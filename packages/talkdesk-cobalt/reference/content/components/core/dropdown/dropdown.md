# Dropdown

> **Cobalt core** component · `@talkdesk/cobalt-react-dropdown`
>
> Not the same as [Dropdown (Cobalt Marketplace)](../../../components/marketplace/dropdown/dropdown.md), `@talkdesk/cobalt-marketplace-react-dropdown`: a separate package with its own API. Check which one the code imports before using either.
>
> Extended in Cobalt Marketplace by [MultiDropdown](../../../components/marketplace/multi-dropdown/multi-dropdown.md) (`@talkdesk/cobalt-marketplace-react-multi-dropdown`), built on this package.

## Install (v4.1.1)

```sh
npm install @talkdesk/cobalt-react-dropdown
```

```tsx
import { Dropdown, DropdownAction, DropdownItem, DropdownSection } from "@talkdesk/cobalt-react-dropdown";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-dropdown-docs--docs)

## Known gaps

Read before using it:

* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.

## Guidance

Dropdowns present a list of items from which a user can select one or multiple options.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

![An open dropdown: the field labelled Dropdown and, below it, the Dropdown Menu listing actions with the selected Value checked](/assets/dropdown/cover.png)

### Overview

Dropdown is used when the user has options to choose from (one or multiple options).

* The dropdown displays placeholder text in the field when closed.
* Clicking on a closed field opens a menu of options.

Selecting an option from the menu closes it and the selected option text replaces the placeholder text in the field and also remains as an option in place if the menu is open.

### Anatomy

The default / activated form of a dropdown.

![Dropdown anatomy: label, hint, field, item, selected item, and dropdown menu](/assets/dropdown/anatomy.png)

1. **Label** - Text that informs the user what to expect in the list of dropdown options.
2. **Hint** - Assistive text to help the user choose the right selection.
3. **Field** - Persists when the dropdown is open or closed.
4. **Item** - A choice for the user, shown with other choices in a menu.
5. **Selected item** - A variation of status for the dropdown item.
6. **Dropdown Menu** - A list of options to choose from, displayed as an open state.

### Variants

#### Sizes

Two sizes available: `Medium` and `Small`

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

Fourteen options available: `Default`, `Active`, `Active-placeholder`, `Active-search`,`Placeholder`, `Disabled`, `Error`, `Error-placeholder`,`Dismissible`, `Focused`, `Focused-placeholder`, `Read-only`, `Warning` and `Warning-placeholder`

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Styles

**Border**

`Default` or `Borderless`

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

##### By function

`Basic`, `With icon`, `With flag`, `Multi-selection` (with one row), `Nested` and `With presence`

Note: Some variations may not be implemented and available in the Storybook yet.

![Default state](/assets/dropdown/state-default.png)
*Default*

  ![Dropdown modifier examples: with icon, with flag, with a custom icon, and icon on the right](/assets/dropdown/modifier-default.png)
*Icon ON*

![Dropdown example — Modifiers By function: MultiSelect ON - One row](/assets/dropdown/modifier-icon-on.png)
*MultiSelect ON - One row*

  ![Dropdown example — Modifiers By function: Nested ON](/assets/dropdown/nested-on.png)
*Nested ON*

![Dropdown example — Modifiers By function: Right value ON](/assets/dropdown/right-value-on.png)
*Right value ON*

  ![Dropdown example — Modifiers By function: Tag ON](/assets/dropdown/tag-on.png)
*Tag ON*

![Dropdown example — Modifiers By function: Action ON](/assets/dropdown/action-on.png)
*Action ON*

##### By structure

We have different types of similar components.

![Dropdown example — Modifiers By structure: Default dropdown](/assets/dropdown/default-dropdown.png)
*Default dropdown*
Used for creating multiple options to a simple dropdown.

  ![Dropdown example — Modifiers By structure: Item from a dropdown menu](/assets/dropdown/item-from-a-dropdown-menu.png)
*Item from a dropdown menu*
Used for creating selectable options inside a dropdown menu.

![Group title item](/assets/dropdown/structure-group-title.png)
*Group title*
Title for a dropdown item

  ![Load more link](/assets/dropdown/structure-load-more.png)
*Load more*
Loading states for dropdown items

![Dropdown example — Modifiers By structure: Microcopy](/assets/dropdown/microcopy.png)
*Microcopy*
Notes to include in a dropdown menu

![Search bar inside a dropdown menu](/assets/dropdown/structure-search.png)
*Search*
To find for information or data

### Guidelines

#### When to use

Dropdowns can be used in forms on full pages, in modals, or on panels. You can use when:

* Offering a single selection from a list of options.
* Offering multiple selections from a list of options.

#### When not to use

* If there are only two options to choose from. Instead, use a [radio button](https://designsystem.talkdesk.com/51aaf6147/p/085bf5-radio-button) group or a toggle.
* If the number of options is indeterminate, use a search field instead.
* Do not nest dropdowns or use them to display overly complex information. Keep option selections as straightforward as possible.

### Behavior

#### Positioning

A dropdown can open up or down depending on its position on the screen. If opened at the bottom of the screen, for example, it will expand upwards to avoid being cropped. By default, our dropdown opens downwards.

#### Minimum width

The width of the Content of the dropdown is by default automatically resized according to the dropdown Input width, however, when using the borderless variation, it can be necessary to customize it.

The width of the Content of the dropdown can be customized by setting the Content viewport property with `Small` or `Medium` values.

#### Max height

The max height for a dropdown menu is implemented as `250px` and beyond that, the scroll will come up for the user.

#### Spacing

Dropdown menus should be positioned at **4px** from the input above. This is already included in the component, so you just need to snap them together (**0px**).

![0px spacing annotation between the dropdown field and the dropdown menu below it](/assets/dropdown/spacing-0px.png)

You can see that there are some dotted lines on the top and bottom of the dropdown background. These are guide rules to position the first and last elements of the list.

You should, try to position the first element until the dotted line disappears.

![Dotted top guide line; an item is positioned to cover the guide](/assets/dropdown/spacing-top-guide.png)

All elements inside the dropdown menu already have the required spacing inside. So you just need to snap them together (**0px**). This also includes the dividers, search bar, loaders, etc.

When finished, make sure to resize the dropdown so that the bottom guide is also covered by the last item in the list.

![First item, selected item, third item, and a Load more link snapped together with 0px spacing; the dropdown is resized so the last item covers the bottom guide](/assets/dropdown/spacing-bottom-guide.png)

#### General

##### Scrolling

Dropdown menu can be scrollable. It is necessary to show a fixed scrollbar inside the list with multiple options.

![Scrollable dropdown menu listing cities, with a visible scrollbar](/assets/dropdown/behavior-scrolling.png)

##### Text truncation

Avoid having multiple lines of text in a dropdown. If it is mandatory, [Tooltips](https://designsystem.talkdesk.com/51aaf6147/p/94ad96-tooltip) can be helpful to display the entire content of a truncated text string. If the text is too long for one line, add an ellipsis `(…)` for overflow content, and accompany a tooltip to show the full string of text.

![Dropdown item truncated with an ellipsis, with a tooltip showing the full text](/assets/dropdown/behavior-truncation.png)

##### Actions in the list

Actions in the list could be placed either on top or at the bottom with a divider between them and the list items. The 10K dropdown also gives you the choice to show actions only when you want. So for example, you could show actions only if there are no results, or only on the main list, or always.

![Two dropdown menus comparing actions placed at the top versus at the bottom of the list, with a divider separating them from the list items](/assets/dropdown/behavior-actions-list.png)

When performing a search, the results can also include the actions, but the focus will always be placed on the first item of the results, even if there are actions before it.

![Dropdown search results including actions, with focus placed on the first result item](/assets/dropdown/behavior-actions-search.png)

##### Tree selection

In a dropdown, we can have a scenario where the list values are provided in a tree-like structure to make the hierarchy easier to understand with grouped options. Any data whose entries are defined in a hierarchical manner is fit to use this control.

![Dropdown example — General Tree selection](/assets/dropdown/general-tree-selection.gif)

##### Loading

![Dropdown showing a loading spinner, and a second state showing a 'Couldn't load data' error with a Try again link](/assets/dropdown/behavior-loading.png)

We replace the chevron icon with a loader when trying to load the data, and remove the icon if the loading fails.

![Dropdown example — General Loading](/assets/dropdown/general-loading.png)

The same behavior applies to the borderless dropdown, where the chevron icon is replaced by the loader until the data is loaded.

#### Single selection

##### Search

Standard dropdowns use a search action on top of the list of results. We will use the same type of search from the [Multi-select Input](/components/core/dropdown/), allowing users to start typing directly on the input after it’s focused.

![Dropdown example — Single selection Search](/assets/dropdown/single-selection-search.png)

A search can be performed inside the dropdown. However, due to API limitations, a search can only start after the user types at least 3 characters, however, the UX/UI has no limitations and if possible, we should try to deliver results as soon as the user starts typing.

  There is a 300ms delay after each character is typed before the search starts, to allow for users to type a complete name without having to perform several API search requests.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

The results list should follow the same rules as the ones applied to any list of items in a dropdown.

  Closing the dropdown without selecting anything and reopening will clear the previous search.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/871585-dropdown) — Design tab, image 45.*

![Dropdown example — Single selection Search](/assets/dropdown/single-selection-search-3.png)

If no results match the query, we show a corresponding "no results found" message.

##### Opening

Opening a dropdown with `single selection`.

![Dropdown field before opening, showing an 'All' selected value next to a 'Please select...' placeholder](/assets/dropdown/single-opening.png)

A dropdown can load with an already selected item or with a placeholder.

![Dropdown opened with a search field on top of the results, showing a loading state while searching](/assets/dropdown/single-search.png)

When opening the dropdown, its data can be loaded asynchronously, displaying the corresponding "loading message".

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

✅ After successful loading of the data, it should follow these rules:

  * There can be a group of special actions at the top, separated from the rest of the list. These actions can include:
  * The ability to select "All" items
  * Assigning something to "You" without having to go through the entire list to find your name
  * Displaying recently selected options, like the latest 3 selected countries, to facilitate selecting repeating items more quickly
  * Items should be ordered alphabetically, always starting with the ones with more information (e.g. numbers with friendly name, contacts with name) and only then by the ones with only basic information (e.g. only a number)
  * Due to the 10k initiative, we will load the first 20 (configurable) items, but will display the total number of remaining items at the bottom of the list. Users will need to refine the list by performing a search query.

  The selected item should be displayed at the top of the list, followed by the first 20 (configurable) items (making it a total of 21 items in the list).

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/871585-dropdown) — Design tab, image 49.*

![Dropdown example — Single selection Opening](/assets/dropdown/single-selection-opening-2.png)

❌ If the data fails to load, the dropdown closes and an error message is displayed after the input.

##### Selecting items

Navigating and selecting items with `single selection`.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

We can only navigate the dropdown using the mouse.

  After clicking one item, the dropdown closes and assumes the selected option.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/871585-dropdown) — Design tab, image 51.*

![Dropdown example — Single selection Navigation](/assets/dropdown/single-selection-navigation-2.png)

We can have an optional feature of dismissing the selected item directly on the dropdown, after an item is selected.

#### Multiple selection

This will act as an input where the user can perform a search. The search results will be displayed in a dropdown menu under the input. **It will not load a list of items without an initial search**.

##### Search

![Multi-select dropdown with a search field, showing a 'type at least 3 characters' prompt and a loading state while searching cities](/assets/dropdown/multiple-search.png)

A search can be performed inside the dropdown. However, due to API limitations, a search can only start after the user types at least 3 characters, however, the UX/UI has no limitations and if possible, we should try to deliver results as soon as the user starts typing.

  There is a 300ms delay after each character is typed before the search starts, to allow for user to type a complete name without having to perform several API search requests.

![Multi-select dropdown after searching 'Lis', with checkboxes, a Select all option, and Lisbon selected](/assets/dropdown/behavior-tree-selection.png)

After a search is performed, selecting an item will keep the dropdown open and will add a tag to the input.

  Selecting multiple items will keep adding tags until there is available space. After that, it collapses all the remaining item into a "+n" tag.

![Dropdown example — Multiple selection Search](/assets/dropdown/multiple-selection-search.png)

A new search can be performed while still keeping the previously selected items.

  The "Select all" option will select all visible items.

  Closing the dropdown without selecting anything and reopening will clear the previous search.

![Dropdown example — Multiple selection Search](/assets/dropdown/multiple-selection-search-2.png)

If no results match the query, we show a corresponding "no results found" message.

##### Opening

Opening a dropdown with `multiple selection`.

![Dropdown example — Multiple selection Opening](/assets/dropdown/multiple-selection-opening.png)

A dropdown can load with already selected item(s) or with a placeholder.

  If there are more than 2 selected items, an extra item with "+n" is added at the end.

![Dropdown example — Multiple selection Opening](/assets/dropdown/multiple-selection-opening-2.png)

When opening the dropdown, its data can be loaded asynchronously, displaying the corresponding "loading message".

![Dropdown example — Multiple selection Opening](/assets/dropdown/multiple-selection-opening-3.png)

✅ After successful loading of the data, it should follow these rules:

  * There is always a "select all" option at the top of the list
  * Items should be ordered alphabetically, always starting with the ones with more information (e.g. numbers with friendly name, contacts with name) and only then by the ones with only basic information (e.g. only a number)
  * Due to the 10k initiative, we will load the first 20 (configurable) items, but will display the total number of remaining items at the bottom of the list. Users will need to refine the list by performing a search query.

  The selected item(s) are kept on their current position, even if they are not in the first 20 items displayed.

![Dropdown example — Multiple selection Opening](/assets/dropdown/multiple-selection-opening-4.png)

❌ If the data fails to load, the dropdown closes and an error message is displayed after the input.

##### Tag maximum width

To prevent tag content from being cropped, we set a maximum width of **120px** for the text box.

In a scenario when you have an option selected with a long text, the tag in the multidropdown input adds an ellipsis (…)

![Dropdown example — Multiple selection Tag maximum width](/assets/dropdown/multiple-selection-tag-maximum-width.png)

If the tag group width is greater than the input width, the tag width is 50% of the input width (without the dropdown icon and the third tag) and the tag value uses an ellipsis.

![Dropdown example — Multiple selection Tag maximum width](/assets/dropdown/multiple-selection-tag-maximum-width-2.png)

##### Select all

The “select all” option can be added as a special item in a group on top of the list. When active, all items become activated, and when having more than 2 items a +1 tag is also added.

![Dropdown example — Multiple selection Select All](/assets/dropdown/multiple-selection-select-all.gif)

##### Selecting items

Navigating and selecting items with `multiple selection`.

![Dropdown example — Multiple selection Navigation](/assets/dropdown/multiple-selection-navigation.png)

In v1, we can only navigate the dropdown using the mouse.

  After clicking one item, a corresponding chip is added to the input and the dropdown keeps opened.

![Dropdown example — Multiple selection Navigation](/assets/dropdown/multiple-selection-navigation-2.png)

The "Select all" action selects all visible items. Any item that is not loaded into the list is not going to be selected.

##### Dismissing items

Items can be dismissed by clicking the dismiss “X” icon on each item.

![Dropdown example — Multiple selection Dismissing items](/assets/dropdown/multiple-selection-dismissing-items.gif)

#### Interaction

If a dropdown is placed at the bottom of a screen the dropdown items should open upwards.

![Dropdown example — Behavior Interaction](/assets/dropdown/behavior-interaction.png)

#### Internationalization

For RTL (right-to-left) languages, the layout of the dropdown is mirrored. All texts are right-aligned while icons like the chevron and checkmark are left-aligned.

![Dropdown example — Internationalization](/assets/dropdown/internationalization.png)

### Resources

Dropdowns and Dropdown menus are fully available in Sketch under `Cobalt Design System > Cobalt Core Components > Form Elements > Dropdown`

* [Dropdown](https://www.sketch.com/s/466c6c91-7742-417b-90f8-858bac409eff/p/6D9A4834-F725-48F4-B7F0-CC1B29AFF137?search=dropdown) — Cobalt component

* [Dropdown menu](https://www.sketch.com/s/466c6c91-7742-417b-90f8-858bac409eff/p/172811D6-D261-45CB-BD38-91F59D92D595) — Cobalt component

* [Real case use](https://app.goabstract.com/embed/4c2ff5de-d859-46ac-8c31-8c432e3e43cc) — Testing the new dropdown 10K in a real scenario (Voicemail filters)

* [Dropdown utils](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/3054863030/Dropdown+utils) — Utils package with shared components to be used with Dropdown (for devs).

* [How to use](https://www.figma.com/file/5mn3vArnbe5ENQfZFRKJBL/8---How-to-use?node-id=401%3A515891\&t=gRxDgkINc8PrzsN0-1) — Figma file with component usage examples

* [V1 Storybook](https://talkdesk.github.io/cobalt-react-components/?path=/story/cobaltroot--default) — Cobalt

* [V2 Storybook](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/1490454305/Component+documentation) — Cobalt

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

Make sure all menu items:

* Have accurate, concise and informative labels.
* Use sentence case.
* Remain in a single line of text.
* Avoid articles. E.g., write *Add contact* instead of *Add a contact*.
* For action menu items, use verbs and verb phrases to describe the action that occurs when the item is chosen. For example, *Delete contact* or *Edit*.
* All dropdowns should be sorted alphabetically if no other field is defined by default.
* In most cases, links should be nouns. For example, *Profile* or *Keyboard* shortcuts.

**Do:** Concise yet informative dropdown.
![Do example](/assets/dropdown/do.png)

**Don't:** No need to be repetitive. Items should use sentence case.
![Don't example](/assets/dropdown/dont.png)

### Accessibility

### Interactions

#### Mouse

Clicking a closed field opens the menu of options; clicking an item selects it and closes the menu.
No additional guidance beyond a native interactive element's default behavior applies here.

#### Keyboard

| **Keys**         | **Interaction**                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Backspace/delete | Removes selected item near the insert point                                                         |
| Down arrow (⬇)   | Moves downward in the list                                                                          |
| End              | Goes down to the last item in the list (the last item of the current page if the list is paginated) |
| Enter (↵)        | Selects the list item in the dropdown that is already pre-selected                                  |
| Esc              | Closes the dropdown menu                                                                            |
| Home             | Goes up to the first item in the list                                                               |
| Left arrow (⬅)   | Navigate between the selected items on the input                                                    |
| Right arrow (➡)  | Navigate between the selected items on the input                                                    |
| Tab (⇥)          | Dismisses the focus in the input and moves to the next on the page                                  |
| Up arrow (⬆)     | Moves upwards in the list                                                                           |

Both `10K dropdown` and `multi-select input` should use the same keyboard navigation patterns.

The only difference is that when opening the dropdown we will not focus on the first element of the list until the user presses the **down⬇** key. It should only be automatically focused after the user performs a search.

* [Design Patterns for a Dropdown (Listbox)](https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox) — W3C WAI-ARIA

### Considerations

#### Design

* [2.4.7 Focus Visible](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-visible.html)
* [3.2.2 On Input](https://www.w3.org/TR/2016/NOTE-UNDERSTANDING-WCAG20-20161007/consistent-behavior-unpredictable-change.html)
* [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value)

#### Development

An accessible dropdown is one where you can choose from a list of options and select one or more of them with the correct information exposed to screen readers.

It's important to render the name, state and position of each option in the dropdown. If the user navigates with the keyboard and the dropdown don't focus their options or don't change between them, the user can't interact with the content and gets lost.

* Avoid very long option names to facilitate understandability and perceivability.
* Do not use the same word or phrase at the beginning of a set of options.
* Always include a `label`, even when using the `hidden-label` prop.
* Never use `placeholder` text in place of a `label`.
* Give the dropdown's text input keyboard focus with the `tab` key (or `shift` + `tab` when tabbing backwards).

### How to test the component

* Tab to the dropdown using only the keyboard, open it, and navigate items with the arrow keys.
* Confirm `Esc` closes the menu and `Enter` selects the focused item.
* With a screen reader running, confirm each option's name, state, and position are announced as
  you move through the list.

## Props

### Dropdown

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `className` | string |  | no |  |  |
| `items` | Iterable<T> |  | no |  | Dynamic collection of options — see `DropdownItem`'s `id`/`textValue`. |
| `prefix` | ReactNode |  | no |  | Leading content, rendered before the selected value. |
| `suffix` | ReactNode |  | no |  | Trailing content, rendered after the selected value and before the chevron. |
| `size` | enum | `small`, `medium` | no |  |  |
| `data-co-surface` | string \| number |  | no |  | The surface level of the popover, from 0 to 3. Defaults to one level above the closest surface. |
| `placement` | enum | `bottom`, `bottom left`, `bottom right`, `bottom start`, `bottom end`, `top`, `top left`, `top right`, `top start`, `top end`, `left`, `left top`, `left bottom`, `start`, `start top`, `start bottom`, `right`, `right top`, `right bottom`, `end`, `end top`, `end bottom` | no |  | Where the popover opens relative to the trigger. Accepts react-aria `Placement` values (e.g. `"bottom start"`, `"top end"`); `start`/`end` are RTL-aware. See `Menu`'s `placement` prop. |
| `isReadOnly` | boolean |  | no |  |  |
| `isLoading` | boolean |  | no |  |  |
| `isClearable` | boolean |  | no |  |  |
| `isSearchable` | boolean |  | no |  |  |
| `isDivided` | boolean |  | no |  |  |
| `footer` | ReactNode |  | no |  |  |
| `accessibilityLabels` | AccessibilityLabels |  | no |  |  |
| `renderValue` | (renderProps: DropdownValueRenderProps) => ReactNode |  | no |  |  |
| `actions` | ReactElement<Props, string \| JSXElementConstructor<any>> \| ReactElement<Props, string \| JSXElementConstructor<any>>[] |  | no |  |  |
| `isBorderless` | boolean |  | no |  |  |
| `popoverSize` | enum | `small`, `medium`, `large` | no |  | Widens the popover to a fixed size instead of the trigger's own width. Only meaningful for a borderless trigger, whose popover otherwise shrinks to the trigger's content and can clip long options. |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `autoComplete` | string |  | no |  | Describes the type of autocomplete functionality the input should provide if any. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete). |
| `name` | string |  | no |  | The name of the input, used when submitting an HTML form. |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `selectionMode` | M |  | no |  | Whether single or multiple selection is enabled. @default 'single' |
| `isOpen` | boolean |  | no |  | Sets the open state of the menu. |
| `defaultOpen` | boolean |  | no |  | Sets the default open state of the menu. |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Method that is called when the open state of the menu changes. |
| `shouldCloseOnSelect` | boolean |  | no |  | Whether the Select should close when an item is selected. Defaults to true if selectionMode is single, false otherwise. |
| `allowsEmptyCollection` | boolean |  | no |  | Whether the select should be allowed to be open when the collection is empty. |
| `disabledKeys` | Iterable<Key> |  | no |  | The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with. |
| `value` | ValueType<M> |  | no |  | The current value (controlled). |
| `defaultValue` | ValueType<M> |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: ChangeValueType<M>) => void |  | no |  | Handler that is called when the value changes. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: ValidationType<M>) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `placeholder` | string |  | no |  | Temporary text that occupies the select when it is empty. @default 'Select an item' (localized) |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `children` | ReactNode \| ((item: T) => ReactElement<any, string \| JSXElementConstructor<any>>) |  | yes |  |  |

### DropdownAction

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `isDisabled` | boolean |  | no |  | Whether the button is disabled. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `type` | "button" \| "submit" \| "reset" | `button`, `submit`, `reset` | no |  | The behavior of the button when used in an HTML form. @default 'button' |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `form` | string |  | no |  | The `<form>` element to associate the button with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#form). |
| `formAction` | string |  | no |  | The URL that processes the information submitted by the button. Overrides the action attribute of the button's form owner. |
| `formEncType` | string |  | no |  | Indicates how to encode the form data that is submitted. |
| `formMethod` | string |  | no |  | Indicates the HTTP method used to submit the form. |
| `formNoValidate` | boolean |  | no |  | Indicates that the form is not to be validated when it is submitted. |
| `formTarget` | string |  | no |  | Overrides the target attribute of the button's form owner. |
| `name` | string |  | no |  | Submitted as a pair with the button's value as part of the form data. |
| `value` | string |  | no |  | The value associated with the button's name when it's submitted with the form data. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `isPending` | boolean |  | no |  | Whether the button is in a pending state. This disables press and hover events while retaining focusability, and announces the pending state to screen readers. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |
| `children` | ReactNode |  | no |  |  |

### DropdownItem

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | no |  | The item's label. When this isn't plain text — an element rather than a string — also pass `textValue`: `Dropdown`'s trigger shows the selected item's plain text, and without `textValue` it falls back to this `children`'s full text content. A string `children` alongside `prefix`/`suffix` doesn't need it; `textValue` defaults to that string automatically. |
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `value` | object |  | no |  | The object value that this item represents. When using dynamic collections, this is set automatically. |
| `textValue` | string |  | no |  | A string representation of the item's contents, used for features like typeahead. |
| `isDisabled` | boolean |  | no |  | Whether the item is disabled. |
| `onAction` | () => void |  | no |  | Handler that is called when a user performs an action on the item. The exact user event depends on the collection's `selectionBehavior` prop and the interaction modality. |
| `href` | string |  | no |  | A URL to link to. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href). |
| `hrefLang` | string |  | no |  | Hints at the human language of the linked URL. See[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang). |
| `target` | HTMLAttributeAnchorTarget |  | no |  | The target window for the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target). |
| `rel` | string |  | no |  | The relationship between the linked resource and the current page. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel). |
| `download` | string \| boolean |  | no |  | Causes the browser to download the linked URL. A string may be provided to suggest a file name. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download). |
| `ping` | string |  | no |  | A space-separated list of URLs to ping when the link is followed. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping). |
| `referrerPolicy` | HTMLAttributeReferrerPolicy | ``, `no-referrer`, `no-referrer-when-downgrade`, `origin`, `origin-when-cross-origin`, `same-origin`, `strict-origin`, `strict-origin-when-cross-origin`, `unsafe-url` | no |  | How much of the referrer to send when following the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy). |
| `routerOptions` | never |  | no |  | Options for the configured client side router. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `onFocus` | (e: FocusEvent<HTMLDivElement, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<HTMLDivElement, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |

### DropdownSection

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | no |  |  |
| `value` | T |  | no |  | The object value that this section represents. When using dynamic collections, this is set automatically. |
| `dependencies` | readonly any[] |  | no |  | Values that should invalidate the item cache when using dynamic collections. |
| `items` | Iterable<T> |  | no |  | Item objects in the section. |

## Examples

_26 of 28 compile against the published `@talkdesk/cobalt-react-dropdown@4.1.1` (React 18, TypeScript strict)._

### Basic

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown aria-label="Sort by" defaultValue="newest">
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Controlled

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

const [sortKey, setSortKey] = useState("newest");

<Dropdown
  aria-label="Sort by"
  value={sortKey}
  onChange={(key) => key && setSortKey(String(key))}
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Small size

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown aria-label="Sort by" size="small" placeholder="Select an option">
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Medium size

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown aria-label="Sort by" size="medium" placeholder="Select an option">
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Borderless

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  aria-label="Sort by"
  isBorderless
  popoverSize="small"
  placeholder="Select an option"
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Prefix and suffix

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import Flag from "@talkdesk/cobalt-react-flag";
import Icon from "@talkdesk/cobalt-react-icon";
import { Tag } from "@talkdesk/cobalt-react-tag";

<Dropdown
  aria-label="Country"
  defaultValue="pt"
  prefix={<Icon name="language" size="tiny" />}
  suffix={<Tag size="small">EU</Tag>}
>
  <DropdownItem id="pt" prefix={<Flag code="pt" />}>Portugal</DropdownItem>
  <DropdownItem id="es" prefix={<Flag code="es" />}>Spain</DropdownItem>
</Dropdown>
```

### Description

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import Icon from "@talkdesk/cobalt-react-icon";

<Dropdown aria-label="Report" placeholder="Select a report">
  <DropdownItem
    id="q3-report"
    prefix={<Icon name="file_document" size="tiny" />}
    description="Last generated 2 days ago"
  >
    Q3 financial report
  </DropdownItem>
  <DropdownItem id="roadmap" description="Shared with the engineering team">
    Roadmap
  </DropdownItem>
</Dropdown>
```

### Clearable

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  aria-label="Sort by"
  isClearable
  defaultValue="newest"
  placeholder="Select an option"
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Divided

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown aria-label="City" isDivided placeholder="Select a city">
  <DropdownItem id="rome">Rome</DropdownItem>
  <DropdownItem id="shenzhen">Shenzhen</DropdownItem>
  <DropdownItem id="bilbao">Bilbao</DropdownItem>
  <DropdownItem id="naples">Naples</DropdownItem>
  <DropdownItem id="venice">Venice</DropdownItem>
</Dropdown>
```

### Truncated value

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import { Tag } from "@talkdesk/cobalt-react-tag";

// The selected value truncates with an ellipsis rather than wrapping or
// overflowing — the trigger stays a fixed height even with a long label,
// and this still holds with a clear button and suffix squeezing the
// available space further.
<div style={{ maxWidth: 240 }}>
  <Dropdown
    aria-label="Report"
    isClearable
    defaultValue="q3-report"
    suffix={<Tag size="small">New</Tag>}
  >
    <DropdownItem id="q3-report">
      Q3 financial performance summary and quarterly business review
    </DropdownItem>
    <DropdownItem id="roadmap">Roadmap</DropdownItem>
  </Dropdown>
</div>
```

### Multiple selection

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";


<div style={{ maxWidth: 280 }}>
  <Dropdown
    aria-label="Countries"
    selectionMode="multiple"
    isClearable
    defaultValue={["us", "it", "pt"]}
    disabledKeys={["fr"]}
    placeholder="Select countries"
  >
    <DropdownItem id="us">United States of America</DropdownItem>
    <DropdownItem id="pt">Portugal</DropdownItem>
    <DropdownItem id="es">Spain</DropdownItem>
    <DropdownItem id="fr">France</DropdownItem>
    <DropdownItem id="de">Germany</DropdownItem>
    <DropdownItem id="it">Italy</DropdownItem>
  </Dropdown>
</div>
```

### With field

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  aria-label="Sort by"
  label="Sort by"
  secondaryLabel="(optional)"
  description="Choose how the list is ordered."
  hint="You can change this at any time."
  placeholder="Select an option"
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Validation

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  label="Sort by"
  isRequired
  isInvalid
  errorMessage="Choose a sort order."
  placeholder="Select an option"
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Disabled

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown label="Sort by" isDisabled defaultValue="newest">
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Read only

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown label="Sort by" isReadOnly defaultValue="newest">
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Loading

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown label="Loading" isLoading>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### Searchable

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown aria-label="Country" isSearchable placeholder="Select a country">
  <DropdownItem id="pt">Portugal</DropdownItem>
  <DropdownItem id="es">Spain</DropdownItem>
  <DropdownItem id="fr">France</DropdownItem>
  <DropdownItem id="de">Germany</DropdownItem>
  <DropdownItem id="it">Italy</DropdownItem>
</Dropdown>
```

### Searchable multiple selection

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";


<div style={{ maxWidth: 280 }}>
  <Dropdown
    aria-label="Countries"
    selectionMode="multiple"
    isSearchable
    isClearable
    placeholder="Select countries"
  >
    <DropdownItem id="us">United States of America</DropdownItem>
    <DropdownItem id="pt">Portugal</DropdownItem>
    <DropdownItem id="es">Spain</DropdownItem>
    <DropdownItem id="fr">France</DropdownItem>
    <DropdownItem id="de">Germany</DropdownItem>
    <DropdownItem id="it">Italy</DropdownItem>
    <DropdownItem id="at">Austria</DropdownItem>
    <DropdownItem id="be">Belgium</DropdownItem>
    <DropdownItem id="br">Brazil</DropdownItem>
    <DropdownItem id="ca">Canada</DropdownItem>
    <DropdownItem id="ch">Switzerland</DropdownItem>
    <DropdownItem id="dk">Denmark</DropdownItem>
    <DropdownItem id="fi">Finland</DropdownItem>
    <DropdownItem id="gr">Greece</DropdownItem>
    <DropdownItem id="ie">Ireland</DropdownItem>
    <DropdownItem id="jp">Japan</DropdownItem>
    <DropdownItem id="nl">Netherlands</DropdownItem>
    <DropdownItem id="no">Norway</DropdownItem>
    <DropdownItem id="pl">Poland</DropdownItem>
    <DropdownItem id="se">Sweden</DropdownItem>
  </Dropdown>
</div>
```

### Dynamic items

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

const countries = [
  { id: "pt", label: "Portugal" },
  { id: "es", label: "Spain" },
  { id: "fr", label: "France" },
];

<Dropdown aria-label="Country" items={countries} placeholder="Select a country">
  {(country) => <DropdownItem id={country.id}>{country.label}</DropdownItem>}
</Dropdown>
```

### Sections

```tsx
import { Dropdown, DropdownItem, DropdownSection } from "@talkdesk/cobalt-react-dropdown";

// "Recent" is a shortcut into the full list below, so its item needs its own
// id — a Select's collection keys must be unique across the whole list, not
// just within a section.
<Dropdown aria-label="Country" placeholder="Select a country">
  <DropdownSection title="Recent">
    <DropdownItem id="pt-recent">Portugal</DropdownItem>
  </DropdownSection>
  <DropdownSection title="All countries">
    <DropdownItem id="pt">Portugal</DropdownItem>
    <DropdownItem id="es">Spain</DropdownItem>
    <DropdownItem id="fr">France</DropdownItem>
  </DropdownSection>
</Dropdown>
```

### Render custom value

```tsx
import { Dropdown, DropdownItem, DropdownSection } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  aria-label="Timezone"
  placeholder="Select a timezone"
  renderValue={({ selectedText, sectionTitle }) =>
    sectionTitle ? `${sectionTitle}: ${selectedText}` : selectedText
  }
>
  <DropdownItem id="Etc/UTC">UTC</DropdownItem>
  <DropdownSection title="Portugal">
    <DropdownItem id="Atlantic/Azores">Azores</DropdownItem>
    <DropdownItem id="Europe/Lisbon">Lisbon</DropdownItem>
  </DropdownSection>
  <DropdownSection title="Australia">
    <DropdownItem id="Australia/Perth">Perth</DropdownItem>
    <DropdownItem id="Australia/Sydney">Sydney</DropdownItem>
  </DropdownSection>
</Dropdown>
```

### Disabled items

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import Divider from "@talkdesk/cobalt-react-divider";

<Dropdown aria-label="Sort by" placeholder="Select an option" disabledKeys={["archived"]}>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
  <Divider />
  <DropdownItem id="archived">Archived</DropdownItem>
</Dropdown>
```

### Actions

```tsx
import { Dropdown, DropdownAction, DropdownItem } from "@talkdesk/cobalt-react-dropdown";
import Icon from "@talkdesk/cobalt-react-icon";

<Dropdown
  aria-label="Contact"
  placeholder="Select a contact"
  isSearchable
  actions={[
    <DropdownAction key="create" prefix={<Icon name="add" size="tiny" />}>
      Create new contact
    </DropdownAction>,
    <DropdownAction key="merge" prefix={<Icon name="merge_type" size="tiny" />}>
      Merge with existing contact
    </DropdownAction>,
  ]}
>
  <DropdownItem id="jane">Jane Doe</DropdownItem>
  <DropdownItem id="john">John Smith</DropdownItem>
</Dropdown>
```

### Load more

> **Doesn't compile:** the published types reject it: Property 'id' does not exist on type 'object'. (it also uses `FIRST_PAGE` without importing it). Fix it before use.

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import Button from "@talkdesk/cobalt-react-button";

const [contacts, setContacts] = useState(FIRST_PAGE);
const [isLoadingMore, setIsLoadingMore] = useState(false);

const loadMore = () => {
  setIsLoadingMore(true);
  fetchContacts({ offset: contacts.length })
    .then((results) => setContacts((current) => [...current, ...results]))
    .finally(() => setIsLoadingMore(false));
};

<Dropdown
  aria-label="Contact"
  placeholder="Select a contact"
  items={contacts}
  footer={
    hasMore ? (
      <Button
        type="primary"
        variation="transparent"
        size="small"
        shape="full-width"
        isDisabled={isLoadingMore}
        onPress={loadMore}
      >
        {isLoadingMore ? "Loading…" : "Load more"}
      </Button>
    ) : null
  }
>
  {(contact) => <DropdownItem id={contact.id}>{contact.name}</DropdownItem>}
</Dropdown>
```

### Selected option not loaded

> **Doesn't compile:** the published types reject it: Property 'id' does not exist on type 'object'. (it also uses `FIRST_PAGE` without importing it). Fix it before use.

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";


// The saved value's label came from the same response that gave us its id.
const savedContact = { id: "contact-14", name: "Contact 15" };

const [contacts, setContacts] = useState(FIRST_PAGE);

// Keep the selected contact in the collection until its own page arrives, so
// the trigger can name it and the form can submit it. De-duplicate by id — a
// repeated id doesn't render a repeated option, it hangs the collection.
const items = contacts.some((contact) => contact.id === savedContact.id)
  ? contacts
  : [savedContact, ...contacts];

<Dropdown
  label="Contact"
  name="contact"
  placeholder="Select a contact"
  defaultValue={savedContact.id}
  items={items}
>
  {(contact) => <DropdownItem id={contact.id}>{contact.name}</DropdownItem>}
</Dropdown>
```

### Truncated labels

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import Divider from "@talkdesk/cobalt-react-divider";
import { Text } from "@talkdesk/cobalt-react-typography";

<Dropdown aria-label="Report" isBorderless popoverSize="small" placeholder="Select a report">
  <DropdownItem id="report" textValue="Q3 financial performance summary">
    <Text inline truncated title="Q3 financial performance summary">
      Q3 financial performance summary
    </Text>
  </DropdownItem>
  <DropdownItem id="roadmap" textValue="Roadmap and engineering priorities">
    <Text inline truncated title="Roadmap and engineering priorities">
      Roadmap and engineering priorities
    </Text>
  </DropdownItem>
  <Divider />
  <DropdownItem id="none">None</DropdownItem>
</Dropdown>
```

### Placement

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

<Dropdown
  aria-label="Sort by"
  placement="top start"
  placeholder="Select an option"
>
  <DropdownItem id="newest">Newest first</DropdownItem>
  <DropdownItem id="oldest">Oldest first</DropdownItem>
</Dropdown>
```

### RTL

```tsx
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";

import { I18nProvider } from "react-aria-components";
import Icon from "@talkdesk/cobalt-react-icon";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <Dropdown
      aria-label="فرز حسب"
      defaultValue="newest"
      prefix={<Icon name="sort" size="tiny" />}
    >
      <DropdownItem id="newest">الأحدث أولاً</DropdownItem>
      <DropdownItem id="oldest">الأقدم أولاً</DropdownItem>
    </Dropdown>
  </div>
</I18nProvider>
```
