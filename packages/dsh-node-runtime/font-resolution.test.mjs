import assert from 'node:assert/strict';
import test from 'node:test';
import { attachFontResolution, collectFontUsage, extractDesignSpecFonts, resolveFonts } from './font-resolution.mjs';
import { EngineSession } from './engine-session.mjs';

const DOCUMENT = {
  version: '1.0.0',
  children: [
    {
      type: 'frame',
      id: 'screen',
      children: [
        { type: 'text', id: 'title', content: 'Inbox', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 },
        { type: 'text', id: 'body', content: '收件箱', fontFamily: 'Noto Sans SC', fontWeight: 400 },
        { type: 'text', id: 'body-2', content: '草稿', fontFamily: 'Noto Sans SC', fontWeight: 400 },
        { type: 'text', id: 'quote', content: 'Quote', fontFamily: 'DM Serif Display', fontWeight: 700 },
        { type: 'text', id: 'plain', content: 'Default' },
        { type: 'ref', id: 'row', ref: 'row-master', descendants: { label: { fontFamily: 'Lato', fontWeight: 'bold' } } },
      ],
    },
    { type: 'frame', id: 'other', children: [{ type: 'text', id: 'far', content: 'x', fontFamily: 'Poppins' }] },
  ],
};

function face(resolution, family) {
  return resolution.faces.find((entry) => entry.family === family);
}

test('specified faces are compared with what the renderer has registered', () => {
  const resolution = resolveFonts(DOCUMENT, []);
  assert.equal(face(resolution, 'Inter').status, 'available');
  assert.equal(face(resolution, 'Inter').source, 'bundled');
  const cjk = face(resolution, 'Noto Sans SC');
  assert.equal(cjk.status, 'unregistered');
  assert.equal(cjk.renderedFamily, null);
  assert.deepEqual(cjk.nodeIds, ['body', 'body-2']);
  assert.equal(cjk.runs, 2);
  assert.match(cjk.note, /only if the capturing machine has it installed/);
  assert.equal(face(resolution, 'DM Serif Display').status, 'weight-substituted');
  assert.equal(face(resolution, 'Lato').weight, 700, 'instance overrides are counted on the instance');
  assert.deepEqual(face(resolution, 'Lato').nodeIds, ['row']);
  assert.deepEqual(resolution.counts, { available: 1, weightSubstituted: 1, unregistered: 3 });
  assert.equal(resolution.coverage.status, 'checked');
  assert.equal(collectFontUsage(DOCUMENT).some((entry) => entry.stack.includes('system-ui')), false);
});

test('a downloaded face resolves only at the weight that was downloaded', () => {
  const manifest = [{ family: 'Noto Sans SC', weight: 400, italic: false }, { family: 'Lato', weight: 400, italic: false }];
  const resolution = resolveFonts(DOCUMENT, manifest);
  assert.equal(face(resolution, 'Noto Sans SC').status, 'available');
  assert.equal(face(resolution, 'Noto Sans SC').source, 'downloaded');
  assert.equal(face(resolution, 'Lato').status, 'weight-substituted');
});

test('a root scope limits the report to that subtree', () => {
  const resolution = resolveFonts(DOCUMENT, [], 'other');
  assert.deepEqual(resolution.faces.map((entry) => entry.family), ['Poppins']);
  // Blank/whitespace rootId falls back to the active page, matching quality_tools.rs.
  assert.equal(resolveFonts(DOCUMENT, [], '   ').faces.length, 5);
});

test('scoped screen checks follow ref instances into reusable masters and ignore inactive pages', () => {
  const multiPage = {
    editorMeta: { activePageIndex: 1 },
    pages: [
      {
        id: 'library-page',
        children: [
          { type: 'text', id: 'inactive-text', content: 'Unused', fontFamily: 'Archivo' },
          {
            type: 'frame', id: 'row-master', reusable: true,
            children: [
              { type: 'text', id: 'lbl', content: 'Item', fontFamily: 'Noto Sans SC', fontWeight: 500 },
              { type: 'text', id: 'sub', content: 'Sub', fontFamily: 'Inter' },
            ],
          },
        ],
      },
      {
        id: 'active-page',
        children: [
          {
            type: 'frame', id: 'screen-a',
            children: [
              { type: 'ref', id: 'inst-default', ref: 'row-master' },
              { type: 'ref', id: 'inst-override', ref: 'row-master', descendants: { lbl: { fontFamily: 'Lato', fontWeight: 700 } } },
            ],
          },
        ],
      },
    ],
  };
  const wholeActivePage = resolveFonts(multiPage, []);
  assert.equal(face(wholeActivePage, 'Archivo'), undefined, 'inactive pages must not pollute active-page font resolution');
  const scoped = resolveFonts(multiPage, [], 'screen-a');
  assert.equal(face(scoped, 'Noto Sans SC')?.status, 'unregistered');
  assert.deepEqual(face(scoped, 'Noto Sans SC')?.nodeIds, ['inst-default']);
  assert.equal(face(scoped, 'Lato')?.weight, 700);
  assert.deepEqual(face(scoped, 'Lato')?.nodeIds, ['inst-override']);
  assert.equal(face(scoped, 'Inter')?.status, 'available');
});

