import { AssetStoreError } from './asset-store.mjs';

const DEFAULT_STYLE = 'talkdesk-cobalt';
const STYLE_INTENT = /风格|样式|主题|design\s*style|\bstyle\b|\btheme\b/i;
const DEFAULT_REQUEST = /(?:用|使用|选择|采用)(?:推荐|默认)(?:的)?(?:风格|主题|样式)?|你(?:来)?(?:决定|定|选)|你自己决定|自动决定|use\s+(?:the\s+)?(?:default|recommended)|you\s+decide|your\s+choice/i;
const CHOOSE_STYLE = /使用|采用|选用|选择|想用|就用|请用|(?:^|[我你他她您们请就想要拟将会])用|就选|^选|换成|切换到|按照|依照|遵循|(?:风格|主题|样式)\s*(?:选|用|定为|是)|\b(?:style|theme)\s*[:：]|\b(?:use|using|choose|select|apply|follow)\b/i;
const DESIGN_REQUEST = /设计|创建|制作|生成|做成|\b(?:design|create|build|make)\b/i;
const STYLE_INQUIRY = /了解|介绍|解释|看看|浏览|比较|对比|预览|区别|\b(?:compare|preview|explain|what is|tell me about)\b/i;
const BARE_CHOICE = /^(?:(?:请|我|我们|就|想)\s*)?(?:选|选择|用|使用|采用|choose|select|use)\s*$/i;
const OTHER_DELEGATION = /(?:布局|文案|内容|尺寸|页面|排版|颜色|字体|间距|layout|copy|content|text|size|color|font)\s*(?:可以|就|由|让|交给)?\s*$/i;
const OTHER_DELEGATION_AFTER = /^\s*(?:一下|下|of\s+|what\s+)?\s*(?:the\s+)?(?:布局|文案|内容|尺寸|页面|排版|颜色|字体|间距|layout|copy|content|text|size|color|font)/iu;

function negatedAt(text, index) {
  const prefix = text.slice(Math.max(0, index - 36), index);
  return /(?:不要|不用|不想|不选|别用|不是|不使用|避免|不|别|\bnot\b|\bavoid\b|don['’]?t|\bno\b)\s*(?:(?:使用|选择|采用|用|use|choose|the)\s*)?$/iu.test(prefix);
}

function styleNames(entry) {
  return [entry.id, entry.name,
    ...(entry.id.startsWith('design-md:') ? [entry.id.slice('design-md:'.length)] : []),
    ...(entry.id === DEFAULT_STYLE ? ['Talkdesk Cobalt', 'Cobalt'] : []),
  ].filter((name) => typeof name === 'string');
}

function mentioned(entry, message) {
  const text = message.trim().toLocaleLowerCase();
  const names = styleNames(entry);
  return names.some((name) => {
    const candidate = name.toLocaleLowerCase();
    if (text === candidate) return true;
    if (candidate.length < 3) return false;
    let index = text.indexOf(candidate);
    while (index >= 0) {
      const before = text[index - 1] ?? '';
      const after = text[index + candidate.length] ?? '';
      const prefix = text.slice(Math.max(0, index - 256), index).split(/[，,。.!?！？;；\n]/u).at(-1);
      const suffix = text.slice(index + candidate.length, index + candidate.length + 256).split(/[，,。.!?！？;；\n]/u, 1)[0];
      const explicitIntent = CHOOSE_STYLE.test(prefix) || (DESIGN_REQUEST.test(prefix) && !STYLE_INQUIRY.test(prefix));
      const styleContext = STYLE_INTENT.test(`${prefix} ${candidate} ${suffix}`)
        || (BARE_CHOICE.test(prefix.trim()) && /^\s*(?:吧|就好|即可|please)?\s*$/iu.test(suffix));
      if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after) && !negatedAt(text, index)
        && styleContext && explicitIntent) return true;
      index = text.indexOf(candidate, index + candidate.length);
    }
    return false;
  });
}

function choice(entries, args) {
  const text = args.userMessage.trim();
  // Ambiguous mentions must be confirmed instead of guessed.
  const matches = entries.filter((entry) => mentioned(entry, text));
  if (matches.length === 1) return { decision: 'use_explicit', guideId: matches[0].id };
  if (args.taskKind === 'continue' || args.taskKind === 'local') {
    if (args.documentHasStyle) return { decision: 'use_document' };
    if (args.documentStyleId) return { decision: 'use_existing', guideId: args.documentStyleId };
  }
  for (const request of text.matchAll(new RegExp(DEFAULT_REQUEST.source, 'giu'))) {
    const preceding = text.slice(Math.max(0, request.index - 20), request.index);
    const following = text.slice(request.index + request[0].length);
    const ambiguousScope = !STYLE_INTENT.test(request[0]);
    if (!negatedAt(text, request.index) && (!ambiguousScope
      || (!OTHER_DELEGATION.test(preceding) && !OTHER_DELEGATION_AFTER.test(following))))
      return { decision: 'use_default', guideId: DEFAULT_STYLE };
  }
  return { decision: 'ask_user' };
}

export async function planDesignStyle(assets, args) {
  if (Buffer.byteLength(args.userMessage, 'utf8') > 64 * 1024)
    throw new AssetStoreError('asset-invalid', 'Design request exceeds 64 KiB');
  const snapshot = await assets.catalog();
  const entries = snapshot.assets.filter((item) => item.kind === 'style-guide');
  if (!entries.some((item) => item.id === DEFAULT_STYLE)) {
    throw new AssetStoreError('asset-not-found', 'The recommended style is unavailable');
  }
  const selected = choice(entries, args);
  if (selected.guideId && !entries.some((item) => item.id === selected.guideId)) {
    throw new AssetStoreError('asset-not-found', `Unknown style-guide: ${selected.guideId}`);
  }
  const query = (args.query ?? '').trim().toLocaleLowerCase();
  const filtered = entries.filter((entry) =>
    !query || `${entry.name} ${entry.id}`.toLocaleLowerCase().includes(query));
  filtered.sort((a, b) => Number(b.id === DEFAULT_STYLE) - Number(a.id === DEFAULT_STYLE));
  const offset = args.offset ?? 0;
  const limit = args.limit ?? 50;
  const english = args.locale === 'en' || (args.locale === undefined && !/\p{Script=Han}/u.test(args.userMessage));
  assets.checkRevision(snapshot.revision);
  return {
    ...selected,
    recommendedId: DEFAULT_STYLE,
    catalogRevision: snapshot.revision,
    count: filtered.length,
    nextOffset: offset + limit < filtered.length ? offset + limit : null,
    candidates: filtered.slice(offset, offset + limit),
    question: english
      ? 'Choose a design style. Talkdesk Cobalt is recommended.'
      : '请选择设计风格，推荐 Talkdesk Cobalt。',
  };
}
