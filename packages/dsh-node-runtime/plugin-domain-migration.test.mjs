import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cropRgbaImage,
  decodePngRgba,
  encodePngRgba,
} from './png-rgba-codec.mjs';
import {
  measureGlyphInkInRgba,
  renderSelectionVisualEvidence,
} from './selection-visual-evidence.mjs';
import {
  DEVICE_FRAME_NAME_PREFIX,
  applyDeviceFrame,
  draftRootNodeId,
  draftRootNodes,
  isDeviceFrameNode,
  measureRootWithRuntime,
} from './device-frame.mjs';
import {
  buildFallbackFromRawDocument,
  parseCodeContextNodeIds,
  resolveLiveCodeContextTargets,
} from './design-code-context.mjs';
import {
  canvasContractDiagnostics,
  healRootWrapperScript,
  unresolvedImageNodes,
} from './draft-canvas-contract.mjs';
import {
  assertNoExternalArguments,
  blockingQualityValue,
  publicBatchReceipt,
  readPaginatedDraftLint,
  readPaginatedDraftQuality,
} from './draft-quality-gate.mjs';
import {
  buildDraftChecklist,
  validateFinishReview,
} from './draft-review-gate.mjs';
import {
  extractPngDimensions,
  groupPocScreens,
  parseAndValidateEvidenceLedgerJson,
  parsePocScreenshotInputs,
} from './poc-evidence-validator.mjs';
import {
  allowedRuntimeTool,
  documentNeedsInitialStyle,
  editorAiTargetOf,
  parseOpenPencilMcpResponse,
  runtimeSkillDescription,
  runtimeSkillVersion,
} from './managed-mcp-client.mjs';

test('png-rgba-codec and selection-visual-evidence render exact CanvasKit glyphs and measure ink bounds', async () => {
  const rgba = new Uint8Array(4 * 4 * 4).fill(255);
  const encoded = encodePngRgba(4, 4, rgba);
  const decoded = decodePngRgba(encoded);
  assert.equal(decoded.width, 4);
  assert.equal(decoded.height, 4);
  const cropped = cropRgbaImage(decoded, { x: 1, y: 1, width: 2, height: 2 });
  assert.equal(cropped.width, 2);
  assert.equal(cropped.height, 2);
  assert.deepEqual(extractPngDimensions(encoded), { width: 4, height: 4 });

  const doc = {
    version: '1.0.0',
    children: [
      {
        type: 'frame',
        id: 'btn',
        x: 0,
        y: 0,
        width: 120,
        height: 40,
        fill: [{ type: 'solid', color: '#FFFFFF' }],
        children: [{ type: 'text', id: 'lbl', content: 'Submit', fontSize: 14, fill: '#111111' }],
      },
    ],
  };
  const layout = [
    {
      id: 'btn',
      type: 'frame',
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      children: [{ id: 'lbl', type: 'text', x: 30, y: 10, width: 60, height: 20 }],
    },
  ];
  const evidence = await renderSelectionVisualEvidence({
    documentJson: JSON.stringify(doc),
    layoutTree: layout,
    selectedIds: ['btn'],
  });
  assert.equal(evidence?.fidelity, 'exact');
  assert.equal(evidence?.textMeasurements.length, 1);
  assert.equal(evidence?.textMeasurements[0].reliable, true);
  assert.ok(Math.abs(evidence.textMeasurements[0].ink.inkCenterOffsetInParentPx) <= 1.5);
  assert.equal(typeof measureGlyphInkInRgba, 'function');
});

test('device-frame and design-code-context decorate single roots and filter decoration nodes', async () => {
  const rawDoc = JSON.stringify({
    version: '1.0.0',
    children: [{ type: 'frame', id: 'page-root', name: 'Home', width: 1440, height: 900, children: [] }],
  });
  const framed = await applyDeviceFrame(rawDoc, measureRootWithRuntime);
  assert.equal(framed.deviceFrame, 'browser');
  const parsed = JSON.parse(framed.documentJson);
  assert.equal(parsed.children.length, 2);
  assert.equal(isDeviceFrameNode(parsed.children[1]), true);
  assert.ok(parsed.children[1].name.startsWith(DEVICE_FRAME_NAME_PREFIX));
  assert.equal(draftRootNodes(parsed).length, 1);
  assert.equal(draftRootNodeId(framed.documentJson), 'page-root');

  const fallback = buildFallbackFromRawDocument(parsed, [], undefined);
  assert.deepEqual(fallback.targetNodeIds, ['page-root']);
  assert.deepEqual(parseCodeContextNodeIds('["a", "b"]'), ['a', 'b']);
  assert.throws(
    () =>
      resolveLiveCodeContextTargets({
        layoutEntries: [],
        requestedNodeIds: 'synapse-device-frame',
        selectedIds: [],
        toolName: 'synapse_design_code_context',
      }),
    /device-frame decoration/,
  );
});

