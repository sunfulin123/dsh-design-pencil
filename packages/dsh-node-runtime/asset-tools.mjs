import { readFile, realpath } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { AssetStoreError as AssetError } from './asset-store.mjs';

const KINDS = {
  scene_template: 'scene-template',
  style_guide: 'style-guide',
  theme_preset: 'theme-preset',
};
const READ_TOOLS = new Set(['list_style_guides', 'get_style_guide']);
export const assetReply = (value) => ({
  isError: false,
  content: [{ type: 'text', text: JSON.stringify(value) }],
  structuredContent: value,
});

function validateArgs(schema, args) {
  const properties = schema.inputSchema.properties;
  for (const key of Object.keys(args)) {
    if (!Object.hasOwn(properties, key))
      throw new AssetError('asset-invalid', `Unknown argument: ${key}`);
  }
  for (const key of schema.inputSchema.required ?? []) {
    if (!Object.hasOwn(args, key)) throw new AssetError('asset-invalid', `${key} is required`);
  }
  for (const [key, value] of Object.entries(args)) {
    const rule = properties[key];
    const valid =
      rule.type === 'integer'
        ? Number.isSafeInteger(value)
        : rule.type === 'array'
          ? Array.isArray(value) && value.every((v) => typeof v === rule.items.type)
          : rule.type === 'object'
            ? value && typeof value === 'object' && !Array.isArray(value)
            : typeof value === rule.type;
    if (
      !valid ||
      (rule.enum && !rule.enum.includes(value)) ||
      (rule.minimum !== undefined && value < rule.minimum) ||
      (rule.maximum !== undefined && value > rule.maximum) ||
      (rule.minLength && value.trim().length < rule.minLength) ||
      (rule.minItems && value.length < rule.minItems) ||
      (rule.uniqueItems && new Set(value).size !== value.length)
    ) {
      throw new AssetError('asset-invalid', `Invalid argument: ${key}`);
    }
  }
}

function metadata(asset) {
  const {
    document: _document,
    markdown: _markdown,
    content: _content,
    preset: _preset,
    ...data
  } = asset.payload ?? asset;
  return {
    ...data,
    id: asset.id,
    kind: asset.kind,
    name: asset.name,
    isUser: asset.id.startsWith('user:'),
  };
}

function includeComponentDependencies(children, document) {
  const nodes = new Map();
  const index = (list) => {
    for (const n of list) {
      nodes.set(n.id, n);
      if (n.children) index(n.children);
    }
  };
  index(document.children);
  for (const page of document.pages ?? []) index(page.children);
  const included = new Set();
  const mark = (list) => {
    for (const n of list) {
      included.add(n.id);
      if (n.children) mark(n.children);
    }
  };
  const result = [...children];
  mark(result);
  const references = (list) => {
    for (const node of list) {
      if (node.type === 'ref' && !included.has(node.ref)) {
        const master = nodes.get(node.ref);
        if (!master?.reusable)
          throw new AssetError('asset-invalid', `Missing reusable component: ${node.ref}`);
        result.push(master);
        mark([master]);
        references([master]);
      }
      if (node.children) references(node.children);
    }
  };
  references(children);
  return result;
}

export class AssetTools {
  constructor(session, { store, webRoot, editorControl } = {}) {
    this.session = session;
    this.store = store;
    this.webRoot = webRoot;
    this.editorControl = editorControl;
    this.schemas = new Map(session.listTools().map((s) => [s.name, s]));
    this.names = new Set([
      ...Object.keys(KINDS).flatMap((k) => ['rename', 'delete'].map((verb) => `${verb}_${k}`)),
      'list_scene_templates',
      'get_scene_template',
      'instantiate_scene_template',
      'save_scene_template',
      'import_design_md',
      'list_theme_presets',
      'get_theme_preset',
      'save_theme_preset',
      'import_theme_preset',
      'export_theme_preset',
      'load_theme_preset',
      'get_editor_theme',
      'set_editor_theme',
      ...READ_TOOLS,
    ]);
  }

