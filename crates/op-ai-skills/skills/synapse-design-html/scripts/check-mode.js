#!/usr/bin/env node
import process from "node:process";
import { loadAmbientEnv, DEFAULT_MODEL } from "./shared.js";

await loadAmbientEnv();

const TRUTHY = new Set(["1", "true", "yes", "on", "y"]);

const rawFlag = String(process.env.ENABLE_GARDEN_IMAGEGEN || "").trim().toLowerCase();
const gardenEnabled = TRUTHY.has(rawFlag);

const apiKey = process.env.OPENAI_API_KEY || "";
const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;

let recommendation;
let mode;
let summary;

if (gardenEnabled && apiKey) {
  mode = "A";
  recommendation = "garden";
  summary =
    "MODE A (Local API): Run scripts/generate.js or scripts/edit.js to generate/edit raster images directly.";
} else if (gardenEnabled && !apiKey) {
  mode = "A?";
  recommendation = "garden-missing-key";
  summary =
    "ENABLE_GARDEN_IMAGEGEN is set, but OPENAI_API_KEY is missing. Fall back to MODE B or MODE C.";
} else {
  mode = "B-or-C";
  recommendation = "host-or-advisor";
  summary =
    "MODE B / C: If the host agent exposes a native image tool (image_generation / image_gen / dalle), use MODE B. Otherwise use MODE C (save rendered prompt to docs/prompts/ and use licensed photos or clean placeholders).";
}

const result = {
  mode,
  recommendation,
  garden_mode_enabled: gardenEnabled,
  has_api_key: Boolean(apiKey),
  base_url: baseUrl,
  model,
  env_flag_value: rawFlag || "(unset)",
  summary,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const pad = (s) => s.padEnd(24, " ");
  console.log("--- synapse-design-html image runtime mode ---");
  console.log(`${pad("mode")}: ${result.mode}`);
  console.log(`${pad("recommendation")}: ${result.recommendation}`);
  console.log(`${pad("garden_mode_enabled")}: ${result.garden_mode_enabled}`);
  console.log(`${pad("has_api_key")}: ${result.has_api_key}`);
  console.log(`${pad("base_url")}: ${result.base_url}`);
  console.log(`${pad("model")}: ${result.model}`);
  console.log(`${pad("env_flag_value")}: ${result.env_flag_value}`);
  console.log("");
  console.log(result.summary);
}
