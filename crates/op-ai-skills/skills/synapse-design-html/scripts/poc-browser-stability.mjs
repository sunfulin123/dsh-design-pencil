/** Wait for a visible capture target and its ancestors to finish finite motion without disabling CSS. */
import { setTimeout as delay } from 'node:timers/promises';
import { frameExpression } from './poc-browser-actions.mjs';

export async function waitForStableTarget(page, step, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let previous, stableSince;
  while (Date.now() < deadline) {
    const state = await page.evaluate(frameExpression(step.frame, `(() => {
      const el=document.querySelector(${JSON.stringify(step.selector)});
      if (!el) return null;
      const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility==='hidden' || cs.display==='none' || Number(cs.opacity)===0) return null;
      const targets=[el,...ctx.frames];
      for(let parent=el.parentElement;parent;parent=parent.parentElement) targets.push(parent);
      const moving=targets.some(target=>target.getAnimations({subtree:target===el}).some(animation=>{
        const timing=animation.effect?.getComputedTiming();
        return timing && Number.isFinite(timing.endTime) && (animation.pending || animation.playState==='running');
      }));
      return {moving,rects:[el,...ctx.frames].map(node=>{
        const b=node.getBoundingClientRect();return [b.x,b.y,b.width,b.height].map(value=>Math.round(value*10)/10);
      })};
    })()`), { evalTimeoutMs: Math.max(1, deadline - Date.now()) });
    const geometry = state && JSON.stringify(state.rects);
    if (state && !state.moving && geometry === previous) {
      stableSince ??= Date.now();
      if (Date.now() - stableSince >= 100) return;
    } else stableSince = undefined;
    previous = geometry;
    await delay(Math.min(50, Math.max(0, deadline - Date.now())));
  }
  throw new Error(`Stable wait timed out for ${step.selector}`);
}
