/** Resumable, source-bound HTML state import. No destination file writes occur here. */
import {
  withBrowser,
  clampViewport,
  captureCurrentPage,
  captureBoardScreenshot,
  renderPage,
} from './html-browser-capture.mjs';
import { pageCall, settlePage } from './html-capture-page.mjs';
import { discoverInterfaces, inspectState } from './html-state-discovery.mjs';
import { framePageCall } from './html-frame-context.mjs';
import { performSteps } from './html-state-actions.mjs';
import {
  applyHtmlStatePlan,
  commitHtmlStateCapture,
  recordHtmlDiscovery,
  mergeHtmlImportVariables,
} from './html-state-checkpoint.mjs';
import { validateExternalUrl } from './html-sources.mjs';
import { prepareHtmlStateFonts } from './html-state-resources.mjs';
import { withHtmlFontDefaults } from './html-font-defaults.mjs';

import { hash, readHtmlStateSource, sourceEvidence } from './html-state-input.mjs';
export { validateHtmlStatePlan } from './html-state-input.mjs';
import {
  htmlStateResult,
  compareHtmlStateStructure,
  htmlStateGraphics,
} from './html-state-report.mjs';
const clone = (value) => JSON.parse(JSON.stringify(value));

export class HtmlImportSession {
  #options;
  #state;
  #engine;
  #closed = false;
  constructor(options = {}) {
    this.#options = options;
    this.#state = options.checkpoint
      ? clone(options.checkpoint)
      : {
          version: 1,
          candidates: [],
          boards: [],
          captures: [],
          warnings: [],
          actions: 0,
          elapsedMs: 0,
          document: { version: '1.0.0', children: [] },
        };
    if (this.#state.version !== 1) throw new Error('Unsupported HTML import checkpoint');
  }
  async #source() {
    const source = await readHtmlStateSource(this.#options, this.#state.sourceFingerprint);
    this.#state.sourceFingerprint = source.fingerprint;
    return source;
  }
  async #page(source, signal, fn) {
    signal?.throwIfAborted();
    const viewport = clampViewport(
      this.#options.viewportWidth || 1440,
      this.#options.viewportHeight || 900,
    );
    const result = await withBrowser(
      { ...source, viewport, timeoutMs: 20000 },
      async (page, network, url) => {
        const { frameTree } = await page.send('Page.getFrameTree');
        const rootFrameId = frameTree.frame.id;
        const entry = new URL(url);
        const stop = page.on('Fetch.requestPaused', (event) => {
          let permitted = ['GET', 'HEAD', 'OPTIONS'].includes(event.request.method);
          try {
            const dest = new URL(event.request.url);
            if (dest.origin !== entry.origin) validateExternalUrl(event.request.url);
            if (
              event.resourceType === 'Document' &&
              (dest.origin !== entry.origin ||
                !event.frameId ||
                (event.frameId === rootFrameId && dest.pathname !== entry.pathname))
            )
              permitted = false;
          } catch {
            permitted = false;
          }
          if (!permitted)
            this.#state.warnings.push(
              'Source request/navigation blocked by isolated capture policy; coverage may be incomplete',
            );
          const command = permitted ? 'Fetch.continueRequest' : 'Fetch.failRequest';
          void page
            .send(command, {
              requestId: event.requestId,
              ...(permitted ? {} : { errorReason: 'BlockedByClient' }),
            })
            .catch(() => {});
        });
        try {
          await page.send('Network.setBlockedURLs', { urls: ['ws://*', 'wss://*'] });
          await page.send('Page.addScriptToEvaluateOnNewDocument', {
            source:
              "window.open=()=>null;document.addEventListener('submit',e=>e.preventDefault(),true);",
          });
          await page.send('Fetch.enable', {
            patterns: [{ urlPattern: '*', requestStage: 'Request' }],
          });
          await page.send('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: false,
          });
          const aborted = () => {
            void page.close();
          };
          signal?.addEventListener('abort', aborted, { once: true });
          try {
            return { value: await fn(page, url, viewport, network) };
          } finally {
            signal?.removeEventListener('abort', aborted);
          }
        } finally {
          stop();
        }
      },
    );
    if (!result) {
      const error = new Error('A Chromium browser is required for interface-state capture');
      error.code = 'HTML_BROWSER_UNAVAILABLE';
      throw error;
    }
    return result.value;
  }
  async #load({ page, url, viewport, network }, steps, signal, onReplay) {
    const loaded = await renderPage(page, network, url, viewport, {
      timeoutMs: 10000,
      preserveViewport: true,
    });
    if (loaded.warnings.some((w) => /did not become idle|did not become true/.test(w)))
      throw new Error('Source did not become ready before capture');
    if (steps.length) {
      await onReplay?.();
      await performSteps(page, steps, signal);
    }
    if (!(await network.wait(Date.now() + 3000))) throw new Error('State resources did not settle');
    await page.evaluate(
      framePageCall(async (_args, context) => {
        const scopes = context.inventory().filter(({ status }) => status === 'available');
        const docs = scopes.map(({ framePath }) => context.resolve(framePath).doc);
        await Promise.race([
          Promise.all(
            docs.flatMap((doc) => [
              doc.fonts.ready,
              ...doc
                .getAnimations()
                .filter(
                  (animation) => animation.effect?.getComputedTiming().iterations !== Infinity,
                )
                .map((animation) => animation.finished.catch(() => {})),
            ]),
          ),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }),
      { awaitPromise: true },
    );
    await page.evaluate(
      pageCall(settlePage, { maxWaitMs: 3000, waitMs: 0, preserveScroll: true }),
      {
        awaitPromise: true,
      },
    );
  }
  async analyze({ signal } = {}) {
    if (this.#closed) throw new Error('HTML import session closed');
    const source = await this.#source();
    if (this.#state.analyzed && this.#state.frames) return this.#analysis();
    try {
      await this.#page(source, signal, async (page, url, viewport, network) => {
        await this.#load({ page, url, viewport, network }, [], signal);
        const inventory = await page.evaluate(framePageCall(discoverInterfaces));
        if (!this.#state.candidates.some(({ id }) => id === 'base'))
          this.#state.candidates.push({
            id: 'base',
            label: 'Initial page',
            kind: 'page',
            steps: [],
            status: 'pending',
            safe: true,
          });
        recordHtmlDiscovery(this.#state, inventory);
        this.#state.sourceEvidence = sourceEvidence(source, this.#options, inventory.text);
        if (
          !this.#state.candidates.some(({ id }) => id === 'source-coverage') &&
          (this.#state.sourceEvidence.bodyTruncated ||
            this.#state.sourceEvidence.scriptsTruncated ||
            this.#state.sourceEvidence.externalScripts.length)
        ) {
          this.#state.candidates.push({
            id: 'source-coverage',
            label: 'Source evidence follow-up',
            kind: 'source',
            steps: [],
            status: 'pending',
            safe: false,
            reason:
              'Read the referenced scripts and truncated source ranges before asserting complete interface discovery',
          });
        }
      });
    } catch (error) {
      if (error.code !== 'HTML_BROWSER_UNAVAILABLE') throw error;
      this.#state.staticFallback = true;
      this.#state.frames = [];
      this.#state.candidates = [
        {
          id: 'base',
          label: 'Initial page',
          kind: 'page',
          steps: [],
          status: 'pending',
          safe: true,
        },
        {
          id: 'unknown-interfaces',
          label: 'Uninspected interfaces',
          kind: 'hidden',
          status: 'pending',
          safe: false,
          reason: 'Browser unavailable; interactive coverage is unknown',
        },
      ];
      this.#state.warnings.push(
        'Browser unavailable; static CSS fallback cannot inspect interactive states',
      );
    }
    this.#state.analyzed = true;
    return this.#analysis();
  }
  #analysis() {
    return clone({
      sourceFingerprint: this.#state.sourceFingerprint,
      candidates: this.#state.candidates,
      frames: this.#state.frames,
      resources: this.#state.resources,
      hidden: this.#state.hidden,
      scrollContainers: this.#state.scrollContainers,
      sourceEvidence: this.#state.sourceEvidence,
      warnings: this.#state.warnings,
    });
  }
  async capture({
    states,
    maxStates = 4,
    signal,
    renewBudget = false,
    onCheckpoint,
    onProgress,
  } = {}) {
    if (typeof renewBudget !== 'boolean') throw new Error('renewBudget must be a boolean');
    if (renewBudget && this.#state.budgetExhausted) {
      this.#state.actions = 0;
      this.#state.elapsedMs = 0;
      this.#state.boardWindowStart = this.#state.boards.length;
      this.#state.budgetExhausted = false;
      this.#state.warnings = this.#state.warnings.filter(
        (w) => !/^(Interface exploration|Action|Visual verification) budget exhausted$/.test(w),
      );
    }
    if (renewBudget)
      for (const state of this.#state.candidates)
        if (state.status === 'failed' && state.safe) state.status = 'pending';
    const started = Date.now();
    const progress = (phase, candidate) =>
      onProgress?.({
        phase,
        candidate: candidate?.id,
        capturedCount: this.#state.boards.length,
        pendingCount: this.#state.candidates.filter(
          ({ status }) => status !== 'captured' && status !== 'excluded',
        ).length,
      });
    await progress('loading');
    await this.analyze({ signal });
    if (this.#state.staticFallback) {
      const { convertHtmlToDocument } = await import('./html-import.mjs');
      const converted = await convertHtmlToDocument({
        ...this.#options,
        preferBrowser: false,
        discoverStates: false,
      });
      this.#state.document = converted.document;
      this.#state.warnings.push(...(converted.warnings || []));
      this.#state.candidates[0].status = 'captured';
      this.#state.boards = [
        {
          id: 'base',
          label: 'Initial page',
          rootId: converted.document.children?.[0]?.id,
          visual: { status: 'unverified', reason: 'Static CSS fallback' },
        },
      ];
      const result = { ...this.#result(), renderMode: 'static-css', done: true };
      await onCheckpoint?.(result);
      return result;
    }
    if (states) applyHtmlStatePlan(this.#state, states);
    const source = await this.#source();
    const { EngineSession, convertSnapshotToDocument } = await import('./engine-session.mjs');
    this.#engine ??= new EngineSession(this.#state.document);
    let captured = 0;
    await this.#page(source, signal, async (page, url, viewport, network) => {
      while (captured < Math.min(4, Math.max(1, maxStates))) {
        signal?.throwIfAborted();
        if (
          this.#state.boards.length - (this.#state.boardWindowStart || 0) >= 40 ||
          this.#state.actions >= 120 ||
          this.#state.elapsedMs + Date.now() - started >= 600000
        ) {
          this.#state.budgetExhausted = true;
          this.#state.warnings.push('Interface exploration budget exhausted');
          break;
        }
        const pending = this.#state.candidates.filter(
          (item) => item.status === 'pending' && item.safe,
        );
        const candidate =
          pending.find(({ kind }) => kind === 'planned') ||
          pending.find(({ id }) => id === 'base') ||
          pending.find(({ kind }) => kind === 'tab') ||
          pending.find((item) => item.evidence?.framePath?.length) ||
          pending[0];
        if (!candidate) break;
        if (this.#state.actions + candidate.steps.length > 120) {
          this.#state.budgetExhausted = true;
          this.#state.warnings.push('Action budget exhausted');
          break;
        }
        this.#state.actions += candidate.steps.length;
        captured++;
        await progress('loading', candidate);
        try {
          await this.#load({ page, url, viewport, network }, candidate.steps, signal, () =>
            progress('replaying', candidate),
          );
          const evidence = await page.evaluate(
            framePageCall(inspectState, {
              expected: candidate.expected,
              expectedFramePath: candidate.expectedFramePath,
            }),
          );
          if (!evidence.expectedVisible)
            throw new Error('Expected interface did not become uniquely visible');
          const inventory = await page.evaluate(framePageCall(discoverInterfaces));
          evidence.pageText = inventory.text;
          recordHtmlDiscovery(this.#state, inventory, candidate.steps);
          await progress('capturing', candidate);
          const capture = await captureCurrentPage(page, viewport, viewport.height, [], {
            pixelMedia: true,
            includeFrames: true,
          });
          const snapshot = JSON.parse(capture.snapshot);
          const {
            shot: sourceShot,
            clip,
            fullBoard,
          } = await captureBoardScreenshot(page, snapshot, viewport);

          const evidenceSize =
            Buffer.byteLength(sourceShot.data, 'base64') + Buffer.byteLength(capture.snapshot);
          const supersededBytes =
            this.#state.boards.find((board) => board.id === candidate.id)?.evidenceBytes || 0;
          if (
            (this.#state.evidenceBytes || 0) - supersededBytes + evidenceSize >
            32 * 1024 * 1024
          ) {
            this.#state.budgetExhausted = true;
            this.#state.warnings.push('Capture evidence storage budget exhausted');
            break;
          }
          const semanticSignature = hash([
            inventory.text,
            inventory.visibleContainers,
            htmlStateGraphics(snapshot),
            snapshot.root,
          ]);
          const duplicate = this.#state.boards.find(
            (b) => b.semanticSignature === semanticSignature,
          );
          if (duplicate && candidate.kind !== 'planned') {
            candidate.status = 'excluded';
            candidate.reason = `Rendered state matches ${duplicate.label}`;
            candidate.boardId = duplicate.rootId;
            continue;
          }
          await progress('resources', candidate);
          const fonts = await prepareHtmlStateFonts(snapshot, capture, this.#state.fonts, {
            baseDir: source.baseDir,
            signal,
          });
          this.#state.fonts = fonts.faces;
          withHtmlFontDefaults(snapshot);
          snapshot.title = candidate.label;
          const palette = (await convertSnapshotToDocument({ snapshot: JSON.stringify(snapshot) }))
            .document.variables;
          const before = new Set(this.#engine.snapshot().document.children.map((n) => n.id));
          const result = this.#engine.callTool('import_web_snapshot', {
            snapshot: JSON.stringify(snapshot),
            x: '0',
            y: '0',
          });
          if (result.isError)
            throw new Error(result.content?.[0]?.text || 'Snapshot import failed');
          const document = this.#engine.snapshot().document;
          mergeHtmlImportVariables(document, palette);
          const root = document.children.find((n) => !before.has(n.id));
          if (!root || !root.children?.length)
            throw new Error('Captured interface produced an empty board');

          if (inventory.scrollContainers.length)
            this.#state.warnings.push(
              'Internal scroll containers require separate coverage; snapshot retains clipping',
            );
          const board = {
            id: candidate.id,
            semanticSignature,
            label: candidate.label,
            rootId: root.id,
            sourceScreenshot: {
              clip,
              fullBoard,
              width: Math.round(clip.width * clip.scale),
              height: Math.round(clip.height * clip.scale),
              scale: clip.scale,
              mimeType: 'image/png',
              sha256: hash(Buffer.from(sourceShot.data, 'base64')),
              base64: sourceShot.data,
            },
            evidence,
            warnings: [...fonts.warnings, ...capture.warnings],
            structure: compareHtmlStateStructure(snapshot, root),
            visual: { status: 'unverified', reason: 'Converted-render comparison required' },
          };
          commitHtmlStateCapture(this.#state, candidate, board, document, evidenceSize);
          this.#state.warnings.push(...fonts.warnings, ...capture.warnings);
          this.#engine.restoreDocument(this.#state.document, this.#engine.snapshot().version);
        } catch (error) {
          signal?.throwIfAborted();
          this.#engine.close();
          this.#engine = new EngineSession(this.#state.document);
          candidate.status = 'failed';
          candidate.reason = error.message;
          continue;
        }
        await onCheckpoint?.(this.#result(Date.now() - started));
      }
    });
    if (this.#options.verifyVisual === true && this.#state.boards.length) {
      const remaining = 600000 - this.#state.elapsedMs - (Date.now() - started);
      if (remaining > 0) {
        await progress('verifying');
        const { verifyHtmlBoards } = await import('./html-state-visual.mjs');
        const budgetSignal = AbortSignal.timeout(Math.max(1, remaining));
        const combined = signal ? AbortSignal.any([signal, budgetSignal]) : budgetSignal;
        this.#state.boards = await verifyHtmlBoards({
          document: this.#state.document,
          boards: this.#state.boards,
          signal: combined,
        });
      } else this.#state.warnings.push('Visual verification budget exhausted');
    }
    this.#state.elapsedMs += Date.now() - started;
    return this.#result();
  }
  #result(batchElapsed = 0) {
    const state = { ...this.#state, elapsedMs: this.#state.elapsedMs + batchElapsed };
    return htmlStateResult(state, state);
  }
  checkpoint() {
    return clone(this.#state);
  }
  close() {
    this.#closed = true;
    this.#engine?.close();
  }
}
