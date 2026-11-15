/** Resolve same-origin frame targets and use Chromium input for real pointer/keyboard actions. */
export function frameExpression(frame, expression) {
  const selectors = frame ? (Array.isArray(frame) ? frame : [frame]) : [];
  return `(() => {
    let doc = globalThis.document, x = 0, y = 0, sx = 1, sy = 1;
    const frames = [];
    for (const selector of ${JSON.stringify(selectors)}) {
      const matches = doc.querySelectorAll(selector);
      if (matches.length !== 1 || matches[0].tagName !== 'IFRAME') throw new Error('Frame selector must match one iframe: ' + selector);
      const el = matches[0], r = el.getBoundingClientRect();
      if (!r.width || !r.height) throw new Error('Frame is not visible: ' + selector);
      let next;
      try { next = el.contentDocument; } catch { throw new Error('Cross-origin frame is unsupported: ' + selector); }
      if (!next || next.readyState === 'loading' || !next.body?.childElementCount) throw new Error('Frame is inaccessible or not ready: ' + selector);
      const fx = r.width / el.offsetWidth, fy = r.height / el.offsetHeight;
      x += (r.left + el.clientLeft * fx) * sx; y += (r.top + el.clientTop * fy) * sy;
      sx *= fx; sy *= fy; frames.push(el); doc = next;
    }
    const ctx = {doc, frames, x, y, sx, sy};
    const document = doc, window = doc.defaultView, getComputedStyle = window.getComputedStyle.bind(window);
    return (${expression});
  })()`;
}

export function assertionExpression(step) {
  return frameExpression(
    step.frame,
    `(() => {
    const step = ${JSON.stringify(step)};
    const nodes = [...document.querySelectorAll(step.selector)], el = nodes[0];
    const visible = (node) => {
      if (!node) return false;
      const r=node.getBoundingClientRect(), c=getComputedStyle(node);
      return r.width>0 && r.height>0 && c.display!=='none' && c.visibility!=='hidden' && Number(c.opacity)!==0;
    };
    if (step.action==='assertVisible') return {ok:visible(el)===(step.visible!==false),actual:visible(el)};
    if (step.action==='assertCount') return {ok:(step.equals===undefined||nodes.length===Number(step.equals))&&(step.min===undefined||nodes.length>=Number(step.min))&&(step.max===undefined||nodes.length<=Number(step.max)),actual:nodes.length};
    if (!el) return {ok:false,error:'Selector not found: '+step.selector};
    if (step.action==='assertFocused') return {ok:document.hasFocus()&&document.activeElement===el};
    const value=step.action==='assertValue'?String(el.value):nodes.map(n=>(n.innerText??n.textContent??'').trim()).join('\\n').trim();
    return {ok:(step.equals===undefined||value===String(step.equals))&&(step.includes===undefined||value.includes(String(step.includes))),actual:value};
  })()`,
  );
}

async function evaluate(page, frame, expression, timeoutMs) {
  return page.evaluate(frameExpression(frame, expression), { evalTimeoutMs: timeoutMs });
}

const keys = {
  Enter: ["Enter", 13, "\r"],
  Escape: ["Escape", 27],
  Tab: ["Tab", 9],
  Backspace: ["Backspace", 8],
  Delete: ["Delete", 46],
  ArrowLeft: ["ArrowLeft", 37],
  ArrowUp: ["ArrowUp", 38],
  ArrowRight: ["ArrowRight", 39],
  ArrowDown: ["ArrowDown", 40],
  Home: ["Home", 36],
  End: ["End", 35],
  PageUp: ["PageUp", 33],
  PageDown: ["PageDown", 34],
  Space: ["Space", 32, " "],
  " ": ["Space", 32, " "],
};
export async function pressKey(page, chord, timeoutMs) {
  const parts = String(chord ?? "Enter").split("+"),
    name = parts.pop();
  let modifiers = 0;
  for (const mod of parts) {
    const bit = { Alt: 1, Control: 2, Ctrl: 2, Meta: 4, Shift: 8 }[mod];
    if (!bit) throw new Error(`Unsupported key modifier: ${mod}`);
    modifiers |= bit;
  }
  const mapped =
    keys[name] ??
    (name?.length === 1
      ? [`Key${name.toUpperCase()}`, name.toUpperCase().charCodeAt(0), name]
      : null);
  if (!mapped) throw new Error(`Unsupported key: ${name}`);
  const [code, virtualKey, text] = mapped;
  const params = {
    key: name === "Space" ? " " : name,
    code,
    modifiers,
    windowsVirtualKeyCode: virtualKey,
  };
  await page.send(
    "Input.dispatchKeyEvent",
    { ...params, type: "keyDown", ...(text && !(modifiers & 7) ? { text } : {}) },
    timeoutMs,
  );
  await page.send("Input.dispatchKeyEvent", { ...params, type: "keyUp" }, timeoutMs);
}

