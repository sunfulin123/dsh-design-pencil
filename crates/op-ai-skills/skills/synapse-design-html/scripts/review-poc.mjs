#!/usr/bin/env node
/** Fast local-server review and a frozen static-delivery capture using the same browser pipeline. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { normalizeCapturePlan, runPocCapturePlan } from "./poc-browser-runner.mjs";
import { startStaticServer } from "./poc-preview-server.mjs";
import {
  preflightReview,
  snapshotSources,
  assertSnapshot,
  within,
  archiveEvidence,
} from "./poc-review-evidence.mjs";
import { collectSourceFiles, inferSurfaceScope } from "./verify-source.mjs";
const usage =
  "review-poc.mjs dev|final --source <task-directory> --out <task-directory> [--url <local-dev-url> | --entry <static-html>] [--project <pnpm-project>] [--steps <plan.json>] [--sessions main,dialog,drawer] [--viewports 1440,390] [--scheme light|dark] [--scope app|page]";
const scripts = path.dirname(fileURLToPath(import.meta.url));
function parse(argv) {
  const [mode, ...args] = argv;
  if (mode === "--help") return { help: true };
  if (!["dev", "final"].includes(mode)) throw new Error(usage);
  const options = { mode };
  const flags = [
    "source",
    "out",
    "url",
    "entry",
    "project",
    "steps",
    "sessions",
    "viewports",
    "scheme",
    "scope",
    "timeout-ms",
  ];
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].slice(2);
    if (
      !args[i].startsWith("--") ||
      !flags.includes(key) ||
      !args[i + 1] ||
      options[key] !== undefined
    )
      throw new Error(usage);
    options[key] = args[i + 1];
  }
  if (!options.source || !options.out) throw new Error(usage);
  if (options.scheme && !["light", "dark"].includes(options.scheme))
    throw new Error("scheme must be light or dark");
  if (mode === "dev" && (!options.url || options.entry))
    throw new Error("Development review requires a running local-server --url");
  if (
    mode === "final" &&
    (options.url || (!options.entry && !options.project) || options.sessions || options.viewports)
  )
    throw new Error(
      "Final review requires static --entry or --project, and always covers the full required viewport set",
    );
  return options;
}
function command(program, args, cwd, timeout = 120000) {
  const start = performance.now();
  const result = spawnSync(program, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${program} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr?.slice(-3000) ?? result.stdout?.slice(-3000)}`,
    );
  return { elapsedMs: performance.now() - start };
}
function capturePlan(options, baseUrl, runDir, out, businessUrl = baseUrl) {
  const raw = options.steps
    ? JSON.parse(fs.readFileSync(path.resolve(options.steps), "utf8"))
    : { sessions: [] };
  if (!Array.isArray(raw.sessions)) throw new Error("Review steps must contain sessions");
  let sessions = raw.sessions;
  if (options.mode === "dev") {
    const names = options.sessions?.split(",");
    if (names?.some((name) => !sessions.some((item) => item.name === name)))
      throw new Error("Selected review session was not found");
    sessions = names ? sessions.filter((item) => names.includes(item.name)) : sessions.slice(0, 3);
    if (options.viewports) {
      const widths = options.viewports.split(",").map(Number);
      if (widths.some((width) => !Number.isInteger(width) || width < 200 || width > 4096))
        throw new Error("Invalid review viewport");
      sessions = sessions.length
        ? sessions.flatMap((item) =>
            widths.map((width) => ({
              ...item,
              name: `${item.name}-${width}`,
              width,
              height: width < 600 ? 844 : 900,
            })),
          )
        : widths.map((width) => ({
            name: `main-${width}`,
            width,
            height: width < 600 ? 844 : 900,
            steps: [],
          }));
    }
    if (!sessions.length)
      sessions = [
        { name: "main-desktop", width: 1440, height: 900, steps: [] },
        { name: "main-phone", width: 390, height: 844, steps: [] },
      ];
  } else {
    if (raw.sessions.length > 13)
      throw new Error(
        "Final review supports at most 13 custom sessions plus required viewport captures",
      );
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 900],
    ]) {
      if (
        !sessions.some(
          (item) =>
            item.width === width &&
            item.height === height &&
            item.steps?.some(
              (step) => step.action === "screenshot" && !step.frame && !step.selector && !step.clip,
            ),
        )
      )
        sessions = [
          {
            name: `surface-${width}`,
            url: new URL(businessUrl).pathname + new URL(businessUrl).search,
            width,
            height,
            steps: [],
          },
          ...sessions,
        ];
    }
  }
  let shot = 0;
  sessions = sessions.map((session) => {
    let url = baseUrl;
    if (session.url) {
      if (options.mode === "final" && /^[a-z][a-z\d+.-]*:/i.test(session.url))
        throw new Error(
          "Final sessions must use paths/query strings within static delivery, not an absolute dev URL",
        );
      url = new URL(session.url, baseUrl).href;
    }
    const steps = [...(session.steps ?? [])];
    if (!steps.some((step) => step.action === "screenshot"))
      steps.push({ action: "screenshot", out: "surface.png" });
    return {
      ...session,
      url,
      scheme: options.scheme ?? session.scheme,
      steps: steps.map((step) => {
        if (step.action !== "screenshot") return step;
        const name = path
          .basename(String(step.out ?? "surface.png"))
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        return { ...step, out: path.relative(out, path.join(runDir, `${++shot}-${name}`)) };
      }),
    };
  });
  return normalizeCapturePlan(
    { sessions, timeoutMs: Number(options["timeout-ms"] ?? raw.timeoutMs ?? 60000) },
    baseUrl,
  );
}
async function review(options) {
  const startedAt = performance.now(),
    source = fs.realpathSync(path.resolve(options.source));
  fs.mkdirSync(path.resolve(options.out), { recursive: true });
  const out = fs.realpathSync(path.resolve(options.out));
  if (!fs.statSync(source).isDirectory())
    throw new Error("--source must be the complete task directory");
  let entry = options.entry
    ? fs.existsSync(options.entry)
      ? fs.realpathSync(options.entry)
      : path.resolve(options.entry)
    : null;
  const project = options.project ? fs.realpathSync(path.resolve(options.project)) : null;
  if (project && !within(source, project))
    throw new Error("Project must be inside the task source directory");
  if (entry && (!within(source, entry) || !entry.endsWith(".html")))
    throw new Error("Static entry must be an HTML file inside the task directory");
  if (
    project &&
    options.mode === "final" &&
    entry &&
    entry !== path.join(project, "delivery/index.html")
  )
    throw new Error("Project review must capture its delivery/index.html");
  const preflight = await preflightReview(source, out);
  if (options.mode === "final" && fs.existsSync(path.join(out, "evidence-report.json"))) {
    const prior = JSON.parse(fs.readFileSync(path.join(out, "evidence-report.json"), "utf8"));
    const history = archiveEvidence(
      out,
      "A new final review started; the previous record remains historical.",
    );
    fs.writeFileSync(
      path.join(out, "evidence-report.json"),
      JSON.stringify(
        {
          ...prior,
          mode: "pending",
          priorReview: history,
          pendingReason: "Final review is in progress; do not hand off this record.",
        },
        null,
        2,
      ) + "\n",
    );
  }
  let builds = 0,
    buildMs = 0;
  if (project) {
    if (options.mode === "final") {
      buildMs = command("pnpm", ["run", "build"], project).elapsedMs;
      builds = 1;
      const delivery = path.join(project, "delivery/index.html");
      if (entry && entry !== delivery)
        throw new Error("Project review must capture its delivery/index.html");
      entry = delivery;
    }
  }
  if (entry) {
    entry = fs.realpathSync(entry);
    if (!within(source, entry) || !entry.endsWith(".html"))
      throw new Error("Static entry must be an HTML file inside the task directory");
  }
  const files = snapshotSources(source, out),
    scope = inferSurfaceScope(collectSourceFiles(source, out), out, options.scope);
  const id = new Date().toISOString().replaceAll(":", "-") + "-" + randomUUID();
  const runDir = path.join(out, "review", options.mode, id);
  fs.mkdirSync(runDir, { recursive: true });
  let server;
  try {
    let url = options.url;
    if (options.mode === "final") {
      server = await startStaticServer(path.dirname(entry), path.basename(entry));
      url = new URL(encodeURIComponent(path.basename(entry)), server.url).href;
    }
    let businessUrl = url;
    if (options.mode === "final") {
      const html = fs.readFileSync(entry, "utf8");
      const config = html.match(
        /<script\b[^>]*id=["']prototype-review-config["'][^>]*>([\s\S]*?)<\/script>/i,
      );
      if (config) {
        const value = JSON.parse(config[1]);
        const target = new URL(value.entry, url);
        const file = fs.realpathSync(
          path.resolve(path.dirname(entry), decodeURIComponent(target.pathname.slice(1))),
        );
        if (!within(path.dirname(entry), file) || target.origin !== new URL(url).origin)
          throw new Error("Ordinary business entry leaves static delivery");
        businessUrl = target.href;
      }
    }
    const plan = capturePlan(options, url, runDir, out, businessUrl);
    const capture = await runPocCapturePlan({
      ...plan,
      baseDir: out,
      inspect: true,
      surfaceScope: scope,
    });
    assertSnapshot(source, out, files);
    const findings = capture.inspections.flatMap((item) => item.findings);
    const result = {
      version: 1,
      mode: options.mode,
      sourceTarget: source,
      sourceFiles: files,
      entry,
      scope,
      preflight,
      builds,
      buildMs,
      ...capture,
      screenshots: capture.screenshots.map((item) => ({
        ...item,
        path: path.relative(out, item.path),
      })),
      elapsedMs: performance.now() - startedAt,
    };
    const captureFile = path.join(runDir, "capture.json");
    fs.writeFileSync(captureFile, JSON.stringify(result, null, 2) + "\n");
    if (options.mode === "dev") {
      const report = {
        ...result,
        status: findings.some((item) => ["P0", "P1"].includes(item.severity)) ? "fail" : "checked",
        handoffEligible: false,
        findings,
      };
      fs.writeFileSync(
        path.join(out, "review/dev-report.json"),
        JSON.stringify(report, null, 2) + "\n",
      );
      console.log(
        JSON.stringify({
          mode: "dev",
          status: report.status,
          builds,
          browserLaunches: capture.browserLaunches,
          screenshots: capture.screenshots.length,
          elapsedMs: result.elapsedMs,
          report: path.join(out, "review/dev-report.json"),
        }),
      );
      return report.status === "fail" ? 1 : 0;
    }
    const verified = spawnSync(
      process.execPath,
      [
        path.join(scripts, "verify-surface.mjs"),
        "--source",
        source,
        "--out",
        out,
        "--scope",
        scope,
        "--capture",
        captureFile,
      ],
      { cwd: source, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024 },
    );
    if (verified.error) throw verified.error;
    const ledger = path.join(out, "evidence-report.json");
    fs.writeFileSync(
      path.join(runDir, "verification.txt"),
      (verified.stdout ?? "") + (verified.stderr ?? ""),
    );
    if (
      !fs.existsSync(ledger) ||
      JSON.parse(fs.readFileSync(ledger, "utf8")).capture?.reused !==
        path.relative(out, captureFile)
    )
      throw new Error(
        verified.stderr ||
          verified.stdout ||
          "Final verification failed before publishing a current ledger",
      );
    fs.copyFileSync(ledger, path.join(runDir, "report-snapshot.json"));
    console.log(
      JSON.stringify({
        mode: "final",
        status: verified.status === 0 ? "verified" : "needs-review",
        builds,
        buildMs,
        browserLaunches: 1,
        screenshots: capture.screenshots.length,
        elapsedMs: performance.now() - startedAt,
        report: ledger,
        capture: captureFile,
        diagnostics: path.join(runDir, "verification.txt"),
      }),
    );
    return verified.status ?? 1;
  } finally {
    if (server) await new Promise((resolve) => server.server.close(resolve));
  }
}
try {
  const options = parse(process.argv.slice(2));
  if (options.help) console.log(usage);
  else process.exitCode = await review(options);
} catch (error) {
  console.error(`REVIEW: ERROR — ${error.stage ? error.stage + ": " : ""}${error.message}`);
  process.exitCode = 1;
}
