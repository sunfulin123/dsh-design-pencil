import { AssetStoreError } from './asset-store.mjs';

const DEFAULT_STYLE = 'talkdesk-cobalt';
const VALID_MODES = new Set(['ask_user', 'explicit', 'default', 'existing', 'reselect']);

function styleAliases(entry) {
  return [
    entry.id,
    entry.name,
    ...(entry.id.startsWith('design-md:') ? [entry.id.slice('design-md:'.length)] : []),
    ...(entry.id === DEFAULT_STYLE ? ['Talkdesk Cobalt', 'Cobalt'] : []),
  ]
    .filter((name) => typeof name === 'string')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function resolveExplicitStyle(entries, ordered, rawStyleId) {
  const needle = typeof rawStyleId === 'string' ? rawStyleId.trim() : '';
  if (!needle) {
    throw new AssetStoreError('asset-invalid', 'styleMode="explicit" requires styleId');
  }
  const exact = entries.find((entry) => entry.id === needle);
  if (exact) return exact;
  const codeMatch = /^s(\d+)$/iu.exec(needle);
  if (codeMatch) {
    const index = Number(codeMatch[1]) - 1;
    if (index >= 0 && index < ordered.length) return ordered[index];
  }
  const lower = needle.toLowerCase();
  const matches = entries.filter((entry) => styleAliases(entry).includes(lower));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return 'ambiguous';
  throw new AssetStoreError('asset-not-found', `Unknown style-guide: ${needle}`);
}

function resolveExistingDocumentStyle(entries, args) {
  if (args.documentHasStyle) return { decision: 'use_document' };
  if (args.documentStyleId) {
    if (!entries.some((item) => item.id === args.documentStyleId)) {
      throw new AssetStoreError('asset-not-found', `Unknown style-guide: ${args.documentStyleId}`);
    }
    return { decision: 'use_existing', guideId: args.documentStyleId };
  }
  return undefined;
}

function choice(entries, ordered, args) {
  const mode = args.styleMode;
  if (mode !== undefined && !VALID_MODES.has(mode)) {
    throw new AssetStoreError('asset-invalid', `Unsupported styleMode: ${String(mode)}`);
  }
  if (mode === 'reselect') return { decision: 'ask_user' };
  if (mode === 'explicit' || (mode === undefined && typeof args.styleId === 'string' && args.styleId.trim().length > 0)) {
    const resolved = resolveExplicitStyle(entries, ordered, args.styleId);
    return resolved === 'ambiguous'
      ? { decision: 'ask_user' }
      : { decision: 'use_explicit', guideId: resolved.id };
  }
  if (args.taskKind === 'continue' || args.taskKind === 'local') {
    const inherited = resolveExistingDocumentStyle(entries, args);
    if (inherited) return inherited;
  }
  if (mode === 'existing') {
    return resolveExistingDocumentStyle(entries, args) ?? { decision: 'ask_user' };
  }
  if (mode === 'default') {
    return { decision: 'use_default', guideId: DEFAULT_STYLE };
  }
  return { decision: 'ask_user' };
}

export async function planDesignStyle(assets, args = {}) {
  const messageText = String(args.userMessage ?? '');
  if (Buffer.byteLength(messageText, 'utf8') > 64 * 1024)
    throw new AssetStoreError('asset-invalid', 'Design request exceeds 64 KiB');
  const snapshot = await assets.catalog();
  const entries = snapshot.assets.filter((item) => item.kind === 'style-guide');
  if (!entries.some((item) => item.id === DEFAULT_STYLE)) {
    throw new AssetStoreError('asset-not-found', 'The recommended style is unavailable');
  }
  const ordered = [...entries].sort(
    (a, b) => Number(b.id === DEFAULT_STYLE) - Number(a.id === DEFAULT_STYLE),
  );
  const selected = choice(entries, ordered, args);
  const query = (args.query ?? '').trim().toLowerCase();
  const filtered = ordered.filter((entry) =>
    !query || `${entry.name} ${entry.id}`.toLowerCase().includes(query));
  const offset = args.offset ?? 0;
  const limit = args.limit ?? 50;
  assets.checkRevision(snapshot.revision);
  return {
    ...selected,
    recommendedId: DEFAULT_STYLE,
    catalogRevision: snapshot.revision,
    count: filtered.length,
    nextOffset: offset + limit < filtered.length ? offset + limit : null,
    candidates: filtered.slice(offset, offset + limit),
    question: 'Choose a design style. Talkdesk Cobalt is recommended.',
  };
}
