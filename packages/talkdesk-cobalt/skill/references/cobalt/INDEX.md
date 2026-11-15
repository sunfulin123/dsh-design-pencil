# Bundled Talkdesk Cobalt reference

Read these local resources from this Skill directory. No external documentation checkout, update command or remote documentation service is required. The upstream repository URLs are provenance only. Keep operational workflow in `references/cobalt-workspace.md`; repository setup instructions, website-only demos and external links in copied documentation do not authorize downloading another docs checkout.

Resolve this library at `<skill-directory>/cobalt-reference/` in the selected runtime. The component and design-document lists below use paths relative to `content/`. Owned `recipes/`, `registry/` and extension source paths use the bundle root; explicit `cobalt-reference/` paths start at the HTML Skill directory. The lookup script resolves these to actual files, so do not infer a base directory from a name. `registry.json` supplies package versions, imports, props, examples, known gaps and each `docs.markdown` path. Read only relevant pages. Original documentation content stays in one place. `cobalt-reference/source.json` records every document and migrated image hash; missing upstream images are listed explicitly and are not grounds to fetch external docs.

## AI retrieval and reuse

Read `cobalt-reference/AI-INDEX.md` first. Use the bundled read-only `scripts/cobalt-lookup.mjs --query "list table filters"`, then `--id recipe.list-page` (or a component ID) to resolve exact local source/API paths. In generated projects use `tools/cobalt-lookup.mjs`. Translate the brief into component/behavior terms and retry individual keywords before assuming the library lacks a match. The generated `registry/authoring.json` combines extension components, core/marketplace API entry paths, package availability, failed-example qualifications, recipe integration contracts and design document categories. Its `pathBases` explains the legacy component documentation field; use `aiDocumentation` for plain AI pages. Every recipe has a generated Markdown contract, a default export, exact source path, dependency list, covered states and limits. Search by purpose, select the correct library, then read the matching API and TSX. Never assume that every migrated snippet compiles or every documented npm package is installed.

For a full list page use `recipes/list-page.md` and `recipes/list-page.tsx`: Extensions BasicTable and SidePanel plus marketplace Toolbar, with Extensions Dialog/FormField/Input/Dropdown for user creation and Dialog/UploadFile for import. Read its supporting workflow source and integration limits: local creation is in-memory and CSV selection requires onImport(file) for a real import. Tables are flush, square-edged surfaces without outer cards, borders, shadows or horizontal table-parent padding. Workspace prototypes use pnpm; read the companion for commands and generated settings. Do not copy the old core Table implementation from a migrated template. Detail/form references likewise point to maintained TSX instead of maintaining separate code bodies. Use `card-widgets` for metric/donut and other card references, `echarts-gallery` for forecast/scenario charts, and `team-schedule` for the WFM day timeline. Read each recipe contract and all support sources before copying.

## Cobalt Extensions and runnable sources

Cobalt Extensions are editable, general-purpose source templates. Never install `@openpencil/cobalt-extensions`, import it as a package, or create an alias/file dependency for it. Resolve the component ID, use lookup `--read-source` to read the full implementation/types/styles/local imports, then copy to `src/components/cobalt-extensions/` and adapt it. Workspace scaffolding copies the source automatically; standalone/existing apps use `cobalt-project.mjs copy-source --out <project>`. Source imports must resolve to actual local files. Only official Cobalt/React dependencies may need package installation. After copying, the target project’s implementation and types define the custom component API. Adapt them as needed and keep local callers, styles and index paths consistent; template documentation remains a reference baseline.

`cobalt-reference/registry/authoring.json` indexes all maintained Cobalt Extensions, MDX documentation, executable examples and recipes. Source, example and AI-document paths are relative to `cobalt-reference/`; the legacy `documentation` field is relative to its `content/` directory. Read the generated plain pages at `content/components/extensions/` and the referenced `examples/extensions/*.tsx` source; the Astro site renders those same sources. `components/extensions/src/` is component code, `content/` is authored MDX, and `recipes/` contains complete page compositions. These wrappers use the pinned upgraded Cobalt dependencies. See `references/cobalt-workspace.md` for project installation and scenario wiring.

The current generated shell is documented in `references/cobalt/workspace-chrome.md`; imported Workspace screenshots may show the earlier chrome.

## Required design references

