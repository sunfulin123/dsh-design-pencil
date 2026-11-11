import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

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

function launchChromeWithCDP(chromeBin, profileDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      chromeBin,
      [
        '--headless=new',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-extensions',
        '--hide-scrollbars',
        '--remote-debugging-port=0',
        `--user-data-dir=${profileDir}`,
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Timed out waiting for Chrome DevTools endpoint'));
    }, 15000);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve({ child, wsEndpoint: m[1] });
      }
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function captureAndInspectViewports(targetUrlOrFile, outDir, viewports) {
  let serverObj = null;
  let liveUrl = targetUrlOrFile;

  try {
    if (targetUrlOrFile && !/^https?:\/\//i.test(targetUrlOrFile)) {
      const resolvedFile = path.resolve(targetUrlOrFile);
      if (fs.existsSync(resolvedFile)) {
        const rootDir = fs.statSync(resolvedFile).isDirectory() ? resolvedFile : path.dirname(resolvedFile);
        const entryFile = fs.statSync(resolvedFile).isDirectory() ? 'index.html' : path.basename(resolvedFile);
        serverObj = await startStaticServer(rootDir, entryFile);
        liveUrl = serverObj.url;
      }
    }

    const shotsDir = path.join(outDir, 'shots');
    fs.mkdirSync(shotsDir, { recursive: true });

    const renderedEvidence = [];
    const domFindings = [];
    const chromeBin = findChromeBinary();

    if (!chromeBin || !liveUrl) {
      return {
        captured: false,
        reason: !chromeBin ? 'No local Chrome/Chromium/Edge binary found' : 'No --url provided',
        renderedEvidence,
        domFindings,
      };
    }

    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-chrome-'));
    let chromeProc = null;

    try {
      chromeProc = await launchChromeWithCDP(chromeBin, profileDir);
      const u = new URL(chromeProc.wsEndpoint);
      const targetsRes = await fetch(`http://${u.host}/json/list`);
      const targets = await targetsRes.json();
      const pageTarget = targets.find(t => t.type === 'page') || targets[0];

      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      await new Promise((res, rej) => {
        ws.addEventListener('open', res, { once: true });
        ws.addEventListener('error', rej, { once: true });
      });

      let msgId = 0;
      const pending = new Map();
      ws.addEventListener('message', (ev) => {
        const data = JSON.parse(String(ev.data));
        if (data.id && pending.has(data.id)) {
          const { resolve, reject, timer } = pending.get(data.id);
          clearTimeout(timer);
          pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      });
      ws.addEventListener('close', () => {
        for (const { reject, timer } of pending.values()) {
          clearTimeout(timer);
          reject(new Error('Chrome debugging connection closed'));
        }
        pending.clear();
      });

      const sendCDP = (method, params = {}) =>
        new Promise((resolve, reject) => {
          const id = ++msgId;
          const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`Chrome debugging timed out: ${method}`));
          }, 15000);
          pending.set(id, { resolve, reject, timer });
          ws.send(JSON.stringify({ id, method, params }));
        });

      await sendCDP('Page.enable');
      await sendCDP('Runtime.enable');

      for (const vp of viewports) {
        await sendCDP('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.width < 600,
        });
        const navigation = await sendCDP('Page.navigate', { url: liveUrl });
        if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
        let ready = false;
        for (let attempt = 0; attempt < 150; attempt++) {
          try {
            const state = await sendCDP('Runtime.evaluate', { returnByValue: true,
              expression: "document.readyState === 'complete' && location.href !== 'about:blank'" });
            ready = state?.result?.value === true;
          } catch { /* Navigation can temporarily reset the JavaScript context. */ }
          if (ready) break;
          await new Promise(r => setTimeout(r, 100));
        }
        if (!ready) throw new Error(`Page did not finish loading at ${vp.label}`);
        const fonts = await sendCDP('Runtime.evaluate', { awaitPromise: true, returnByValue: true,
          expression: "document.fonts ? Promise.race([document.fonts.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Font loading timed out')), 10000))]).then(() => true) : true" });
        if (fonts.exceptionDetails) throw new Error(`Font loading could not be verified at ${vp.label}`);

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
            return { overflowPx, brokenImgs, smallBorderedPills };
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
        if (vp.width >= 1280 && geom.smallBorderedPills > 22) {
          domFindings.push({
            severity: 'P1',
            category: 'second-order-slop',
            rule: 'pill-soup-overload',
            location: vp.label,
            message: `Pill & Box Soup detected: ${geom.smallBorderedPills} small bordered pill/chip boxes on screen (max 22). Replace bordered pills/chips with open typographic hierarchy and whitespace.`,
          });
        }

        const outFile = path.join(outDir, vp.file);
        fs.rmSync(outFile, { force: true });
        const shot = await sendCDP('Page.captureScreenshot', {
          format: 'png',
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

      ws.close();
    } finally {
      if (chromeProc?.child) chromeProc.child.kill('SIGKILL');
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    }

    return { captured: true, liveUrl, renderedEvidence, domFindings };
  } finally {
    if (serverObj?.server) serverObj.server.close();
  }
}

