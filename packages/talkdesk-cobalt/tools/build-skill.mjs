/** Assemble the backward-compatible local HTML Skill payload from its owning modules. */
import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exportCobalt } from "./export.mjs";
const source = fileURLToPath(
  new URL("../../../crates/op-ai-skills/skills/synapse-design-html/", import.meta.url),
);
const destination = fileURLToPath(
  new URL("../../dsh-node-runtime/skills/synapse-design-html/", import.meta.url),
);
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
await exportCobalt(destination);
console.log("Built HTML Skill with local Cobalt module resources");
