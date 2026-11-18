/** Structured browser input; accepts no evaluated caller scripts or activation expressions. */
import { pageCall } from './html-capture-page.mjs';
import { setTimeout as delay } from 'node:timers/promises';

function target({ selector, focused }) {
  const candidates = focused ? [document.activeElement] : [...document.querySelectorAll(selector)];
  const matches = candidates.filter((el) => {
    if (!el || (focused && el === document.body)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (matches.length !== 1) throw new Error('Action target must match one visible element');
  const el = matches[0];
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (
    el.disabled ||
    el.getAttribute('aria-disabled') === 'true' ||
    !hit ||
    !(hit === el || el.contains(hit))
  )
    throw new Error('Action target is disabled or covered');
  if (
    /delete|remove|pay|purchase|send|submit|logout|terminate|删除|支付|发送/i.test(
      el.textContent || '',
    ) ||
    (el.type === 'submit' && el.closest('form'))
  )
    throw new Error('Business submission is not executed');
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function setValue({ selector, value, type }) {
  const els = document.querySelectorAll(selector);
  if (els.length !== 1) throw new Error('Value target must match one element');
  const el = els[0];
  const rect = el.getBoundingClientRect(),
    style = getComputedStyle(el);
  if (
    el.disabled ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    style.display === 'none' ||
    style.visibility === 'hidden'
  )
    throw new Error('Value target must be visible and enabled');
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
    throw new Error('Unsupported value target');
  if (type === 'select' && el.tagName !== 'SELECT')
    throw new Error('select requires a select element');
  const setter = Object.getOwnPropertyDescriptor(
    el.tagName === 'SELECT'
      ? HTMLSelectElement.prototype
      : el.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
    'value',
  ).set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
/** Wait at most three seconds for one visible target; no selector means the normal two-frame settle. */
async function waitForTarget(page, selector, signal) {
  const deadline = Date.now() + 3000;
  do {
    signal?.throwIfAborted();
    const visible = await page.evaluate(
      pageCall(
        ({ selector }) => {
          const matches = [...document.querySelectorAll(selector)].filter((el) => {
            const r = el.getBoundingClientRect(),
              style = getComputedStyle(el);
            return (
              r.width > 0 &&
              r.height > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none'
            );
          });
          return matches.length === 1;
        },
        { selector },
      ),
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
      if (['click', 'hover'].includes(step.type)) {
        const point = await page.evaluate(pageCall(target, step));
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
      } else if (['select', 'fill'].includes(step.type))
        await page.evaluate(pageCall(setValue, step));
      else if (step.type === 'key') {
        if (
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
        if (['Enter', ' '].includes(step.value))
          await page.evaluate(pageCall(target, { focused: true }));
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: step.value });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: step.value });
      } else if (step.type === 'wait' && step.selector)
        await waitForTarget(page, step.selector, signal);
      else if (step.type === 'scroll')
        await page.evaluate(
          pageCall(({ selector, x, y }) => {
            const el = selector ? document.querySelector(selector) : document.scrollingElement;
            if (!el) throw new Error('Scroll target unavailable');
            el.scrollTo(Number(x) || 0, Number(y) || 0);
          }, step),
        );
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
