import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { EVAL_BRIEFS, scoreDesignRun } from '../../scripts/eval-synapse-design.mjs'
import { EngineSession } from './engine-session.mjs'

test('eval harness defines the three canonical benchmark briefs', () => {
  assert.deepEqual(EVAL_BRIEFS.map(item => item.id), [
    'enterprise-list',
    'chat-interface',
    'poc-to-synapse',
  ])
  for (const brief of EVAL_BRIEFS) {
    assert.ok(brief.prompt.length >= 24)
    assert.ok(Array.isArray(brief.expectedScreens) && brief.expectedScreens.length >= 2)
  }
})

test('scoreDesignRun measures step completion, linked refs, variable ratio, lint, touch targets, and POC mapping against the real engine', () => {
  const engine = new EngineSession({ version: '0.8.5', children: [] })
  let completeDoc
  let flawedDoc
  try {
    const clean = engine.callTool('batch_design', {
      script: `
        const master = I(null, { type: 'frame', name: 'RowMaster', reusable: true, previewAsScreen: false, layout: 'horizontal', width: 320, height: 48, padding: [12, 16], gap: '$--spacing-small', fill: '$--surface-elevation-1' });
        I(master, { type: 'text', name: 'RowTitle', content: 'Acme Corp', fontSize: 14, fill: '$--text-default' });
        const root = I(null, { type: 'frame', name: 'Workspace', layout: 'vertical', width: 1440, height: 'fit_content', padding: 24, gap: '$--spacing-medium', fill: '$--surface-elevation-0' });
        const list = I(root, { type: 'frame', name: 'Overview', layout: 'vertical', width: 'fill_container', height: 'fit_content', gap: '$--spacing-small' });
        I(list, { type: 'ref', ref: master });
        I(list, { type: 'ref', ref: master });
        const settings = I(root, { type: 'frame', name: 'Settings', layout: 'vertical', width: 'fill_container', height: 'fit_content', gap: '$--spacing-small' });
        const cta = I(settings, { type: 'frame', name: 'Save', role: 'button', layout: 'horizontal', width: 120, height: 44, fill: '$--primary-9', alignItems: 'center', justifyContent: 'center' });
        I(cta, { type: 'text', name: 'SaveLabel', content: 'Save', fontSize: 14, fill: '$--primary-contrast' });
      `,
    })
    assert.equal(clean.isError, false)
    completeDoc = JSON.stringify(engine.peekDocument())

    const badEngine = new EngineSession({ version: '0.8.5', children: [] })
    try {
      badEngine.callTool('batch_design', {
        script: `
          const root = I(null, { type: 'frame', name: 'Broken', layout: 'vertical', width: 1440, height: 'fit_content', fill: '#ffffff' });
          const tiny = I(root, { type: 'frame', name: 'TinyBtn', role: 'icon-button', width: 18, height: 18, fill: '#eeeeee' });
          I(tiny, { type: 'text', content: 'x', fontSize: 12, fill: '#111111' });
          I(root, { type: 'path', name: 'BrokenIcon', width: 20, height: 20, d: 'M0 0' });
        `,
      })
      flawedDoc = JSON.stringify(badEngine.peekDocument())
    } finally {
      badEngine.close()
    }
  } finally {
    engine.close()
  }

  const parsed = JSON.parse(completeDoc)
  const overview = parsed.children[1].children[0]
  const settings = parsed.children[1].children[1]

  const goodReport = scoreDesignRun({
    briefId: 'poc-to-synapse',
    plannedScreens: ['Overview', 'Settings'],
    pocScreens: ['Overview', 'Settings'],
    documentJson: completeDoc,
    toolTrace: [
      { name: 'synapse_design_discovery', arguments: { stage: 'context', screens: [{ name: 'Overview' }, { name: 'Settings' }] }, result: { status: 'resolved' } },
      { name: 'synapse_design_poc_handoff', arguments: { action: 'record' }, result: { status: 'poc_recorded' } },
      { name: 'synapse_design_poc_handoff', arguments: { action: 'resolve' }, result: { status: 'poc_ready' } },
      { name: 'synapse_design_pipeline_begin', arguments: {}, result: { draftId: 'd1' } },
      { name: 'synapse_design_pipeline_inspect', arguments: { kind: 'quality' }, result: {} },
      { name: 'synapse_design_pipeline_context', arguments: { tool: 'lint_document' }, result: {} },
      { name: 'synapse_design_pipeline_finish', arguments: { draftId: 'd1' }, result: { stage: 'needs_visual_review' } },
      {
        name: 'synapse_design_pipeline_finish',
        arguments: {
          draftId: 'd1',
          review: {
            screens: [
              { name: 'Overview', nodeId: overview.id, pocScreenshot: 'shots/overview.png', deviation: 'none' },
              { name: 'Settings', nodeId: settings.id, pocScreenshot: 'shots/settings.png', deviation: 'minor', differences: 'Matched form controls' },
            ],
          },
        },
        result: { published: true },
      },
    ],
  })

  assert.equal(goodReport.steps.context, true)
  assert.equal(goodReport.steps.pocRecorded, true)
  assert.equal(goodReport.steps.pocResolved, true)
  assert.equal(goodReport.steps.qualityInspected, true)
  assert.equal(goodReport.steps.lintInspected, true)
  assert.equal(goodReport.steps.visualReviewed, true)
  assert.equal(goodReport.steps.published, true)
  assert.equal(goodReport.screens.complete, true)
  assert.equal(goodReport.linkedRefCount, 2)
  assert.ok(goodReport.variableBindingRatio > 0.5)
  assert.equal(goodReport.blockingLintCount, 0)
  assert.equal(goodReport.criticalTargetCount, 0)
  assert.equal(goodReport.pocMapping.complete, true)

  const badReport = scoreDesignRun({
    briefId: 'enterprise-list',
    plannedScreens: ['Customer List', 'Customer Detail'],
    pocScreens: ['Customer List'],
    documentJson: flawedDoc,
    toolTrace: [{ name: 'synapse_design_pipeline_begin', arguments: {}, result: { draftId: 'd2' } }],
  })
  assert.equal(badReport.steps.context, false)
  assert.equal(badReport.steps.published, false)
  assert.equal(badReport.screens.complete, false)
  assert.deepEqual(badReport.screens.missing, ['Customer List', 'Customer Detail'])
  assert.equal(badReport.linkedRefCount, 0)
  assert.equal(badReport.variableBindingRatio, 0)
  assert.ok(badReport.criticalTargetCount >= 1)
  assert.equal(badReport.pocMapping.complete, false)

  const duplicateNodeReport = scoreDesignRun({
    briefId: 'enterprise-list',
    plannedScreens: ['Overview', 'Settings'],
    pocScreens: [],
    documentJson: completeDoc,
    toolTrace: [{
      name: 'synapse_design_pipeline_finish',
      arguments: {
        draftId: 'd3',
        review: {
          screens: [
            { name: 'Overview', nodeId: overview.id },
            { name: 'Settings', nodeId: overview.id },
          ],
        },
      },
      result: { published: false },
    }],
  })
  assert.equal(duplicateNodeReport.screens.complete, false)
  assert.deepEqual(duplicateNodeReport.screens.missing, ['Settings'])
})

