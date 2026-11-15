# Extend Form page with copied Cobalt Extensions date/time/range/checkbox/radio/multi-select demos and use Extensions TimePicker for callback scheduling; sync AI docs, SS and maintained preview.

Record-Version: 2
Task-ID: 93e8641e-6708-4456-8a39-025e6af99d1c
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T08:04:41.954203+00:00
Type: feature
Status: complete

## Context

Extend Form page with copied Cobalt Extensions date/time/range/checkbox/radio/multi-select demos and use Extensions TimePicker for callback scheduling; sync AI docs, SS and maintained preview.

## Changes

Form page now includes controlled Scheduling and preferences examples using copied Extensions DatePicker, TimeSelectInput, DateRangePicker, Choice checkbox/radio, MultiDropdown and FormField. Profile.controlExamples is optional on input and returned through Save; defaults are local sample dates and 09:00. Unique radio names and dropdown label IDs keep the examples independently usable. Call callback Time uses the existing TimeSelectInput numeric minute API and formats HH:mm only on confirmation. No invented TimePicker alias/export or installable Extensions package is introduced.

Recipe catalog contracts, generated Markdown/AI index and TimeSelectInput MDX explain source closure, searchable terminology, selectors, data units and host-owned timezone/persistence. Actual SS/live preview updates are recorded below.

## Validation

`bun run docs:build`: PASS, TypeScript/demo/Astro build (277 pages).

`node --test test/form-controls-browser.test.mjs test/active-call-browser.test.mjs`: PASS, 7/7, no skipped checks; date/range selection, time editing, checkbox/radio/multi-search state, dark phone layout, callback numeric time scheduling and existing call regressions.

`node --test test/export.test.mjs`: PASS, 3/3; complete local component/support source closure exports without Extensions package dependencies.

`vet <Form examples and callback time scope> --agentic --agent-harness codex`: PASS, no issues found.

- A stricter popup-close check exposed a test locator error: dismissible selected tags include the close-icon text, so an exact global Billing text match was wrong. Inspected the native checkbox and selected trigger state, then asserted Billing within the trigger after the popup closes; the control itself retained the selection correctly.