export async function runBrowserAction(page, step, timeoutMs) {
  if (step.action === "press") {
    if (step.selector || step.frame) {
      await evaluate(
        page,
        step.frame,
        `(() => {
        const el=${step.selector ? `document.querySelector(${JSON.stringify(step.selector)})` : "document.activeElement"};
        if (!el) throw new Error('Keyboard target not found'); if (!document.hasFocus()) ctx.frames.forEach(f=>f.focus()); el.focus(); return true;
      })()`,
        timeoutMs,
      );
    }
    await pressKey(page, step.key, timeoutMs);
    return;
  }
  if (step.action.startsWith("assert")) {
    const result = await page.evaluate(assertionExpression(step), { evalTimeoutMs: timeoutMs });
    if (!result?.ok)
      throw new Error(
        result?.error ??
          `${step.action} failed for ${step.selector}: ${JSON.stringify(result?.actual)}`,
      );
    return;
  }
  const selector = JSON.stringify(step.selector);
  const info = await evaluate(
    page,
    step.frame,
    `(() => {
    const el=document.querySelector(${selector}); if (!el) throw new Error('Selector not found: '+${selector});
    if (el.disabled || el.closest('[inert]')) throw new Error('Target is disabled or inert');
    ctx.frames.forEach(f=>f.scrollIntoView({block:'nearest',inline:'nearest'}));
    el.scrollIntoView({block:'nearest',inline:'nearest'}); return true;
  })()`,
    timeoutMs,
  );
  if (!info) throw new Error("Target unavailable");
  if (step.action === "click") {
    const point = await evaluate(
      page,
      step.frame,
      `(() => {
      const el=document.querySelector(${selector}),r=el.getBoundingClientRect();
      const x=(Math.max(0,r.left)+Math.min(r.right,window.innerWidth))/2;
      const y=(Math.max(0,r.top)+Math.min(r.bottom,window.innerHeight))/2;
      const hit=document.elementFromPoint(x,y);
      if (!r.width||!r.height||!hit||(hit!==el&&!el.contains(hit))) throw new Error('Click target is hidden or covered: '+${selector});
      return {x:ctx.x+x*ctx.sx,y:ctx.y+y*ctx.sy};
    })()`,
      timeoutMs,
    );
    // Check each outer document too: an overlay above an iframe must block its clicks.
    const exposed = await page.evaluate(
      `(() => {
      let doc=document,x=${point.x},y=${point.y};
      for (const selector of ${JSON.stringify(step.frame ? (Array.isArray(step.frame) ? step.frame : [step.frame]) : [])}) {
        const f=doc.querySelector(selector),hit=doc.elementFromPoint(x,y),r=f.getBoundingClientRect();
        if (hit!==f) return false;
        x=(x-r.left)/(r.width/f.offsetWidth)-f.clientLeft;
        y=(y-r.top)/(r.height/f.offsetHeight)-f.clientTop;doc=f.contentDocument;
      } return true;
    })()`,
      { evalTimeoutMs: timeoutMs },
    );
    if (!exposed) throw new Error("An outer overlay covers the frame click target");
    await page.send(
      "Input.dispatchMouseEvent",
      { type: "mouseMoved", ...point, buttons: 0, pointerType: "mouse" },
      timeoutMs,
    );
    await page.send(
      "Input.dispatchMouseEvent",
      {
        type: "mousePressed",
        ...point,
        button: "left",
        buttons: 1,
        pointerType: "mouse",
        clickCount: 1,
      },
      timeoutMs,
    );
    await page.send(
      "Input.dispatchMouseEvent",
      { type: "mouseReleased", ...point, button: "left", clickCount: 1 },
      timeoutMs,
    );
    return;
  }
  await evaluate(
    page,
    step.frame,
    `(() => {
    ctx.frames.forEach(f=>f.focus());const el=document.querySelector(${selector});el.focus();
    if (${JSON.stringify(step.action)}==='select') {
      if (el.tagName!=='SELECT') throw new Error('select requires a native SELECT');
      const value=${JSON.stringify(String(step.value ?? ""))};
      if (![...el.options].some(o=>o.value===value)) throw new Error('Select option not found');
      el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));el.dispatchEvent(new window.Event('change',{bubbles:true}));
    }
    if (${JSON.stringify(step.action)}==='submit') {
      if (typeof el.requestSubmit!=='function') throw new Error('submit requires a form');el.requestSubmit();
    }
    return true;
  })()`,
    timeoutMs,
  );
  if (step.action === "fill") {
    await page.send(
      "Input.dispatchKeyEvent",
      { type: "keyDown", key: "a", code: "KeyA", modifiers: 2, commands: ["selectAll"] },
      timeoutMs,
    );
    await page.send(
      "Input.dispatchKeyEvent",
      { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 },
      timeoutMs,
    );
    await pressKey(page, "Backspace", timeoutMs);
    if (String(step.value ?? ""))
      await page.send("Input.insertText", { text: String(step.value) }, timeoutMs);
  }
}

export async function screenshotRegion(page, step, session, timeoutMs) {
  if (!step.selector && !step.frame && !step.clip)
    return { x: 0, y: 0, width: session.width, height: session.height, scale: 1 };
  if (step.clip) {
    if (
      step.clip.x + step.clip.width > session.width ||
      step.clip.y + step.clip.height > session.height
    )
      throw new Error("Screenshot clip exceeds viewport");
    return { ...step.clip, scale: 1 };
  }
  const r = await evaluate(
    page,
    step.frame,
    `(() => {
    const el=${step.selector ? `document.querySelector(${JSON.stringify(step.selector)})` : "document.documentElement"};
    if (!el) throw new Error('Screenshot element not found');const r=el.getBoundingClientRect();
    return {x:ctx.x+r.x*ctx.sx,y:ctx.y+r.y*ctx.sy,width:r.width*ctx.sx,height:r.height*ctx.sy};
  })()`,
    timeoutMs,
  );
  const x = Math.max(0, Math.floor(r.x)),
    y = Math.max(0, Math.floor(r.y));
  const width = Math.min(session.width, Math.ceil(r.x + r.width)) - x,
    height = Math.min(session.height, Math.ceil(r.y + r.height)) - y;
  if (width <= 0 || height <= 0) throw new Error("Screenshot element is outside the viewport");
  return { x, y, width, height, scale: 1 };
}
