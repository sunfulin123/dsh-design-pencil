## Recipe component reuse audit

All eight maintained recipes use official Cobalt controls or copied Extensions implementations. Before adding UI, search the authoring registry and inspect the closest component API/example. For a new control, prefer the pinned official Cobalt component when its API supports the required behavior. Use the documented extension when a recipe relies on its layout, focus or overlay behavior. Reuse the implementation and its native theme/state behavior; do not draw a substitute control, custom avatar circle, tag close button, badge or empty state. Existing core Flex/Heading/Text compositions are valid Cobalt UI; a generic wrapper is not mandatory when it does not fit the layout.

| Recipe | Reused building blocks | Intentional page composition |
| --- | --- | --- |
| List page | AppPage, BasicTable, SidePanel, Dialog, FormField, UploadFile, ChipGroup, native Toolbar/TagGroup | Table cell layout and host-owned data/selection. |
| Detail page | Native Avatar, Tab, Button, Divider, Tag, Flex and typography | Record groups and read-only label/value fields. |
| Form page | Native field controls plus copied FormField, DatePicker, DateRangePicker, TimeSelectInput, Choice and MultiDropdown | Responsive sections and validation wiring. |
| Echart insights | AppPage, Card, MultiDropdown, native Toolbar/SelectionGroup/TagGroup/SplitButton/Popover/Avatar/ChatBubble | Apache ECharts options and local sample chat replies. |
| Active call | Card, Dialog, FormField, DatePicker, TimeSelectInput, Textarea, native EmptyWidget/BadgeContainerWrapper/Avatar/Tab/Button | Pinned call layout, callback connector and explicitly requested outward wave animation. |
| Card widgets | Card, Dialog, Dropdown, SelectGroup, FormField, native EmptyWidget/Tag/Button/Icon | Metric/card arrangement, edit handles and ECharts donuts. |
| ECharts gallery | Card, native Button/Icon/typography | Real ECharts plots, legends and zoom. |
| Schedule page | TimezoneDropdown, DatePicker, MultiDropdown, SidePanel, native Toolbar/BadgeContainerWrapper/TagGroup/Pagination/Avatar | Scheduling grid, quarter-hour lines and duration-positioned event Buttons; Cobalt has no complete team scheduler. |

The callback history keeps its screenshot connector because the documented marketplace Timeline API has no custom marker slot for phone Avatars. Do not repaint its native dots to imitate this design. Native semantic HTML remains appropriate for forms, logs, navigation and lists. The hidden submit button in the create-user form is form submission plumbing, not a visible custom control. Recipes are references for composition and exploration, not complete production workflows; adapt sample content and interactions to the actual request. Keep shared source fixes in the library and regenerate copied templates, component indexes and SS assets together.
