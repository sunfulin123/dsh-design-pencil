# Share compact review chrome, protect canonical Workspace shell and restore extension popup dismissal; sync templates, AI guidance, SS and previews.

Record-Version: 2
Task-ID: a12b0a54-1736-4786-8926-0ae219f68cfb
Base-Ref: cfe576f5609071072aab0464cc95ce94a3693374
Started-At: 2026-11-15T14:17:33.578340+00:00
Type: fix-bug
Status: complete

## Context

Share compact review chrome, protect canonical Workspace shell and restore extension popup dismissal; sync templates, AI guidance, SS and previews.

## Changes

Added canonical chrome.css in the existing HTML review source-copy library. HTML and Workspace retain separate state adapters while sharing 44px bar geometry, 32px desktop/36px narrow buttons, SVG masks, neutral theme colors and focus styles. Removed conflicting Workspace dimensions and character chevrons; popup placement uses trigger geometry.

Moved canonical built-in Dock merging into copied dock-registry.ts. Built-in IDs retain official SVG URLs, metadata and drawer model, regardless of configured iconName; custom-app icon configuration is preserved. Registry schemaVersion stays 1. Adapter 7 records the complete protected shell/runtime/main/verifier inventory and SHA-256 values; generated builds verify it before Vite. Business pages and copied Extensions remain editable; add does not migrate existing shells.

Added a private popup-dismiss boundary to copied Dropdown, TimezoneDropdown, MultiDropdown, PopupTrigger and date/range/date-time wrappers. Native close callbacks preserve their public props and visual styling. Escape closes the innermost popup with trigger focus restoration; outside pointer/focus or frame blur closes applicable non-modal regions without taking focus back. Portal ownership, legacy exit/reopen lifecycle, body-focused non-search dropdowns and native MultiDropdown tabindex removal are handled locally. Native Menu, Popover and ModalPanel retain their dismissal owners.

Updated component MDX, AI companion/style guidance, runtime exports, SS packaged tests/owner docs and the existing SS implemented decision note. Rebuilt embedded style data, exported resources and staged the SS runtime. Refreshed the maintainer-owned Cobalt and ordinary HTML previews, preserving authored business pages and routes. Upstream inputs and node_modules were not modified.

## Validation

- Baseline diagnostic using cfe576f5 main.tsx confirmed a built-in WFM registration loses its official icon URL and retains a guessed iconName. Browser reproduction confirmed timezone Escape/focus-leave failures before the wrapper repair.
- `bun run test:unit` in packages/talkdesk-cobalt: PASS, 11/11, including built-in override/no-icon registration, all canonical icon/drawer entries, source-copy export and protected-file mutation rejection.
- `node --test test/popup-dismissal-browser.test.mjs test/form-controls-browser.test.mjs test/insights-controls-browser.test.mjs`: PASS, 12/12. The final boundary-only rerun passes 6/6, including real Tab, repeated multi-select, nested SidePanel and callback Dialog, date/range, queue overflow and iframe focus leave. Initial regressions exposed retained popup exit nodes, a wrong StatefulPopup target mode, native tabindex removal and body-focused Escape; each was fixed. Early fixture errors used a symlinked temp path or nonexistent Week option, then were corrected to test the actual path/native popup.
- DateTimePicker baseline browser check confirmed Escape leaves the calendar visible. Its existing StatefulPopup was connected to the same boundary; the added sixth browser test verifies time editing, Escape and outside-focus dismissal. A source audit confirms all seven local legacy dropdown/calendar/popup wrappers use the boundary.
- `bun run docs:build`: PASS, typechecks plus 279 Astro pages. `bun run examples:check`: PASS after the final boundary update. Incremental demos build and final popup browser run pass. Existing Form and Insights controls remain operable in dark/phone views.
- Generated fresh full-route projects using the SS-packaged helper, then `pnpm install --offline` and `pnpm run build`: PASS; verifier checks 49 protected files. Deliberately changing SvgIcon makes the actual pnpm build fail before Vite, with a named integrity error; restoring bytes succeeds.
- `SYNAPSE_COBALT_TEST_PROJECT=<SS-generated-project> node --test test/review-toolbar-browser.test.mjs`: PASS, sizes, all six scenarios, every Feature flag, Reset, keyboard/focus, popup bounds, light/dark and 360/390/768/1024/1440.
- `DSH_E2E_CHROME=1 DSH_HTML_REVIEW_HELPER=<SS-packaged-helper> node --test packages/dsh-node-runtime/html-review-browser.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs`: PASS, 4/4, no skips. Covers ordinary HTML states, real iframe sizing, Reset, navigation and source-preserving add behavior.
- Live rendered comparison at 57481 and 50058: PASS, eight light/dark and 360/390/768/1440 pairs. Bars measure 44px, buttons 32/36px, arrow centers differ by at most 1px, and both adapters have identical icon mask/color/background. All built-in SVG masks match canonical URLs; Conversations opens without an outer Drawer. Screenshots/results are under /private/tmp/preview-{workspace,html}-* and preview-shared-live-results.json.
- `PATH=/Users/franklin/.cargo/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh` and `node packages/talkdesk-cobalt/tools/build-skill.mjs`: PASS. Runtime is locally staged into SS; published release pin remains unchanged.
- SS packaged Cobalt/HTML helper tests: PASS, 2/2, with manifest/source equality, recursive private helper inclusion and positive/negative integrity checks. Focused ESLint, doc-check (46 assertions), plugin build and desktop build pass. Final staging/build refresh is recorded before handoff.
- Focused vet reviews: PASS, no issues found, including the SS test/documentation review. The final combined source review and final DateTimePicker integration review pass, with no issues found.
- `bash tools/check-maintenance.sh --lint-js --base cfe576f5609071072aab0464cc95ce94a3693374 --task a12b0a54-1736-4786-8926-0ae219f68cfb`: PASS, source-size, note/knowledge receipts and harness lint; JS lint reports warnings only.
- Final staged SS refresh: packaged helper tests PASS 2/2; plugin and desktop builds PASS. Final SS-generated project install/build PASS and both live previews refreshed from that delivery. Final eight theme/viewport comparisons and all built-in icon/no-Drawer assertions PASS. The final DateTimePicker update is copied with the SS-packaged source-only helper; live pnpm build and rendered comparison pass again.

