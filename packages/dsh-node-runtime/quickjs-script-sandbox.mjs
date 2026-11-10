import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core';
import quickJSVariant from '@jitl/quickjs-wasmfile-release-sync';

// The interpreter has its own heap and receives only primitive-valued
// callbacks. Node's vm contexts are not a boundary for untrusted scripts.
const quickJS = await newQuickJSWASMModuleFromVariant(quickJSVariant);
const MEMORY_LIMIT = 64 * 1024 * 1024;
const STACK_LIMIT = 1024 * 1024;
const TIME_LIMIT_MS = 2000;

function readArgument(context, handle) {
  const type = context.typeof(handle);
  if (type === 'string') return context.getString(handle);
  if (type === 'number') return context.getNumber(handle);
  if (type === 'undefined') return undefined;
  throw new Error('Design script callbacks accept only strings and numbers');
}

function evaluate(context, source) {
  const result = context.evalCode(source, 'design-script.js', { type: 'global' });
  if (result.error) {
    try {
      const error = context.dump(result.error);
      throw new Error(typeof error?.message === 'string' ? error.message : String(error));
    } finally {
      result.error.dispose();
    }
  }
  result.value.dispose();
}

export function runIsolatedDesignScript(prelude, script, callbacks, preserveAuthoredGeometry) {
  const runtime = quickJS.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT);
  runtime.setMaxStackSize(STACK_LIMIT);
  const deadline = Date.now() + TIME_LIMIT_MS;
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const context = runtime.newContext();
  try {
    context.setProp(context.global, '__preserveAuthoredGeometry',
      preserveAuthoredGeometry ? context.true : context.false);
    for (const [name, callback] of Object.entries(callbacks)) {
      const fn = context.newFunction(name, (...handles) => {
        const result = callback(...handles.map((handle) => readArgument(context, handle)));
        return result === undefined ? undefined : context.newString(result);
      });
      context.setProp(context.global, name, fn);
      fn.dispose();
    }
    evaluate(context, prelude);
    evaluate(context, `for (const name of ['I', 'K']) Object.defineProperty(globalThis, name, { writable: false, configurable: false });`);
    evaluate(context, `'use strict';\n${script}`);
  } finally {
    context.dispose();
    runtime.dispose();
  }
}