  handles(name) {
    return this.names.has(name);
  }

  requireStore() {
    if (!this.store)
      throw new AssetError(
        'asset-storage',
        'Persistent assets require a bound document or assetDirectory',
      );
    return this.store;
  }

  async catalog() {
    const snapshot = this.store ? await this.store.snapshot() : { revision: 0, assets: [] };
    const assets = [];
    for (const kind of Object.values(KINDS)) {
      assets.push(...this.session.builtinAssets(kind).map((a) => metadata({ ...a, kind })));
    }
    assets.unshift(
      ...(await Promise.all(
        snapshot.assets.map(async (a) => metadata(await this.store.get(a.kind, a.id))),
      )),
    );
    this.checkRevision(snapshot.revision);
    const view = { revision: snapshot.revision, persistent: Boolean(this.store), assets };
    if (Buffer.byteLength(JSON.stringify(view)) > 32 * 1024 * 1024) {
      throw new AssetError(
        'asset-too-large',
        'Asset catalogue exceeds 32 MiB; use paginated list tools',
      );
    }
    return view;
  }

  checkRevision(revision) {
    if (this.store && this.store.revision() !== revision) {
      throw new AssetError(
        'asset-conflict',
        'Asset revision changed while reading; refresh the catalogue',
      );
    }
  }

  async entries(kind) {
    const snapshot = this.store ? await this.store.snapshot() : { revision: 0, assets: [] };
    return {
      revision: snapshot.revision,
      entries: [
        ...snapshot.assets.filter((a) => a.kind === kind),
        ...this.session.builtinAssets(kind).map((a) => ({ ...a, kind })),
      ],
    };
  }

  async get(kind, id) {
    if (id.startsWith('user:')) return this.requireStore().get(kind, id);
    const builtin = this.session.builtinAssets(kind).find((a) => a.id === id);
    if (!builtin) throw new AssetError('asset-not-found', `Unknown ${kind}: ${id}`);
    if (kind === 'scene-template') {
      if (
        !this.webRoot ||
        !/^\/pkg\/assets\/scene_templates\/[a-z0-9_-]+\.op$/.test(builtin.documentRoute ?? '')
      ) {
        throw new AssetError(
          'asset-storage',
          'Builtin template document is unavailable in this host bundle',
        );
      }
      const root = await realpath(this.webRoot);
      const file = await realpath(join(root, builtin.documentRoute.slice('/pkg/'.length)));
      if (relative(root, file).startsWith('..') || resolve(file) === root) {
        throw new AssetError('asset-invalid', 'Builtin template route escaped its bundle');
      }
      return {
        id,
        kind,
        name: builtin.name,
        payload: { ...builtin, document: JSON.parse(await readFile(file, 'utf8')) },
      };
    }
    return {
      id,
      kind,
      name: builtin.name,
      payload: kind === 'style-guide' ? { ...builtin, markdown: builtin.content } : builtin,
    };
  }

  async list(kind, args) {
    const { revision, entries } = await this.entries(kind);
    const query = (args.query ?? '').toLowerCase();
    const filtered = [];
    for (const entry of entries) {
      const user = entry.id.startsWith('user:');
      if (args.source && args.source !== (user ? 'user' : 'builtin')) continue;
      if (query && !entry.name.toLowerCase().includes(query)) continue;
      const item = user ? metadata(await this.get(kind, entry.id)) : metadata(entry);
      if (args.category && item.category !== args.category) continue;
      if (args.tag && !(item.tags ?? []).includes(args.tag)) continue;
      if (args.platform && item.platform !== args.platform) continue;
      filtered.push(item);
    }
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 100;
    this.checkRevision(revision);
    return {
      revision,
      count: filtered.length,
      nextOffset: offset + limit < filtered.length ? offset + limit : null,
      [kind === 'style-guide' ? 'guides' : kind === 'theme-preset' ? 'presets' : 'templates']:
        filtered.slice(offset, offset + limit),
    };
  }

