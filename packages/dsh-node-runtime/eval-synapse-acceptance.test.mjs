import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ACCEPTANCE_SCENARIOS,
  SEEDED_DEFECT_DOCUMENT,
  locateSeededDefects,
} from '../../scripts/eval-synapse-acceptance.mjs'

test('the three acceptance scenarios are defined with what to read in the output', () => {
  assert.deepEqual(ACCEPTANCE_SCENARIOS.map(item => item.id), ['new-design', 'seeded-defect', 'vague-feedback'])
  for (const scenario of ACCEPTANCE_SCENARIOS) assert.ok(scenario.read.length >= 2 && scenario.prompt.length > 8)
})

test('the production engine names the node of every seeded defect', () => {
  const report = locateSeededDefects()
  assert.equal(report.allLocated, true, JSON.stringify(report.located, null, 2))
  assert.equal(report.counts.contentIssues, 1)
  assert.equal(report.counts.spacingLeads, 3)
})

test('a repaired document has no content issue and no spacing lead', () => {
  const repaired = structuredClone(SEEDED_DEFECT_DOCUMENT)
  const [channels, direct] = repaired.children[1].children
  channels.children[1].descendants = { 'row-label': { content: 'general' } }
  direct.padding = [0, 12]
  direct.gap = 8
  direct.children[1].padding = [0, 12]
  const report = locateSeededDefects(repaired)
  assert.equal(report.located.some(item => item.located), false, JSON.stringify(report.located))
  assert.equal(report.counts.contentIssues, 0)
  assert.equal(report.counts.spacingLeads, 0)
})
