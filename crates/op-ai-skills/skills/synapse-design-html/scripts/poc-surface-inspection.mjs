/** Shared live DOM checks, used by final capture and the legacy surface verifier. */
import { setTimeout as delay } from "node:timers/promises";
import { frameExpression } from "./poc-browser-actions.mjs";
const geometryExpression = `(() => {
            const overflowPx = document.documentElement.scrollWidth - window.innerWidth;
            const brokenImgs = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length;
            // Count small bordered pill/chip containers visible in the viewport (Pill Soup detector)
            const smallBorderedPills = [...document.querySelectorAll('span, button, li, div')].filter(el => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0 || r.height > 46 || r.width > 240) return false;
              const cs = getComputedStyle(el);
              return parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none' && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
            }).length;
            const describeCtrl = el => {
              const parts=[];
              for(let node=el;node;node=node.parentElement) {
                if(node.id) {parts.unshift('#'+node.id);break;}
                const siblings=node.parentElement ? [...node.parentElement.children].filter(child=>child.tagName===node.tagName) : [node];
                parts.unshift(node.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(node)+1)+')');
              }
              return parts.join('>');
            };
            const painted = el => {
              for (let node=el;node;node=node.parentElement) {
                const cs=getComputedStyle(node);
                if (cs.display==='none' || cs.visibility==='hidden' || cs.visibility==='collapse' || Number(cs.opacity)===0 || cs.contentVisibility==='hidden') return false;
                if (/^rect\\(0(?:px)?,?\\s*0(?:px)?,?\\s*0(?:px)?,?\\s*0(?:px)?\\)$/.test(cs.clip) || cs.clipPath==='inset(50%)') return false;
              }
              return true;
            };
            const selectChevronIssues = [];
            for (const sel of document.querySelectorAll('select:not([multiple])')) {
              const sz = parseInt(sel.getAttribute('size') || '1', 10);
              if (sz > 1) continue;
              const r = sel.getBoundingClientRect();
              if (r.width === 0 || r.height === 0 || !painted(sel)) continue;
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
            // Menu buttons may be compact or icon-only; field inset rules apply to selection controls.
            for (const trig of document.querySelectorAll('[role="combobox"], button[aria-haspopup="listbox"]')) {
              const r = trig.getBoundingClientRect();
              if (r.width === 0 || r.height === 0 || !painted(trig)) continue;
              const cs = getComputedStyle(trig);
              if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              const icon = [...trig.querySelectorAll('[data-chevron], svg, i')].filter(el => {
                const style=getComputedStyle(el), bounds=el.getBoundingClientRect();
                const name=(el.getAttribute('data-icon') || el.getAttribute('aria-label') || el.textContent || '').trim();
                return bounds.width>0 && bounds.height>0 && style.visibility!=='hidden' && style.display!=='none'
                  && (el.hasAttribute('data-chevron') || /^(chevron_down|expand_more|arrow_drop_down)$/i.test(name));
              }).at(-1);
              if (!icon) continue;
              const ir = icon.getBoundingClientRect();
              const borderR = parseFloat(cs.borderRightWidth) || 0;
              const gapRight = (r.right - borderR) - ir.right;
              if (ir.width > 0 && gapRight >= -2 && gapRight < 8) {
                selectChevronIssues.push(describeCtrl(trig) + ' trailing chevron sits only ' + Math.round(gapRight) + 'px from the right border (need 12px-16px)');
              }
            }
            const brokenHidden=[...document.querySelectorAll('[hidden]')].filter(el=>getComputedStyle(el).display!=='none').length;
            return { overflowPx, brokenImgs, smallBorderedPills, selectChevronIssues, brokenHidden };
          })()`;
