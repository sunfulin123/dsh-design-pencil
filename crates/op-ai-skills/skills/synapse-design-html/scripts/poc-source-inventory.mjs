/** Authored lint scope and complete frozen POC input inventory have different ownership rules. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

function isPocTaskOutputDir(dir) {
  return ["style-context.json", "evidence-report.json", "DESIGN.md"].some((marker) =>
    fs.existsSync(path.join(dir, marker)),
  );
}

function taskArtifactDirs(targetRoot, outDir) {
  const bases = [];
  if (outDir) bases.push(path.resolve(outDir));
  else if (targetRoot && isPocTaskOutputDir(targetRoot)) bases.push(targetRoot);
  return new Set(
    bases.flatMap((base) => {
      const aliases = fs.existsSync(base) ? [base, fs.realpathSync(base)] : [base];
      return aliases.flatMap((root) => [path.join(root, "review"), path.join(root, "shots")]);
    }),
  );
}

/** Verified project-copy shell files are hashed inputs, not editable business-style lint targets. */
function protectedSources(dir) {
  const file = path.join(dir, "cobalt-source.json");
  if (!fs.existsSync(file)) return [];
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  if (manifest.adapterVersion !== 7 || !manifest.protectedFiles) return [];
  return Object.entries(manifest.protectedFiles).map(([name, hash]) => {
    if (
      !/^(src\/(main\.tsx|workspace-shell\/.+|prototype-runtime\/.+)|tools\/verify-workspace-shell\.mjs)$/.test(
        name,
      ) ||
      name.split("/").some((part) => part === ".." || part === ".") ||
      name.includes("\\")
    )
      throw new Error("Invalid protected source path");
    const target = path.join(dir, name);
    const actual = createHash("sha256").update(fs.readFileSync(target)).digest("hex");
    if (actual !== hash) throw new Error(`Protected Workspace source changed: ${name}`);
    return target;
  });
}

export function collectSourceFiles(target, outDir = null) {
  if (!target || !fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [path.resolve(target)];
  const resolvedTarget = path.resolve(target);
  const exts = new Set([
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".vue",
    ".svelte",
    ".astro",
  ]);
  const ignoreDirs = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "delivery",
    "__pycache__",
    ".synapse",
    ".synapse-review",
    ".impeccable",
    ".taste-skill",
  ]);
  const excludedArtifactDirs = taskArtifactDirs(resolvedTarget, outDir);
  const results = [];
  const protectedFiles = new Set();
  function walk(dir) {
    for (const file of protectedSources(dir)) protectedFiles.add(file);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignoreDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (excludedArtifactDirs.has(full)) continue;
        walk(full);
      } else if (exts.has(path.extname(entry.name).toLowerCase())) {
        if (!protectedFiles.has(full)) results.push(full);
      }
    }
  }
  walk(resolvedTarget);
  return results;
}

/** Fingerprint all task source assets while excluding this verifier's outputs. */
export function collectEvidenceFiles(target, outDir) {
  if (!target || !fs.existsSync(target)) return [];
  const output = path.resolve(outDir);
  const outputAliases = new Set([
    output,
    ...(fs.existsSync(output) ? [fs.realpathSync(output)] : []),
  ]);
  const ignored = new Set(["node_modules", ".git", ".next", "dist", "build", "__pycache__"]);
  const excluded = new Set(["evidence-report.json", "style-context.json", "baseline.json"]);
  const excludedArtifactDirs = taskArtifactDirs(path.resolve(target), output);
  const files = [];
  function visit(current) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Cannot fingerprint a symbolic link: ${current}`);
    if (stat.isDirectory()) {
      if (ignored.has(path.basename(current)) || excludedArtifactDirs.has(current)) return;
      for (const entry of fs.readdirSync(current).sort()) visit(path.join(current, entry));
    } else if (
      stat.isFile() &&
      !(outputAliases.has(path.dirname(current)) && excluded.has(path.basename(current)))
    ) {
      if (stat.size > 32 * 1024 * 1024 || files.length >= 5000)
        throw new Error("POC evidence exceeds the supported file budget");
      files.push(current);
    }
  }
  if (fs.lstatSync(target).isSymbolicLink())
    throw new Error(`Cannot fingerprint a symbolic link: ${target}`);
  visit(path.resolve(target));
  return files;
}
