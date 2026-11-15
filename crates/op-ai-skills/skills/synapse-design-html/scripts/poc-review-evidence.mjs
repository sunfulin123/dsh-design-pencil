/** Freeze and validate local review inputs; development output never becomes delivery evidence. */
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { collectEvidenceFiles } from "./verify-source.mjs";
import { checkStyleContext } from "./verify-evidence.mjs";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function snapshotSources(source, out) {
  return collectEvidenceFiles(source, out)
    .sort()
    .map((file) => ({ path: file, sha256: hash(fs.readFileSync(file)) }));
}
export function within(root, file) {
  const rel = path.relative(root, file);
  return !path.isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + path.sep);
}
export function assertSnapshot(source, out, expected) {
  if (JSON.stringify(snapshotSources(source, out)) !== JSON.stringify(expected))
    throw new Error(
      "Source inventory or content changed during review; rerun final capture after finishing edits.",
    );
}
export async function preflightReview(source, out) {
  const errors = checkStyleContext(out);
  if (errors.length) throw new Error(errors.map((item) => item.message).join("\n"));
  const files = collectEvidenceFiles(source, out);
  const manifests = files.filter((file) => path.basename(file) === "cobalt-source.json");
  if (manifests.length) {
    const tool = [
      new URL("./verify-workspace-shell.mjs", import.meta.url),
      new URL(
        "../../../../../packages/talkdesk-cobalt/tools/verify-workspace-shell.mjs",
        import.meta.url,
      ),
    ].find((url) => fs.existsSync(fileURLToPath(url)));
    if (!tool) throw new Error("Canonical Workspace verifier is unavailable");
    const { verifyWorkspaceShell } = await import(tool.href);
    for (const file of manifests) await verifyWorkspaceShell(path.dirname(file));
  }
  return { style: "verified", shells: manifests.length };
}
export function archiveEvidence(out, reason) {
  const file = path.join(out, "evidence-report.json");
  if (!fs.existsSync(file)) return null;
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const dir = path.join(
    out,
    "review/history",
    new Date().toISOString().replaceAll(":", "-") + "-" + randomUUID(),
  );
  fs.mkdirSync(dir, { recursive: true });
  const artifacts = [];
  for (const [i, item] of (report.renderedEvidence ?? []).entries()) {
    if (!item.artifact) continue;
    const original = path.resolve(out, item.artifact);
    if (!fs.existsSync(original)) {
      artifacts.push({ original: item.artifact, status: "missing" });
      continue;
    }
    const real = fs.realpathSync(original);
    if (!within(fs.realpathSync(out), real))
      throw new Error("Prior evidence artifact leaves the report directory");
    const name = `artifact-${i}.png`,
      bytes = fs.readFileSync(real);
    fs.writeFileSync(path.join(dir, name), bytes);
    artifacts.push({
      original: item.artifact,
      file: name,
      sha256: hash(bytes),
      matchesRecordedHash: hash(bytes) === item.sha256,
    });
  }
  fs.writeFileSync(
    path.join(dir, "history.json"),
    JSON.stringify(
      { mode: "history", reason, archivedAt: new Date().toISOString(), report, artifacts },
      null,
      2,
    ) + "\n",
  );
  return path.relative(out, dir);
}
export function readCaptureEvidence(file, { source, out, viewports, scope }) {
  const realOut = fs.realpathSync(out),
    realFile = fs.realpathSync(file);
  if (!within(realOut, realFile))
    throw new Error("Final capture manifest must be inside the review directory");
  const capture = JSON.parse(fs.readFileSync(realFile, "utf8"));
  if (capture.mode !== "final" || capture.version !== 1)
    throw new Error("Only a final review capture can supply delivery evidence");
  if (capture.sourceTarget !== fs.realpathSync(source) || capture.scope !== scope)
    throw new Error("Capture source/scope does not match this verification");
  assertSnapshot(capture.sourceTarget, out, capture.sourceFiles);
  const entry = fs.realpathSync(capture.entry);
  if (
    !within(capture.sourceTarget, entry) ||
    !capture.sourceFiles.some((item) => item.path === entry)
  )
    throw new Error("Capture entry is outside its frozen source inventory");
  if (!Array.isArray(capture.inspections) || !capture.inspections.length)
    throw new Error("Capture lacks live DOM inspections");
  const shots = capture.screenshots ?? [];
  for (const item of shots) {
    const artifact = fs.realpathSync(path.resolve(out, item.path));
    if (!within(realOut, artifact)) throw new Error("Capture artifact leaves its review directory");
    const bytes = fs.readFileSync(artifact);
    if (
      bytes.length < 24 ||
      bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      hash(bytes) !== item.sha256 ||
      bytes.readUInt32BE(16) !== item.width ||
      bytes.readUInt32BE(20) !== item.height
    )
      throw new Error("Captured PNG content or dimensions changed");
  }
  const renderedEvidence = viewports.map((vp) => {
    const item = shots.find(
      (shot) => shot.fullViewport && shot.width === vp.width && shot.height === vp.height,
    );
    if (!item)
      throw new Error(
        `Final capture is missing full viewport ${vp.label}; cropped images cannot replace it`,
      );
    const inspection = capture.inspections.find(
      (value) =>
        value.session === item.session &&
        value.width === vp.width &&
        value.height === vp.height &&
        value.documents >= 1,
    );
    if (!inspection) throw new Error(`Final capture lacks DOM coverage for ${vp.label}`);
    return {
      viewport: vp.label,
      status: "captured",
      artifact: path.relative(out, path.resolve(out, item.path)),
      renderer: "Chromium",
      sha256: item.sha256,
      width: item.width,
      height: item.height,
    };
  });
  return {
    captured: true,
    renderedEvidence,
    domFindings: capture.inspections.flatMap((value) => value.findings),
    stages: capture.stages,
    browserLaunches: 0,
    reusedCapture: path.relative(out, realFile),
  };
}
