import { readFileSync, realpathSync } from 'node:fs';
import { isIP } from 'node:net';
import { isAbsolute, relative, resolve } from 'node:path';

export const VIRTUAL_PROJECT_ORIGIN = 'https://openpencil.local/__op_project__/';

export function collectLocalHtmlResources(html, baseDir) {
  const resources = {};
  if (!baseDir) return resources;
  let rootReal;
  try {
    rootReal = realpathSync(baseDir);
  } catch {
    return resources;
  }
  const refs = new Set();
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1]?.trim();
    if (!raw || /^(?:https?:|data:|blob:|mailto:|javascript:|#)/i.test(raw)) continue;
    const clean = raw.split(/[?#]/)[0]?.replace(/^\/+/, '');
    if (clean) refs.add(clean);
  }
  for (const href of refs) {
    try {
      const decoded = decodeURIComponent(href);
      if (!decoded || decoded.includes('\0') || isAbsolute(decoded)) continue;
      const candidate = realpathSync(resolve(rootReal, decoded));
      const rel = relative(rootReal, candidate);
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) continue;
      const bytes = readFileSync(candidate);
      if (bytes.byteLength <= 4 * 1024 * 1024) {
        const b64 = bytes.toString('base64');
        resources[href] = b64;
        resources[decoded] = b64;
        resources[`${VIRTUAL_PROJECT_ORIGIN}${href}`] = b64;
        resources[`${VIRTUAL_PROJECT_ORIGIN}${decoded}`] = b64;
      }
    } catch {
      // Ignore missing or unreadable optional local assets.
    }
  }
  return resources;
}

function isRestrictedHost(hostname) {
  const host = hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  )
    return true;
  const ipKind = isIP(host);
  if (ipKind === 4) {
    const parts = host.split('.').map(Number);
    if (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    )
      return true;
  } else if (ipKind === 6) {
    if (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fe80:') ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('::ffff:127.')
    )
      return true;
  }
  return false;
}

export function validateExternalUrl(rawUrl, allowLocal = false) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl ?? '').trim());
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }
  if (!allowLocal && isRestrictedHost(parsed.hostname)) {
    throw new Error(`URL host is restricted: ${parsed.hostname}`);
  }
  return parsed;
}

export async function fetchRemoteHtmlWithResources(rawUrl, { allowLocal = false } = {}) {
  const initialUrl = validateExternalUrl(rawUrl, allowLocal);
  const response = await fetch(initialUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${initialUrl.href}`);
  const finalUrl = validateExternalUrl(response.url || initialUrl.href, allowLocal);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('HTML response exceeds 10 MiB limit');
  const html = new TextDecoder('utf-8').decode(bytes);
  const resources = {};
  const refs = new Set();
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1]?.trim();
    if (!raw || /^(?:data:|blob:|mailto:|javascript:|#)/i.test(raw)) continue;
    try {
      const resolved = new URL(raw, finalUrl.href).href;
      refs.add(resolved);
    } catch {
      // Ignore malformed subresource URLs.
    }
  }
  for (const resourceUrl of [...refs].slice(0, 32)) {
    try {
      const validated = validateExternalUrl(resourceUrl, allowLocal);
      const sub = await fetch(validated, {
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      if (!sub.ok) continue;
      const subBytes = Buffer.from(await sub.arrayBuffer());
      if (subBytes.byteLength <= 4 * 1024 * 1024) {
        resources[resourceUrl] = subBytes.toString('base64');
      }
    } catch {
      // Ignore unreachable optional subresources.
    }
  }
  return { html, bytes, finalUrl: finalUrl.href, resources };
}
