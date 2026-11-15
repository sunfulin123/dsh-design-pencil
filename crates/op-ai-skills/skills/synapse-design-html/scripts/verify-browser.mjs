import fs from 'node:fs';
import {readSurfaceGeometry,surfaceFindings} from './poc-surface-inspection.mjs';
import path from 'node:path';
import {startStaticServer} from './poc-preview-server.mjs';
import { createHash } from 'node:crypto';
import { loadHeadlessLauncher } from './poc-browser-runner.mjs';


export async function captureAndInspectViewports(targetUrlOrFile, outDir, viewports, options = {}) {
  const totalTimeoutMs = Math.max(500, Math.min(120_000, Number(options.timeoutMs) || 45_000));
  const startedAt = Date.now();
  const deadline = startedAt + totalTimeoutMs;
  const stages = [];
  let currentStage = 'init';
  let serverObj = null;
  let liveUrl = targetUrlOrFile;

  const elapsed = () => Date.now() - startedAt;
  const remaining = (stage) => {
    const rem = deadline - Date.now();
    if (rem <= 50) throw new Error(`Timed out at stage "${stage}" after ${elapsed()}ms (budget ${totalTimeoutMs}ms)`);
    return rem;
  };
  const markStage = async (stage, fn) => {
    currentStage = stage;
    const t0 = Date.now();
    try {
      const result = await fn();
      stages.push({ stage, durationMs: Date.now() - t0, elapsedMs: elapsed() });
      return result;
    } catch (error) {
      stages.push({ stage, durationMs: Date.now() - t0, elapsedMs: elapsed(), failed: true });
      throw error;
    }
  };
  const fillUnverifiedRenders = (existing, reason) => {
    const covered = new Set(existing.map((r) => r.viewport));
    const list = [...existing];
    for (const vp of viewports) {
      if (!covered.has(vp.label)) {
        list.push({
          viewport: vp.label,
          status: 'unverified',
          renderer: 'unavailable',
          uncovered: reason,
        });
      }
    }
    return list;
  };

  try {
    if (targetUrlOrFile && !/^https?:\/\//i.test(targetUrlOrFile)) {
      const resolvedFile = path.resolve(targetUrlOrFile);
      if (fs.existsSync(resolvedFile)) {
        const rootDir = fs.statSync(resolvedFile).isDirectory() ? resolvedFile : path.dirname(resolvedFile);
        const entryFile = fs.statSync(resolvedFile).isDirectory() ? 'index.html' : path.basename(resolvedFile);
        serverObj = await markStage('static-server', () => startStaticServer(rootDir, entryFile));
        liveUrl = serverObj.url;
      }
    }

    const shotsDir = path.join(outDir, 'shots');
    fs.mkdirSync(shotsDir, { recursive: true });

    const renderedEvidence = [];
    const domFindings = [];
    if (!liveUrl) {
      const reason = 'No --url provided for browser verification';
      return {
        captured: false,
        degraded: true,
        reason,
        stages,
        renderedEvidence: fillUnverifiedRenders([], reason),
        domFindings,
      };
    }

    let page = null;
    try {
      const launchHeadlessPage = await loadHeadlessLauncher();
      const maxWidth = Math.max(...viewports.map((vp) => vp.width), 1440);
      const maxHeight = Math.max(...viewports.map((vp) => vp.height), 900);
      page = await markStage('launch', () =>
        launchHeadlessPage({ width: maxWidth, height: maxHeight, timeoutMs: remaining('launch') }),
      );
      if (!page) {
        const reason = 'No local Chrome/Chromium/Edge binary found; browser verification unverified';
        return {
          captured: false,
          degraded: true,
          reason,
          stages,
          renderedEvidence: fillUnverifiedRenders([], reason),
          domFindings,
        };
      }

      const sendCDP = (method, params = {}) => page.send(method, params, remaining(currentStage));

      await markStage('cdp-enable', async () => {
        await sendCDP('Page.enable');
        await sendCDP('Runtime.enable');
      });

      for (const vp of viewports) {
        currentStage = `viewport:${vp.label}`;
        // oxlint-disable-next-line no-await-in-loop -- sequential multi-viewport reuse in one browser
        await sendCDP('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: false,
        });
        // oxlint-disable-next-line no-await-in-loop -- touch media query emulation for narrow boards
        await sendCDP('Emulation.setTouchEmulationEnabled', { enabled: vp.width < 600 });
        currentStage = `navigate:${vp.label}`;
        // oxlint-disable-next-line no-await-in-loop -- sequential viewport navigation
        const navigation = await sendCDP('Page.navigate', { url: liveUrl });
        if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
        currentStage = `ready:${vp.label}`;
        let ready = false;
        const readyDeadline = Math.min(deadline, Date.now() + 15_000);
        while (Date.now() < readyDeadline) {
          try {
            // oxlint-disable-next-line no-await-in-loop -- sequential readiness poll
            const state = await page.send(
              'Runtime.evaluate',
              { returnByValue: true, expression: "document.readyState === 'complete' && location.href !== 'about:blank'" },
              Math.min(2000, remaining(currentStage)),
            );
            ready = state?.result?.value === true;
          } catch { /* Navigation can temporarily reset the JavaScript context. */ }
          if (ready) break;
          // oxlint-disable-next-line no-await-in-loop -- backoff between polls
          await new Promise(r => setTimeout(r, 80));
        }
        if (!ready) throw new Error(`Page did not finish loading at ${vp.label}`);
        currentStage = `fonts:${vp.label}`;
        const fontWaitMs = Math.max(100, Math.min(10_000, remaining(currentStage)) - 100);
        // oxlint-disable-next-line no-await-in-loop -- sequential font readiness check
        const fonts = await sendCDP('Runtime.evaluate', {
          awaitPromise: true,
          returnByValue: true,
          expression: `document.fonts ? Promise.race([document.fonts.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Font loading timed out')), ${fontWaitMs}))]).then(() => true) : true`,
        });
        if (fonts.exceptionDetails) throw new Error(`Font loading could not be verified at ${vp.label}`);
        currentStage = `inspect:${vp.label}`;

        // Live DOM geometry & Second-Order Slop check at this exact viewport
        const geom = await readSurfaceGeometry(page, undefined, remaining(currentStage));
        if (!geom) throw new Error(`DOM inspection failed at ${vp.label}`);
        domFindings.push(...surfaceFindings(geom,vp,options.scope));

        currentStage = `screenshot:${vp.label}`;
        const outFile = path.join(outDir, vp.file);
        fs.rmSync(outFile, { force: true });
        // oxlint-disable-next-line no-await-in-loop -- sequential viewport screenshot
        const shot = await sendCDP('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 1 },
        });
        if (shot?.data) {
          fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
        }

        const exists = fs.existsSync(outFile) && fs.statSync(outFile).size > 0;
        renderedEvidence.push({
          viewport: vp.label,
          artifact: vp.file,
          status: exists ? 'captured' : 'missing',
          renderer: 'Chromium',
          width: vp.width,
          height: vp.height,
          sha256: exists ? createHash('sha256').update(fs.readFileSync(outFile)).digest('hex') : null,
          observation: exists
            ? `Captured ${vp.width}x${vp.height} at ${vp.file}; visual review remains separate (overflow=${geom.overflowPx}px, brokenImgs=${geom.brokenImgs}).`
            : `Failed to capture ${vp.label}`,
        });
        if (!exists) {
          domFindings.push({
            severity: 'P0',
            category: 'check-0-evidence',
            rule: 'missing-screenshot',
            location: vp.label,
            message: `Check 0 failure: Screenshot ${vp.file} is missing or 0 bytes.`,
          });
        }

        // Automated 6-State Interactive Walkthrough & [hidden] Override Check at Desktop Viewport
        if (vp.width >= 1280) {
          const stateWalkRes = await sendCDP('Runtime.evaluate', {
            awaitPromise: true,
            returnByValue: true,
            expression: `(async () => {
              const issues = [];
              const describeEl = el => el.id ? '#' + el.id : (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : el.tagName.toLowerCase());
              const findBrokenHidden = () => [...document.querySelectorAll('[hidden]')].filter(el => getComputedStyle(el).display !== 'none').map(describeEl);

              const initialBroken = findBrokenHidden();
              if (initialBroken.length) {
                issues.push({
                  severity: 'P0',
                  rule: 'hidden-attribute-overridden',
                  message: 'Elements with [hidden] are still visible (computed display !== "none"): ' + initialBroken.join(', ') + '. Declare [hidden] { display: none !important; } globally.'
                });
              }

              const stateBtns = [...document.querySelectorAll('[data-set-state], [data-state-btn]')];
              const seenStates = new Set();
              for (const btn of stateBtns) {
                const st = (btn.dataset.setState || btn.dataset.stateBtn || '').trim();
                if (!st || st === 'normal' || seenStates.has(st)) continue;
                seenStates.add(st);
                btn.click();
                await new Promise(r => setTimeout(r, 120));

                const brokenAfter = findBrokenHidden();
                if (brokenAfter.length) {
                  issues.push({
                    severity: 'P0',
                    rule: 'state-hidden-override-' + st,
                    message: 'Switching to state "' + st + '" set [hidden] on ' + brokenAfter.join(', ') + ', but CSS display overrode [hidden] so normal content stayed visible.'
                  });
                }

                const targetEl = document.getElementById('state-' + st) || document.querySelector('[data-state-view="' + st + '"]');
                if (targetEl) {
                  const cs = getComputedStyle(targetEl);
                  const rect = targetEl.getBoundingClientRect();
                  if (cs.display === 'none' || rect.height === 0) {
                    issues.push({
                      severity: 'P1',
                      rule: 'state-not-visible-' + st,
                      message: 'Switching to state "' + st + '" did not make ' + describeEl(targetEl) + ' visible.'
                    });
                  } else if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
                    issues.push({
                      severity: 'P1',
                      rule: 'state-offscreen-' + st,
                      message: 'Switching to state "' + st + '" updated ' + describeEl(targetEl) + ' off-screen (top=' + Math.round(rect.top) + 'px) without scrolling it into the viewport.'
                    });
                  }
                }

                if (['loading', 'empty', 'error', 'permission'].includes(st)) {
                  const normalGrid = document.querySelector('[data-state-normal], #product-grid, .product-grid');
                  if (normalGrid) {
                    const ncs = getComputedStyle(normalGrid);
                    const nrect = normalGrid.getBoundingClientRect();
                    if (ncs.display !== 'none' && nrect.height > 0) {
                      issues.push({
                        severity: 'P0',
                        rule: 'state-mutual-exclusion-' + st,
                        message: 'Replacement state "' + st + '" is active, but normal content container (' + describeEl(normalGrid) + ') is still visible at the same time.'
                      });
                    }
                  }
                }
              }

              const normalBtn = stateBtns.find(b => (b.dataset.setState || b.dataset.stateBtn) === 'normal');
              if (normalBtn) normalBtn.click();
              window.scrollTo(0, 0);
              return issues;
            })()`,
          });

          if (!Array.isArray(stateWalkRes?.result?.value) || stateWalkRes.exceptionDetails) {
            throw new Error(`Content-state inspection failed at ${vp.label}`);
          }
          for (const issue of stateWalkRes.result.value) {
            domFindings.push({
              severity: issue.severity,
              category: '6-state-verification',
              rule: issue.rule,
              location: vp.label,
              message: issue.message,
            });
          }
        }
      }
    } catch (error) {
      const tail = typeof page?.stderrTail === 'function' ? page.stderrTail().trim() : '';
      const rawMessage = error instanceof Error ? error.message : String(error);
      const stderrSuffix = tail && !rawMessage.includes(tail) ? ` (Chrome stderr: ${tail.replace(/\s+/g, ' ')})` : '';
      const reason = `Browser verification degraded at stage "${currentStage}" after ${elapsed()}ms: ${rawMessage}${stderrSuffix}`;
      return {
        captured: false,
        degraded: true,
        reason,
        stages,
        renderedEvidence: fillUnverifiedRenders(renderedEvidence, reason),
        domFindings,
      };
    } finally {
      if (page) await page.close().catch(() => {});
    }

    return { captured: true, liveUrl, stages, renderedEvidence, domFindings };
  } finally {
    if (serverObj?.server) serverObj.server.close();
  }
}