- `foundations/tokens/spacing/spacing.md`: responsive spacing and page/panel/modal composition.
- `foundations/tokens/typography/typography.md` and `foundations/tokens/color/color.md`: type and semantic colors.
- `foundations/content/content/content.md` and `foundations/content/content-voice-and-tone/content-voice-and-tone.md`: product copy.
- `foundations/accessibility/web-accessibility/web-accessibility.md`: keyboard, labels and accessibility. Preserve its upstream under-review qualification.
- `workspace/overview/overview.md`, `workspace/space-and-viewports/space-and-viewports.md`, `workspace/dock-and-drawer/dock-and-drawer.md`: shell ownership and actual app widths.
- `patterns/forms-and-validation/forms-and-validation.md`, `patterns/search-filtering-and-sorting/search-filtering-and-sorting.md`, `patterns/empty-states-and-loading/empty-states-and-loading.md`: behavior and states.
- `layout-templates/list-view/list-view.md`, `layout-templates/detail-page/detail-page.md`, `layout-templates/form-page/form-page.md`: design references linking the maintained recipe sources. Read the recipe Markdown contract and TSX; retain draft qualifications and record justified adaptations.
- `get-started/develop/develop.md` and `.npmrc`: standalone component setup and registry settings. Workspace scaffolds already provide the root providers.

## Component, hook and provider index

