import { SCRIPT_PRELUDE } from './script-prelude.mjs';
import { runIsolatedDesignScript } from './quickjs-script-sandbox.mjs';
import { extractDesignSpecFonts } from './font-resolution.mjs';

const MAX_SCRIPT_BYTES = 262_144;
const MAX_RECORDED_LINES = 4096;
const MAX_RECORDED_BYTES = 8 * 1024 * 1024;

export function expandScriptWithVariables(rawScript, options = {}) {
  const stripped = String(rawScript ?? '')
    .trim()
    .replace(/^```(?:javascript|js|ts)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  if (!stripped) throw new Error('script must not be empty');
  if (Buffer.byteLength(stripped, 'utf8') > MAX_SCRIPT_BYTES) {
    throw new Error(`script exceeds ${MAX_SCRIPT_BYTES} byte limit`);
  }
  const lines = [];
  const variables = Object.create(null);
  const themes = Object.create(null);
  let counter = 0;
  let bytesUsed = 0;
  let records = 0;
  let limitExceeded = false;
  const reserve = (content) => {
    const size = Buffer.byteLength(content, 'utf8');
    if (records >= MAX_RECORDED_LINES || bytesUsed + size > MAX_RECORDED_BYTES) {
      limitExceeded = true;
      throw new Error('Design script recorded too many operations or bytes');
    }
    records += 1;
    bytesUsed += size;
  };
  const pushOp = (line) => {
    reserve(line);
    lines.push(line);
  };
  const callbacks = {
    __record(parent, json) {
      const bind = `b${counter++}`;
      pushOp(`${bind}=I(${parent}, ${json})`);
      return bind;
    },
    __recordK(kit, parent, json) {
      const bind = `b${counter++}`;
      pushOp(`${bind}=K(${kit}, ${parent}, ${json})`);
      return bind;
    },
    __recordC(sourceId, parent, json) {
      const bind = `b${counter++}`;
      pushOp(`${bind}=C(${sourceId}, ${parent}, ${json})`);
      return bind;
    },
    __recordR(targetId, json) {
      const bind = `b${counter++}`;
      pushOp(`${bind}=R(${targetId}, ${json})`);
      return bind;
    },
    __recordU(nodeId, json) {
      pushOp(`U(${nodeId}, ${json})`);
      return nodeId;
    },
    __recordD(nodeId) {
      pushOp(`D(${nodeId})`);
      return nodeId;
    },
    __recordM(nodeId, parentId, index) {
      pushOp(
        index === undefined || !Number.isFinite(index)
          ? `M(${nodeId}, ${parentId})`
          : `M(${nodeId}, ${parentId}, ${Math.max(0, Math.trunc(index))})`,
      );
      return nodeId;
    },
    __recordV(name, json) {
      reserve(name + json);
      try {
        variables[name] = JSON.parse(json);
      } catch {
        // Ignore malformed variable entry
      }
      return `$${name}`;
    },
    __recordT(axis, json) {
      reserve(axis + json);
      try {
        themes[axis] = JSON.parse(json);
      } catch {
        // Ignore malformed theme entry
      }
      return axis;
    },
  };
  const specFonts = options.document ? extractDesignSpecFonts(options.document) : undefined;
  runIsolatedDesignScript(SCRIPT_PRELUDE, stripped, callbacks, {
    preserveAuthoredGeometry: Boolean(options.preserveAuthoredGeometry),
    defaultFontFamily: options.defaultFontFamily ?? specFonts?.bodyFont,
    headingFontFamily: options.headingFontFamily ?? specFonts?.headingFont,
  });
  if (limitExceeded) throw new Error('Design script recorded too many operations or bytes');
  if (
    lines.length === 0 &&
    Object.keys(variables).length === 0 &&
    Object.keys(themes).length === 0
  ) {
    throw new Error('script recorded no operations');
  }
  return {
    operations: lines.join('\n'),
    variables: { ...variables },
    themes: { ...themes },
  };
}