  async call(name, args = {}) {
    const schema = this.schemas.get(name);
    if (!schema) throw new AssetError('asset-invalid', `Tool schema missing: ${name}`);
    validateArgs(schema, args);
    if (name.endsWith('editor_theme')) {
      if (!this.editorControl)
        throw new AssetError('editor-unavailable', 'No editor theme control is connected');
      return assetReply(await this.editorControl.request(name, args));
    }
    if (name === 'import_design_md' && args.target === 'document') {
      return this.session.callTool('set_design_md', { markdown: args.markdown });
    }
    if (name.startsWith('rename_') || name.startsWith('delete_')) {
      const [verb, ...suffix] = name.split('_');
      const kind = KINDS[suffix.join('_')];
      return assetReply(
        verb === 'rename'
          ? await this.requireStore().rename(kind, args.id, args.name, args)
          : await this.requireStore().remove(kind, args.id, args),
      );
    }
    let kind = name.includes('scene_template')
      ? 'scene-template'
      : name.includes('theme_preset')
        ? 'theme-preset'
        : 'style-guide';
    if (name.startsWith('list_') && !args.id) return assetReply(await this.list(kind, args));
    if (name === 'get_style_guide' && !args.id) {
      if (!args.name) return this.session.callTool(name, args);
      const { entries } = await this.entries(kind);
      args = { ...args, id: entries.find((a) => a.name === args.name)?.id };
      if (!args.id)
        return this.session.callTool(name, {
          name: args.name,
          tags: args.tags,
          platform: args.platform,
        });
    }
    if (name.startsWith('get_') || name.startsWith('export_') || name === 'list_style_guides') {
      const asset = await this.get(kind, args.id);
      const value = { ...metadata(asset), ...asset.payload };
      if (kind === 'style-guide') value.content = asset.payload.markdown;
      return assetReply(name === 'list_style_guides' ? { guides: [value] } : value);
    }
    if (name === 'instantiate_scene_template' || name === 'load_theme_preset') {
      const asset = await this.get(kind, args.id);
      const result = this.session.applyAsset(kind, asset.payload, args);
      if (!result.isError) {
        result.structuredContent.version = this.session.version();
        result.content = [{ type: 'text', text: JSON.stringify(result.structuredContent) }];
      }
      return result;
    }
    let payload;
    if (name === 'import_design_md') {
      payload = { name: args.name?.trim() || 'Imported style', markdown: args.markdown };
      const parsed = this.session.validateAsset(kind, payload);
      payload = { ...parsed, name: args.name?.trim() || parsed.importedName || parsed.name };
    } else if (name === 'import_theme_preset') {
      payload = { name: args.preset.name, preset: args.preset };
    } else {
      const document = this.session.assetDocument();
      if (kind === 'theme-preset') {
        payload = {
          name: args.name,
          preset: {
            type: 'openpencil-theme-preset',
            version: '1.0.0',
            name: args.name,
            themes: document.themes ?? {},
            variables: document.variables ?? {},
          },
        };
      } else {
        const page = document.pages?.[document.editorMeta?.activePageIndex ?? 0];
        let children = page?.children ?? document.children;
        if (args.nodeIds) {
          const roots = new Map();
          const walk = (nodes) => {
            for (const n of nodes) {
              roots.set(n.id, n);
              if (n.children) walk(n.children);
            }
          };
          walk(children);
          children = args.nodeIds.map((id) => {
            if (!roots.has(id)) throw new AssetError('asset-not-found', `Unknown node: ${id}`);
            return roots.get(id);
          });
        }
        children = includeComponentDependencies(children, document);
        payload = {
          name: args.name,
          document: {
            ...document,
            children,
            pages: undefined,
            editorMeta: { ...document.editorMeta, activePageIndex: 0 },
          },
        };
      }
    }
    payload = this.session.validateAsset(kind, payload);
    return assetReply(await this.requireStore().put(kind, payload, args));
  }
}
