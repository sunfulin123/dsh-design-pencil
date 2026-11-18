/** Same-origin frame traversal shared by state discovery, replay and browser snapshot capture. */
export const MAX_HTML_FRAME_DEPTH = 4;
const MAX_HTML_FRAMES = 16;

export function framePageCall(fn, argument = {}) {
  return `(${fn.toString()})(${JSON.stringify(argument)},(${htmlFrameContext.toString()})(${MAX_HTML_FRAME_DEPTH},${MAX_HTML_FRAMES}))`;
}

export function accessibleFramePaths(_args, context) {
  return context.inventory();
}

// This function runs in Chromium. External dependencies must be passed as arguments.
function htmlFrameContext(maxDepth, maxFrames) {
  const visible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = el.ownerDocument.defaultView.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.visibility !== 'collapse'
    );
  };
  const exactSelector = (el, attribute) => {
    const value = el.getAttribute(attribute);
    if (!value || value.length > 500) return undefined;
    const candidate = `${el.localName}[${CSS.escape(attribute)}="${CSS.escape(value)}"]`;
    if (el.ownerDocument.querySelectorAll(candidate).length === 1) return candidate;
    return undefined;
  };
  const stableSelector = (el) => {
    for (const attribute of ['data-testid', 'data-test', 'data-qa', 'data-cy']) {
      const result = exactSelector(el, attribute);
      if (result) return result;
    }
    if (el.id && !/^(?::[rR]|react-aria|radix-:|headlessui-.*-:|aria-\d)/i.test(el.id)) {
      const id = '#' + CSS.escape(el.id);
      if (el.ownerDocument.querySelectorAll(id).length === 1) return id;
    }
    for (const { name } of el.attributes) {
      if (!/^data-.*(?:panel|target|page|view|tab)$/i.test(name)) continue;
      const result = exactSelector(el, name);
      if (result) return result;
    }
    return undefined;
  };
  const frameSelector = (frame) =>
    stableSelector(frame) ||
    exactSelector(frame, 'title') ||
    exactSelector(frame, 'name') ||
    exactSelector(frame, 'src') ||
    (frame.ownerDocument.querySelectorAll('iframe').length === 1 ? 'iframe' : undefined);
  const childDocument = (frame) => {
    const doc = frame.contentDocument;
    if (!doc?.body || !doc.defaultView) return undefined;
    // While a non-blank src is loading, the frame may briefly expose a blank inherited Document.
    if (
      doc.URL === 'about:blank' &&
      frame.src &&
      !frame.hasAttribute('srcdoc') &&
      frame.src !== 'about:blank'
    )
      return undefined;
    return doc;
  };
  const role = (el) => {
    const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
    if (explicit) return explicit;
    if (el.localName === 'summary') return 'button';
    if (el.localName === 'button') return 'button';
    if (el.localName === 'a' && el.hasAttribute('href')) return 'link';
    if (el.localName === 'textarea') return 'textbox';
    if (el.localName === 'select') return el.multiple || el.size > 1 ? 'listbox' : 'combobox';
    if (el.localName === 'input')
      return (
        {
          search: 'searchbox',
          checkbox: 'checkbox',
          radio: 'radio',
          range: 'slider',
          button: 'button',
          submit: 'button',
          reset: 'button',
          number: 'spinbutton',
        }[el.type] || 'textbox'
      );
    return undefined;
  };
  const name = (el) => {
    const labelledBy = el.getAttribute('aria-labelledby');
    const labelled = labelledBy
      ?.trim()
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() || '')
      .filter(Boolean)
      .join(' ');
    const label = el.labels ? [...el.labels].map((item) => item.textContent || '').join(' ') : '';
    const buttonValue = el.localName === 'input' && role(el) === 'button' ? el.value : '';
    return (
      labelled ||
      el.getAttribute('aria-label') ||
      label ||
      buttonValue ||
      el.innerText ||
      el.getAttribute('title') ||
      el.getAttribute('name') ||
      ''
    )
      .trim()
      .replace(/\s+/g, ' ');
  };
  const targets = (doc, options) => {
    if (options.selector) return [...doc.querySelectorAll(options.selector)];
    const locator = options.locator;
    if (!locator) return [];
    // Only native controls and elements with explicit roles participate in semantic replay.
    return [...doc.querySelectorAll('button,a[href],input,textarea,select,summary,[role]')].filter(
      (el) => role(el) === locator.role && name(el) === locator.name,
    );
  };
  const resolve = (framePath = [], { wait = false } = {}) => {
    if (framePath.length > maxDepth) throw new Error('Frame depth limit reached');
    let doc = document;
    const frames = [];
    for (const selector of framePath) {
      const matches = [...doc.querySelectorAll(selector)];
      if (matches.length > 1 || (matches[0] && matches[0].localName !== 'iframe'))
        throw new Error('Frame path must match one visible iframe at each level');
      const frame = matches[0];
      if (!visible(frame)) {
        if (wait) return null;
        throw new Error('Frame path must match one visible iframe at each level');
      }
      doc = childDocument(frame);
      if (!doc) {
        if (wait) return null;
        throw new Error('Frame is inaccessible, restricted or not ready');
      }
      frames.push(frame);
    }
    return { doc, frames };
  };
  const frameScale = (frame, rect) => ({
    x: rect.width / frame.offsetWidth,
    y: rect.height / frame.offsetHeight,
  });
  const projectToParent = (frame, point) => {
    const rect = frame.getBoundingClientRect();
    const scale = frameScale(frame, rect);
    return {
      x: rect.left + (frame.clientLeft + point.x) * scale.x,
      y: rect.top + (frame.clientTop + point.y) * scale.y,
    };
  };
  const boardRect = (el) => {
    const rect = el.getBoundingClientRect();
    let point = { x: rect.left, y: rect.top };
    let { width, height } = rect;
    let doc = el.ownerDocument;
    for (let frame; (frame = doc.defaultView.frameElement); doc = frame.ownerDocument) {
      const scale = frameScale(frame, frame.getBoundingClientRect());
      point = projectToParent(frame, point);
      width *= scale.x;
      height *= scale.y;
    }
    const body = doc.body.getBoundingClientRect();
    return { x: point.x - body.left, y: point.y - body.top, width, height };
  };
  const inventory = () => {
    const result = [{ framePath: [], status: 'available' }];
    let framesSeen = 0;
    const visit = (doc, parentPath) => {
      for (const frame of doc.querySelectorAll('iframe')) {
        if (!visible(frame)) continue;
        if (++framesSeen > maxFrames) {
          if (framesSeen === maxFrames + 1)
            result.push({
              framePath: parentPath,
              status: 'limit',
              reason: 'Visible iframe count limit reached',
            });
          return;
        }
        const selector = frameSelector(frame);
        const label = frame.getAttribute('title') || frame.getAttribute('name') || 'Embedded frame';
        if (!selector) {
          result.push({
            framePath: parentPath,
            label,
            status: 'restricted',
            reason: 'No unique stable iframe locator',
          });
          continue;
        }
        const framePath = [...parentPath, selector];
        if (framePath.length > maxDepth) {
          result.push({
            framePath,
            label,
            status: 'limit',
            reason: 'Visible iframe depth limit reached',
          });
          continue;
        }
        const child = childDocument(frame);
        if (!child) {
          result.push({
            framePath,
            label,
            status: 'restricted',
            reason: 'Iframe is inaccessible, restricted or not ready',
          });
          continue;
        }
        result.push({
          framePath,
          label,
          status: 'available',
          url: child.defaultView.location.pathname + child.defaultView.location.search,
        });
        visit(child, framePath);
      }
    };
    visit(document, []);
    return result;
  };
  return {
    visible,
    stableSelector,
    resolve,
    inventory,
    targets,
    role,
    name,
    projectToParent,
    boardRect,
  };
}