- AccordionStateful: `components/marketplace/accordion-stateful/accordion-stateful.md` — `@talkdesk/cobalt-marketplace-react-accordion-stateful@2.3.2`
- AiDisclaimer: `components/marketplace/ai-disclaimer/ai-disclaimer.md` — `@talkdesk/cobalt-marketplace-react-ai-disclaimer@1.2.2`
- BadgeContainer: `components/marketplace/badge-container/badge-container.md` — `@talkdesk/cobalt-marketplace-react-badge-container@2.2.0`
- Card: `components/marketplace/card/card.md` — `@talkdesk/cobalt-marketplace-react-card@2.1.0`
- CopyToClipboard: `components/marketplace/copy-to-clipboard/copy-to-clipboard.md` — `@talkdesk/cobalt-marketplace-react-copy-to-clipboard@2.3.3`
- DatePicker: `components/marketplace/datepicker/datepicker.md` — `@talkdesk/cobalt-marketplace-react-datepicker@2.2.2`
- DateRangePicker: `components/marketplace/daterangepicker/daterangepicker.md` — `@talkdesk/cobalt-marketplace-react-daterangepicker@2.2.2`
- DismissibleModal: `components/marketplace/dismissible-modal/dismissible-modal.md` — `@talkdesk/cobalt-marketplace-react-dismissible-modal@2.2.2`
- DismissibleTag: `components/marketplace/dismissible-tag/dismissible-tag.md` — `@talkdesk/cobalt-marketplace-react-dismissible-tag@2.2.2`
- DragAndDrop: `components/marketplace/drag-and-drop/drag-and-drop.md` — `@talkdesk/cobalt-marketplace-react-drag-and-drop@3.2.0`
- Dropdown: `components/marketplace/dropdown/dropdown.md` — `@talkdesk/cobalt-marketplace-react-dropdown@3.2.2`
- EmptyWidget: `components/marketplace/empty-widget/empty-widget.md` — `@talkdesk/cobalt-marketplace-react-empty-widget@2.2.2`
- ExpandableTable: `components/marketplace/expandable-table/expandable-table.md` — `@talkdesk/cobalt-marketplace-react-expandable-table@2.2.2`
- Footnote: `components/marketplace/footnote/footnote.md` — `@talkdesk/cobalt-marketplace-react-footnote@2.2.0`
- FormCheck: `components/marketplace/form-check/form-check.md` — `@talkdesk/cobalt-marketplace-react-form-check@2.2.0`
- FormControl: `components/marketplace/form-control/form-control.md` — `@talkdesk/cobalt-marketplace-react-form-control@2.2.2`
- Header: `components/marketplace/header/header.md` — `@talkdesk/cobalt-marketplace-react-header@2.2.2`
- LabeledIcon: `components/marketplace/labeled-icon/labeled-icon.md` — `@talkdesk/cobalt-marketplace-react-labeled-icon@3.2.2`
- List: `components/marketplace/list/list.md` — `@talkdesk/cobalt-marketplace-react-list@2.2.2`
- Media: `components/marketplace/media/media.md` — `@talkdesk/cobalt-marketplace-react-media@2.1.0`
- Message: `components/marketplace/message/message.md` — `@talkdesk/cobalt-marketplace-react-message@2.2.2`
- MultiDropdown: `components/marketplace/multi-dropdown/multi-dropdown.md` — `@talkdesk/cobalt-marketplace-react-multi-dropdown@3.2.2`
- Nav: `components/marketplace/nav/nav.md` — `@talkdesk/cobalt-marketplace-react-nav@2.2.2`
- OverflowScroll: `components/marketplace/overflow-scroll/overflow-scroll.md` — `@talkdesk/cobalt-marketplace-react-overflow-scroll@2.2.2`
- Pagination: `components/marketplace/pagination/pagination.md` — `@talkdesk/cobalt-marketplace-react-pagination@2.2.3`
- SearchInput: `components/marketplace/search-input/search-input.md` — `@talkdesk/cobalt-marketplace-react-search-input@2.2.2`
- StatefulButton: `components/marketplace/stateful-button/stateful-button.md` — `@talkdesk/cobalt-marketplace-react-stateful-button@2.2.2`
- StatefulPopup: `components/marketplace/stateful-popup/stateful-popup.md` — `@talkdesk/cobalt-marketplace-react-stateful-popup@3.2.0`
- Table: `components/marketplace/table/table.md` — `@talkdesk/cobalt-marketplace-react-table@2.1.0`
- Timeline: `components/marketplace/timeline/timeline.md` — `@talkdesk/cobalt-marketplace-react-timeline@1.0.2`
- Timepicker: `components/marketplace/timepicker/timepicker.md` — `@talkdesk/cobalt-marketplace-react-timepicker@2.1.0`
- Toaster: `components/marketplace/toaster/toaster.md` — `@talkdesk/cobalt-marketplace-react-toaster@2.2.0`
- Toolbar: `components/marketplace/toolbar/toolbar.md` — `@talkdesk/cobalt-marketplace-react-toolbar@2.2.2`
- Tooltip: `components/marketplace/tooltip/tooltip.md` — `@talkdesk/cobalt-marketplace-react-tooltip@2.3.0`
- TranscriptionBubble: `components/marketplace/transcription-bubble/transcription-bubble.md` — `@talkdesk/cobalt-marketplace-react-transcription-bubble@3.2.0`
- DatepickerUtils: `utils/marketplace/datepicker-utils/datepicker-utils.md` — `@talkdesk/cobalt-marketplace-react-datepicker-utils@2.2.2`
- DropdownUtils: `utils/marketplace/dropdown-utils/dropdown-utils.md` — `@talkdesk/cobalt-marketplace-react-dropdown-utils@3.2.2`
- Accordion: `components/core/accordion/accordion.md` — `@talkdesk/cobalt-react-accordion@3.0.1`
- Avatar: `components/core/avatar/avatar.md` — `@talkdesk/cobalt-react-avatar@2.3.1`
- Box: `components/core/box/box.md` — `@talkdesk/cobalt-react-box@2.3.0`
- Button: `components/core/button/button.md` — `@talkdesk/cobalt-react-button@3.3.1`
- Calendar: `components/core/calendar/calendar.md` — `@talkdesk/cobalt-react-calendar@3.0.1`
- Card: `components/core/card/card.md` — `@talkdesk/cobalt-react-card@2.2.5`
- ChatBubble: `components/core/chat-bubble/chat-bubble.md` — `@talkdesk/cobalt-react-chat-bubble@2.2.5`
- Checkbox: `components/core/checkbox/checkbox.md` — `@talkdesk/cobalt-react-checkbox@1.1.6`
- ColorInput: `components/core/color-input/color-input.md` — `@talkdesk/cobalt-react-color-input@1.2.1`
- DatePicker: `components/core/date-picker/date-picker.md` — `@talkdesk/cobalt-react-date-picker@1.1.0`
- Divider: `components/core/divider/divider.md` — `@talkdesk/cobalt-react-divider@3.0.3`
- Dropdown: `components/core/dropdown/dropdown.md` — `@talkdesk/cobalt-react-dropdown@4.1.1`
- FakeInput: `components/core/fake-input/fake-input.md` — `@talkdesk/cobalt-react-fake-input@2.2.6`
- Field: `components/core/field/field.md` — `@talkdesk/cobalt-react-field@1.4.1`
- Flag: `components/core/flag/flag.md` — `@talkdesk/cobalt-react-flag@2.2.7`
- Flex: `components/core/flex/flex.md` — `@talkdesk/cobalt-react-flex@3.3.0`
- Grid: `components/core/grid/grid.md` — `@talkdesk/cobalt-react-grid@2.3.0`
- Icon: `components/core/icon/icon.md` — `@talkdesk/cobalt-react-icon@2.31.0`
- Illustration: `components/core/illustration/illustration.md` — `@talkdesk/cobalt-react-illustration@1.0.4`
- Image: `components/core/image/image.md` — `@talkdesk/cobalt-react-image@2.2.5`
- Input: `components/core/input/input.md` — `@talkdesk/cobalt-react-input@2.3.6`
- InputGroup: `components/core/input-group/input-group.md` — `@talkdesk/cobalt-react-input-group@3.0.1`
- Label: `components/core/label/label.md` — `@talkdesk/cobalt-react-label@2.2.5`
- Link: `components/core/link/link.md` — `@talkdesk/cobalt-react-link@3.0.1`
- List: `components/core/list/list.md` — `@talkdesk/cobalt-react-list@2.2.6`
- Menu: `components/core/menu/menu.md` — `@talkdesk/cobalt-react-menu@1.2.3`
- Message: `components/core/message/message.md` — `@talkdesk/cobalt-react-message@2.3.5`
- Modal: `components/core/modal/modal.md` — `@talkdesk/cobalt-react-modal@4.0.4`
- NumberInput: `components/core/number-input/number-input.md` — `@talkdesk/cobalt-react-number-input@1.2.3`
- Overflow: `components/core/overflow/overflow.md` — `@talkdesk/cobalt-react-overflow@2.2.5`
- Pagination: `components/core/pagination/pagination.md` — `@talkdesk/cobalt-react-pagination@1.0.3`
- Panel: `components/core/panel/panel.md` — `@talkdesk/cobalt-react-panel@3.0.3`
- Popover: `components/core/popover/popover.md` — `@talkdesk/cobalt-react-popover@1.2.1`
- Popup: `components/core/popup/popup.md` — `@talkdesk/cobalt-react-popup@2.2.8`
- ProgressBar: `components/core/progress-bar/progress-bar.md` — `@talkdesk/cobalt-react-progress-bar@3.0.2`
- Radio: `components/core/radio/radio.md` — `@talkdesk/cobalt-react-radio@1.1.6`
- Rating: `components/core/rating/rating.md` — `@talkdesk/cobalt-react-rating@3.0.0`
- Required: `components/core/required/required.md` — `@talkdesk/cobalt-react-required@2.2.5`
- ScrollableShadow: `components/core/scrollable-shadow/scrollable-shadow.md` — `@talkdesk/cobalt-react-scrollable-shadow@2.2.6`
- SearchInput: `components/core/search-input/search-input.md` — `@talkdesk/cobalt-react-search-input@1.1.7`
- SelectionGroup: `components/core/selection-group/selection-group.md` — `@talkdesk/cobalt-react-selection-group@3.1.0`
- Shortcut: `components/core/shortcut/shortcut.md` — `@talkdesk/cobalt-react-shortcut@1.3.1`
- Skeleton: `components/core/skeleton/skeleton.md` — `@talkdesk/cobalt-react-skeleton@1.0.1`
- Spinner: `components/core/spinner/spinner.md` — `@talkdesk/cobalt-react-spinner@3.1.2`
- Stepper: `components/core/stepper/stepper.md` — `@talkdesk/cobalt-react-stepper@2.3.5`
- Tab: `components/core/tab/tab.md` — `@talkdesk/cobalt-react-tab@2.2.5`
- Table: `components/core/table/table.md` — `@talkdesk/cobalt-react-table@2.2.5`
- Tag: `components/core/tag/tag.md` — `@talkdesk/cobalt-react-tag@3.0.2`
- TextInput: `components/core/text-input/text-input.md` — `@talkdesk/cobalt-react-text-input@1.3.0`
- Textarea: `components/core/textarea/textarea.md` — `@talkdesk/cobalt-react-textarea@3.1.2`
- Toggle: `components/core/toggle/toggle.md` — `@talkdesk/cobalt-react-toggle@3.1.1`
- Tooltip: `components/core/tooltip/tooltip.md` — `@talkdesk/cobalt-react-tooltip@1.1.0`
- Typography: `components/core/typography/typography.md` — `@talkdesk/cobalt-react-typography@3.0.2`
- useOutsideClick: `hooks/core/outside-click-hook/outside-click-hook.md` — `@talkdesk/cobalt-react-outside-click-hook@3.2.5`
- usePosition: `hooks/core/position-hook/position-hook.md` — `@talkdesk/cobalt-react-position-hook@3.2.7`
- useResize: `hooks/core/resize-hook/resize-hook.md` — `@talkdesk/cobalt-react-resize-hook@2.2.5`
- useResponsiveValue: `hooks/core/responsive-value-hook/responsive-value-hook.md` — `@talkdesk/cobalt-react-responsive-value-hook@3.2.5`
- PortalProvider: `providers/core/portal-provider/portal-provider.md` — `@talkdesk/cobalt-react-portal-provider@2.2.5`
- SurfaceProvider: `providers/core/surface-provider/surface-provider.md` — `@talkdesk/cobalt-react-surface-provider@1.0.1`
- ThemeProvider: `providers/core/theme-provider/theme-provider.md` — `@talkdesk/cobalt-react-theme-provider@4.6.3`
- ViewportProvider: `providers/core/viewport-provider/viewport-provider.md` — `@talkdesk/cobalt-react-viewport-provider@2.2.5`
- Mark: `components/core/mark/mark.md`
- Slider: `components/core/slider/slider.md`
- Component inventory: `components/inventory/inventory.md`
- Audit: `foundations/accessibility/audit/audit.md`
- Overview: `foundations/accessibility/overview/overview.md`
- Report: `foundations/accessibility/report/report.md`
- Resources: `foundations/accessibility/resources/resources.md`
- Training: `foundations/accessibility/training/training.md`
- Web accessibility: `foundations/accessibility/web-accessibility/web-accessibility.md`
- Content: `foundations/content/content/content.md`
- Grammar and mechanics: `foundations/content/content-grammar-and-mechanics/content-grammar-and-mechanics.md`
- Portuguese: `foundations/content/content-localization-portuguese/content-localization-portuguese.md`
- Principles: `foundations/content/content-principles/content-principles.md`
- Voice and tone: `foundations/content/content-voice-and-tone/content-voice-and-tone.md`
- Consistent words: `foundations/content/content-word-choice-consistent-words/content-word-choice-consistent-words.md`
- Inclusive language: `foundations/content/content-word-choice-inclusive-language/content-word-choice-inclusive-language.md`
- Vocabulary: `foundations/content/content-word-choice-vocabulary/content-word-choice-vocabulary.md`
- Layout: `foundations/layout/layout.md`
- Right to left: `foundations/rtl/rtl.md`
- Border: `foundations/tokens/border/border.md`
- Color: `foundations/tokens/color/color.md`
- Flags: `foundations/tokens/flags/flags.md`
- Grid: `foundations/tokens/grid/grid.md`
- Iconography: `foundations/tokens/iconography/iconography.md`
- Illustrations: `foundations/tokens/illustrations/illustrations.md`
- Brand logos: `foundations/tokens/logos/logos.md`
- Opacity: `foundations/tokens/opacity/opacity.md`
- Overview: `foundations/tokens/overview/overview.md`
- Elevation: `foundations/tokens/shadow/shadow.md`
- Spacing: `foundations/tokens/spacing/spacing.md`
- Typography: `foundations/tokens/typography/typography.md`
- Units: `foundations/units/units.md`
- Viewports: `foundations/viewports/viewports.md`
- Support: `get-help/support/support.md`
- Build with AI: `get-started/build-with-ai/build-with-ai.md`
- Develop: `get-started/develop/develop.md`
- Intro: `get-started/intro/intro.md`
- Detail Page: `layout-templates/detail-page/detail-page.md`
- Form Page: `layout-templates/form-page/form-page.md`
- List View: `layout-templates/list-view/list-view.md`
- Most used templates: `layout-templates/most-used-templates/most-used-templates.md`
- Actions: `patterns/actions/actions.md`
- Bulk actions: `patterns/bulk-actions/bulk-actions.md`
- Empty States & Loading: `patterns/empty-states-and-loading/empty-states-and-loading.md`
- Forms & Validation: `patterns/forms-and-validation/forms-and-validation.md`
- Onboarding & Wizards: `patterns/onboarding-and-wizards/onboarding-and-wizards.md`
- Search, Filtering & Sorting: `patterns/search-filtering-and-sorting/search-filtering-and-sorting.md`
- Timezone selector: `patterns/timezone-selector/timezone-selector.md`
- App loading (3Dots): `workspace/app-loading/app-loading.md`
- What an app can ask Workspace for: `workspace/app-requests/app-requests.md`
- Contributions: `workspace/contributions/contributions.md`
- Desktop app: `workspace/desktop-app/desktop-app.md`
- Dock and drawer: `workspace/dock-and-drawer/dock-and-drawer.md`
- Messages: `workspace/messages/messages.md`
- Workspace overview: `workspace/overview/overview.md`
- Secondary area: `workspace/secondary-area/secondary-area.md`
- Space and viewports: `workspace/space-and-viewports/space-and-viewports.md`
- Title bar: `workspace/title-bar/title-bar.md`

For component discovery, read `cobalt-reference/components/extensions/INDEX.md` or search `registry/authoring.json` by name, keywords and description. Each component source folder has a generated `README.md` linking purpose, exports, API guidance and runnable examples; read the closest example before coding. The generated project keeps these indexes and linked docs locally.
