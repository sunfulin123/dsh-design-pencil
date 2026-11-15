import { PocStageError } from "./poc-capture-plan.mjs";
export {
  PocStageError,
  normalizeCapturePlan,
  resolveLocalCaptureUrl,
} from "./poc-capture-plan.mjs";
/**
 * Shared single-browser runner for HTML POC screenshots and declarative
 * interactive checks with per-stage timing and total-deadline enforcement.
 */
import { inspectCaptureSurface } from "./poc-surface-inspection.mjs";
import { assertionExpression, runBrowserAction, screenshotRegion } from "./poc-browser-actions.mjs";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export async function loadHeadlessLauncher() {
  const candidate = [
    new URL("../../../chrome-cdp.mjs", import.meta.url),
    new URL("../../../../../packages/dsh-node-runtime/chrome-cdp.mjs", import.meta.url),
  ].find((item) => existsSync(fileURLToPath(item)));
  if (!candidate) {
    throw new PocStageError("The Synapse Chromium renderer module is unavailable", {
      kind: "browser",
      stage: "resolve-renderer",
      elapsedMs: 0,
    });
  }
  const mod = await import(candidate.href);
  return mod.launchHeadlessPage;
}

export async function runPocCapturePlan({
  sessions,
  timeoutMs = 35_000,
  baseDir = process.cwd(),
  inspect = false,
  surfaceScope = "page",
}) {
  const clampedTimeoutMs = Math.max(
    500,
    Math.min(120_000, Math.trunc(Number(timeoutMs) || 35_000)),
  );
  const startedAt = Date.now();
  const deadline = startedAt + clampedTimeoutMs;
  const stages = [];
  let page = null;
  let currentStage = "init";

  const stderrTail = () => (typeof page?.stderrTail === "function" ? page.stderrTail().trim() : "");
  const elapsed = () => Date.now() - startedAt;
  const remaining = (stageName) => {
    const rem = deadline - Date.now();
    if (rem <= 50) {
      throw new PocStageError(
        `Timed out at stage "${stageName}" after ${elapsed()}ms (budget ${clampedTimeoutMs}ms)`,
        {
          kind: "browser",
          stage: stageName,
          elapsedMs: elapsed(),
          stages: [...stages],
          stderrTail: stderrTail(),
        },
      );
    }
    return rem;
  };
  const runStage = async (stageName, fn, errorKind = "browser") => {
    currentStage = stageName;
    const t0 = Date.now();
    try {
      const value = await fn();
      stages.push({ stage: stageName, durationMs: Date.now() - t0, elapsedMs: elapsed() });
      return value;
    } catch (error) {
      stages.push({
        stage: stageName,
        durationMs: Date.now() - t0,
        elapsedMs: elapsed(),
        failed: true,
      });
      if (error instanceof PocStageError) throw error;
      const tail = stderrTail();
      const suffix =
        tail && !String(error?.message || "").includes(tail)
          ? ` (Chrome stderr: ${tail.replace(/\s+/g, " ")})`
          : "";
      throw new PocStageError(
        `Stage "${stageName}" failed after ${elapsed()}ms: ${error?.message || String(error)}${suffix}`,
        {
          kind: errorKind,
          stage: stageName,
          elapsedMs: elapsed(),
          stages: [...stages],
          stderrTail: tail,
          cause: error,
        },
      );
    }
  };

  const launchHeadlessPage = await loadHeadlessLauncher();
  const maxWidth = Math.max(...sessions.map((s) => s.width));
  const maxHeight = Math.max(...sessions.map((s) => s.height));

  try {
    page = await runStage("launch", async () => {
      const instance = await launchHeadlessPage({
        width: maxWidth,
        height: maxHeight,
        timeoutMs: remaining("launch"),
      });
      if (!instance) {
        throw new Error("Chrome or Chromium is unavailable; no screenshot was captured");
      }
      await instance.send("Page.enable", {}, remaining("launch"));
      await instance.send("Runtime.enable", {}, remaining("launch"));
      return instance;
    });

    const screenshots = [];
    const sessionSummaries = [];
    const inspections = [];

    for (const session of sessions) {
      const prefix = `session:${session.name}`;
      // oxlint-disable-next-line no-await-in-loop -- sessions reuse one Chromium page sequentially
      await runStage(`${prefix}:viewport`, async () => {
        await page.send(
          "Emulation.setDeviceMetricsOverride",
          { width: session.width, height: session.height, deviceScaleFactor: 1, mobile: false },
          remaining(`${prefix}:viewport`),
        );
        await page.send(
          "Emulation.setTouchEmulationEnabled",
          { enabled: session.width < 600 },
          remaining(`${prefix}:viewport`),
        );
      });

      await page.send(
        "Emulation.setEmulatedMedia",
        {
          features: session.scheme ? [{ name: "prefers-color-scheme", value: session.scheme }] : [],
        },
        remaining(prefix),
      );
      // oxlint-disable-next-line no-await-in-loop -- sequential session navigation
      await runStage(`${prefix}:navigate`, async () => {
        const nav = await page.send(
          "Page.navigate",
          { url: session.url.href },
          remaining(`${prefix}:navigate`),
        );
        if (nav?.errorText) throw new Error(`POC navigation failed: ${nav.errorText}`);
      });

      // oxlint-disable-next-line no-await-in-loop -- wait for document ready
      await runStage(`${prefix}:ready`, async () => {
        const readyDeadline = Math.min(deadline, Date.now() + 15_000);
        let ready = false;
        let lastEvalErr = null;
        while (Date.now() < readyDeadline) {
          try {
            ready = await page.evaluate(
              "document.readyState === 'complete' && location.href !== 'about:blank'",
              { evalTimeoutMs: Math.min(2000, remaining(`${prefix}:ready`)) },
            );
          } catch (err) {
            lastEvalErr = err;
          }
          if (ready) break;
          await delay(80);
        }
        if (!ready) {
          throw new Error(
            `The POC did not finish loading${lastEvalErr ? ` (${lastEvalErr.message})` : ""}`,
          );
        }
      });

      // oxlint-disable-next-line no-await-in-loop -- wait for web fonts and verify layout width
      await runStage(`${prefix}:fonts`, async () => {
        const fontBudget = Math.min(10_000, remaining(`${prefix}:fonts`));
        await page.evaluate(
          `document.fonts ? Promise.race([document.fonts.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), ${Math.max(100, fontBudget - 100)}))]) : true`,
          { awaitPromise: true, evalTimeoutMs: fontBudget + 500 },
        );
        const innerWidth = await page.evaluate("Math.round(window.innerWidth)", {
          evalTimeoutMs: Math.min(3000, remaining(`${prefix}:fonts`)),
        });
        if (typeof innerWidth === "number" && innerWidth !== session.width) {
          throw new PocStageError(
            `POC layout innerWidth (${innerWidth}px) does not match requested viewport width (${session.width}px)`,
            {
              kind: "assertion",
              stage: `${prefix}:fonts`,
              elapsedMs: elapsed(),
              stages: [...stages],
              stderrTail: stderrTail(),
            },
          );
        }
      });

      for (let i = 0; i < session.steps.length; i += 1) {
        const step = session.steps[i];
        const stepStage = `${prefix}:step:${i + 1}:${step.action}`;
        if (step.action === "screenshot") {
          // oxlint-disable-next-line no-await-in-loop -- sequential step execution
          const shotMeta = await runStage(stepStage, async () => {
            if (inspect) {
              const surface = await inspectCaptureSurface(
                page,
                session,
                remaining(stepStage),
                surfaceScope,
              );
              inspections.push({
                session: session.name,
                width: session.width,
                height: session.height,
                ...surface,
              });
            }
            const clip = await screenshotRegion(page, step, session, remaining(stepStage));
            const result = await page.send(
              "Page.captureScreenshot",
              {
                format: "png",
                captureBeyondViewport: true,
                clip,
              },
              remaining(stepStage),
            );
            const png = Buffer.from(result.data, "base64");
            if (png.length < 24 || png.toString("latin1", 12, 16) !== "IHDR") {
              throw new Error("The browser returned an invalid PNG screenshot");
            }
            const actualWidth = png.readUInt32BE(16);
            const actualHeight = png.readUInt32BE(20);
            if (actualWidth !== clip.width || actualHeight !== clip.height) {
              throw new Error(
                `Captured PNG dimensions (${actualWidth}x${actualHeight}) do not match requested viewport (${session.width}x${session.height})`,
              );
            }
            const outPath = resolve(baseDir, step.out);
            await mkdir(dirname(outPath), { recursive: true });
            await writeFile(outPath, png);
            return {
              path: outPath,
              session: session.name,
              renderer: "Chromium",
              url: session.url.href,
              width: actualWidth,
              height: actualHeight,
              viewportWidth: session.width,
              viewportHeight: session.height,
              fullViewport: !step.frame && !step.selector && !step.clip,
              ...(step.frame ? { frame: step.frame } : {}),
              sha256: createHash("sha256").update(png).digest("hex"),
              capturedAt: new Date().toISOString(),
            };
          });
          screenshots.push(shotMeta);
        } else if (step.action === "waitFor") {
          // oxlint-disable-next-line no-await-in-loop -- sequential waitFor polling
          await runStage(
            stepStage,
            async () => {
              const waitBudget = Math.min(Number(step.timeoutMs) || 5000, remaining(stepStage));
              const waitEnd = Date.now() + waitBudget;
              const checkExpr = assertionExpression({
                action: "assertVisible",
                frame: step.frame,
                selector: step.selector,
                visible: step.visible ?? true,
              });
              let lastError;
              while (Date.now() < waitEnd) {
                try {
                  const res = await page.evaluate(checkExpr, {
                    evalTimeoutMs: Math.min(1500, remaining(stepStage)),
                  });
                  if (res?.ok) return;
                } catch (error) {
                  lastError = error;
                }
                await delay(60);
              }
              throw new PocStageError(
                `waitFor timed out waiting for selector: ${step.selector}${lastError ? ` (${lastError.message})` : ""}`,
                {
                  kind: "assertion",
                  stage: stepStage,
                  elapsedMs: elapsed(),
                  stages: [...stages],
                  stderrTail: stderrTail(),
                },
              );
            },
            "assertion",
          );
        } else {
          const isAssert = step.action.startsWith("assert");
          // oxlint-disable-next-line no-await-in-loop -- sequential DOM interaction/assertion
          await runStage(
            stepStage,
            async () => {
              await runBrowserAction(page, step, Math.min(5000, remaining(stepStage)));
            },
            isAssert ? "assertion" : "browser",
          );
        }
      }
      sessionSummaries.push({
        name: session.name,
        width: session.width,
        height: session.height,
        stepsCompleted: session.steps.length,
      });
    }

    return {
      status: "ok",
      renderer: "Chromium",
      browserLaunches: 1,
      sessions: sessionSummaries,
      screenshots,
      inspections,
      stages,
      totalMs: elapsed(),
    };
  } catch (error) {
    if (error instanceof PocStageError) throw error;
    throw new PocStageError(error?.message || String(error), {
      kind: "browser",
      stage: currentStage,
      elapsedMs: elapsed(),
      stages,
      stderrTail: stderrTail(),
      cause: error,
    });
  } finally {
    if (page) {
      const t0 = Date.now();
      await page.close().catch(() => {});
      stages.push({ stage: "close", durationMs: Date.now() - t0, elapsedMs: elapsed() });
    }
  }
}
