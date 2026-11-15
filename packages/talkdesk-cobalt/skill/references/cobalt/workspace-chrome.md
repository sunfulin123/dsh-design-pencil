# Generated Workspace chrome

The scaffold copies the pinned ai-docs shell and applies maintained Atlas presentation templates. `cobalt-source.json` records the Atlas revision, source hashes, copied template hashes and adapter version. No Atlas checkout, runtime service or upstream modification is required to create a project. Historical screenshots in imported docs are reference images, not the current shell specification.

## Ownership and layout

The top bar is 44px; the Dock rail is 48px (240px expanded), with 32px app buttons and 20px icons. Logo and collapsed Dock icons share their horizontal center. The top bar and Dock share scheme-aware Primary 3/Primary 2 chrome. Search/status/avatar/notification/secondary-area controls use the pinned Atlas TitleBarButton, frame and Tooltip source. Cobalt owns typography, alpha-token fills, hover, expanded and focus states; do not add local background/color overrides or replace them with FakeInput/Avatar triggers. The existing stand-in menu data and SDK actions remain. The application area uses 2px borders, an 8px corner radius and 10px end/bottom gaps. A drawer shares its 1px inner border; up to 640px the end/bottom gaps and borders disappear. The prototype supports 360/390px using compact search instead of Atlas's production 414px minimum.

The slot admission algorithm reserves 422px (360px app, 48px Dock and 14px chrome), then admits requested slots in recency order. Actual iframe width also accounts for the drawer strip, shared border, secondary area and resize separator. Read the rendered iframe width, not just the browser width. The outer application-frame radius does not authorize adding card wrappers, padding or rounded corners to BasicTable.

The review toolbar stays outside Workspace. Preserve dimensions, all six scenarios and eight existing mock Feature flags. New chrome is the default presentation, not a feature flag. Production search and live Atlas services are not implemented by this stand-in. `add` registers apps/pages without overwriting an existing shell; use a newly scaffolded project for this presentation.

## Review locators

- `workspace-titlebar`: the named Workspace header.
- `workspace-search`: compact or full search trigger; the action remains a logged stand-in.
- `current-status`: status menu trigger with its current name.
- `workspace-notifications`: notifications trigger; its accessible name includes unread count.
- `getByRole('button', { name: 'Profile menu', exact: true })`: profile and Theme submenu.
- `workspace-secondary-toggle`: named Secondary area button with `aria-expanded`.
- `dock-button-<app-id>` and `dock-button-<page-id>`: use Dock or drawer scope if IDs overlap.
- `dock-action-button`: named drawer toggle with its expanded state.
- `iframe[data-primary-frame]`: business page boundary; use a frame locator.

Status/profile menus move focus after mounting. Wait for a menu item to receive focus before sending Escape or arrow keys; menu visibility alone is not keyboard readiness.

Validate both schemes at 360, 390, 640, 641, 768, 1024 and 1440px. Measure icon center offsets (at most 0.5px), iframe width versus the App readout, outer gaps and shared borders. Exercise pinned/hover drawer, expanded Dock, secondary open/close/resize, all prototype controls and business workflows. Intentional oversized size presets scroll within the review stage. This guide does not introduce generated E2E/Cucumber documents.

Theme regression compares rendered default/hover/expanded control styles to an unmodified Cobalt Button under the same loaded theme in both schemes. A matching top-bar background alone does not establish component theme parity.

The pinned Atlas frame imports Tag v2 by default; the generated copy changes only that import to the named Tag export required by Cobalt v3. Original primitive bytes and hashes remain intact, and `primitiveAdaptations` records this API-only adjustment.

The phone review preset uses prototype-size-mobile (390 × 844). Notification history uses compact rows, an Older group and per-row named read actions; desktopUpdateEntry adds a compact update row. The default history in main.tsx is explicitly local sample content.