export async function readSurfaceGeometry(page, frame, timeoutMs) {
  return page.evaluate(frameExpression(frame, geometryExpression), {
    evalTimeoutMs: timeoutMs,
  });
}
export function surfaceFindings(geom, vp, scope = "page") {
  const findings = [];
  if (geom.overflowPx > 2) {
    findings.push({
      severity: "P0",
      category: "responsive-dom",
      rule: "horizontal-overflow",
      location: `${vp.label} (${vp.width}x${vp.height})`,
      message: `Horizontal overflow of ${geom.overflowPx}px detected at ${vp.width}x${vp.height}.`,
    });
  }
  if (geom.brokenImgs > 0) {
    findings.push({
      severity: "P1",
      category: "responsive-dom",
      rule: "broken-image",
      location: `${vp.label} (${vp.width}x${vp.height})`,
      message: `${geom.brokenImgs} broken image(s) (naturalWidth === 0) detected at ${vp.label}.`,
    });
  }
  if (
    Array.isArray(geom.selectChevronIssues) &&
    geom.selectChevronIssues.length > 0 &&
    vp.width >= 1280
  ) {
    findings.push({
      severity: "P1",
      category: "craft-floor",
      rule: "dropdown-chevron-inset",
      location: `${vp.label} (${vp.width}x${vp.height})`,
      message: `Dropdown/select chevron inset defect: ${geom.selectChevronIssues.slice(0, 3).join("; ")}. Use appearance: none, inset the chevron 12px-16px from the right border, and set padding-right: 36px-40px.`,
    });
  }
  if (scope !== "app" && vp.width >= 1280 && geom.smallBorderedPills > 22) {
    findings.push({
      severity: "P1",
      category: "second-order-slop",
      rule: "pill-soup-overload",
      location: `${vp.label} (${vp.width}x${vp.height})`,
      message: `Pill & Box Soup detected: ${geom.smallBorderedPills} small bordered pill/chip boxes on screen (max 22). Replace bordered pills/chips with open typographic hierarchy and whitespace.`,
    });
  }

  if (geom.brokenHidden > 0)
    findings.push({
      severity: "P0",
      category: "6-state-verification",
      rule: "hidden-attribute-overridden",
      location: `${vp.label} (${vp.width}x${vp.height})`,
      message: `${geom.brokenHidden} hidden elements remain displayed.`,
    });
  return findings;
}
async function waitForPaintedResources(page, frame, timeoutMs) {
  await page.evaluate(
    frameExpression(
      frame,
      `(async()=>{
    // Mounted components register fonts asynchronously; let layout request them first.
    await new Promise(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(resolve)));
    if(document.fonts) await document.fonts.ready;
    const urls=new Set();
    for(const node of document.querySelectorAll('*')){
      const r=node.getBoundingClientRect();if(!r.width||!r.height) continue;
      const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden') continue;
      const match=(style.maskImage||style.webkitMaskImage||'').match(/^url\\(["']?(.*?)["']?\\)$/);
      if(match) urls.add(match[1]);
    }
    await Promise.all([...urls].map(url=>new Promise((resolve,reject)=>{
      const image=new window.Image();image.onload=resolve;image.onerror=()=>reject(new Error('Visible mask asset failed: '+url));image.src=url;
    })));
    return true;
  })()`,
    ),
    { awaitPromise: true, evalTimeoutMs: timeoutMs },
  );
  const deadline = Date.now() + timeoutMs;
  while (
    await page.evaluate(
      frameExpression(
        frame,
        `(()=>[...document.querySelectorAll('[data-co-name="Icon"]')].some(node=>{
    const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(node).visibility==='hidden';
  }))()`,
      ),
      { evalTimeoutMs: Math.max(100, deadline - Date.now()) },
    )
  ) {
    if (Date.now() >= deadline)
      throw new Error("Visible Cobalt icon font did not finish loading");
    await delay(50);
  }
}
export async function inspectCaptureSurface(
  page,
  session,
  timeoutMs,
  scope = "page",
) {
  const deadline = Date.now() + Math.min(timeoutMs, 10000);
  let frames;
  while (!frames) {
    const state = await page.evaluate(
      `(() => {
    const result=[[]];
    const selector=el=>{const parts=[];while(el&&el.parentElement){const tag=el.tagName.toLowerCase();const siblings=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);parts.unshift(tag+':nth-of-type('+(siblings.indexOf(el)+1)+')');el=el.parentElement;}return ':root>'+parts.join('>')};
    let pending=false;
    const visit=(doc,chain)=>{
      if(doc.querySelector('[data-prototype-loading]') || doc.getElementById('root')?.childElementCount===0) pending=true;
      for(const f of doc.querySelectorAll('iframe')){
        const r=f.getBoundingClientRect(),c=doc.defaultView.getComputedStyle(f);
        if (!r.width||!r.height||c.display==='none'||c.visibility==='hidden') continue;
        const next=f.contentDocument;
        if (!next) throw new Error('Visible cross-origin iframe cannot be inspected');
        if (next.readyState==='loading'||!next.body?.childElementCount){pending=true;continue;}
        const child=[...chain,selector(f)];result.push(child);
        if(child.length>=4&&next.querySelector('iframe')) throw new Error('Frame nesting exceeds four levels');
        visit(next,child);
      }
    };visit(document,[]);return {frames:result,pending};
  })()`,
      { evalTimeoutMs: Math.max(100, deadline - Date.now()) },
    );
    if (!state.pending) frames = state.frames;
    else {
      if (Date.now() >= deadline)
        throw new Error("Visible business frame did not finish rendering");
      await delay(60);
    }
  }
  const findings = [];
  for (const frame of frames) {
    await waitForPaintedResources(
      page,
      frame,
      Math.max(100, deadline - Date.now()),
    );
    const geom = await readSurfaceGeometry(
      page,
      frame,
      Math.max(100, deadline - Date.now()),
    );
    if (!geom) throw new Error("DOM surface inspection failed");
    findings.push(
      ...surfaceFindings(
        geom,
        {
          width: session.width,
          height: session.height,
          label: `${session.name}${frame.length ? " / " + frame.join(" / ") : ""}`,
        },
        scope,
      ),
    );
  }
  return { documents: frames.length, findings };
}

/** Collapse repeated observations, retaining separate targets, sessions/frames and messages. */
export function deduplicateSurfaceFindings(findings) {
  const seen = new Set();
  return findings.filter(finding => {
    const key = JSON.stringify([finding.severity, finding.category, finding.rule, finding.location, finding.message]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
