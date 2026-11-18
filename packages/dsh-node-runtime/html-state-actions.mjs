/** Structured browser input scoped to visible, same-origin documents. */
import { setTimeout as delay } from 'node:timers/promises';
import { framePageCall } from './html-frame-context.mjs';

function prepareAction(step, context) {
  const { doc, frames } = context.resolve(step.framePath);
  const hasTarget = step.selector || step.locator;
  const matches = hasTarget ? context.targets(doc, step).filter(context.visible) : [];
  if (hasTarget && matches.length !== 1)
    throw new Error('Action target must match one visible element');
  let el = matches[0];

  if (step.type === 'scroll') {
    (el || doc.scrollingElement).scrollTo(step.x || 0, step.y || 0);
    return;
  }
  if (step.type === 'key' && !el) {
    let focused = document;
    while (focused.activeElement?.localName === 'iframe') {
      const child = focused.activeElement.contentDocument;
      if (!child) throw new Error('Focused frame is inaccessible');
      focused = child;
    }
    if (step.framePath && focused !== doc)
      throw new Error('The requested frame does not own keyboard focus');
    if (!['Enter', ' '].includes(step.value)) return;
    el = focused.activeElement;
    if (!context.visible(el) || el === focused.body)
      throw new Error('Keyboard activation requires a focused visible target');
  }

  if (
    el.disabled ||
    el.getAttribute('aria-disabled') === 'true' ||
    el.closest('[inert]') ||
    el.matches('input[type="file"]')
  )
    throw new Error('Action target is disabled or unsupported');
  if (
    /delete|remove|pay|purchase|send|submit|logout|sign.out|terminate|删除|支付|发送/i.test(
      context.name(el),
    ) ||
    (el.type === 'submit' && el.closest('form'))
  )
    throw new Error('Business submission is not executed');

  if (step.type === 'key') {
    el.focus();
    if (el.ownerDocument.activeElement !== el)
      throw new Error('Action target could not be focused');
    return;
  }
  if (['select', 'fill'].includes(step.type)) {
    const win = doc.defaultView;
    const constructors = {
      INPUT: win.HTMLInputElement,
      TEXTAREA: win.HTMLTextAreaElement,
      SELECT: win.HTMLSelectElement,
    };
    if (!constructors[el.tagName]) throw new Error('Unsupported value target');
    if (step.type === 'select' && el.tagName !== 'SELECT')
      throw new Error('select requires a select element');
    if (
      el.tagName === 'SELECT' &&
      ![...el.options].some((option) => option.value === step.value && !option.matches(':disabled'))
    )
      throw new Error('Select option is unavailable');
    const { set } = Object.getOwnPropertyDescriptor(constructors[el.tagName].prototype, 'value');
    set.call(el, step.value);
    el.dispatchEvent(new win.Event('input', { bubbles: true }));
    el.dispatchEvent(new win.Event('change', { bubbles: true }));
    return;
  }

  // Compose frame offsets up to the CDP viewport and verify that no ancestor obscures the hit.
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  const rect = el.getBoundingClientRect();
  let point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const hit = doc.elementFromPoint(point.x, point.y);
  if (!hit || !(hit === el || el.contains(hit))) throw new Error('Action target is covered');
  for (const frame of frames.toReversed()) {
    const win = frame.ownerDocument.defaultView;
    for (let node = frame; node; node = node.parentElement) {
      const transform = win.getComputedStyle(node).transform;
      if (transform === 'none') continue;
      const matrix = new win.DOMMatrixReadOnly(transform);
      if (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0)
        throw new Error('Action frame has an unsupported transform');
    }
    point = context.projectToParent(frame, point);
    if (frame.ownerDocument.elementFromPoint(point.x, point.y) !== frame)
      throw new Error('Action frame is covered');
  }
  return point;
}

/** Wait at most three seconds for one visible target, without revealing hidden controls. */
async function waitForTarget(page, step, signal) {
  const deadline = Date.now() + 3000;
  do {
    signal?.throwIfAborted();
    const visible = await page.evaluate(
      framePageCall((action, context) => {
        const scope = context.resolve(action.framePath, { wait: true });
        return scope && context.targets(scope.doc, action).filter(context.visible).length === 1;
      }, step),
    );
    if (visible) return;
    await delay(50, undefined, { signal });
  } while (Date.now() < deadline);
  throw new Error('Wait target did not become uniquely visible within 3000ms');
}

export async function performSteps(page, steps, signal) {
  if (!Array.isArray(steps) || steps.length > 120) throw new Error('Invalid state action plan');
  for (const [index, step] of steps.entries()) {
    try {
      signal?.throwIfAborted();
      if (
        !step ||
        !['click', 'select', 'fill', 'hover', 'key', 'scroll', 'wait'].includes(step.type)
      )
        throw new Error('Unsupported state action');
      if (step.type === 'wait') {
        if (step.selector || step.locator) await waitForTarget(page, step, signal);
      } else {
        if (
          step.type === 'key' &&
          ![
            'Escape',
            'Tab',
            'Enter',
            'ArrowDown',
            'ArrowUp',
            'ArrowLeft',
            'ArrowRight',
            ' ',
          ].includes(step.value)
        )
          throw new Error('Unsupported state key');
        const point = await page.evaluate(framePageCall(prepareAction, step));
        if (step.type === 'click' || step.type === 'hover') {
          await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
          if (step.type === 'click') {
            await page.send('Input.dispatchMouseEvent', {
              type: 'mousePressed',
              ...point,
              button: 'left',
              clickCount: 1,
            });
            await page.send('Input.dispatchMouseEvent', {
              type: 'mouseReleased',
              ...point,
              button: 'left',
              clickCount: 1,
            });
          }
        } else if (step.type === 'key') {
          await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: step.value });
          await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: step.value });
        }
      }
      await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))', {
        awaitPromise: true,
      });
    } catch (error) {
      throw new Error(`State action ${index + 1} (${step.type}) failed: ${error.message}`, {
        cause: error,
      });
    }
  }
}