test('a stack that falls through to a registered family is still reported', () => {
  const document = { children: [{ type: 'text', id: 't', content: 'x', fontFamily: '"Söhne", Inter, sans-serif' }] };
  const [entry] = resolveFonts(document, []).faces;
  assert.equal(entry.status, 'unregistered');
  assert.equal(entry.renderedFamily, 'Inter');
});

test('the quality result gains fontResolution and fetching is explicit', async () => {
  const quality = { isError: false, content: [{ type: 'text', text: '{}' }], structuredContent: { counts: {} } };
  const faces = [];
  const requested = [];
  const fonts = {
    manifest: () => ({ faces }),
    ensure: async (wanted) => {
      requested.push(...wanted);
      return wanted.map((item) => {
        if (item.family === 'Poppins') return { ...item, available: false, error: 'Font provider HTTP 404' };
        faces.push(item);
        return { ...item, available: true };
      });
    },
  };
  const reported = await attachFontResolution(quality, { document: DOCUMENT, fonts });
  assert.equal(requested.length, 0, 'a quality check does not use the network unless asked');
  assert.equal(reported.structuredContent.fontResolution.counts.unregistered, 3);
  assert.equal(JSON.parse(reported.content[0].text).fontResolution.faces.length, 5);

  const fetched = await attachFontResolution(quality, { document: DOCUMENT, fonts, fetchFonts: true });
  const resolution = fetched.structuredContent.fontResolution;
  assert.equal(face(resolution, 'Noto Sans SC').status, 'available');
  assert.equal(face(resolution, 'Poppins').status, 'unregistered');
  assert.deepEqual(resolution.fetched.find((entry) => entry.family === 'Poppins'), {
    family: 'Poppins', weight: 400, italic: false, available: false, reason: 'Font provider HTTP 404',
  });

  const failed = { isError: true, content: [{ type: 'text', text: 'rootId not found' }] };
  assert.equal(await attachFontResolution(failed, { document: DOCUMENT, fonts }), failed);
});

test('fontResolution compares canvas text directly against DESIGN-specified typography', () => {
  const withFallbackOnly = {
    version: '1.0.0',
    designMd: {
      raw: '# Design\n- **Heading Font**: Space Grotesk\n- **Body Font**: DM Sans\n',
      typography: { headings: 'Space Grotesk', body: 'DM Sans' },
    },
    children: [
      { type: 'frame', id: 'root', children: [{ type: 'text', id: 't1', content: 'Hello', fontFamily: 'Inter' }] },
    ],
  };
  const mismatch = resolveFonts(withFallbackOnly, []);
  assert.deepEqual(mismatch.designSpec.specifiedFamilies, ['Space Grotesk', 'DM Sans']);
  assert.deepEqual(mismatch.designSpec.missingFromCanvas, ['Space Grotesk', 'DM Sans']);
  assert.equal(mismatch.designSpec.specMatched, false);

  const matching = {
    ...withFallbackOnly,
    children: [{
      type: 'frame',
      id: 'root',
      children: [
        { type: 'text', id: 'h1', content: 'Heading', fontFamily: 'Space Grotesk', fontWeight: 700 },
        { type: 'text', id: 'p1', content: 'Body', fontFamily: 'DM Sans', fontWeight: 400 },
      ],
    }],
  };
  const ok = resolveFonts(matching, []);
  assert.deepEqual(ok.designSpec.missingFromCanvas, []);
  assert.equal(ok.designSpec.specMatched, true);
});

test('extractDesignSpecFonts resolves clean heading and body families across all 85 bundled style guides', () => {
  const catalog = new EngineSession({ version: '1.0.0', children: [] });
  try {
    const guides = catalog.callTool('list_style_guides', {}).structuredContent.guides ?? [];
    assert.ok(guides.length >= 85);
    const byId = new Map();
    for (const guide of guides) {
      const md = catalog.callTool('get_style_guide', { id: guide.id }).structuredContent?.content ?? '';
      const docSession = new EngineSession({ version: '1.0.0', children: [] });
      try {
        docSession.callTool('set_design_md', { markdown: md });
        const extracted = extractDesignSpecFonts(docSession.snapshot().document);
        assert.ok(extracted.bodyFont, `missing bodyFont for ${guide.id}`);
        assert.ok(extracted.headingFont, `missing headingFont for ${guide.id}`);
        assert.ok(extracted.families.length > 0, `missing families for ${guide.id}`);
        for (const fam of extracted.families) {
          assert.doesNotMatch(fam, /^(?:a|an|the)\s+|\b(?:panel|hero|section|layout|width|height)\b/iu, `prose leaked into ${guide.id}: ${fam}`);
        }
        byId.set(guide.id, extracted);
      } finally {
        docSession.close?.();
      }
    }
    assert.deepEqual(byId.get('talkdesk-cobalt').families, ['Roboto']);
    assert.deepEqual(byId.get('design-md:nintendo-2001').families, ['Arial Black', 'Arial']);
    assert.deepEqual(byId.get('design-md:sap').families, ['72 Brand Variable']);
  } finally {
    catalog.close?.();
  }
});


