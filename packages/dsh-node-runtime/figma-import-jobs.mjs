// Chunked, resumable Figma REST imports.
//
// A parent link can hold hundreds of boards; fetching it in one request is
// what timed out. A job instead probes the target with `depth=1`, inserts
// the parent frame as an empty shell, then fetches and inserts each child
// board separately (3 in flight, inserted in order). A board that is still
// too large is subdivided one level at a time. Raw responses are cached per
// file version so a failed or cancelled job resumes without refetching.

import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { FigmaImageResolver, collectImageRefs } from './figma-images.mjs'
import {
  FigmaApiError,
  figmaFetch,
  figmaFileUrl,
  figmaNodesUrl,
  parseFigmaWebUrl,
  resolveFigmaToken,
} from './figma-rest-client.mjs'

const FETCH_CONCURRENCY = 3
const MAX_SUBDIVIDE_DEPTH = 3
const DEFAULT_MAX_NODES = 60_000
const SUBDIVIDE_CODES = new Set(['FIGMA_TIMEOUT', 'FIGMA_NODE_TOO_LARGE'])

export function defaultFigmaCacheDir(env = process.env) {
  return env.DSH_FIGMA_CACHE_DIR || join(homedir(), '.cache', 'dsh-design-pencil', 'figma')
}

function maxNodes(env = process.env) {
  const value = Number(env.DSH_FIGMA_MAX_NODES)
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_MAX_NODES
}

function safeSegment(value) {
  return String(value).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120)
}

function box(node) {
  const b = node?.absoluteBoundingBox
  return b && Number.isFinite(b.x) && Number.isFinite(b.y) ? b : null
}

function parseNodeIds(raw) {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : []
  return list.map(id => String(id).trim().replace(/-/g, ':')).filter(Boolean)
}

/**
 * Run `tasks` (thunks that never reject) with bounded concurrency, in order,
 * never more than `window` tasks ahead of the consumer. Returns
 * `{ results, consumed }`: `results[i]` resolves to task i's value and the
 * caller calls `consumed()` after handling each result.
 */
function pooled(tasks, limit, window = limit * 2) {
  const results = tasks.map(() => {
    let resolve
    const promise = new Promise(r => { resolve = r })
    return { promise, resolve }
  })
  let next = 0
  let taken = 0
  const waiters = new Set()
  const worker = async () => {
    while (next < tasks.length) {
      if (next - taken >= window) {
        await new Promise(r => { waiters.add(r) })
        continue
      }
      const index = next++
      results[index].resolve(await tasks[index]())
    }
  }
  for (let i = 0; i < Math.min(limit, tasks.length); i += 1) worker()
  return {
    results: results.map(r => r.promise),
    consumed() {
      taken += 1
      for (const resolve of waiters) resolve()
      waiters.clear()
    },
  }
}

function publicJob(job) {
  const { completed: _completed, subdivided: _subdivided, anchor: _anchor, force: _force, scope: _scope, ...rest } = job
  return {
    ...rest,
    jobId: job.id,
    progress: { total: job.total, done: job.done, failed: job.failed.length, current: job.current ?? null },
  }
}

export class FigmaImportJobs {
  #invoke
  #cacheDir
  #onFonts
  #jobs = new Map()
  #running = new Map()
  #timeoutMs
  #scope
  #siblingCount

  /**
   * @param {object} options
   * @param {(name: string, args: object) => object} options.invoke engine tool call
   * @param {string} [options.cacheDir]
   * @param {(fonts: object[]) => void} [options.onFonts] font inventory hook
   */
  constructor({ invoke, cacheDir = defaultFigmaCacheDir(), onFonts, requestTimeoutMs, scope = 'standalone', siblingCount = () => 0 } = {}) {
    this.#invoke = invoke
    this.#cacheDir = cacheDir
    this.#onFonts = onFonts
    this.#timeoutMs = requestTimeoutMs
    this.#scope = scope
    this.#siblingCount = siblingCount
  }

  #jobPath(id) {
    return join(this.#cacheDir, 'jobs', `${safeSegment(id)}.json`)
  }

