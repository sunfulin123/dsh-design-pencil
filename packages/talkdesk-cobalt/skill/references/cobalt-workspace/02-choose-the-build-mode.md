## Choose the build mode

Read existing context first. Ask only missing material requirements: what users will do, which Dock app and pages they need, and which interactions matter. Default a new Cobalt application prototype to Workspace with the copied shell. Ask when the request could instead mean production deployment; never assume a mock is production code.

1. **Workspace prototype:** a local mock app, a new Dock entry, or a screen of an existing Workspace app. Use the scaffold below. Preserve the generated Atlas-style top bar, Dock, drawer, secondary area, themes, size presets, feature flags, notifications and SDK stand-ins. Never redraw that chrome. The menu data contains real default entries, but their business apps remain placeholders unless implemented.
2. **Standalone prototype outside Workspace:** an explicitly independent sign-up page, component or flow. Skip this shell and follow the Cobalt docs' standalone providers/setup. Keep the same design and review standards.
3. **Production app in its repository:** inspect the existing app and use the official production/Atlas instructions. Do not install the prototype shell into production. If the user switches from design to production implementation, close the design phase as the core skill requires.
