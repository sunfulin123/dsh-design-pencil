# Active call

<!-- Generated from recipes/catalog.json and recipe source imports. -->

Screenshot-faithful Conversations voice-call workspace: assigned queue and search, Talking via Sales Number, call quality and recording, Snapshot/Notes/Callbacks, empty callback card, two-entry callback timeline and pinned full call controls.

Read and copy [active-call.tsx](active-call.tsx). Default export: `ActiveCall`.

Supporting source: [recipes/support/call-dialogs.tsx](support/call-dialogs.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/conversation-queue.tsx](support/conversation-queue.tsx). Copy this file too when reusing the recipe outside a scaffold.
Supporting source: [recipes/support/active-call.css](support/active-call.css). Copy this file too when reusing the recipe outside a scaffold.

## Integration

Copy active-call.tsx, support/call-dialogs.tsx, support/conversation-queue.tsx and support/active-call.css plus the complete local Extensions source closure. Mount in a bounded full-height business surface (100% height, min-height:0); do not add another app menu inside this screenshot composition. Pass scenario from usePrototypeScenario() in Workspace. The 1386x861 reference uses a 360px queue, 164px call header, 24px content inset/gap and pinned 66px footer; only conversation/content scroll. Native Cobalt components supply all controls, typography, badges, avatars and icons. No emoji, custom SVG or external icon family. Native Cobalt DatePicker/Input/Extensions Dialog handle callback scheduling; the screenshot default has no upcoming callbacks and exactly the two sample timeline records. Every call action has an accessible name and call-* locator. Hold/Mute/Recording toggle locally; Keypad opens a local digit pad; Consult/Blind transfer/Add guest/New conversation collect a target; End call confirms and disables call controls. Queue tabs/search/compact/filter/sort are local sample interactions. Notes remain in memory. onAction(action,value) observes prototype actions; it is not a telephony transport. Under 1100px cards stack, under 600px the queue is an explicit collapsible overlay; controls remain visible and wrapping at the bottom. Theme all surfaces through Cobalt tokens. The call header renders a native Cobalt Divider under its tabs. Snapshot uses a 24px title-to-metadata gap and 4px metadata gaps; Notes uses Extensions FormField with its 8px label/control gap and 16px section/action gaps. The caller Avatar has two staggered outward CSS waves while talking; Hold/end/loading/permission stop motion, and prefers-reduced-motion retains static rings. Callback Time uses the copied TimeSelectInput, not a plain text field. It defaults to 09:00 in 24-hour format, stores total minutes locally and formats HH:mm for the Callback/onAction result; a date remains required. Callback Note uses the copied Cobalt Textarea with three visible rows; preserve multiline note text. Queue counts use native BadgeContainerWrapper; callback emptiness uses marketplace EmptyWidget; thread surfaces use copied Card and native Avatar. The callback connector is layout for the screenshot phone-avatar markers; marketplace Timeline has no custom marker slot, so do not simulate its API or overwrite its dot styles.

Read the Props interface and callbacks in the source; do not infer them from other recipes. Workspace scaffolds already provide ThemeProvider, ViewportProvider and PortalProvider.

## Components and dependencies

- `cobalt:components/button`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/icon`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/avatar`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/tab`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/typography`: look up its exact import and props in the Cobalt registry.
- `extensions.card`: [component guidance](../components/extensions/src/card/README.md).
- `extensions.input`: [component guidance](../components/extensions/src/input/README.md).
- `extensions.dialog`: [component guidance](../components/extensions/src/dialog/README.md).
- `extensions.form-field`: [component guidance](../components/extensions/src/form-field/README.md).
- `extensions.date-picker`: [component guidance](../components/extensions/src/date-picker/README.md).
- `cobalt:components/tag`: look up its exact import and props in the Cobalt registry.
- `cobalt:components/divider`: look up its exact import and props in the Cobalt registry.
- `extensions.time-select-input`: [component guidance](../components/extensions/src/time-select-input/README.md).
- `extensions.textarea`: [component guidance](../components/extensions/src/textarea/README.md).
- `cobalt-marketplace:components/empty-widget`: look up its exact import and props in the Cobalt registry.
- `cobalt-marketplace:components/badge-container`: look up its exact import and props in the Cobalt registry.

- `react` (18.3.1)
- `@talkdesk/cobalt-react-avatar` (2.3.1)
- `@talkdesk/cobalt-marketplace-react-empty-widget` (2.2.2)
- `@talkdesk/cobalt-react-button` (3.3.1)
- `@talkdesk/cobalt-react-icon` (2.31.0)
- `@talkdesk/cobalt-react-tab` (2.2.5)
- `@talkdesk/cobalt-react-divider` (3.0.3)
- `@talkdesk/cobalt-react-tag` (3.0.2)
- `@talkdesk/cobalt-react-spinner` (3.1.2)
- `@talkdesk/cobalt-react-message` (2.3.5)
- `@talkdesk/cobalt-react-typography` (3.0.2)
- `@talkdesk/cobalt-marketplace-react-badge-container` (2.2.0)

Read and copy the full referenced component implementations, types, CSS and local imports before adapting this recipe. Workspace scaffolding provides src/components/cobalt-extensions/. Standalone apps use cobalt-project.mjs copy-source --out <project> first. Rebase relative imports to the local source directory. Never install @openpencil/cobalt-extensions, create a file dependency for it, or leave a package-name import/alias. Install only the listed runtime dependencies, including Apache echarts for the Insights recipe; never install an Extensions package.

States covered: success, loading, empty, error, partial, permission, on hold, muted, recording stopped, call ended, callback scheduled, keypad, queue collapsed.

## Limits and required adaptation

Carly Yates, the phone number, history names, historical timestamps, 5 assigned and 6 conversations are screenshot sample content, not live customer data. The sample list contains one active voice contact, so sorting/filtering does not invent five other records. No calling, recording, DTMF, transfers, notifications or persistence are performed. Wire authorized telephony services in the embedding app. Empty refers to callback history; the active contact/header stay visible. Partial shows one history record. Error retries local sample data. Loading/permission disable call actions. The ended state is local and resets on remount. No production audio/network integration.

Run the applicable TypeScript/build checks and browser interactions after adapting. A compiling recipe is a starting point; it does not prove finished UX or every API combination.