  #persist(job) {
    job.updatedAt = new Date().toISOString()
    mkdirSync(join(this.#cacheDir, 'jobs'), { recursive: true, mode: 0o700 })
    const destination = this.#jobPath(job.id)
    const temporary = `${destination}.${process.pid}.tmp`
    writeFileSync(temporary, JSON.stringify(job), { mode: 0o600 })
    renameSync(temporary, destination)
  }

  #load(id) {
    if (this.#jobs.has(id)) return this.#jobs.get(id)
    const path = this.#jobPath(id)
    if (!existsSync(path)) return null
    const job = JSON.parse(readFileSync(path, 'utf8'))
    if (job.scope !== this.#scope) return null
    // A job persisted mid-run belongs to a host that has since exited.
    if (job.status === 'running' || job.status === 'queued') job.status = 'interrupted'
    this.#jobs.set(id, job)
    return job
  }

  #chunkPath(job, nodeId) {
    return join(this.#cacheDir, safeSegment(job.fileKey), safeSegment(job.version ?? 'unknown'), `${safeSegment(nodeId)}.json`)
  }

  async #fetchNode(job, ctx, nodeId, { depth, name } = {}) {
    const cached = depth === undefined ? this.#chunkPath(job, nodeId) : null
    if (cached && existsSync(cached)) return JSON.parse(readFileSync(cached, 'utf8'))
    const body = await figmaFetch(figmaNodesUrl(job.fileKey, [nodeId], {
      depth, version: job.apiVersion,
    }), {
      token: ctx.token, signal: ctx.signal, timeoutMs: ctx.timeoutMs, nodeId, nodeName: name,
    })
    if (body.version && job.version && body.version !== job.version) {
      throw new FigmaApiError('FIGMA_FILE_CHANGED', 'Figma returned a different version for a child board; restart the import')
    }
    if (cached) {
      mkdirSync(join(cached, '..'), { recursive: true, mode: 0o700 })
      const temporary = `${cached}.${process.pid}.tmp`
      writeFileSync(temporary, JSON.stringify(body), { mode: 0o600 })
      renameSync(temporary, cached)
    }
    return body
  }

  /** Resolve the job target into an optional shell plus child boards. */
  async #probe(job, ctx) {
    if (job.nodeIds.length > 0) {
      const body = await figmaFetch(figmaNodesUrl(job.fileKey, job.nodeIds, { geometry: false, depth: 1 }), {
        token: ctx.token, signal: ctx.signal, timeoutMs: ctx.timeoutMs, nodeId: job.nodeIds.join(','),
      })
      job.version ??= body.version ?? body.lastModified
      job.apiVersion = body.version
      const children = job.nodeIds.map(id => body.nodes?.[id]?.document).filter(Boolean)
      if (children.length === 0) throw new FigmaApiError('FIGMA_NOT_FOUND', `None of ${job.nodeIds.join(', ')} exist in file ${job.fileKey}`)
      return { shell: null, layoutMode: null, children: children.map(({ children: _, ...node }) => node) }
    }
    if (!job.nodeId) {
      const body = await figmaFetch(figmaFileUrl(job.fileKey, { geometry: false, depth: 2 }), {
        token: ctx.token, signal: ctx.signal, timeoutMs: ctx.timeoutMs,
      })
      job.version ??= body.version ?? body.lastModified
      job.apiVersion = body.version
      const pages = body.document?.children ?? []
      const visible = pages.filter(p => p.visible !== false && p.children?.length)
      if (!visible.length) throw new FigmaApiError('FIGMA_NOT_FOUND', `File ${job.fileKey} has no layers`)
      return { shell: null, layoutMode: null, children: [], pages: visible }
    }
    const body = await figmaFetch(figmaNodesUrl(job.fileKey, [job.nodeId], { depth: 1 }), {
      token: ctx.token, signal: ctx.signal, timeoutMs: ctx.timeoutMs, nodeId: job.nodeId,
    })
    job.version ??= body.version ?? body.lastModified
    job.apiVersion = body.version
    const target = body.nodes?.[job.nodeId]?.document
    if (!target) throw new FigmaApiError('FIGMA_NOT_FOUND', `Node ${job.nodeId} was not found in file ${job.fileKey}`, { nodeId: job.nodeId })
    job.rootName = target.name
    const children = Array.isArray(target.children) ? target.children : []
    if (target.type === 'CANVAS') return { shell: null, layoutMode: null, children }
    if (children.length === 0) return { shell: null, layoutMode: null, children: [target] }
    const { children: _, ...shell } = target
    return { shell, layoutMode: target.layoutMode ?? null, children }
  }

