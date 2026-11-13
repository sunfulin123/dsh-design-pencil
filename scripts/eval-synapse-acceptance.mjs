#!/usr/bin/env node
/**
 * Acceptance scenarios for the Synapse design guidance.
 *
 * Three kinds of task are read after a guidance change: a new design, a design
 * with known defects, and vague revision feedback. The live scenarios need a
 * model and are judged by reading the transcript. The seeded-defect document is
 * also checked offline: the diagnostics must name the node of every defect.
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { EngineSession } from '../packages/dsh-node-runtime/engine-session.mjs'

export const ACCEPTANCE_SCENARIOS = Object.freeze([
  {
    id: 'new-design',
    prompt: '设计桌面端团队聊天室：左侧频道与私信分组列表（带未读角标），中部消息流与输入区，覆盖加载、空和错误状态。',
    read: [
      'The delivery summary lists passed checks with their evidence separately from unverified checks.',
      'Each primary action is reported as verifiable, visual-only or not-implemented.',
      'Preview generated, changes applied and file saved are reported as separate facts.',
    ],
  },
  {
    id: 'seeded-defect',
    prompt: '审阅这份聊天室设计并指出问题所在的具体位置，先不要修改。',
    read: [
      'The review names the node of each seeded defect instead of describing the screen in general.',
      'The missing channel name is reported as missing content, not as spacing.',
    ],
  },
  {
    id: 'vague-feedback',
    prompt: '左边看起来有点乱，调一下。',
    read: [
      'The current render is inspected, or the user is asked, before anything is edited.',
      'The cause is fixed and sibling groups with the same problem are checked.',
      'The reply states what was found, what changed and what remains unverified.',
    ],
  },
])

/** A sidebar with one defect of each kind this guidance change targets. */
export const SEEDED_DEFECT_DOCUMENT = Object.freeze({
  version: '1.0.0',
  children: [
    {
      type: 'frame', id: 'row-master', name: 'Channel Row', reusable: true, layout: 'horizontal',
      width: 240, height: 32, padding: [0, 12], gap: 8,
      children: [{ type: 'text', id: 'row-label', content: 'channel', fontSize: 14, fill: '#111111' }],
    },
    {
      type: 'frame', id: 'sidebar', name: 'Sidebar', layout: 'vertical', width: 264, height: 'fit_content',
      padding: 12, gap: 24, fill: [{ type: 'solid', color: '#FFFFFF' }],
      children: [
        {
          type: 'frame', id: 'group-channels', name: 'Channels', layout: 'vertical', width: 'fill_container',
          height: 'fit_content', padding: [0, 12], gap: 8,
          children: [
            { type: 'text', id: 'channels-title', content: 'Channels', fontSize: 12, fill: '#555555' },
            // Defect 1: the override key matches no node of the master, so the name never shows.
            { type: 'ref', id: 'row-general', ref: 'row-master', descendants: { title: { content: 'general' } } },
          ],
        },
        {
          // Defect 2: heading indent and heading distance differ from the sibling group.
          type: 'frame', id: 'group-direct', name: 'Direct Messages', layout: 'vertical', width: 'fill_container',
          height: 'fit_content', padding: [0, 20], gap: 16,
          children: [
            { type: 'text', id: 'direct-title', content: 'Direct Messages', fontSize: 12, fill: '#555555' },
            {
              type: 'frame', id: 'row-ada', name: 'Row', layout: 'horizontal', width: 'fill_container', height: 32,
              // Defect 3: the unread badge sits against the row's right edge.
              padding: [0, 0, 0, 12], gap: 8, fill: [{ type: 'solid', color: '#F3F4F6' }],
              children: [
                { type: 'text', id: 'ada-name', content: 'Ada', fontSize: 14, fill: '#111111' },
                {
                  type: 'frame', id: 'ada-unread', name: 'Unread Badge', layout: 'horizontal', width: 20, height: 18,
                  fill: [{ type: 'solid', color: '#2563EB' }],
                  children: [{ type: 'text', id: 'ada-count', content: '3', fontSize: 11, fill: '#FFFFFF' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

export const SEEDED_DEFECTS = Object.freeze([
  { id: 'override-missed-component', nodeId: 'row-general', field: 'contentIssues', pattern: /matches no node of component/ },
  { id: 'heading-indent', nodeId: 'group-direct', field: 'spacingLeads', pattern: /heading indent/ },
  { id: 'heading-distance', nodeId: 'group-direct', field: 'spacingLeads', pattern: /heading-to-content distance/ },
  { id: 'badge-on-edge', nodeId: 'ada-unread', field: 'spacingLeads', pattern: /touches the edge/ },
])

/** Run the engine's quality diagnostics and report which seeded defects they locate. */
export function locateSeededDefects(document = SEEDED_DEFECT_DOCUMENT) {
  const session = new EngineSession(structuredClone(document))
  try {
    const result = session.callTool('get_design_quality', { limit: 200 })
    const quality = result.structuredContent ?? JSON.parse(result.text ?? result.content?.[0]?.text ?? '{}')
    const located = SEEDED_DEFECTS.map((defect) => {
      const entries = Array.isArray(quality[defect.field]) ? quality[defect.field] : []
      const hit = entries.find((entry) => typeof entry === 'string' && entry.startsWith(`${defect.nodeId}: `) && defect.pattern.test(entry))
      return { id: defect.id, nodeId: defect.nodeId, located: hit !== undefined, ...(hit === undefined ? {} : { evidence: hit }) }
    })
    return { located, allLocated: located.every((item) => item.located), counts: quality.counts ?? {} }
  } finally {
    session.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.includes('--list')) console.log(JSON.stringify(ACCEPTANCE_SCENARIOS, null, 2))
  else console.log(JSON.stringify(locateSeededDefects(), null, 2))
}
