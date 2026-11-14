/** Discover all style folders; generated manifests are never authoring inputs. */
import { readdir, readFile, lstat, mkdir, writeFile, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export const stylesRoot = fileURLToPath(new URL("../styles/", import.meta.url));
export async function discoverStyles(root = stylesRoot) {
  const entries = [];
  for (const dir of await readdir(root, { withFileTypes: true })) {
    if (dir.name === '.DS_Store') continue;
    if (!dir.isDirectory()) throw new Error(`Unexpected style entry: ${dir.name}`);
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(dir.name))
      throw new Error(`Invalid style folder: ${dir.name}`);
    const path = join(root, dir.name, "DESIGN.md");
    if (!(await lstat(path)).isFile()) throw new Error(`Expected regular DESIGN.md: ${path}`);
    const raw = await readFile(path);
    if (raw.length > 512 * 1024 || raw.includes(0) || raw.toString("utf8").trim().length < 8)
      throw new Error(`Invalid DESIGN.md: ${path}`);
    new TextDecoder("utf-8", { fatal: true }).decode(raw);
    let metadata = {};
    try {
      const metadataPath = join(root, dir.name, "style.json");
      if (!(await lstat(metadataPath)).isFile())
        throw new Error(`Expected regular style.json: ${metadataPath}`);
      metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      if (!metadata || Array.isArray(metadata) || typeof metadata !== "object")
        throw new Error(`Invalid style metadata: ${metadataPath}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (
      metadata.category !== undefined &&
      (typeof metadata.category !== "string" || !metadata.category.trim())
    )
      throw new Error("Style category must be a nonempty string");
    const id = metadata.id ?? dir.name;
    if (
      typeof id !== "string" ||
      !/^[a-z0-9][a-z0-9:.-]*$/.test(id) ||
      entries.some((entry) => entry.id === id)
    )
      throw new Error(`Invalid or duplicate style id: ${id}`);
    entries.push({
      id,
      path: `${dir.name}/DESIGN.md`,
      category: metadata.category ?? "uncategorized",
      sha256: createHash("sha256").update(raw).digest("hex"),
    });
  }
  return entries.toSorted(
    (a, b) =>
      Number(b.id === "talkdesk-cobalt") - Number(a.id === "talkdesk-cobalt") ||
      a.id.localeCompare(b.id),
  );
}
export async function exportStyles(out, root = stylesRoot) {
  const entries = await discoverStyles(root);
  await mkdir(out, { recursive: true });
  for (const entry of entries) {
    await mkdir(dirname(join(out, entry.path)), { recursive: true });
    await cp(join(root, entry.path), join(out, entry.path));
  }
  await writeFile(join(out, "manifest.json"), JSON.stringify(entries, null, 2) + "\n");
  return entries;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) throw new Error("Usage: catalog.mjs <output-directory>");
  console.log((await exportStyles(resolve(out))).length);
}
