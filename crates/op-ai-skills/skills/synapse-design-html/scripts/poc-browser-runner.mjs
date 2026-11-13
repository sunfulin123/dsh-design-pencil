/**
 * Shared single-browser runner for HTML POC screenshots and declarative
 * interactive checks with per-stage timing and total-deadline enforcement.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ALLOWED_ACTIONS = new Set([
  'click',
  'fill',
  'select',
  'submit',
  'focus',
  'press',
  'waitFor',
  'assertText',
  'assertVisible',
  'assertCount',
  'screenshot',
]);

export class PocStageError extends Error {
  constructor(message, { kind = 'browser', stage, elapsedMs, stages = [], stderrTail = '', cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'PocStageError';
    this.kind = kind;
    this.stage = stage;
    this.elapsedMs = elapsedMs;
    this.stages = stages;
    this.stderrTail = stderrTail;
  }

  toDiagnostics() {
    return {
      kind: this.kind,
      failedStage: this.stage,
      elapsedMs: this.elapsedMs,
      stages: this.stages,
      ...(this.stderrTail ? { stderrTail: this.stderrTail } : {}),
      error: this.message,
    };
  }
}

export async function loadHeadlessLauncher() {
  const candidate = [
    new URL('../../../chrome-cdp.mjs', import.meta.url),
    new URL('../../../../../packages/dsh-node-runtime/chrome-cdp.mjs', import.meta.url),
  ].find((item) => existsSync(fileURLToPath(item)));
  if (!candidate) {
    throw new PocStageError('The Synapse Chromium renderer module is unavailable', {
      kind: 'browser',
      stage: 'resolve-renderer',
      elapsedMs: 0,
    });
  }
  const mod = await import(candidate.href);
  return mod.launchHeadlessPage;
}

export function resolveLocalCaptureUrl(source) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new PocStageError('A local HTML file or localhost URL is required', {
      kind: 'validation',
      stage: 'validate-args',
      elapsedMs: 0,
    });
  }
  if (/^https?:/i.test(source)) {
    const parsed = new URL(source);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
      throw new PocStageError('Only local POC servers (localhost / 127.0.0.1 / [::1]) may be captured', {
        kind: 'validation',
        stage: 'validate-args',
        elapsedMs: 0,
      });
    }
    return parsed;
  }
  return pathToFileURL(resolve(source));
}

function validateDimension(value, label) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 200 || num > 4096) {
    throw new PocStageError(`${label} must be an integer between 200 and 4096 pixels`, {
      kind: 'validation',
      stage: 'validate-args',
      elapsedMs: 0,
    });
  }
  return num;
}

function validateStep(step, sessionName, index) {
  if (!step || typeof step !== 'object' || Array.isArray(step) || !ALLOWED_ACTIONS.has(step.action)) {
    throw new PocStageError(
      `Invalid step #${index + 1} in session "${sessionName}": action must be one of ${[...ALLOWED_ACTIONS].join(', ')}`,
      { kind: 'validation', stage: 'validate-steps', elapsedMs: 0 },
    );
  }
  if (step.action === 'screenshot') {
    if (typeof step.out !== 'string' || !step.out.trim() || !/\.png$/i.test(step.out.trim())) {
      throw new PocStageError(`Screenshot step #${index + 1} in "${sessionName}" requires a .png "out" path`, {
        kind: 'validation',
        stage: 'validate-steps',
        elapsedMs: 0,
      });
    }
    return { action: 'screenshot', out: step.out.trim() };
  }
  if (step.action !== 'press' && (typeof step.selector !== 'string' || !step.selector.trim())) {
    throw new PocStageError(`Step #${index + 1} (${step.action}) in "${sessionName}" requires a non-empty CSS selector`, {
      kind: 'validation',
      stage: 'validate-steps',
      elapsedMs: 0,
    });
  }
  return step;
}

export function normalizeCapturePlan(rawPlan, fallbackUrl) {
  if (!rawPlan || typeof rawPlan !== 'object' || Array.isArray(rawPlan)) {
    throw new PocStageError('Steps plan must be a JSON object with a non-empty "sessions" array', {
      kind: 'validation',
      stage: 'validate-steps',
      elapsedMs: 0,
    });
  }
  const rawSessions = Array.isArray(rawPlan.sessions) ? rawPlan.sessions : [];
  if (rawSessions.length === 0 || rawSessions.length > 16) {
    throw new PocStageError('Steps plan must contain 1 to 16 viewport sessions', {
      kind: 'validation',
      stage: 'validate-steps',
      elapsedMs: 0,
    });
  }
  const sessions = rawSessions.map((session, sIdx) => {
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      throw new PocStageError(`Session #${sIdx + 1} must be an object`, {
        kind: 'validation',
        stage: 'validate-steps',
        elapsedMs: 0,
      });
    }
    const width = validateDimension(session.width ?? 1440, `Session #${sIdx + 1} width`);
    const height = validateDimension(session.height ?? 900, `Session #${sIdx + 1} height`);
    const name = typeof session.name === 'string' && session.name.trim() ? session.name.trim() : `${width}x${height}`;
    const url = session.url ? resolveLocalCaptureUrl(session.url) : resolveLocalCaptureUrl(fallbackUrl);
    const rawSteps = Array.isArray(session.steps) ? session.steps : [];
    if (rawSteps.length > 64) {
      throw new PocStageError(`Session "${name}" exceeds the 64-step limit`, {
        kind: 'validation',
        stage: 'validate-steps',
        elapsedMs: 0,
      });
    }
    return {
      name,
      width,
      height,
      url,
      steps: rawSteps.map((st, idx) => validateStep(st, name, idx)),
    };
  });
  return {
    timeoutMs: rawPlan.timeoutMs === undefined ? undefined : Number(rawPlan.timeoutMs),
    sessions,
  };
}

function buildDomStepExpression(step) {
  const payload = JSON.stringify(step);
  return `(() => {
    const step = ${payload};
    const isVisible = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const requireEl = () => {
      const el = document.querySelector(step.selector);
      if (!el) return { ok: false, error: 'Selector not found: ' + step.selector };
      return { ok: true, el };
    };
    if (step.action === 'click') {
      const found = requireEl();
      if (!found.ok) return found;
      found.el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      found.el.click();
      return { ok: true };
    }
    if (step.action === 'focus') {
      const found = requireEl();
      if (!found.ok) return found;
      found.el.focus();
      return { ok: true };
    }
    if (step.action === 'fill') {
      const found = requireEl();
      if (!found.ok) return found;
      found.el.focus();
      const val = String(step.value ?? '');
      if ('value' in found.el) found.el.value = val;
      else found.el.textContent = val;
      found.el.dispatchEvent(new Event('input', { bubbles: true }));
      found.el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }
    if (step.action === 'select') {
      const found = requireEl();
      if (!found.ok) return found;
      found.el.value = String(step.value ?? '');
      found.el.dispatchEvent(new Event('input', { bubbles: true }));
      found.el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }
    if (step.action === 'submit') {
      const found = requireEl();
      if (!found.ok) return found;
      if (typeof found.el.requestSubmit === 'function') found.el.requestSubmit();
      else found.el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return { ok: true };
    }
    if (step.action === 'press') {
      const target = step.selector ? document.querySelector(step.selector) : (document.activeElement || document.body);
      if (!target) return { ok: false, error: 'Selector not found: ' + step.selector };
      target.focus?.();
      const key = String(step.key ?? 'Enter');
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
      return { ok: true };
    }
    if (step.action === 'assertText') {
      const els = [...document.querySelectorAll(step.selector)];
      if (els.length === 0) return { ok: false, error: 'assertText selector matched 0 elements: ' + step.selector };
      const text = els.map((e) => (e.innerText ?? e.textContent ?? '').trim()).join('\\n').trim();
      if (step.equals !== undefined && text !== String(step.equals)) {
        return { ok: false, error: 'assertText(' + step.selector + ') expected ' + JSON.stringify(String(step.equals)) + ', got ' + JSON.stringify(text.slice(0, 160)) };
      }
      if (step.includes !== undefined && !text.includes(String(step.includes))) {
        return { ok: false, error: 'assertText(' + step.selector + ') expected to include ' + JSON.stringify(String(step.includes)) + ', got ' + JSON.stringify(text.slice(0, 160)) };
      }
      return { ok: true, value: text };
    }
    if (step.action === 'assertVisible') {
      const el = document.querySelector(step.selector);
      const expected = step.visible !== false;
      const actual = isVisible(el);
      if (actual !== expected) {
        return { ok: false, error: 'assertVisible(' + step.selector + ') expected visible=' + expected + ', got ' + actual };
      }
      return { ok: true };
    }
    if (step.action === 'assertCount') {
      const count = document.querySelectorAll(step.selector).length;
      if (step.equals !== undefined && count !== Number(step.equals)) {
        return { ok: false, error: 'assertCount(' + step.selector + ') expected ' + step.equals + ', got ' + count };
      }
      if (step.min !== undefined && count < Number(step.min)) {
        return { ok: false, error: 'assertCount(' + step.selector + ') expected >= ' + step.min + ', got ' + count };
      }
      if (step.max !== undefined && count > Number(step.max)) {
        return { ok: false, error: 'assertCount(' + step.selector + ') expected <= ' + step.max + ', got ' + count };
      }
      return { ok: true, count };
    }
    return { ok: false, error: 'Unsupported action: ' + step.action };
  })()`;
}

export async function runPocCapturePlan({ sessions, timeoutMs = 35_000, baseDir = process.cwd() }) {
  const clampedTimeoutMs = Math.max(500, Math.min(120_000, Math.trunc(Number(timeoutMs) || 35_000)));
  const startedAt = Date.now();
  const deadline = startedAt + clampedTimeoutMs;
  const stages = [];
  let page = null;
  let currentStage = 'init';

  const stderrTail = () => (typeof page?.stderrTail === 'function' ? page.stderrTail().trim() : '');
  const elapsed = () => Date.now() - startedAt;
  const remaining = (stageName) => {
    const rem = deadline - Date.now();
    if (rem <= 50) {
      throw new PocStageError(
        `Timed out at stage "${stageName}" after ${elapsed()}ms (budget ${clampedTimeoutMs}ms)`,
        { kind: 'browser', stage: stageName, elapsedMs: elapsed(), stages: [...stages], stderrTail: stderrTail() },
      );
    }
    return rem;
  };
  const runStage = async (stageName, fn, errorKind = 'browser') => {
    currentStage = stageName;
    const t0 = Date.now();
    try {
      const value = await fn();
      stages.push({ stage: stageName, durationMs: Date.now() - t0, elapsedMs: elapsed() });
      return value;
    } catch (error) {
      stages.push({ stage: stageName, durationMs: Date.now() - t0, elapsedMs: elapsed(), failed: true });
      if (error instanceof PocStageError) throw error;
      const tail = stderrTail();
      const suffix = tail && !String(error?.message || '').includes(tail) ? ` (Chrome stderr: ${tail.replace(/\s+/g, ' ')})` : '';
      throw new PocStageError(
        `Stage "${stageName}" failed after ${elapsed()}ms: ${error?.message || String(error)}${suffix}`,
        { kind: errorKind, stage: stageName, elapsedMs: elapsed(), stages: [...stages], stderrTail: tail, cause: error },
      );
    }
  };

  const launchHeadlessPage = await loadHeadlessLauncher();
  const maxWidth = Math.max(...sessions.map((s) => s.width));
  const maxHeight = Math.max(...sessions.map((s) => s.height));

  try {
    page = await runStage('launch', async () => {
      const instance = await launchHeadlessPage({
        width: maxWidth,
        height: maxHeight,
        timeoutMs: remaining('launch'),
      });
      if (!instance) {
        throw new Error('Chrome or Chromium is unavailable; no screenshot was captured');
      }
      await instance.send('Page.enable', {}, remaining('launch'));
      await instance.send('Runtime.enable', {}, remaining('launch'));
      return instance;
    });

    const screenshots = [];
    const sessionSummaries = [];

    for (const session of sessions) {
      const prefix = `session:${session.name}`;
      // oxlint-disable-next-line no-await-in-loop -- sessions reuse one Chromium page sequentially
      await runStage(`${prefix}:viewport`, async () => {
        await page.send(
          'Emulation.setDeviceMetricsOverride',
          { width: session.width, height: session.height, deviceScaleFactor: 1, mobile: false },
          remaining(`${prefix}:viewport`),
        );
        await page.send(
          'Emulation.setTouchEmulationEnabled',
          { enabled: session.width < 600 },
          remaining(`${prefix}:viewport`),
        );
      });

      // oxlint-disable-next-line no-await-in-loop -- sequential session navigation
      await runStage(`${prefix}:navigate`, async () => {
        const nav = await page.send('Page.navigate', { url: session.url.href }, remaining(`${prefix}:navigate`));
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
            `The POC did not finish loading${lastEvalErr ? ` (${lastEvalErr.message})` : ''}`,
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
        const innerWidth = await page.evaluate('Math.round(window.innerWidth)', {
          evalTimeoutMs: Math.min(3000, remaining(`${prefix}:fonts`)),
        });
        if (typeof innerWidth === 'number' && innerWidth !== session.width) {
          throw new PocStageError(
            `POC layout innerWidth (${innerWidth}px) does not match requested viewport width (${session.width}px)`,
            { kind: 'assertion', stage: `${prefix}:fonts`, elapsedMs: elapsed(), stages: [...stages], stderrTail: stderrTail() },
          );
        }
      });

      for (let i = 0; i < session.steps.length; i += 1) {
        const step = session.steps[i];
        const stepStage = `${prefix}:step:${i + 1}:${step.action}`;
        if (step.action === 'screenshot') {
          // oxlint-disable-next-line no-await-in-loop -- sequential step execution
          const shotMeta = await runStage(stepStage, async () => {
            const result = await page.send(
              'Page.captureScreenshot',
              {
                format: 'png',
                captureBeyondViewport: true,
                clip: { x: 0, y: 0, width: session.width, height: session.height, scale: 1 },
              },
              remaining(stepStage),
            );
            const png = Buffer.from(result.data, 'base64');
            if (png.length < 24 || png.toString('latin1', 12, 16) !== 'IHDR') {
              throw new Error('The browser returned an invalid PNG screenshot');
            }
            const actualWidth = png.readUInt32BE(16);
            const actualHeight = png.readUInt32BE(20);
            if (actualWidth !== session.width || actualHeight !== session.height) {
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
              renderer: 'Chromium',
              url: session.url.href,
              width: actualWidth,
              height: actualHeight,
              sha256: createHash('sha256').update(png).digest('hex'),
              capturedAt: new Date().toISOString(),
            };
          });
          screenshots.push(shotMeta);
        } else if (step.action === 'waitFor') {
          // oxlint-disable-next-line no-await-in-loop -- sequential waitFor polling
          await runStage(
            stepStage,
            async () => {
              const waitBudget = Math.min(Number(step.timeoutMs) || 5000, remaining(stepStage));
              const waitEnd = Date.now() + waitBudget;
              const checkExpr = buildDomStepExpression({
                action: 'assertVisible',
                selector: step.selector,
                visible: step.visible ?? true,
              });
              while (Date.now() < waitEnd) {
                const res = await page.evaluate(checkExpr, {
                  evalTimeoutMs: Math.min(1500, remaining(stepStage)),
                });
                if (res?.ok) return;
                await delay(60);
              }
              throw new PocStageError(`waitFor timed out waiting for selector: ${step.selector}`, {
                kind: 'assertion',
                stage: stepStage,
                elapsedMs: elapsed(),
                stages: [...stages],
                stderrTail: stderrTail(),
              });
            },
            'assertion',
          );
        } else {
          const isAssert = step.action.startsWith('assert');
          // oxlint-disable-next-line no-await-in-loop -- sequential DOM interaction/assertion
          await runStage(
            stepStage,
            async () => {
              const res = await page.evaluate(buildDomStepExpression(step), {
                evalTimeoutMs: Math.min(5000, remaining(stepStage)),
              });
              if (!res?.ok) {
                throw new PocStageError(res?.error || `Step ${step.action} failed`, {
                  kind: 'assertion',
                  stage: stepStage,
                  elapsedMs: elapsed(),
                  stages: [...stages],
                  stderrTail: stderrTail(),
                });
              }
            },
            isAssert ? 'assertion' : 'browser',
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
      status: 'ok',
      renderer: 'Chromium',
      browserLaunches: 1,
      sessions: sessionSummaries,
      screenshots,
      stages,
      totalMs: elapsed(),
    };
  } catch (error) {
    if (error instanceof PocStageError) throw error;
    throw new PocStageError(error?.message || String(error), {
      kind: 'browser',
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
      stages.push({ stage: 'close', durationMs: Date.now() - t0, elapsedMs: elapsed() });
    }
  }
}
