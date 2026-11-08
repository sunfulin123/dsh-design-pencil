import vm from 'node:vm';
import { SCRIPT_PRELUDE } from './script-prelude.mjs';

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
  const variables = {};
  const themes = {};
  let counter = 0;
  let bytesUsed = 0;
  const pushOp = (line) => {
    if (lines.length >= MAX_RECORDED_LINES || bytesUsed >= MAX_RECORDED_BYTES) return;
    if (bytesUsed + line.length <= MAX_RECORDED_BYTES) {
      bytesUsed += line.length;
      lines.push(line);
    } else {
      bytesUsed = MAX_RECORDED_BYTES;
    }
  };
  const sandbox = {
    __preserveAuthoredGeometry: Boolean(options.preserveAuthoredGeometry),
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
      try {
        variables[name] = JSON.parse(json);
      } catch {
        // Ignore malformed variable entry
      }
      return `$${name}`;
    },
    __recordT(axis, json) {
      try {
        themes[axis] = JSON.parse(json);
      } catch {
        // Ignore malformed theme entry
      }
      return axis;
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(SCRIPT_PRELUDE, context, { timeout: 2000 });
  vm.runInContext(stripped, context, { timeout: 2000 });
  if (
    lines.length === 0 &&
    Object.keys(variables).length === 0 &&
    Object.keys(themes).length === 0
  ) {
    throw new Error('script recorded no operations');
  }
  return {
    operations: lines.join('\n'),
    variables,
    themes,
  };
}
