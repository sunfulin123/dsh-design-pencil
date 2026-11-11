#!/usr/bin/env node
/** Deterministic benchmark briefs and run scorer for Synapse Design evaluations. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EngineSession } from '../packages/dsh-node-runtime/engine-session.mjs'

export const EVAL_BRIEFS = Object.freeze([
  {
    id: 'enterprise-list',
    title: 'Enterprise customer management list and detail drawer',
    route: 'synapse',
    styleId: 'talkdesk-cobalt',
    expectedScreens: ['Customer List', 'Customer Detail'],
    prompt: '设计企业客户管理桌面端工作台，使用默认 Talkdesk Cobalt 风格，直接做 Synapse 高保真设计：包含客户列表（搜索筛选、至少 6 行状态各异的记录、复用列表行组件）与客户详情抽屉，覆盖空状态和加载状态。',
  },
  {
    id: 'chat-interface',
    title: 'Desktop support chat workspace',
    route: 'synapse',
    styleId: 'talkdesk-cobalt',
    expectedScreens: ['Conversation Inbox', 'Active Thread'],
    prompt: '设计桌面端客服实时对话工作台，使用默认 Talkdesk Cobalt 风格，直接做 Synapse 高保真设计：左侧会话队列（未读/处理中/已解决状态）、中部当前会话流与回复输入区、右侧工单上下文摘要，并说明适用状态。',
  },
  {
    id: 'poc-to-synapse',
    title: 'Approved HTML POC converted to editable Synapse high fidelity',
    route: 'html-then-synapse',
    styleId: 'talkdesk-cobalt',
    expectedScreens: ['Overview', 'Settings'],
    prompt: '先做 HTML POC 验证桌面端团队概览（Overview）与权限设置（Settings）两页及空/错误状态，使用 Talkdesk Cobalt 风格；确认后沿用同一风格与截图转成可编辑 Synapse 高保真设计并逐页核对差异。',
  },
])

const NON_BLOCKING_WARNINGS = new Set([
  'empty-filled-panel', 'invisible-container', 'mixed-sibling-corner-radius', 'mixed-sibling-padding',
  'sibling-inconsistency', 'text-effect', 'text-explicit-height', 'slop/purple-glow-gradient',
  'slop/three-card-feature-row', 'slop/rounded-card-wall',
])
const BINDABLE_PROPS = ['fill', 'stroke', 'gap', 'padding', 'fontSize']

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isVariableBoundValue(value) {
  if (typeof value === 'string') return value.trim().startsWith('$')
  if (Array.isArray(value)) return value.some(isVariableBoundValue)
  if (isRecord(value)) return Object.values(value).some(isVariableBoundValue)
  return false
}

function walkNodes(nodes, visitor) {
  if (!Array.isArray(nodes)) return
  for (const node of nodes) {
    if (!isRecord(node)) continue
    if (typeof node.name === 'string' && node.name.startsWith('Synapse Device Frame')) continue
    visitor(node)
    if (Array.isArray(node.children)) walkNodes(node.children, visitor)
  }
}

function nonEmptyScreenContainer(node) {
  return isRecord(node)
    && (node.type === 'frame' || node.type === 'group')
    && Array.isArray(node.children)
    && node.children.length > 0
}

function collectDocumentStats(documentJson) {
  let doc
  try { doc = JSON.parse(documentJson) } catch { doc = {} }
  const roots = Array.isArray(doc?.pages) && doc.pages.length > 0
    ? doc.pages.flatMap(page => Array.isArray(page?.children) ? page.children : [])
    : (Array.isArray(doc?.children) ? doc.children : [])
  const byId = new Map()
  const byName = new Map()
  let linkedRefCount = 0
  let boundProps = 0
  let totalProps = 0
  walkNodes(roots, node => {
    if (typeof node.id === 'string') byId.set(node.id, node)
    if (typeof node.name === 'string' && node.name.trim()) {
      byName.set(node.name.trim().toLowerCase(), node)
    }
    if (node.type === 'ref') linkedRefCount += 1
    const bindings = isRecord(node.variableBindings) ? node.variableBindings : {}
    for (const prop of BINDABLE_PROPS) {
      if (node[prop] === undefined && bindings[prop] === undefined) continue
      totalProps += 1
      if (bindings[prop] !== undefined || isVariableBoundValue(node[prop])) boundProps += 1
    }
  })
  return {
    byId, byName, linkedRefCount,
    variableBindingRatio: totalProps === 0 ? 0 : Number((boundProps / totalProps).toFixed(4)),
  }
}

function parseEngineJson(callResult) {
  if (callResult.isError) return {}
  if (typeof callResult.text === 'string') {
    try { return JSON.parse(callResult.text) } catch { return {} }
  }
  return isRecord(callResult.structuredContent) ? callResult.structuredContent : {}
}

function measureEngineDiagnostics(documentJson) {
  let doc
  try { doc = JSON.parse(documentJson) } catch { return { blockingLintCount: 0, undersizedTargetCount: 0, criticalTargetCount: 0 } }
  const session = new EngineSession(doc)
  try {
    let blockingLintCount = 0
    const seenCursors = new Set()
    let cursor
    for (let page = 0; page < 500; page += 1) {
      const lint = parseEngineJson(session.callTool('lint_document', {
        limit: 200, ...(cursor ? { cursor } : {}),
      }))
      for (const issue of Array.isArray(lint.issues) ? lint.issues : []) {
        const sev = String(issue?.severity ?? '').toLowerCase()
        const cat = String(issue?.category ?? issue?.code ?? '').toLowerCase()
        if (sev === 'info' || (sev === 'warning' && NON_BLOCKING_WARNINGS.has(cat))) continue
        blockingLintCount += 1
      }
      if (typeof lint.nextCursor !== 'string' || !lint.nextCursor || seenCursors.has(lint.nextCursor)) break
      seenCursors.add(lint.nextCursor)
      cursor = lint.nextCursor
    }
    let undersizedTargetCount = 0
    let criticalTargetCount = 0
    let offset = 0
    for (let page = 0; page < 500; page += 1) {
      const quality = parseEngineJson(session.callTool('get_design_quality', {
        limit: 200, touchTargetOffset: offset,
      }))
      for (const item of Array.isArray(quality.navIssues) ? quality.navIssues : []) {
        undersizedTargetCount += 1
        if (item?.priority !== 'review') criticalTargetCount += 1
      }
      if (typeof quality.touchTargetsNextOffset !== 'number' || quality.touchTargetsNextOffset <= offset) break
      offset = quality.touchTargetsNextOffset
    }
    return { blockingLintCount, undersizedTargetCount, criticalTargetCount }
  } finally {
    session.close()
  }
}

function inspectTrace(toolTrace) {
  const trace = Array.isArray(toolTrace) ? toolTrace : []
  let latestReview
  for (const call of trace) {
    if (call?.name === 'synapse_design_pipeline_finish' && isRecord(call?.arguments?.review)) {
      latestReview = call.arguments.review
    }
  }
  return {
    latestReview,
    steps: {
      context: trace.some(c => c?.name === 'synapse_design_discovery' && c?.arguments?.stage === 'context'),
      pocRecorded: trace.some(c => c?.name === 'synapse_design_poc_handoff' && c?.arguments?.action === 'record' && c?.result?.status === 'poc_recorded'),
      pocResolved: trace.some(c => c?.name === 'synapse_design_poc_handoff' && c?.arguments?.action === 'resolve' && c?.result?.status === 'poc_ready'),
      draftBegun: trace.some(c => c?.name === 'synapse_design_pipeline_begin' && typeof c?.result?.draftId === 'string'),
      qualityInspected: trace.some(c =>
        (c?.name === 'synapse_design_pipeline_inspect' && c?.arguments?.kind === 'quality')
        || (c?.name === 'synapse_design_pipeline_context' && c?.arguments?.tool === 'get_design_quality')),
      lintInspected: trace.some(c =>
        (c?.name === 'synapse_design_pipeline_context' && c?.arguments?.tool === 'lint_document')
        || c?.name === 'lint_document'),
      visualReviewed: trace.some(c => c?.name === 'synapse_design_pipeline_finish' && c?.result?.stage === 'needs_visual_review'),
      published: trace.some(c => c?.name === 'synapse_design_pipeline_finish' && c?.result?.published === true),
    },
  }
}

function evaluateScreens(plannedScreens, pocScreens, latestReview, stats) {
  const declared = (Array.isArray(plannedScreens) ? plannedScreens : []).map(s => String(s).trim()).filter(Boolean)
  const reviewEntries = Array.isArray(latestReview?.screens) ? latestReview.screens : []
  const matched = []
  const omitted = []
  const missing = []
  const usedNodeIds = new Set()
  for (const screen of declared) {
    const key = screen.toLowerCase()
    const entry = reviewEntries.find(r => isRecord(r) && String(r.name ?? '').trim().toLowerCase() === key)
    if (entry && typeof entry.omittedReason === 'string' && entry.omittedReason.trim().length >= 8) {
      omitted.push(screen)
      continue
    }
    const explicitId = entry && typeof entry.nodeId === 'string' ? entry.nodeId.trim() : undefined
    const node = explicitId !== undefined
      ? (explicitId && !usedNodeIds.has(explicitId) ? stats.byId.get(explicitId) : undefined)
      : stats.byName.get(key)
    if (nonEmptyScreenContainer(node) && (typeof node.id !== 'string' || !usedNodeIds.has(node.id))) {
      if (typeof node.id === 'string') usedNodeIds.add(node.id)
      matched.push(screen)
    } else {
      missing.push(screen)
    }
  }
  const requiredPoc = (Array.isArray(pocScreens) ? pocScreens : []).map(s => String(s).trim()).filter(Boolean)
  const mappedPoc = []
  const missingPoc = []
  for (const screen of requiredPoc) {
    const key = screen.toLowerCase()
    const entry = reviewEntries.find(r => isRecord(r) && String(r.name ?? '').trim().toLowerCase() === key)
    const omittedOk = isRecord(entry) && typeof entry.omittedReason === 'string' && entry.omittedReason.trim().length >= 8
    const builtNode = isRecord(entry) && typeof entry.nodeId === 'string' ? stats.byId.get(entry.nodeId.trim()) : undefined
    const mappedOk = isRecord(entry) && nonEmptyScreenContainer(builtNode)
      && typeof entry.pocScreenshot === 'string' && entry.pocScreenshot.trim().length > 0
      && typeof entry.differences === 'string' && entry.differences.trim().length >= 8
    if (omittedOk || mappedOk) mappedPoc.push(screen)
    else missingPoc.push(screen)
  }
  return {
    screens: { declared, matched, omitted, missing, complete: missing.length === 0 },
    pocMapping: { required: requiredPoc, mapped: mappedPoc, missing: missingPoc, complete: missingPoc.length === 0 },
  }
}

export function scoreDesignRun({ briefId, plannedScreens = [], pocScreens = [], toolTrace = [], documentJson = '{}' }) {
  const stats = collectDocumentStats(documentJson)
  const engineMetrics = measureEngineDiagnostics(documentJson)
  const { steps, latestReview } = inspectTrace(toolTrace)
  const { screens, pocMapping } = evaluateScreens(plannedScreens, pocScreens, latestReview, stats)
  return {
    briefId: briefId ?? 'custom',
    steps,
    screens,
    linkedRefCount: stats.linkedRefCount,
    variableBindingRatio: stats.variableBindingRatio,
    blockingLintCount: engineMetrics.blockingLintCount,
    undersizedTargetCount: engineMetrics.undersizedTargetCount,
    criticalTargetCount: engineMetrics.criticalTargetCount,
    pocMapping,
  }
}

function main(argv) {
  if (argv.includes('--list')) {
    console.log(JSON.stringify(EVAL_BRIEFS, null, 2))
    return
  }
  const runIdx = argv.indexOf('--run')
  if (runIdx === -1 || !argv[runIdx + 1]) {
    console.error('Usage: node scripts/eval-synapse-design.mjs --list | --run <run-artifact.json>')
    process.exit(1)
  }
  const artifact = JSON.parse(readFileSync(resolve(argv[runIdx + 1]), 'utf8'))
  if (typeof artifact?.documentJson !== 'string' && typeof artifact?.documentPath !== 'string') {
    console.error('Run artifact requires either documentJson or documentPath')
    process.exit(1)
  }
  const documentJson = typeof artifact.documentJson === 'string'
    ? artifact.documentJson
    : readFileSync(resolve(artifact.documentPath), 'utf8')
  console.log(JSON.stringify(scoreDesignRun({ ...artifact, documentJson }), null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2))
}