test('CLI --list and --run score a saved run artifact without network credentials', async context => {
  const root = await mkdtemp(join(tmpdir(), 'synapse-eval-cli-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const cli = fileURLToPath(new URL('../../scripts/eval-synapse-design.mjs', import.meta.url))
  const listOut = spawnSync(process.execPath, [cli, '--list'], { encoding: 'utf8' })
  assert.equal(listOut.status, 0, listOut.stderr)
  assert.equal(JSON.parse(listOut.stdout).length, 3)

  const docPath = join(root, 'out.op')
  const runPath = join(root, 'run.json')
  await writeFile(docPath, JSON.stringify({ version: '0.8.5', children: [{ type: 'frame', id: 'r1', name: 'Customer List', width: 1440, height: 900, children: [{ type: 'text', id: 't1', content: 'Customers' }] }] }))
  await writeFile(runPath, JSON.stringify({
    briefId: 'enterprise-list',
    plannedScreens: ['Customer List'],
    pocScreens: [],
    documentPath: docPath,
    toolTrace: [],
  }))
  const runOut = spawnSync(process.execPath, [cli, '--run', runPath], { encoding: 'utf8' })
  assert.equal(runOut.status, 0, runOut.stderr)
  const scored = JSON.parse(runOut.stdout)
  assert.equal(scored.screens.complete, true)
})
