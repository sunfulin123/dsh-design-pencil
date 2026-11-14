/** Materialize website content from the same sources exported to AI; generated files are not authored. */
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { join, relative, posix } from "node:path";
import { toolkitRoot as root } from "./export.mjs";
import { filesUnder, buildContent } from "./content.mjs";
import { stylesRoot } from "../../design-data/tools/catalog.mjs";
const registry = await buildContent();
const target = join(root, "site/generated");
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
const documents = (await filesUnder(join(root, "reference/content"))).filter(
  (file) => file.endsWith(".md") && !file.includes("/components/extensions/"),
);
const routes = new Map();
for (const file of documents) {
  const path = relative(join(root, "reference/content"), file);
  const slug = path.replace(/\.md$/, "");
  routes.set("/" + posix.dirname(path) + "/", "/reference/" + slug + "/");
  routes.set("/" + slug, "/reference/" + slug + "/");
}
for (const file of documents) {
  if (!file.endsWith(".md") || file.includes("/components/extensions/")) continue;
  const output = join(target, relative(join(root, "reference/content"), file));
  await mkdir(join(output, ".."), { recursive: true });
  const source = await readFile(file, "utf8");
  const text = source.replace(/\]\(([^)]+)\)/g, (original, href) => {
    if (/^(?:[a-z]+:|#|\/assets\/)/i.test(href)) return original;
    const [path, anchor] = href.split("#");
    const normalized = path.startsWith("/")
      ? path
      : "/" +
        posix.normalize(
          posix.join(relative(join(root, "reference/content"), join(file, "..")), path),
        );
    const route = routes.get(normalized.replace(/\.md$/, "")) ?? routes.get(normalized);
    return route ? `](${route}${anchor ? "#" + anchor : ""})` : original;
  });
  await writeFile(output, text);
}
await cp(join(root, "content"), target, { recursive: true });
await mkdir(join(target, "styles"), { recursive: true });
for (const style of registry.styles)
  await writeFile(
    join(target, "styles", style.id.replaceAll(":", "-") + ".md"),
    (await readFile(join(stylesRoot, style.path), "utf8")).replace(
      /^---\r?\n[\s\S]*?\r?\n---\r?\n/,
      "",
    ),
  );
await mkdir(join(root, "site/public"), { recursive: true });
await cp(join(root, "reference/content/assets"), join(root, "site/public/assets"), {
  recursive: true,
});
