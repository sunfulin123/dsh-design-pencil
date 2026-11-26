/** Temporary review output lives outside the task directory; only the current final run stays beside its ledger. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { archiveEvidence } from "../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-review-evidence.mjs";

const scripts = fileURLToPath(new URL("../../crates/op-ai-skills/skills/synapse-design-html/scripts/", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function workspace(t) {
  // The review CLI reports canonical paths (macOS temp is /private/var), so the fixture uses them too.
  const root = await realpath(await mkdtemp(join(tmpdir(), "poc-review-temp-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  const task = join(root, ".synapse/html-design/artifacts/service-0123456789ab");
  const temp = join(root, ".synapse/html-design/temp/service-0123456789ab");
  await mkdir(task, { recursive: true });
  const guide = "# Local test style\nReadable text, plain surfaces.\n";
  await writeFile(join(task, "DESIGN.md"), guide);
  await writeFile(join(task, "style-context.json"), JSON.stringify({
    schemaVersion: 1, styleId: "test-style", contentHash: sha256(guide), guidePath: "DESIGN.md",
  }));
  await writeFile(join(task, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Service review</title><style>body{margin:0;font:16px system-ui}main{padding:24px}</style></head><body><main><h1>Service requests</h1><p>Review pending customer requests.</p></main></body></html>');
  return { root, task, temp };
}

const review = (args) => spawnSync(process.execPath, [join(scripts, "review-poc.mjs"), ...args], { encoding: "utf8", timeout: 110000 });
/** Asynchronous run, required while this process serves the page the review opens. */
const reviewAsync = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [join(scripts, "review-poc.mjs"), ...args]);
  let stdout = "", stderr = "";
  child.stdout.on("data", (value) => (stdout += value));
  child.stderr.on("data", (value) => (stderr += value));
  const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Review run timed out")); }, 110000);
  child.on("error", (error) => { clearTimeout(timer); reject(error); });
  child.on("close", (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
});

test("a temporary directory inside the task directory is refused", async (t) => {
  const { task } = await workspace(t);
  const result = review(["final", "--source", task, "--out", task, "--entry", join(task, "index.html"), "--temp", join(task, "temp")]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--temp must be outside the task directory/);
  assert.equal(existsSync(join(task, "temp")), false);
});

test("archiving copies the ledger and its images to a history root outside the report directory", async (t) => {
  const { task, temp } = await workspace(t);
  const image = Buffer.from("89504e470d0a1a0a", "hex");
  await mkdir(join(task, "evidence/run-a"), { recursive: true });
  await writeFile(join(task, "evidence/run-a/shot.png"), image);
  await writeFile(join(task, "evidence-report.json"), JSON.stringify({
    renderedEvidence: [{ artifact: "evidence/run-a/shot.png", sha256: sha256(image) }],
  }));
  const history = archiveEvidence(task, "fixture", join(temp, "review/history"));
  assert.ok(history.startsWith(join(temp, "review/history")), history);
  assert.deepEqual((await readdir(history)).toSorted(), ["artifact-0.png", "history.json"]);
  const record = JSON.parse(await readFile(join(history, "history.json"), "utf8"));
  assert.equal(record.artifacts[0].matchesRecordedHash, true);
  assert.equal(existsSync(join(task, "review")), false, "nothing is written under the report directory");
  assert.equal(archiveEvidence(task, "default").startsWith("review/history/"), true, "the default stays relative and inside");
});

test(
  "with --temp, development and history output stay outside the task and only the latest final run remains",
  { skip: process.env.DSH_E2E_CHROME !== "1", timeout: 360000 },
  async (t) => {
    const { task, temp } = await workspace(t);
    const { startStaticServer } = await import("../../crates/op-ai-skills/skills/synapse-design-html/scripts/poc-preview-server.mjs");
    const server = await startStaticServer(task, "index.html");
    t.after(() => new Promise((resolve) => server.server.close(resolve)));
    const dev = await reviewAsync(["dev", "--source", task, "--out", task, "--temp", temp, "--url", server.url]);
    assert.notEqual(dev.status, null, dev.stderr);
    assert.ok(existsSync(join(temp, "review/dev-report.json")), dev.stderr);
    assert.equal(existsSync(join(task, "review")), false, "development output is not in the task directory");

    const finalArgs = ["final", "--source", task, "--out", task, "--temp", temp, "--entry", join(task, "index.html")];
    const first = await reviewAsync(finalArgs);
    assert.ok(first.stdout, first.stderr);
    const firstSummary = JSON.parse(first.stdout);
    assert.ok(firstSummary.capture.startsWith(join(task, "evidence")), first.stderr);
    const ledger = JSON.parse(await readFile(join(task, "evidence-report.json"), "utf8"));
    for (const item of ledger.renderedEvidence) assert.ok(item.artifact.startsWith("evidence/"), item.artifact);

    const second = await reviewAsync(finalArgs);
    const secondSummary = JSON.parse(second.stdout);
    assert.ok(second.stdout, second.stderr);
    assert.deepEqual(await readdir(join(task, "evidence")), [secondSummary.capture.split("/").at(-2)],
      "a published ledger keeps only its own final run");
    assert.ok((await readdir(join(temp, "review/history"))).length >= 1, "the replaced ledger is archived in temp");
    assert.equal(existsSync(join(task, "review")), false);
  },
);