  async #engine(name, args) {
    const result = await this.#invoke(name, args)
    if (result?.isError) {
      const text = result.content?.[0]?.text ?? 'engine rejected the import'
      throw new FigmaApiError('ENGINE_REJECTED', text)
    }
    return result.structuredContent ?? {}
  }

  async #insert(job, ctx, body, placement) {
    const pending = Object.values(body.nodes ?? {}).map(entry => entry.document).filter(Boolean)
    let incoming = 0
    while (pending.length) {
      const node = pending.pop()
      if (node.visible === false) continue
      incoming++
      pending.push(...(node.children ?? []))
    }
    if (job.nodeCount + incoming > maxNodes()) {
      throw new FigmaApiError('FIGMA_IMPORT_LIMIT', `Next chunk would exceed ${maxNodes()} nodes; import a smaller nodeIds subset or raise DSH_FIGMA_MAX_NODES`)
    }
    const refs = collectImageRefs(body)
    const urls = refs.size > 0 ? await ctx.images.resolve(refs) : {}
    const out = await this.#engine('import_figma_rest', {
      restJson: JSON.stringify(body),
      layout: job.layout,
      ...(Object.keys(urls).length > 0 ? { imageUrlsJson: JSON.stringify(urls) } : {}),
      ...placement,
    })
    if (out.persistenceError) {
      job.persistenceError = out.persistenceError
      job.warnings.push(`Import applied, but draft persistence failed: ${out.persistenceError}`)
    }
    job.nodeCount += Number(out.nodeCount) || 0
    for (const font of out.fonts ?? []) {
      const key = `${font.family}|${font.weight}|${font.italic}`
      if (!job.fonts.some(f => `${f.family}|${f.weight}|${f.italic}` === key)) job.fonts.push(font)
    }
    for (const ref of out.unresolvedImageRefs ?? []) {
      if (!job.unresolvedImageRefs.includes(ref)) job.unresolvedImageRefs.push(ref)
    }
    job.warnings.push(...(out.warnings ?? []).slice(0, 20))
    return out
  }

  async #fonts(job, ctx) {
    if (!job.fetchFonts || !this.#onFonts || !job.fonts.length) return
    job.current = { phase: 'fonts', count: job.fonts.length }
    this.#persist(job)
    const outcomes = await this.#onFonts(job.fonts, ctx.signal)
    for (const face of outcomes ?? []) {
      if (!face.available) job.warnings.push(`Missing font ${face.family} ${face.weight}: ${face.error}`)
      if (face.warning) job.warnings.push(face.warning)
    }
  }

  /** Insert one REST body under `anchor`, learning the page offset on first use. */
  async #insertAt(job, ctx, anchor, body, doc) {
    const out = await this.#insert(job, ctx, body, this.#placement(anchor, doc))
    if (anchor.offsetX === undefined && Array.isArray(out.bounds) && Array.isArray(out.sourceBounds)) {
      anchor.offsetX = out.bounds[0] - out.sourceBounds[0]
      anchor.offsetY = out.bounds[1] - out.sourceBounds[1]
      this.#persist(job)
    }
    return out
  }

  /**
   * Insert `children` under `anchor` (`{ parent?, pageId?, offsetX?,
   * offsetY?, sourceOrigin? }`). Returns whether every child imported.
   */
  async #importChildren(job, ctx, children, anchor, layoutMode, depth) {
    const flowOrder = job.layout === 'semantic' && (layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL')
    // The engine appends each insert; inserting topmost-first reproduces
    // Figma's stacking, while semantic auto layout needs flow order.
    const ordered = flowOrder ? [...children] : [...children].reverse()
    anchor.baseIndex ??= this.#siblingCount(anchor)
    anchor.rootBySource ??= {}
    anchor.sourceOrder = ordered.map(child => child.id)
    const pending = ordered.filter(child => !job.completed.includes(`${depth}:${child.id}`))
    job.total += pending.length
    const failedBefore = job.failed.length
    // Boards subdivided on an earlier run go straight back to their parts.
    const fetchable = pending.map(child => job.subdivided[child.id]
      ? () => Promise.resolve({ error: new FigmaApiError('FIGMA_NODE_TOO_LARGE', 'subdivided earlier') })
      : () => this.#fetchNode(job, ctx, child.id, { name: child.name }).then(body => ({ body }), error => ({ error })))
    const pool = pooled(fetchable, FETCH_CONCURRENCY)
    for (const [index, child] of pending.entries()) {
      const { body, error } = await pool.results[index]
      pool.consumed()
      if (ctx.signal.aborted) throw ctx.signal.reason
      job.current = { nodeId: child.id, name: child.name }
      const key = `${depth}:${child.id}`
      if (error) {
        if (error instanceof FigmaApiError && SUBDIVIDE_CODES.has(error.code) && depth < MAX_SUBDIVIDE_DEPTH) {
          const subdivided = await this.#subdivide(job, ctx, child, anchor, depth).catch(e => e)
          if (subdivided === true || subdivided === 'partial') {
            if (subdivided === true) {
              job.completed.push(key)
              job.done += 1
            }
            this.#persist(job)
            continue
          }
          if (subdivided instanceof Error && ctx.signal.aborted) throw ctx.signal.reason
          if (subdivided instanceof FigmaApiError && subdivided.code === 'FIGMA_IMPORT_LIMIT') throw subdivided
        }
        const failure = error instanceof FigmaApiError ? error.toJSON() : { code: 'FIGMA_ERROR', message: String(error?.message ?? error) }
        job.failed.push({ ...failure, nodeId: child.id, name: child.name, retryable: true })
        this.#persist(job)
        continue
      }
      try {
        const doc = body.nodes?.[child.id]?.document
        if (!doc) throw new FigmaApiError('FIGMA_NOT_FOUND', `Node ${child.id} disappeared from the file`, { nodeId: child.id })
        const out = await this.#insertAt(job, ctx, anchor, body, doc)
        anchor.rootBySource[child.id] = out.rootIds?.[0]
        await this.#restoreOrder(job, anchor)
        job.rootIds.push(...(out.rootIds ?? []))
        job.done += 1
        job.completed.push(key)
      } catch (error) {
        if (ctx.signal.aborted) throw ctx.signal.reason
        if (error instanceof FigmaApiError && error.code === 'FIGMA_IMPORT_LIMIT') throw error
        job.failed.push({
          ...(error instanceof FigmaApiError ? error.toJSON() : { code: 'ENGINE_REJECTED', message: String(error?.message ?? error) }),
          nodeId: child.id, name: child.name, retryable: false,
        })
      }
      this.#persist(job)
      if (job.persistenceError) throw new FigmaApiError('FIGMA_DRAFT_WRITE', `Imported chunks remain applied, but recovery persistence failed: ${job.persistenceError}`)
    }

    return job.failed.length === failedBefore
  }

  async #restoreOrder(job, anchor) {
    let index = anchor.baseIndex ?? 0
    for (const sourceId of anchor.sourceOrder ?? []) {
      const nodeId = anchor.rootBySource?.[sourceId]
      if (!nodeId) continue
      const out = await this.#engine('move_node', {
        nodeId, parent: anchor.parent || '0', pageId: anchor.pageId, index,
      })
      if (out.persistenceError) {
        job.persistenceError = out.persistenceError
        job.warnings.push(`Stacking order applied, but draft persistence failed: ${out.persistenceError}`)
      }
      index++
    }
  }

  #placement(anchor, doc) {
    const b = box(doc)
    const placement = {}
    if (anchor.parent) placement.parent = anchor.parent
    if (anchor.pageId) placement.pageId = anchor.pageId
    if (anchor.sourceParents?.length) {
      placement.sourceParentsJson = JSON.stringify(anchor.sourceParents)
    } else if (anchor.offsetX !== undefined && b) {
      placement.x = Math.round((b.x + anchor.offsetX) * 100) / 100
      placement.y = Math.round((b.y + anchor.offsetY) * 100) / 100
    } else if (anchor.sourceOrigin) {
      // Let the engine pick the drop point for the union of all boards.
      placement.sourceOriginX = anchor.sourceOrigin[0]
      placement.sourceOriginY = anchor.sourceOrigin[1]
    }
    return placement
  }

  /**
   * A board too large for one request: insert its frame, then its children.
   * Returns `true` (all parts imported), `'partial'`, or `false` (not
   * divisible). The frame's anchor is persisted so a resume never inserts
   * the frame twice.
   */
  async #subdivide(job, ctx, child, anchor, depth) {
    const body = await this.#fetchNode(job, ctx, child.id, { depth: 1, name: child.name })
    const doc = body.nodes?.[child.id]?.document
    const kids = Array.isArray(doc?.children) ? doc.children : []
    if (!doc || kids.length === 0) return false
    let inner = job.subdivided[child.id]
    if (!inner) {
      const { children: _, ...shellDoc } = doc
      const shellBody = { ...body, nodes: { [child.id]: { ...body.nodes[child.id], document: shellDoc } } }
      const out = await this.#insertAt(job, ctx, anchor, shellBody, doc)
      const parent = out.rootIds?.[0]
      if (!parent) throw new FigmaApiError('ENGINE_REJECTED', `Could not create frame for ${child.name}`)
      job.rootIds.push(parent)
      anchor.rootBySource ??= {}
      anchor.rootBySource[child.id] = parent
      await this.#restoreOrder(job, anchor)
      const b = box(doc)
      inner = {
        parent, pageId: anchor.pageId,
        offsetX: -(b?.x ?? 0), offsetY: -(b?.y ?? 0),
        sourceParents: [...(anchor.sourceParents ?? []), shellDoc],
      }
      job.subdivided[child.id] = inner
      job.warnings.push(`"${child.name}" was too large for one request and was imported in ${kids.length} parts`)
      this.#persist(job)
    }
    const complete = await this.#importChildren(job, ctx, kids, inner, doc.layoutMode, depth + 1)
    return complete ? true : 'partial'
  }

  async #run(job, ctx) {
    job.status = 'running'
    job.error = null
    this.#persist(job)
    try {
      const probedVersion = job.version
      const probe = { ...job, version: undefined }
      const { shell, layoutMode, children, pages } = await this.#probe(probe, ctx)
      if (probedVersion && probe.version && probedVersion !== probe.version && !job.force) {
        throw new FigmaApiError('FIGMA_FILE_CHANGED', `The Figma file changed since this job started (${probedVersion} → ${probe.version}); start a new import or resume with force:true`)
      }
      job.version = probe.version
      job.apiVersion = probe.apiVersion
      job.rootName = probe.rootName
      if (!job.drop.pageId && !pages) {
        const listed = await this.#engine('list_pages', {})
        job.drop.pageId = listed.pages[listed.activePageIndex]?.id
        this.#persist(job)
      }
      if (pages) {
        job.total = job.done = job.completed.length
        job.pageTargets ??= {}
        for (const page of pages) {
          let pageId = job.pageTargets[page.id]
          if (!pageId) {
            await this.#engine('add_page', { name: page.name })
            const listed = await this.#engine('list_pages', {})
            pageId = listed.pages.at(-1).id
            job.pageTargets[page.id] = pageId
            this.#persist(job)
          }
          const boxes = page.children.map(box).filter(Boolean)
          const sourceOrigin = [
            Math.min(...boxes.map(b => b.x)), Math.min(...boxes.map(b => b.y)),
          ]
          job.pageAnchors ??= {}
          const anchor = job.pageAnchors[page.id] ??= { pageId, sourceOrigin }
          await this.#importChildren(job, ctx, page.children, anchor, null, 0)
        }
        await this.#fonts(job, ctx)
        job.current = null
        job.status = job.failed.length ? (job.done ? 'partial' : 'failed') : 'succeeded'
        return publicJob(job)
      }
      let anchor = job.anchor
      if (!anchor) {
        if (shell) {
          const out = await this.#insert(job, ctx, { nodes: { [shell.id]: { document: shell } } }, job.drop)
          const parent = out.rootIds?.[0]
          if (!parent) throw new FigmaApiError('ENGINE_REJECTED', 'Could not create the parent frame')
          job.rootIds.push(parent)
          job.bounds = out.bounds
          const b = box(shell)
          anchor = {
            parent, pageId: job.drop.pageId,
            offsetX: -(b?.x ?? 0), offsetY: -(b?.y ?? 0),
            sourceParents: [shell],
          }
        } else {
          anchor = { parent: job.drop.parent, pageId: job.drop.pageId }
          const union = children.map(box).filter(Boolean)
          if (union.length > 0) {
            const minX = Math.min(...union.map(b => b.x))
            const minY = Math.min(...union.map(b => b.y))
            if (job.drop.x !== undefined || job.drop.y !== undefined) {
              anchor.offsetX = (job.drop.x ?? 0) - minX
              anchor.offsetY = (job.drop.y ?? 0) - minY
            } else {
              anchor.sourceOrigin = [minX, minY]
            }
          }
        }
        job.anchor = anchor
        this.#persist(job)
        if (job.persistenceError) throw new FigmaApiError('FIGMA_DRAFT_WRITE', `Parent frame remains applied, but recovery persistence failed: ${job.persistenceError}`)
      }
      job.done = job.completed.length
      job.total = job.done
      await this.#importChildren(job, ctx, children, anchor, layoutMode, 0)
      await this.#fonts(job, ctx)
      job.current = null
      job.status = job.failed.length === 0 ? 'succeeded' : job.done > 0 ? 'partial' : 'failed'
    } catch (error) {
      job.current = null
      if (ctx.signal.aborted) {
        job.status = 'cancelled'
      } else {
        job.error = error instanceof FigmaApiError ? error.toJSON() : { code: 'FIGMA_ERROR', message: String(error?.message ?? error) }
        job.status = job.done > 0 ? 'partial' : 'failed'
      }
    } finally {
      job.warnings = [...new Set([...job.warnings, ...ctx.images.warnings])].slice(0, 100)
      this.#persist(job)
      this.#running.delete(job.id)
    }
    return publicJob(job)
  }

  #launch(job, token) {
    const controller = new AbortController()
    const ctx = {
      token,
      signal: controller.signal,
      timeoutMs: this.#timeoutMs,
      images: new FigmaImageResolver({ fileKey: job.fileKey, token, signal: controller.signal, timeoutMs: this.#timeoutMs }),
    }
    const promise = this.#run(job, ctx)
    this.#running.set(job.id, { controller, promise })
    return promise
  }

  /** Start an import from a figma.com link. Returns `{ job, done }`. */
  start(args = {}) {
    for (const key of ['x', 'y']) {
      if (args[key] !== undefined && !Number.isFinite(Number(args[key]))) {
        throw new FigmaApiError('FIGMA_ARGUMENT', `${key} must be finite`)
      }
    }
    if (args.layout !== undefined && !['preserve', 'semantic'].includes(args.layout)) {
      throw new FigmaApiError('FIGMA_ARGUMENT', 'layout must be preserve or semantic')
    }
    const info = parseFigmaWebUrl(args.url)
    if (!info) throw new FigmaApiError('FIGMA_BAD_URL', 'url must be a figma.com design/file link')
    const token = resolveFigmaToken(args.figmaToken)
    if (!token) {
      throw new FigmaApiError('FIGMA_AUTH', 'Importing a figma.com link requires a Figma Personal Access Token (pass figmaToken or set FIGMA_TOKEN); alternatively copy the frames in Figma and paste them into the editor.')
    }
    const layout = args.layout === 'semantic' ? 'semantic' : 'preserve'
    const job = {
      id: randomBytes(6).toString('hex'),
      scope: this.#scope,
      status: 'queued',
      url: String(args.url),
      fileKey: info.fileKey,
      nodeId: info.nodeId ?? null,
      nodeIds: parseNodeIds(args.nodeIds),
      layout,
      fetchFonts: args.fetchFonts !== false,
      drop: {
        ...(args.parent ? { parent: String(args.parent) } : {}),
        ...(args.pageId ? { pageId: String(args.pageId) } : {}),
        ...(args.x !== undefined ? { x: Number(args.x) } : {}),
        ...(args.y !== undefined ? { y: Number(args.y) } : {}),
      },
      createdAt: new Date().toISOString(),
      total: 0,
      done: 0,
      failed: [],
      completed: [],
      subdivided: {},
      rootIds: [],
      fonts: [],
      warnings: [],
      unresolvedImageRefs: [],
      nodeCount: 0,
      error: null,
    }
    this.#jobs.set(job.id, job)
    return { job: publicJob(job), done: this.#launch(job, token) }
  }

  status(id) {
    const job = this.#load(String(id ?? ''))
    return job ? publicJob(job) : null
  }

  close() {
    for (const { controller } of this.#running.values()) {
      controller.abort(new FigmaApiError('FIGMA_CANCELLED', 'Host is shutting down; resume this import in the next session'))
    }
  }

  list() {
    const dir = join(this.#cacheDir, 'jobs')
    const ids = new Set(this.#jobs.keys())
    if (existsSync(dir)) {
      for (const file of readdirSync(dir)) if (file.endsWith('.json')) ids.add(file.slice(0, -5))
    }
    return [...ids].map(id => this.status(id)).filter(Boolean)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }

  cancel(id) {
    const running = this.#running.get(String(id ?? ''))
    if (!running) return this.status(id)
    running.controller.abort(new FigmaApiError('FIGMA_CANCELLED', 'Import cancelled'))
    return running.promise
  }

  /** Retry failed / unfinished boards of a job, skipping completed ones. */
  resume(id, { figmaToken, force = false } = {}) {
    const job = this.#load(String(id ?? ''))
    if (!job) throw new FigmaApiError('FIGMA_JOB_NOT_FOUND', `No Figma import job ${id}`)
    if (this.#running.has(job.id)) return { job: publicJob(job), done: this.#running.get(job.id).promise }
    if (job.status === 'succeeded') return { job: publicJob(job), done: Promise.resolve(publicJob(job)) }
    const token = resolveFigmaToken(figmaToken)
    if (!token) throw new FigmaApiError('FIGMA_AUTH', 'Resuming needs the Figma token (figmaToken or FIGMA_TOKEN); tokens are never stored with jobs')
    job.failed = []
    job.persistenceError = null
    job.force = force
    return { job: publicJob(job), done: this.#launch(job, token) }
  }

  /** Read-only outline of a Figma node for planning an import. */
  async inspect(args = {}) {
    const info = parseFigmaWebUrl(args.url)
    if (!info) throw new FigmaApiError('FIGMA_BAD_URL', 'url must be a figma.com design/file link')
    const token = resolveFigmaToken(args.figmaToken)
    if (!token) throw new FigmaApiError('FIGMA_AUTH', 'inspect_figma_node requires figmaToken or FIGMA_TOKEN')
    const depth = Math.max(1, Math.min(3, Number(args.depth) || 1))
    const nodeId = parseNodeIds(args.nodeId)[0] ?? info.nodeId
    const body = nodeId
      ? await figmaFetch(figmaNodesUrl(info.fileKey, [nodeId], { geometry: false, depth }), { token, nodeId, timeoutMs: this.#timeoutMs })
      : await figmaFetch(figmaFileUrl(info.fileKey, { geometry: false, depth }), { token, timeoutMs: this.#timeoutMs })
    const root = nodeId ? body.nodes?.[nodeId]?.document : body.document
    if (!root) throw new FigmaApiError('FIGMA_NOT_FOUND', `Node ${nodeId} was not found in file ${info.fileKey}`, { nodeId })
    const outline = node => {
      const b = box(node)
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        ...(b ? { width: b.width, height: b.height } : {}),
        childCount: Array.isArray(node.children) ? node.children.length : 0,
        ...(Array.isArray(node.children) && node.children.some(c => Array.isArray(c.children))
          ? { children: node.children.map(outline) }
          : Array.isArray(node.children) ? { children: node.children.map(c => ({ id: c.id, name: c.name, type: c.type, ...(box(c) ? { width: box(c).width, height: box(c).height } : {}) })) } : {}),
      }
    }
    return {
      fileKey: info.fileKey,
      fileName: body.name,
      version: body.version ?? body.lastModified,
      node: outline(root),
      suggestedChunks: Array.isArray(root.children) ? root.children.length : 1,
    }
  }
}
