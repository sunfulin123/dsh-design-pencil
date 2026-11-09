import { figmaErrorResult } from './engine-session.mjs';
import { compareFigmaFidelity } from './figma-fidelity.mjs';
import { compareHtmlFidelity } from './html-fidelity.mjs';

// Routes a screenshot to a live CanvasKit renderer: the hidden headless one
// (started on demand) or an open editor tab. Without Chrome, falls back to
// the approximate server-side preview and says so in the result.
export async function captureScreenshot(lifecycle, session, args, version = session.version()) {
  const shots = lifecycle.screenshots;
  const headless = lifecycle.headless;
  if (headless?.available) {
    if (shots.connected('headless')) headless.touch();
    else await headless.ensure();
  } else if (headless && !shots.connected('editor')) {
    const result = session.callTool('get_screenshot', args);
    if (!result.isError) {
      const meta = {
        ...result.structuredContent,
        renderer: 'approximate',
        note: 'No Chrome was found; this preview omits text shaping and effects. Set DSH_CHROME_PATH for exact captures.',
      };
      result.structuredContent = meta;
      result.content = result.content.map((item) =>
        item.type === 'text' ? { type: 'text', text: JSON.stringify(meta) } : item,
      );
    }
    return result;
  }
  return shots.capture(args, version);
}

function fidelityContext(lifecycle, session) {
  return {
    capture: (args, version) => captureScreenshot(lifecycle, session, args, version),
    layout: () => session.callTool('snapshot_layout', { maxDepth: 100 }),
    version: () => session.version(),
    document: () => session.snapshot().document,
  };
}

/**
 * Tools that need the live renderer or a browser, answered by the host
 * rather than the engine. Returns `undefined` for every other tool.
 */
export async function callRenderTool(name, args, lifecycle, session) {
  if (name === 'sample_color') return lifecycle.colorSampler.sample(args, session.version());
  if (name === 'get_screenshot') return captureScreenshot(lifecycle, session, args);
  if (name === 'compare_figma_fidelity') {
    try {
      return await compareFigmaFidelity(args, fidelityContext(lifecycle, session));
    } catch (error) {
      return figmaErrorResult(error);
    }
  }
  if (name === 'compare_html_fidelity') {
    try {
      return await compareHtmlFidelity(args, fidelityContext(lifecycle, session));
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
      };
    }
  }
  return undefined;
}
