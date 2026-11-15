/** Measure disposable prototype copies, actual route loading and React Fast Refresh. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { serveStatic } from "./static-server.mjs";
const project = process.env.SYNAPSE_COBALT_TEST_PROJECT;
const baseline = process.env.SYNAPSE_COBALT_BASELINE_PROJECT;
const devUrl = process.env.SYNAPSE_COBALT_DEV_URL;
const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
test(
  "lazy prototype routes defer charts while keeping list, chart and call views",
  { skip: !project, timeout: 120000 },
  async (t) => {
    const browser = await chromium.launch({ executablePath, headless: true });
    t.after(() => browser.close());
    const rows = [];
    for (const [variant, root] of [
      ["before", baseline],
      ["after", project],
    ]) {
      if (!root) continue;
      const server = await serveStatic(join(root, "delivery"));
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      try {
        const page = await context.newPage(),
          requests = [],
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("response", (r) => {
          if (
            r.url().startsWith(server.url) &&
            r.url().includes("/assets/") &&
            r.url().endsWith(".js")
          )
            requests.push(r);
        });
        const start = performance.now();
        await page.goto(server.url, { waitUntil: "domcontentloaded" });
        await page
          .frameLocator("iframe[data-primary-frame]")
          .getByRole("heading", { name: "Users", exact: true })
          .waitFor();
        const readyMs = performance.now() - start,
          initial = [...new Map(requests.map((r) => [r.url(), r])).values()];
        const bytes = (await Promise.all(initial.map(async (r) => (await r.body()).length))).reduce(
          (a, b) => a + b,
          0,
        );
        if (variant === "after")
          assert.ok(
            initial.every((r) => !r.url().includes("/charts-")),
            "Charts must not load with Users",
          );
        await page.screenshot({
          path: `/private/tmp/poc-loading-${variant}-list.png`,
          animations: "disabled",
        });
        await page.goto(server.url + "/?frame=app&app=wfm&page=insights&scheme=light", {
          waitUntil: "domcontentloaded",
        });
        await page.getByRole("heading", { name: "Insights", exact: true }).waitFor();
        await page.locator("canvas").first().waitFor();
        if (variant === "after")
          assert.ok(
            requests.some((r) => r.url().includes("/charts-")),
            "Chart route must load the deferred chunk",
          );
        await page.screenshot({
          path: `/private/tmp/poc-loading-${variant}-insights.png`,
          animations: "disabled",
        });
        await page.goto(server.url + "/?frame=app&app=conversation&page=active-call", {
          waitUntil: "domcontentloaded",
        });
        await page.getByText("Carly Yates", { exact: true }).first().waitFor();
        await page.getByRole("button", { name: "Add callback", exact: true }).waitFor();
        assert.deepEqual(errors, []);
        rows.push({
          variant,
          initialJsBytes: bytes,
          initialJsRequests: initial.length,
          readyMs: Math.round(readyMs),
        });
      } finally {
        await context.close();
        await server.close();
      }
    }
    if (rows.length === 2)
      assert.ok(rows[1].initialJsBytes < rows[0].initialJsBytes, JSON.stringify(rows));
    await writeFile("/private/tmp/poc-trial-load-metrics.json", JSON.stringify(rows, null, 2));
  },
);
test(
  "React Fast Refresh updates without rebuilding or losing component state",
  { skip: !project || !devUrl, timeout: 90000 },
  async (t) => {
    const file = join(project, "src/apps/admin/pages/users.tsx"),
      original = await readFile(file, "utf8");
    const delivery = join(project, "delivery/index.html"),
      before = (await stat(delivery)).mtimeMs;
    const browser = await chromium.launch({ executablePath, headless: true });
    t.after(() => browser.close());
    try {
      await writeFile(
        file,
        `import {useState} from 'react';export default function Page(){const [n,setN]=useState(0);return <main><h1>Fast Refresh before</h1><button onClick={()=>setN(n+1)}>Probe count {n}</button></main>}`,
      );
      const p = await browser.newPage();
      await p.goto(devUrl, { waitUntil: "domcontentloaded" });
      const frame = p.frameLocator("iframe[data-primary-frame]");
      await frame.getByRole("heading", { name: "Fast Refresh before" }).waitFor();
      await frame.getByRole("button", { name: "Probe count 0" }).click();
      await frame.getByRole("button", { name: "Probe count 1" }).waitFor();
      const start = performance.now();
      await writeFile(
        file,
        (await readFile(file, "utf8")).replace("Fast Refresh before", "Fast Refresh after"),
      );
      await frame.getByRole("heading", { name: "Fast Refresh after" }).waitFor();
      await frame.getByRole("button", { name: "Probe count 1" }).waitFor();
      assert.equal((await stat(delivery)).mtimeMs, before);
      await writeFile(
        "/private/tmp/poc-hmr-metrics.json",
        JSON.stringify(
          {
            refreshMs: Math.round(performance.now() - start),
            componentStatePreserved: true,
            deliveryRebuilt: false,
          },
          null,
          2,
        ),
      );
    } finally {
      await writeFile(file, original);
    }
  },
);