test('draft contract, quality pagination, review receipt, and POC ledger validators enforce gates cleanly', async () => {
  const healed = healRootWrapperScript('const root = I(null, { type: "frame", width: 1440 });\nI(root, { type: "text" });', 'seeded-root');
  assert.equal(healed, 'const root = "seeded-root";\nI(root, { type: "text" });');
  assert.equal(unresolvedImageNodes(JSON.stringify({ type: 'image', id: 'img-1', imagePrompt: 'hero' })).count, 1);

  const canvas = { platform: 'web', width: 1440, seedHeight: 900, finalHeight: 'fit_content', fixedViewport: false, rootCount: 1, rootType: 'frame' };
  const okDoc = JSON.stringify({ children: [{ type: 'frame', id: 'r1', width: 1440, height: 'fit_content', children: [{ type: 'text', id: 't1' }] }] });
  assert.deepEqual(canvasContractDiagnostics(okDoc, canvas, { requireFinalHeight: true }), []);
  assert.throws(() => assertNoExternalArguments({ filePath: '/etc/passwd' }), /not allowed/);
  assert.equal(publicBatchReceipt({ applied: true, results: [{ binding: 'a', nodeId: 'r1' }] }, okDoc).results[0].nodeId, 'r1');

  const filtered = blockingQualityValue(
    { structureIssues: [{ nodeId: 'n1', reason: 'same fill' }] },
    [{ nodeId: 'n1', reason: 'same fill', severity: 'warning', category: 'invisible-container' }],
  );
  assert.equal(filtered.structureIssues.length, 0);

  const lintPages = await readPaginatedDraftLint(
    async (_tool, args) =>
      args.cursor
        ? { version: 1, value: { count: 2, issues: [{ id: '2', severity: 'error' }], nextCursor: null } }
        : { version: 1, value: { count: 2, issues: [{ id: '1', severity: 'info' }], nextCursor: 'c1' } },
    { version: 1, quality: {} },
  );
  assert.equal(lintPages.issues.length, 2);

  const qualityPages = await readPaginatedDraftQuality(
    async (_tool, args) =>
      args.touchTargetOffset
        ? { version: 1, value: { navIssues: [{ nodeId: 'b2' }], touchTargetsNextOffset: null } }
        : { version: 1, value: { navIssues: [{ nodeId: 'b1' }], touchTargetsNextOffset: 50, counts: { componentReuseCandidates: 1 } } },
    1,
  );
  assert.equal(qualityPages.value.navIssues.length, 2);
  assert.equal(qualityPages.reuseCandidateCount, 1);

  assert.equal(buildDraftChecklist([{ name: 'Home' }]).plannedScreens.length, 1);
  const reviewCheck = validateFinishReview({
    draftId: 'd1',
    review: {},
    pending: { processPath: '/tmp/a.op', plannedScreens: [{ name: 'Home' }], visualReviewStatus: 'unavailable' },
    checkpoint: { version: 1 },
    validation: { reuseCandidateCount: 0 },
    finalizedSnapshot: { documentJson: okDoc },
    userTurnCount: 1,
  });
  assert.equal(reviewCheck.ok, false);
  assert.equal(reviewCheck.response.stage, 'needs_generation');

  const shots = parsePocScreenshotInputs([{ path: 'shot.png', screen: 'Home', viewport: { width: 1440, height: 900 } }]);
  assert.equal(shots[0].viewport, 1440);
  assert.equal(groupPocScreens([{ path: '/a/shot.png', screen: 'Home' }])[0].name, 'Home');

  const validLedger = parseAndValidateEvidenceLedgerJson(
    Buffer.from(
      JSON.stringify({
        targetViewports: ['1440px'],
        renderedEvidence: [{ viewport: '1440px', status: 'captured', artifact: 'shot.png', sha256: 'a'.repeat(64) }],
        sourceFiles: [{ path: 'index.html', sha256: 'b'.repeat(64) }],
        accessibility: { status: 'pass', evidence: 'ok' },
        responsive: { status: 'pass', evidence: 'ok' },
        visualReview: { status: 'pass', evidence: 'ok' },
        contentStates: Object.fromEntries(
          ['loading', 'empty', 'error', 'partial', 'success', 'permission'].map((s) => [
            s,
            { status: 'not-applicable', reason: 'fixture' },
          ]),
        ),
      }),
    ),
  );
  assert.equal(validLedger.requiredRenders.length, 1);
  assert.equal(validLedger.sourceEntries.length, 1);
});

test('managed-mcp-client parses envelopes, skill metadata, capabilities, and blank-document state', () => {
  const parsed = parseOpenPencilMcpResponse('get_variables', {
    result: { content: [{ type: 'text', text: '{"variables":{},"image_base64":"strip-me"}' }] },
  });
  assert.deepEqual(parsed.value, { variables: {} });
  assert.equal(
    allowedRuntimeTool([{ name: 'set_variables', access: 'document-write' }], 'set_variables', false),
    undefined,
  );
  assert.equal(
    runtimeSkillVersion('---\nname: synapse-design\nmetadata:\n  version: synapse-design/2\n---\n'),
    'synapse-design/2',
  );
  assert.equal(
    runtimeSkillDescription('---\nname: synapse-design\ndescription: "Clean skill"\n---\n'),
    'Clean skill',
  );
  assert.equal(documentNeedsInitialStyle('{"version":"1.0.0","children":[]}'), true);
  assert.deepEqual(editorAiTargetOf({ activePageId: '0', selectedIds: ['n1'] }), {
    activePageId: '0',
    selectedIds: ['n1'],
  });
});