- Final form popup-close/selected-trigger assertions: PASS, 2/2; clean screenshot visually inspected at `/private/tmp/cobalt-form-control-examples.png`.
- `node tools/build-skill.mjs`: PASS; searchable TimeSelectInput terminology and recipe source closure packaged.
- SS staging and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` (1/1), plugin build and desktop build: PASS.
- Actual 57481 browser path: PASS, changed 14:30/contact-email/support+billing values reach the Form Save callback; callback uses Extensions TimeSelectInput and schedules 16:45. Zero page errors. Screenshots: `/private/tmp/cobalt-live-form-controls-updated.png` and `/private/tmp/cobalt-live-callback-timepicker.png`.
- Final full task vet: PASS, no issues found.
- Input profiles without controlExamples are normalized to the visible sample defaults before editing, so Save returns those values even if the new fields are untouched. Focused browser checks and documentation build pass after this normalization.

- Final optional-input initialization vet: PASS, no issues found.
- Actual final 57481 host deliberately omits controlExamples: PASS, saving untouched controls returns the visible 09:00/voice/support defaults. Edited-value Save and callback scheduling were verified separately above.
- Final SS staging, focused Cobalt test (1/1), plugin/desktop builds and maintained prototype `pnpm run build`: PASS.
- `bash tools/check-maintenance.sh --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 93e8641e-6708-4456-8a39-025e6af99d1c`: PASS. Earlier lint-js maintenance passes with warnings only.
- `git diff --check HEAD`: PASS.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "New controls remain recipe/source-template content with unchanged SS runtime boundaries.",
      "sha256": "b335253bf46b79d2c1c229a713130d18029be890b54441651a45764ffef2d080"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "No repository engineering-policy changes are needed for controlled recipe examples.",
      "sha256": "1b31b67078c341d304d1bfc8bd80ce8b1a4a248e1913f0700beb350530dce6f6"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Confirm normalized optional Form control defaults, controlled Extensions demos and minute-valued callback scheduling.",
      "sha256": "1bd5e6ccbb3a2f0559b3e8d4db8ac5dce0bebf31e7505fe8dac3130cb0e80a16"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Dates are local calendar values and time values are minutes from midnight, not production timezone/UTC serialization. No new dependencies, backend, upstream changes, commit or push. Callback date is still required; 09:00 is an explicit editable default. Existing main profile fields and onSave behavior remain usable with omitted controlExamples.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "9a9670860d7a8d4546b65a28fc8715bc3ade89bb9407243e67ea220d73109c3f",
      "after": "1bd5e6ccbb3a2f0559b3e8d4db8ac5dce0bebf31e7505fe8dac3130cb0e80a16"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "30a1fd3eb94ef55dbc71c58b503ab46b1163f07100f58501d35f63d21d78ade5",
      "after": "b335253bf46b79d2c1c229a713130d18029be890b54441651a45764ffef2d080"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "924023be0b2e209a9d46a0b59f950cf6ebf98c63251da11688ff424df5584139",
      "after": "1b31b67078c341d304d1bfc8bd80ce8b1a4a248e1913f0700beb350530dce6f6"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/INDEX.md",
      "before": "51bcbf8a8bec735c23cd064f085761e938aea0bf77e7fe4d708ad39ca3950464",
      "after": "f942a3608c96d4d7cef6ab023d05a1a91e3c920adf637bddba1cd30873595040"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/time-select-input/README.md",
      "before": "5b5505a68fef83ba07437b62c921eafd5fa57c2fe5b211c9a7a647f4e42b794d",
      "after": "6c149b0a4dfc44143c9f086bc2ab1893d3524bc1faafd50671c1162c595fda19"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timeselectinput.mdx",
      "before": "a681542e6c612acc9158a4db5130d41a799a1eeeac3871c143ee9582675418dc",
      "after": "732a01fa3a1df688c495e0c10eb8a10264c175cda487748fe6f72c391b0faf72"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "17e74cab6376b2fff2143b8c7f449583dc290e1632871d4fe3ca13a2ba6dfdf2",
      "after": "0a8b7c499b90851c561ea88cdb13684ab1a1980c10b1b7b25c6e1411622993ad"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.md",
      "before": "d63f3119f09d797fc3fa3378ea30b6fd591cd94f9d9b7d737dfc6ec78dd3ce9e",
      "after": "5695a9850724c74e2a463de051e921a766769830dec44e025bfe077262322ad8"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "6301a7540ba39f6d9756f6cd8a832fee58c710d6534354eb7494b4d9aca1cbdc",
      "after": "34ab0f698027d629d02785cb758473749b899a7553bcfb290eb5ee9d4d5bed51"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.md",
      "before": "43f6f6f13df47b44624daa20c5f8b52d7fbfed40d602728257754cdd7c5f35ad",
      "after": "8f07a97db03df17392b12362aee7bc6464338f1c45fb5ccd686cb3b38511c8e5"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.tsx",
      "before": "513a2871089d851edcf8823eb4fcdc9e0828aa57a6c62c61406e11d5f64b305b",
      "after": "b7921e5487319fef291637f9e09403b2e5b9d5d246b12160c1ecf59806e62a91"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/call-dialogs.tsx",
      "before": "2f58529fce8ea43dfa0b9a6e97a6000c9faacde9ec5b4c31270aa844781c18ee",
      "after": "16efbc16284031624935236f971d23069abd4f9ddec4f71e52b4ab0ca75b3221"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/form-control-examples.tsx",
      "before": null,
      "after": "8a126f157517bb8abcc8da036aa2e479dbe064750781e8f789ccc355114e1abb"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "fead74fda97dc7b8c43491835c8c8f849045bafaf31da5a3f9f6e7992036950c",
      "after": "af00a788a054a68f886301d7e5c935cdfdac2760ca626234042affec71c4b907"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": "bb4a3032136196655f64540e500e991827cd0116be2d954ecefb234567314e3d",
      "after": "8064513586c44c2f875012040f39feecbde572a0f57f169aab62de5dff2dfd2c"
    },
    {
      "path": "packages/talkdesk-cobalt/test/form-controls-browser.test.mjs",
      "before": null,
      "after": "eceed8316d99e4c64235fb99fd0371c216a7175e71863c940cfbc582a0dbf45b"
    }
  ]
}
```

Completed-At: 2026-11-15T08:21:06.890330+00:00
