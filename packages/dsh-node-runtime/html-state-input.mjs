/** Source and structured-plan validation for resumable HTML imports. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { MAX_HTML_FRAME_DEPTH } from './html-frame-context.mjs';
import { collectLocalHtmlResources, fetchRemoteHtmlWithResources } from './html-sources.mjs';
export const hash = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
    .digest('hex');

function validateFramePath(framePath) {
  if (
    framePath !== undefined &&
    (!Array.isArray(framePath) ||
      framePath.length > MAX_HTML_FRAME_DEPTH ||
      framePath.some((part) => typeof part !== 'string' || !part.trim() || part.length > 2000))
  )
    throw new Error('Invalid frame path');
}

function validateLocator(locator) {
  if (locator === undefined) return;
  if (
    !locator ||
    typeof locator !== 'object' ||
    Object.keys(locator).some((key) => !['role', 'name'].includes(key)) ||
    typeof locator.role !== 'string' ||
    !/^[a-z][a-z0-9-]{0,39}$/.test(locator.role) ||
    typeof locator.name !== 'string' ||
    !locator.name.trim() ||
    locator.name.length > 160
  )
    throw new Error('Invalid action locator');
}

export function validateHtmlStatePlan(states) {
  if (!Array.isArray(states) || states.length > 40)
    throw new Error('State plan must contain at most 40 states');
  for (const state of states) {
    if (!state || typeof state.id !== 'string' || state.id.length > 200)
      throw new Error('State id is required');
    if (
      state.excludeReason !== undefined &&
      (typeof state.excludeReason !== 'string' || !state.excludeReason.trim())
    )
      throw new Error('Excluded state requires a reason');
    if (
      state.expected !== undefined &&
      (typeof state.expected !== 'string' || state.expected.length > 2000)
    )
      throw new Error('Invalid expected interface selector');
    validateFramePath(state.expectedFramePath);
    if (state.steps !== undefined) {
      if (!Array.isArray(state.steps) || state.steps.length > 120)
        throw new Error('Invalid state steps');
      for (const step of state.steps) {
        if (
          !step ||
          !['click', 'select', 'fill', 'hover', 'key', 'scroll', 'wait'].includes(step.type) ||
          Object.keys(step).some(
            (key) => !['type', 'selector', 'locator', 'framePath', 'value', 'x', 'y'].includes(key),
          )
        )
          throw new Error('Unsupported state step');
        validateFramePath(step.framePath);
        validateLocator(step.locator);
        if (step.selector !== undefined && step.locator !== undefined)
          throw new Error('Use one action selector or locator');
        if (
          ['click', 'hover', 'fill', 'select'].includes(step.type) &&
          !step.locator &&
          (typeof step.selector !== 'string' || !step.selector.trim())
        )
          throw new Error('Action selector or locator is required');
        if (['fill', 'select', 'key'].includes(step.type) && typeof step.value !== 'string')
          throw new Error('Action value is required');
        if (
          step.selector !== undefined &&
          (typeof step.selector !== 'string' || step.selector.length > 2000)
        )
          throw new Error('Invalid action selector');
        if (
          ['x', 'y'].some(
            (k) =>
              step[k] !== undefined && (!Number.isFinite(step[k]) || Math.abs(step[k]) > 1000000),
          )
        )
          throw new Error('Invalid scroll coordinates');
        if (
          step.value !== undefined &&
          (typeof step.value !== 'string' || step.value.length > 10000)
        )
          throw new Error('Invalid action value');
      }
    }
  }
  return states;
}

export async function readHtmlStateSource(options, expectedFingerprint) {
  let bytes,
    baseDir = null,
    targetUrl = null,
    resources = {};
  if (typeof options.html === 'string') {
    bytes = Buffer.from(options.html);
  } else if (options.htmlPath) {
    const path = resolve(options.htmlPath);
    bytes = await readFile(path);
    baseDir = dirname(path);
    resources = collectLocalHtmlResources(bytes.toString('utf8'), baseDir);
  } else if (options.url) {
    const fetched = await fetchRemoteHtmlWithResources(options.url, {
      allowLocal: options.allowLocalUrl === true,
    });
    bytes = fetched.bytes;
    targetUrl = fetched.finalUrl;
    resources = fetched.resources;
  } else throw new Error('htmlPath or url is required');
  const fingerprint = hash([bytes.toString('utf8'), resources]);
  if (expectedFingerprint && expectedFingerprint !== fingerprint)
    throw new Error('HTML source or referenced resources changed; analyze again');

  return { htmlBytes: bytes, baseDir, targetUrl, fingerprint };
}

/** Bounded evidence includes exact source ranges so a truncated excerpt is never a full-read claim. */
export function sourceEvidence(source, options, observedText) {
  const html = source.htmlBytes.toString('utf8');
  const lineAt = (offset) => html.slice(0, offset).split('\n').length;
  const bodyAt = Math.max(0, html.search(/<body\b/i));
  const markup = html.slice(bodyAt).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const blocks = scripts.slice(0, 20).map((match) => ({
    source: options.htmlPath || options.url || 'inline HTML',
    sourceStartLine: lineAt(match.index),
    sourceEndLine: lineAt(match.index + match[0].length),
    src: /\bsrc\s*=\s*['"]([^'"]+)['"]/i.exec(match[1])?.[1],
    text: match[2].slice(0, 60000),
    totalCharacters: match[2].length,
    truncated: match[2].length > 60000,
  }));
  return {
    source: options.htmlPath || options.url || 'inline HTML',
    bodyText: observedText,
    htmlBody: markup.slice(0, 120000),
    bodyStartLine: lineAt(bodyAt),
    bodyTruncated: markup.length > 120000,
    scripts: blocks,
    scriptsTruncated: scripts.length > 20 || blocks.some((b) => b.truncated),
    externalScripts: blocks.filter((b) => b.src).map((b) => b.src),
    scope:
      'Browser observations and bounded source excerpts; unread source ranges require follow-up and arbitrary application states cannot be proven exhaustive',
  };
}