Not run: a live-model SS authoring/handoff session or Electron E2E; this task changes generated authoring resources and packaging tests, not SS Host/Client, IPC, slots or Electron behavior. Static delivery and evidence gates remain intact. No E2E/Cucumber documentation generator was added.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Existing source-copy ownership, theme and focused evidence policies cover the approved fixes without an engineering-policy change.",
      "sha256": "aad6813429f9e7c63fad9ff072c84682bb00fa9a780f91a5de3c804920265730"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record shared compact controls, canonical built-in shell protection and copied popup dismissal behavior.",
      "sha256": "38d476629d7cea169659b70277b3d7bdddaa12abc87dafc8f2fc59fe53fd685b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document shared source ownership, adapter 7 protection and verified native popup lifecycle behavior including date-time selection.",
      "sha256": "da6f5e5d3f6cb22fe5ef1574920ab33f1bed4e125a08e46a8b883bd8e1a48789"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Source-copy integrity prevents accidental shell edits in the normal generated build path; it is not a security boundary against intentionally changing metadata or bypassing the build command. Existing user projects are not automatically rewritten. The two maintainer-owned test previews were explicitly refreshed. Business scenario content remains the page author's responsibility. Cobalt/Vite dependency warnings and the known large demo chunk warning remain non-blocking; native dependencies stay pinned. No commit or push was performed.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "c89dd41d568b7ccd76f7e5650542762407c1d94ca426fbeafbee295c05f6b7c5",
      "after": "38d476629d7cea169659b70277b3d7bdddaa12abc87dafc8f2fc59fe53fd685b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "e15d057ba922e55dcabf21a7f25005ad3c24b726ea38b30b7af4fac118c22615",
      "after": "da6f5e5d3f6cb22fe5ef1574920ab33f1bed4e125a08e46a8b883bd8e1a48789"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "6b1e3a0941d7748a4d4180be1c8b6458fc73e6be734f18c33ead4aa59dfc4e9f",
      "after": "aad6813429f9e7c63fad9ff072c84682bb00fa9a780f91a5de3c804920265730"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "7792d69f8047490c2cc8e0cc3a3e9b90dbeecefd3a19575d39d7b37b2b6a0d25",
      "after": "c50257bfebfa010868ddb0cff1c4f62146b4421f65aacf4f94567a0ebea2dd32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "c7485b6dc3972c5b8d35e5da220772b8f66af693ccbef8b07af8aee1e662fdda",
      "after": "917902e16c14b9cd613aba1fcb50de70db387ff434151a2a7495ec82887e13a4"
    },
    {
      "path": "packages/dsh-node-runtime/html-review-browser.test.mjs",
      "before": "395b5efc88371a0b0dbbdae050ccc1b13dad5d933868ce4748d59e04f04713a2",
      "after": "8981bd3a9081f44fab9b728a4e64797d42d7265ed28f0893c0ef8a42af18c240"
    },
    {
      "path": "packages/html-prototype-review/README.md",
      "before": "b328990ac0937bf93e8c94c5689942377a17ee260b6baf74302b3178168f54c1",
      "after": "a0fb4dae3fd8365ee693cc54c8934825040825f5000ae0a0000bb59354fed548"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/chrome.css",
      "before": null,
      "after": "f402919e40b1d79b327e61b2cb9ba71b2b3c9b8c12100b5a1ca9352bdfb4ee41"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.css",
      "before": "035946ccb9969916043ba36cb1227509115f7499d64a347e3042f78414165ef1",
      "after": "c8e666d230ca370b3c7a05f009d9fc3e48f6eb3ce20031aaa0469301da7af033"
    },
    {
      "path": "packages/html-prototype-review/scripts/html-review/review.html",
      "before": "b3e6de9f57b754b1e0e0f04af82cf83eb2d9c4aa49089f3dbbad55c02905dcef",
      "after": "f6d5b19c5c20e14474b558961df0c17514bcc3c42ef35d5277e78c4d1038cac2"
    },
    {
      "path": "packages/html-prototype-review/scripts/prepare-html-review.mjs",
      "before": "f3ddf6c0f6735d284c4eff8113240143599ef5e3ce5294c927787da110cd9c82",
      "after": "09efdc25d3a7f44d74e32b1aab9651f1b21cbeadf5975e67974af6a00a5610ae"
    },
    {
      "path": "packages/html-prototype-review/tools/export.mjs",
      "before": "2977e7d07ac375b8b762684d441ba92c2a1d899ded3b181e2900359c15025ab2",
      "after": "2f31aac86a2e429212ce43045ffb670b1db71b0e7325587f537dcc120efab75e"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "2dfdd618ef2406b15819f91f936669056d9efaa39450d819595dc08ca96ea247",
      "after": "4ce2203cbc5aa93cdbdbd3cb2ee2eb9767ab80c4ee6487f087c3ecd0269e6d77"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-picker/date-picker.tsx",
      "before": "27fd15700a483d7a2b0ede5f1b58d726e2b63af6cfe3f4d6f7d21739eef8bdca",
      "after": "e3590dba5c58e74b7721b30a136b2f30f12e179cb77edbf3d9e16e1832a55be4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-range-picker/date-range-picker.tsx",
      "before": "584a66c76b97f58cbf5425291f7eb954a47888f0b2c6f87816a5325344607ed4",
      "after": "5c393f5ace5b1deccc6028b261ac3e2fc33b878baa2f6256e02698f88dc865e5"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-time-picker/date-time-picker.tsx",
      "before": "a54ac0800eafe3b0335c39d75a38704e9cae3b1b353c4d78af2a5f6e9f6e6764",
      "after": "39b772b838ada43d4abbc2a6d6563b6cea9964a110faae212ba4a206d0a6507e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/dropdown.tsx",
      "before": "6fb4943517a1315a9dd45d270940b73e55c67e003380b20e9e0a522f4d30209b",
      "after": "82538bc740c9e856bdb684f5e7f17832ee6b0d0ff5005b0621ca579157a78bce"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/internal/popup-dismiss-boundary.tsx",
      "before": null,
      "after": "2dc9e002a17c4c434273bd97b847d40f2dd5866f70f417a348b288500aadd464"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/multi-dropdown.tsx",
      "before": "db3b79fb005f4906cbffd1911252dcf2662d5b96484ff0d89f8c9c5b10c35e15",
      "after": "6a39fe5b76b184caf7c456ca99bd73acd75ecfb5379c2f3248a01ff10736766a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/popup-trigger/popup-trigger.tsx",
      "before": "850ee1626e3d861c0b8b86997c71fe3d0ada06b7e5c06809797f92ac0e005374",
      "after": "53cec57bba5c5d4723934e7a2914ce757fd3047eda359b82db2b41b4023fecf4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/timezone-dropdown.tsx",
      "before": "eca9fbcc8971ddd216f9dc77a7ae9526f0e2ed35d70ac9fd65e4c6c58090e4f0",
      "after": "e1133785f2188c8b25843f9df6b73fa8576d521d893c038ef57130ec1eb72783"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datepicker.mdx",
      "before": "b1445fa4cffa187230e88e25a06bd769071a832c86f81f71627bf25f5b643000",
      "after": "d23f6e6e056391d282467f1c8da0f3d6fc08e7f846bfd1345c5eced2cc5183ab"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/daterangepicker.mdx",
      "before": "6ad17afefc77ddef932d9fa0ff24d69c69a888f0c6fe963800ee3f823b6586be",
      "after": "48f9cf04ba0a2ef65156d45a4d8833855202b03ecf5bbbdd1d5c7bf7da15d0f7"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datetimepicker.mdx",
      "before": "81173d8d92ea95e48fc79976e3f47ad08a6724137631a17453dc895d59eedae4",
      "after": "7bcf1e3577f7c513c65df0882d83c6049ca7feb14a8634cacedb772a146506ec"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dropdown.mdx",
      "before": "80c046b7726f08f583caf6ef8a562d154044e9e8e7f96fdfc0d800798636daac",
      "after": "76f3e3454f90d558f30a324fe98f99d2a102beca3806c5156c147c036d657ad8"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/multidropdown.mdx",
      "before": "c6b1475a3ee9cdcb7ffee1d4dc52521d1c5540db5b912ba870ed52d326c6d7a4",
      "after": "47b31ff7cd537a6f36037c5fa124692c8e1a2b210910feee483260924086fe90"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/popuptrigger.mdx",
      "before": "0bc5ed24da7cb4115aeec98e52914e1c978b47f4b04431840128275a458ae9dc",
      "after": "f3ffbb9175a6ab3022aa8900cee0280f6c60ee1acdebd56d1820c2042c3477fa"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timezonedropdown.mdx",
      "before": "3a5849963efb44c83dfa4bd3ca0281581f21fdc5888fbc55e184d4ac45527f43",
      "after": "f316d12e54dfe896e2170471734b951902b4ea3188a12ef49e7a4145ca5c0a96"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "d34807de54c4fae55d44b8e15ff3cb5825ade1ad0d6f0ec0bbc44b5ce74bc0c0",
      "after": "f091a62a77209c9862ddb30efcb7be55428adcb159f1c32a7893fe964fcd025b"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "2264154daf9e3d0008c1281ab2d1f9845c859c551921c38d0daaf8d3f3c92799",
      "after": "0b7047dd2e1084d4ecf3bd738478d7bb0a895cfa2f1f8aed74b65a1687b3985d"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/workspace-chrome.md",
      "before": "060987dea59c5b670a5723589569fd16ca43e5bcdfea6dba1f9d19ac3d2c0aee",
      "after": "79886d4d55e61ea6bc224142aa5bd609f8fb3caf1f583ebd10827953339a44aa"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/dock-registry.ts",
      "before": null,
      "after": "22e2c82f9032b59391fa931466cb3d467cde2804cf1382867da40983d263a991"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/main.tsx",
      "before": "34a542cec37dfa44b38cefd3f297f936fa1790dd1e84b5142665d0f4f1f72a87",
      "after": "11a5b3b3b4d0ac6ec6073009c00804dfb05212ced27f51acdae0b48cc1af4e6f"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-dropdown.tsx",
      "before": "31847ab3b40da018563777777b89760ebc82e8a9997cf00fd4da4d4da343dc44",
      "after": "03a9574825d4a21e777fe3cc868195500a88ab120923bca4ed012f0aa2368ed9"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.css",
      "before": "d14f9a367329aaffb35531c4ae6d6ea4667fa6158fe8317564ec171014729e19",
      "after": "a25395eccfaef204c56f10b3c7ae012b99dba120e3f6c2bfba163ded420abd54"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.tsx",
      "before": "07109537343953392a0f2bd031512ae2cd666ab51c2a3344c27e7cfe341dd98c",
      "after": "abe0a548d44fb7d0cfee573b0475ff22e8c16ea11916c0f24cffa32fca36b2bb"
    },
    {
      "path": "packages/talkdesk-cobalt/test/popup-dismissal-browser.test.mjs",
      "before": null,
      "after": "c5503938a0b9f83c790a7fe4a9b73c3d17cc4cdd96c82ea3f7d0ac47fc560ab0"
    },
    {
      "path": "packages/talkdesk-cobalt/test/preview-contracts.test.mjs",
      "before": null,
      "after": "39dc560901b5288377634068db92501601eae85151624887c762b149f1a8e57c"
    },
    {
      "path": "packages/talkdesk-cobalt/test/review-toolbar-browser.test.mjs",
      "before": "ac075d33b4c97bebf9699071abaf66ff7ee598e456c2454074cd8249bb8c1845",
      "after": "24b5425889f03f822e49725f8de9070fbd6ff08dc721c370e1f70816dd609b84"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "a855ad8fc7f66ac7f1d859cbcd751203aa2356d57a89174ab77e4914d76082f1",
      "after": "d7bb68fe180efa5500a7e2f3c3c0a954a1f9840c8066be48fb48254853e3e5a3"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "b5c6293a0803a728927b87d222b62e71f031b8675ab8723f3fc09c0f8f479fe6",
      "after": "a7b0475adf1146f0764e3b3786b6bc42aa7e06d82fb437ba1cc2a85850bd0cbd"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/verify-workspace-shell.mjs",
      "before": null,
      "after": "62801fb62cdaf28316f8fe65924c0b387098466063571ab1e63982fcb7ecdf54"
    }
  ]
}
```

Completed-At: 2026-11-15T15:10:38.043359+00:00
