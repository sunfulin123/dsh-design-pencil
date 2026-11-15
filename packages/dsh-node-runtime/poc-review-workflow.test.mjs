/** Source-owned POC review entry points retain strict final evidence while allowing fast iteration. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { normalizeCapturePlan } from "../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs";
import {
  collectSourceFiles,
  collectEvidenceFiles,
} from "../../crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs";
const scripts = fileURLToPath(
  new URL(
    "../../crates/op-ai-skills/skills/synapse-design-html/scripts/",
    import.meta.url,
  ),
);
test("capture plans preserve explicit frame, crop and color scheme targets", () => {
  const plan = normalizeCapturePlan(
    {
      sessions: [
        {
          name: "dialog",
          width: 390,
          height: 844,
          scheme: "dark",
          steps: [
            { action: "click", frame: ["iframe#app"], selector: "#open" },
            {
              action: "screenshot",
              frame: "iframe#app",
              selector: "#dialog",
              out: "review/dialog.png",
            },
          ],
        },
      ],
    },
    "http://127.0.0.1:4173",
  );
  assert.equal(plan.sessions[0].scheme, "dark");
  assert.equal(plan.sessions[0].steps[1].frame, "iframe#app");
  assert.equal(plan.sessions[0].steps[1].selector, "#dialog");
  assert.throws(
    () =>
      normalizeCapturePlan(
        {
          sessions: [
            {
              steps: [
                {
                  action: "screenshot",
                  out: "a.png",
                  clip: { x: 0, y: 0, width: -1, height: 4 },
                },
              ],
            },
          ],
        },
        "http://127.0.0.1:4173",
      ),
    /clip/i,
  );
});
test("compiled delivery is fingerprinted without being linted as authored source", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "poc-source-scope-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "project/delivery/assets"), { recursive: true });
  await writeFile(
    join(root, "project/delivery/assets/dependency.js"),
    "minified library",
  );
  await writeFile(
    join(root, "project/page.tsx"),
    "export default function Page(){return null}",
  );
  const files = collectSourceFiles(root, root);
  assert.ok(!files.some((path) => path.includes("/delivery/")));
  assert.ok(files.some((path) => path.endsWith("page.tsx")));
  assert.ok(
    collectEvidenceFiles(root, root).some((path) =>
      path.endsWith("dependency.js"),
    ),
  );
});
test("review CLI advertises separate development and final entry points", () => {
  const r = spawnSync(
    process.execPath,
    [join(scripts, "review-poc.mjs"), "--help"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /dev\|final/);
});

test(
  "native browser input, nested frame focus and cropped screenshots use the real Workspace boundary",
  { skip: process.env.DSH_E2E_CHROME !== "1", timeout: 60000 },
  async (t) => {
    const { runPocCapturePlan } =
      await import("../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs");
    const root = await mkdtemp(join(tmpdir(), "poc-frame-input-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    await writeFile(
      join(root, "child.html"),
      `<!doctype html><html><head><style>body{margin:16px;font:16px system-ui}#panel{padding:16px;border:1px solid}</style></head><body><button id="open">Open</button><div id="panel" hidden><label>Name <input id="name"></label><button id="last">Last</button></div><output id="trusted"></output><i id="late-icon" data-co-name="Icon" style="visibility:hidden">test</i><script>
 document.querySelector('#open').addEventListener('click',e=>{document.querySelector('#trusted').textContent=String(e.isTrusted);document.querySelector('#panel').hidden=false;document.querySelector('#name').focus();setTimeout(()=>document.querySelector('#late-icon').style.visibility='visible',800)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('#panel').hidden=true;document.querySelector('#open').focus()}});
 </script></body></html>`,
    );
    await writeFile(
      join(root, "index.html"),
      '<button id="outer">Outside</button><iframe id="app" src="child.html" style="display:block;width:600px;height:400px;margin:20px"></iframe>',
    );
    const { startStaticServer } =
      await import("../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-preview-server.mjs");
    const server = await startStaticServer(root, "index.html");
    t.after(() => new Promise((resolve) => server.server.close(resolve)));
    const plan = normalizeCapturePlan(
      {
        sessions: [
          {
            name: "native",
            width: 1024,
            height: 768,
            steps: [
              { action: "click", frame: "#app", selector: "#open" },
              {
                action: "assertText",
                frame: "#app",
                selector: "#trusted",
                equals: "true",
              },
              {
                action: "fill",
                frame: "#app",
                selector: "#name",
                value: "Cobalt workflow",
              },
              {
                action: "assertValue",
                frame: "#app",
                selector: "#name",
                equals: "Cobalt workflow",
              },
              { action: "press", frame: "#app", key: "Tab" },
              { action: "assertFocused", frame: "#app", selector: "#last" },
              {
                action: "screenshot",
                frame: "#app",
                selector: "#panel",
                out: "panel.png",
              },
              { action: "press", frame: "#app", key: "Escape" },
              {
                action: "assertVisible",
                frame: "#app",
                selector: "#panel",
                visible: false,
              },
              { action: "assertFocused", frame: "#app", selector: "#open" },
              { action: "click", selector: "#outer" },
              { action: "assertFocused", selector: "#outer" },
              { action: "screenshot", out: "full.png" },
            ],
          },
        ],
      },
      server.url,
    );
    const result = await runPocCapturePlan({
      ...plan,
      baseDir: root,
      inspect: true,
    });
    assert.equal(result.browserLaunches, 1);
    assert.equal(result.screenshots[0].fullViewport, false);
    assert.ok(result.screenshots[0].width < 600);
    assert.equal(result.screenshots[1].fullViewport, true);
    const invalid = normalizeCapturePlan(
      {
        sessions: [
          {
            steps: [{ action: "click", frame: "#missing", selector: "button" }],
          },
        ],
      },
      server.url,
    );
    await assert.rejects(
      runPocCapturePlan({ ...invalid, baseDir: root, timeoutMs: 10000 }),
      /Frame selector/,
    );
  },
);

test("selection inset inspection ignores menu icons and hidden glyphs but catches field chevrons", async () => {
  const { readSurfaceGeometry } =
    await import("../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-surface-inspection.mjs");
  const icon = (hidden = false) => ({
    getBoundingClientRect: () => ({ width: 16, height: 16, right: 100 }),
    getAttribute: () => null,
    textContent: "chevron_down",
    hasAttribute: () => true,
    style: { visibility: hidden ? "hidden" : "visible" },
  });
  const control = (id, glyph) => ({
    id,
    getBoundingClientRect: () => ({ width: 100, height: 32, right: 100 }),
    querySelectorAll: () => [glyph],
    style: { display: "block", visibility: "visible", borderRightWidth: "0" },
  });
  const controls = [
    control("hidden-field", icon(true)),
    control("real-field", icon()),
  ];
  const fakeDocument = {
    defaultView: { innerWidth: 1440, getComputedStyle: (el) => el.style },
    documentElement: { scrollWidth: 1440 },
    querySelectorAll: (selector) =>
      selector === '[role="combobox"], button[aria-haspopup="listbox"]'
        ? controls
        : [],
  };
  const page = {
    evaluate: async (expression) => {
      const { runInNewContext } = await import("node:vm");
      return runInNewContext(expression, {
        document: fakeDocument,
        window: { innerWidth: 1440 },
        getComputedStyle: (el) => el.style,
      });
    },
  };
  const geometry = await readSurfaceGeometry(page, undefined, 1000);
  assert.equal(geometry.selectChevronIssues.length, 1);
  assert.match(geometry.selectChevronIssues[0], /#real-field/);
});

async function workflowFixture(t) {
  const { createHash } = await import("node:crypto");
  const root = await mkdtemp(join(tmpdir(), "poc-review-lanes-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const guide = "# Local test style\nReadable text, plain surfaces.\n";
  await writeFile(join(root, "DESIGN.md"), guide);
  await writeFile(
    join(root, "style-context.json"),
    JSON.stringify({
      schemaVersion: 1,
      styleId: "test-style",
      contentHash: createHash("sha256").update(guide).digest("hex"),
      guidePath: "DESIGN.md",
    }),
  );
  await writeFile(
    join(root, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Service review</title><style>body{margin:0;font:16px system-ui}main{padding:24px}button{padding:12px}dialog{padding:24px}[hidden]{display:none!important}</style></head><body><main><h1>Service requests</h1><p>Review pending customer requests.</p><button id="open" onclick="document.querySelector('dialog').showModal()">Open request</button><dialog><h2>Request details</h2><button onclick="this.closest('dialog').close()">Close request</button></dialog></main></body></html>`,
  );
  const { startStaticServer } =
    await import("../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-preview-server.mjs");
  const server = await startStaticServer(root, "index.html");
  t.after(() => new Promise((resolve) => server.server.close(resolve)));
  const plan = {
    sessions: [
      {
        name: "dialog",
        width: 1440,
        height: 900,
        steps: [
          { action: "click", selector: "#open" },
          { action: "assertVisible", selector: "dialog[open]" },
          { action: "screenshot", selector: "dialog", out: "dialog.png" },
        ],
      },
    ],
  };
  await mkdir(join(root, "review"));
  await writeFile(join(root, "review/steps.json"), JSON.stringify(plan));
  const { spawn } = await import("node:child_process");
  const run = (script, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [join(scripts, script), ...args], {
        cwd: root,
      });
      let stdout = "",
        stderr = "";
      child.stdout.on("data", (v) => (stdout += v));
      child.stderr.on("data", (v) => (stderr += v));
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Review test timed out"));
      }, 90000);
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
    });
  return { root, url: server.url, run };
}
test(
  "development review never builds or rewrites final evidence and rejects invalid style before capture",
  { skip: process.env.DSH_E2E_CHROME !== "1", timeout: 90000 },
  async (t) => {
    const { readFile } = await import("node:fs/promises");
    const { root, url, run } = await workflowFixture(t);
    const old = JSON.stringify({ mode: "final", marker: "retain this review" });
    await writeFile(join(root, "evidence-report.json"), old);
    const result = await run("review-poc.mjs", [
      "dev",
      "--source",
      root,
      "--out",
      root,
      "--url",
      url,
      "--steps",
      join(root, "review/steps.json"),
      "--sessions",
      "dialog",
    ]);
    assert.equal(result.code, 0, result.stderr);
    assert.ok(result.stdout, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.builds, 0);
    assert.equal(summary.browserLaunches, 1);
    assert.equal(summary.screenshots, 1);
    assert.equal(
      await readFile(join(root, "evidence-report.json"), "utf8"),
      old,
    );
    const dev = JSON.parse(
      await readFile(join(root, "review/dev-report.json"), "utf8"),
    );
    assert.equal(dev.handoffEligible, false);
    assert.equal(dev.screenshots[0].fullViewport, false);
    const { parseAndValidateEvidenceLedgerJson } =
      await import("./poc-evidence-validator.mjs");
    assert.throws(
      () => parseAndValidateEvidenceLedgerJson(JSON.stringify(dev)),
      /Development/,
    );
    await writeFile(join(root, "DESIGN.md"), "changed style");
    const failed = await run("review-poc.mjs", [
      "dev",
      "--source",
      root,
      "--out",
      root,
      "--url",
      url,
    ]);
    assert.equal(failed.code, 1);
    assert.match(failed.stderr, /DESIGN changed/);
    assert.equal(
      await readFile(join(root, "evidence-report.json"), "utf8"),
      old,
    );
  },
);
test(
  "final capture reuses one browser, enforces frozen artifacts and retains prior reviews",
  { skip: process.env.DSH_E2E_CHROME !== "1", timeout: 120000 },
  async (t) => {
    const { readFile, readdir } = await import("node:fs/promises");
    const { root, run } = await workflowFixture(t);
    const args = [
      "final",
      "--source",
      root,
      "--out",
      root,
      "--entry",
      join(root, "index.html"),
      "--steps",
      join(root, "review/steps.json"),
    ];
    const result = await run("review-poc.mjs", args);
    assert.equal(result.code, 1, result.stderr);
    assert.ok(result.stdout, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.status, "needs-review");
    assert.equal(summary.browserLaunches, 1);
    assert.equal(summary.screenshots, 4);
    const ledger = join(root, "evidence-report.json");
    let report = JSON.parse(await readFile(ledger, "utf8"));
    assert.equal(report.capture.browserLaunches, 0);
    assert.equal(report.renderedEvidence.length, 3);
    assert.equal(report.visualReview.status, "pending");
    for (const key of ["accessibility", "responsive", "visualReview"])
      report[key] = {
        status: "pass",
        evidence: "Observed in fixture acceptance",
      };
    for (const state of Object.keys(report.contentStates))
      report.contentStates[state] =
        state === "success"
          ? { status: "pass", evidence: "Service requests rendered" }
          : {
              status: "not-applicable",
              reason: "Fixture has one business state",
            };
    report.actions = [
      {
        label: "Open request",
        kind: "verifiable",
        evidence: "Native click opened request dialog",
      },
    ];
    await writeFile(ledger, JSON.stringify(report));
    const check = await run("verify-surface.mjs", ["--check-evidence", ledger]);
    assert.equal(check.code, 0, check.stderr);
    const capture = JSON.parse(await readFile(summary.capture, "utf8"));
    const png = join(root, capture.screenshots[0].path),
      bytes = await readFile(png);
    await writeFile(png, "tampered");
    const tampered = await run("verify-surface.mjs", [
      "--source",
      root,
      "--out",
      root,
      "--capture",
      summary.capture,
    ]);
    assert.equal(tampered.code, 1);
    assert.match(tampered.stderr, /PNG/);
    await writeFile(png, bytes);
    const wrongMode = join(root, "review/wrong-mode.json");
    await writeFile(wrongMode, JSON.stringify({ ...capture, mode: "dev" }));
    const devReuse = await run("verify-surface.mjs", [
      "--source",
      root,
      "--out",
      root,
      "--capture",
      wrongMode,
    ]);
    assert.equal(devReuse.code, 1);
    assert.match(devReuse.stderr, /Only a final/);
    const cropped = join(root, "review/cropped-only.json");
    await writeFile(
      cropped,
      JSON.stringify({
        ...capture,
        screenshots: capture.screenshots.map((shot) => ({
          ...shot,
          fullViewport: false,
        })),
      }),
    );
    const cropReuse = await run("verify-surface.mjs", [
      "--source",
      root,
      "--out",
      root,
      "--capture",
      cropped,
    ]);
    assert.equal(cropReuse.code, 1);
    assert.match(cropReuse.stderr, /missing full viewport/);
    const reuse = await run("verify-surface.mjs", [
      "--source",
      root,
      "--out",
      root,
      "--capture",
      summary.capture,
    ]);
    assert.equal(reuse.code, 0, reuse.stderr);
    assert.equal(
      JSON.parse(await readFile(ledger, "utf8")).visualReview.status,
      "pass",
    );
    const before = await readFile(ledger, "utf8");
    await writeFile(join(root, "new-business-file.js"), 'console.log("new")');
    const stale = await run("verify-surface.mjs", [
      "--source",
      root,
      "--out",
      root,
      "--capture",
      summary.capture,
    ]);
    assert.equal(stale.code, 1);
    assert.match(stale.stderr, /Source inventory or content changed/);
    assert.equal(await readFile(ledger, "utf8"), before);
    const second = await run("review-poc.mjs", args);
    assert.equal(second.code, 1, second.stderr);
    assert.equal(
      JSON.parse(await readFile(ledger, "utf8")).visualReview.status,
      "pending",
    );
    const history = await readdir(join(root, "review/history"));
    assert.ok(history.length >= 1);
    const old = JSON.parse(
      await readFile(
        join(root, "review/history", history[0], "history.json"),
        "utf8",
      ),
    );
    assert.equal(old.report.visualReview.status, "pass");
    assert.ok(old.artifacts.every((item) => item.matchesRecordedHash));
    const invalidPlan = join(root, "review/invalid.json");
    await writeFile(
      invalidPlan,
      JSON.stringify({
        sessions: [
          {
            name: "failure",
            steps: [
              { action: "waitFor", selector: "#not-present", timeoutMs: 100 },
            ],
          },
        ],
      }),
    );
    const interrupted = await run("review-poc.mjs", [
      "final",
      "--source",
      root,
      "--out",
      root,
      "--entry",
      join(root, "index.html"),
      "--steps",
      invalidPlan,
    ]);
    assert.equal(interrupted.code, 1);
    assert.equal(JSON.parse(await readFile(ledger, "utf8")).mode, "pending");
    assert.equal(
      (await run("verify-surface.mjs", ["--check-evidence", ledger])).code,
      1,
    );
  },
);

test(
  "ordinary final review captures the business entry while retaining wrapper provenance",
  { skip: process.env.DSH_E2E_CHROME !== "1", timeout: 60000 },
  async (t) => {
    const { readFile, realpath } = await import("node:fs/promises");
    const { root, run } = await workflowFixture(t);
    const entry = join(root, "index.html");
    await writeFile(
      entry,
      (await readFile(entry, "utf8")).replace(
        "</head>",
        '<script src="./prototype-review/page.js"></script></head>',
      ),
    );
    const helper = fileURLToPath(
      new URL(
        "../html-prototype-review/scripts/prepare-html-review.mjs",
        import.meta.url,
      ),
    );
    const prepared = spawnSync(process.execPath, [helper, "--entry", entry], {
      encoding: "utf8",
    });
    assert.equal(prepared.status, 0, prepared.stderr);
    const result = await run("review-poc.mjs", [
      "final",
      "--source",
      root,
      "--out",
      root,
      "--entry",
      join(root, "preview.html"),
    ]);
    assert.equal(result.code, 1, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.status, "needs-review");
    const capture = JSON.parse(await readFile(summary.capture, "utf8"));
    const canonicalRoot = await realpath(root);
    assert.equal(capture.screenshots.length, 3);
    assert.ok(
      capture.screenshots.every(
        (shot) => new URL(shot.url).pathname === "/index.html",
      ),
    );
    assert.ok(
      capture.sourceFiles.some(
        (file) => file.path === join(canonicalRoot, "preview.html"),
      ),
    );
    assert.ok(
      capture.sourceFiles.some((file) =>
        file.path.endsWith("/prototype-review/chrome.css"),
      ),
    );
  },
);
