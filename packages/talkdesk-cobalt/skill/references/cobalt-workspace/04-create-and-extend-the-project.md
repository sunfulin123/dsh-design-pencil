## Create and extend the project

Use the bundled `scripts/cobalt-project.mjs` through the host's ordinary authorized shell tool. Resolve it relative to this skill's resource directory, never from `node_modules` or by searching the guide website. Its source, snapshot and templates ship together.

Write `<task-dir>/review/apps.json` describing the app and pages:

```json
{"apps":[{"id":"routing-studio","title":"Routing Studio","iconName":"app_automation_flows","pages":[{"id":"overview","title":"Overview"},{"id":"rules","title":"Rules"}]}]}
```

```sh
node <skill-directory>/scripts/cobalt-project.mjs create --out <task-dir>/project --spec <task-dir>/review/apps.json
```

The destination must not exist. It creates React 18 + TypeScript + Vite, private registry mapping, the complete official shell with owned multi-app/review adapters, `talkdesk-prototype.json`, and `src/apps/<app-id>/pages/<page-id>.tsx`. Scaffold pages are explicitly unfinished; replace each with the planned business UI using documented Cobalt components and tokens. Keep the selected `DESIGN.md` and `style-context.json` at the task root. Do not add another ThemeProvider or stylesheet to the business pages: `mountPrototype` supplies them in each frame.

For another app, write a spec containing only that new app and call:

```sh
node <skill-directory>/scripts/cobalt-project.mjs add --out <task-dir>/project --spec <task-dir>/review/new-app.json
```

This preserves existing business files. New pages within an existing app are authored under its `pages/` directory and registered in that app's `pages` array in `talkdesk-prototype.json`; `src/prototype-runtime/app.tsx` discovers them automatically. Page ids are unique within each app; app ids are unique across the project. An existing Workspace app id can intentionally replace its default Dock placeholder through the same registry. Use icon names verified in the official icon docs. Keep routing through `useWorkspaceState` / `workspace.navigate`; cross-app selection belongs to the Dock. Changing apps remounts business content and resets local component state; persist shared mock data explicitly if the requested flow needs it.

AI normally edits the registry, business pages and mock data. Leave `src/workspace-shell/` and `src/prototype-runtime/` alone unless a verified integration defect requires a scoped fix. The upstream snapshot under the tool's `vendor/` directory is immutable. `cobalt-source.json` identifies the copied revision and the owned adapter files, including shell/shell.css.
