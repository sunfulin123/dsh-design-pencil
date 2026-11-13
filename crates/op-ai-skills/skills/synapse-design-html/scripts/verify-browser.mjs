import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { loadHeadlessLauncher } from './poc-browser-runner.mjs';

function startStaticServer(rootDir, entryFile) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  };

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath;
      try { reqPath = decodeURIComponent((req.url || '/').split('?')[0]); }
      catch { res.writeHead(400).end('Bad request'); return; }
      const relPath = reqPath === '/' ? entryFile : reqPath.replace(/^\/+/, '');
      const fullPath = path.resolve(rootDir, relPath);
      let realFile;
      try { realFile = fs.realpathSync(fullPath); } catch { res.writeHead(404).end('Not found'); return; }
      const relative = path.relative(fs.realpathSync(rootDir), realFile);
      if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || fs.statSync(realFile).isDirectory()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      fs.createReadStream(realFile).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
    server.on('error', reject);
  });
}

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
        const evalRes = await sendCDP('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const overflowPx = document.documentElement.scrollWidth - window.innerWidth;
            const brokenImgs = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length;
            // Count small bordered pill/chip containers visible in the viewport (Pill Soup detector)
            const smallBorderedPills = [...document.querySelectorAll('span, button, li, div')].filter(el => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0 || r.height > 46 || r.width > 240) return false;
              const cs = getComputedStyle(el);
              return parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none' && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
            }).length;
            const describeCtrl = el => el.id ? '#' + el.id : (el.name ? el.tagName.toLowerCase() + '[name="' + el.name + '"]' : el.tagName.toLowerCase());
            const selectChevronIssues = [];
            for (const sel of document.querySelectorAll('select:not([multiple])')) {
              const sz = parseInt(sel.getAttribute('size') || '1', 10);
              if (sz > 1) continue;
              const r = sel.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              const cs = getComputedStyle(sel);
              if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
              const bordered = parseFloat(cs.borderRightWidth) >= 1 && cs.borderRightStyle !== 'none' && cs.borderRightColor !== 'rgba(0, 0, 0, 0)';
              const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
              if (!bordered && !filled) continue;
              const appearance = cs.appearance || cs.webkitAppearance || 'auto';
              const padR = parseFloat(cs.paddingRight) || 0;
              const parentCs = sel.parentElement ? getComputedStyle(sel.parentElement) : null;
              const hasOverlayIcon = parentCs && parentCs.position !== 'static'
                && [...sel.parentElement.querySelectorAll('svg, [data-chevron], [aria-hidden="true"]')].some(ic => {
                  const ir = ic.getBoundingClientRect();
                  return ir.width > 0 && ir.right <= r.right && (r.right - ir.right) >= 8;
                });
              if (appearance !== 'none') {
                selectChevronIssues.push(describeCtrl(sel) + ' uses native UA appearance ("' + appearance + '"), gluing the dropdown arrow to the right border');
              } else if (cs.backgroundImage === 'none' && !hasOverlayIcon) {
                selectChevronIssues.push(describeCtrl(sel) + ' sets appearance:none without a visible custom chevron indicator');
              } else if (padR < 32) {
                selectChevronIssues.push(describeCtrl(sel) + ' has padding-right=' + Math.round(padR) + 'px (< 32px), causing text to collide with the dropdown chevron');
              } else if (cs.backgroundImage !== 'none') {
                const posX = (cs.backgroundPositionX || cs.backgroundPosition || '').trim();
                const rightPx = /^calc\\(\\s*100%\\s*-\\s*([\\d.]+)px\\s*\\)$/i.exec(posX) || /\\bright\\s+([\\d.]+)px\\b/i.exec(posX);
                if (/^(?:100%|right)$/i.test(posX) || (rightPx && parseFloat(rightPx[1]) < 8)) {
                  selectChevronIssues.push(describeCtrl(sel) + ' places its chevron flush with the right edge (' + posX + '); inset it 12px-16px from the right border');
                }
              }
            }
            for (const trig of document.querySelectorAll('[role="combobox"], button[aria-haspopup="listbox"], button[aria-haspopup="menu"]')) {
              const r = trig.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              const cs = getComputedStyle(trig);
              if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              const icon = [...trig.querySelectorAll('svg, [data-chevron], i')].at(-1);
              if (!icon) continue;
              const ir = icon.getBoundingClientRect();
              const borderR = parseFloat(cs.borderRightWidth) || 0;
              const gapRight = (r.right - borderR) - ir.right;
              if (ir.width > 0 && gapRight >= -2 && gapRight < 8) {
                selectChevronIssues.push(describeCtrl(trig) + ' trailing chevron sits only ' + Math.round(gapRight) + 'px from the right border (need 12px-16px)');
              }
            }
            return { overflowPx, brokenImgs, smallBorderedPills, selectChevronIssues };
          })()`,
        });

        const geom = evalRes?.result?.value;
        if (!geom || evalRes.exceptionDetails) throw new Error(`DOM inspection failed at ${vp.label}`);
        if (geom.overflowPx > 2) {
          domFindings.push({
            severity: 'P0',
            category: 'responsive-dom',
            rule: 'horizontal-overflow',
            location: vp.label,
            message: `Horizontal overflow of ${geom.overflowPx}px detected at ${vp.width}x${vp.height}.`,
          });
        }
        if (geom.brokenImgs > 0) {
          domFindings.push({
            severity: 'P1',
            category: 'responsive-dom',
            rule: 'broken-image',
            location: vp.label,
            message: `${geom.brokenImgs} broken image(s) (naturalWidth === 0) detected at ${vp.label}.`,
          });
        }
        if (Array.isArray(geom.selectChevronIssues) && geom.selectChevronIssues.length > 0 && vp.width >= 1280) {
          domFindings.push({
            severity: 'P1',
            category: 'craft-floor',
            rule: 'dropdown-chevron-inset',
            location: vp.label,
            message: `Dropdown/select chevron inset defect: ${geom.selectChevronIssues.slice(0, 3).join('; ')}. Use appearance: none, inset the chevron 12px-16px from the right border, and set padding-right: 36px-40px.`,
          });
        }
        if (vp.width >= 1280 && geom.smallBorderedPills > 22) {
          domFindings.push({
            severity: 'P1',
            category: 'second-order-slop',
            rule: 'pill-soup-overload',
            location: vp.label,
            message: `Pill & Box Soup detected: ${geom.smallBorderedPills} small bordered pill/chip boxes on screen (max 22). Replace bordered pills/chips with open typographic hierarchy and whitespace.`,
          });
        }

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

