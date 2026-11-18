/** Compare stored source-state pixels with an isolated real CanvasKit render. */
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { callOpenPencilMcp } from './managed-mcp-client.mjs';
import { decodePng, diffImages } from './png-diff.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const unverified = (reason) => ({ status: 'unverified', reason: String(reason).slice(0, 500) });

function graphicRegion(image, rect, scale) {
  if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite))
    throw new Error('Graphic bounds are unavailable');
  const x = Math.floor(rect.x * scale),
    y = Math.floor(rect.y * scale);
  const width = Math.ceil((rect.x + rect.width) * scale) - x;
  const height = Math.ceil((rect.y + rect.height) * scale) - y;
  if (
    x < 0 ||
    y < 0 ||
    width < 1 ||
    height < 1 ||
    x + width > image.width ||
    y + height > image.height
  )
    throw new Error('Graphic evidence is clipped');
  const pixels = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row++) {
    const start = ((y + row) * image.width + x) * 4;
    image.pixels.copy(pixels, row * width * 4, start, start + width * 4);
  }
  return { width, height, pixels };
}

function hasVisibleVariation(image) {
  const channel = (offset, index) =>
    255 + ((image.pixels[offset + index] - 255) * image.pixels[offset + 3]) / 255;
  for (let offset = 4; offset < image.pixels.length; offset += 4)
    if ([0, 1, 2].some((index) => Math.abs(channel(offset, index) - channel(0, index)) > 24))
      return true;
  return false;
}

/** A numerical match never upgrades an incomplete or approximate capture. */
export function compareCapturedBoard(board, importedPng, metadata) {
  const source = board.sourceScreenshot;
  if (!source?.fullBoard) return unverified('Source evidence covers only part of the board');
  if (board.structure?.status !== 'verified')
    return unverified('Structural comparison is incomplete');
  if (!/^canvaskit-(?:headless|editor)$/.test(metadata?.renderer ?? ''))
    return unverified('A real CanvasKit screenshot is required');
  try {
    const bytes = Buffer.from(source.base64, 'base64');
    if (hash(bytes) !== source.sha256) return unverified('Source screenshot checksum mismatch');
    const a = decodePng(bytes),
      b = decodePng(importedPng);
    const comparison = diffImages(a, b, 24);
    if (!comparison.comparable) return unverified(comparison.reason);
    const graphics = (board.evidence?.chartCandidates ?? []).map((candidate) => {
      const original = graphicRegion(a, candidate.rect, source.scale ?? 1);
      const converted = graphicRegion(b, candidate.rect, source.scale ?? 1);
      return {
        ...diffImages(original, converted, 24),
        sourceHasVariation: hasVisibleVariation(original),
      };
    });
    if (graphics.some((graphic) => !graphic.sourceHasVariation))
      return unverified('A captured graphic is visually blank; its data state needs review');
    return {
      status:
        comparison.ratio <= 0.05 && graphics.every((graphic) => graphic.ratio <= 0.05)
          ? 'verified'
          : 'differences',
      renderer: metadata.renderer,
      sourceSha256: source.sha256,
      importedSha256: hash(importedPng),
      comparison: {
        width: a.width,
        height: a.height,
        ratio: comparison.ratio,
        tolerance: 24,
        passRatio: 0.05,
      },
      graphics,
      note: 'Pixel comparison supports visual review; it does not prove accessibility or application behavior.',
    };
  } catch (error) {
    return unverified(error.message);
  }
}

function findNode(document, id) {
  const walk = (nodes) => {
    for (const node of nodes ?? []) {
      if (node.id === id) return node;
      const found = walk(node.children);
      if (found) return found;
    }
  };
  return (
    walk(document.children) ?? document.pages?.map((page) => walk(page.children)).find(Boolean)
  );
}

/** Renderer failure retains captures as unverified; cancellation remains cancellation. */
export async function verifyHtmlBoards({ document, boards, signal }) {
  signal?.throwIfAborted();
  const updated = boards.map((board) => ({ ...board }));
  const pending = updated.filter((board) => {
    if (!board.sourceScreenshot?.fullBoard || board.structure?.status !== 'verified') {
      board.visual = unverified('Full source pixels and verified structure are required');
      return false;
    }
    const node = findNode(document, board.rootId);
    const subtreeHash = node ? hash(JSON.stringify(node)) : undefined;
    return !(
      board.visual?.status === 'verified' &&
      board.visual.subtreeHash === subtreeHash &&
      board.visual.sourceSha256 === board.sourceScreenshot?.sha256
    );
  });
  if (!pending.length) return updated;
  let host;
  try {
    // Dynamic loading avoids the converter -> EngineSession -> converter cycle.
    const { startNodeHost } = await import('./node-host.mjs');
    const runtimeRoot = fileURLToPath(new URL('.', import.meta.url));
    host = await startNodeHost({
      document,
      webRoot: join(runtimeRoot, 'web-bundle'),
      canvaskitRoot: join(runtimeRoot, 'web-bundle', 'canvaskit'),
      headless: true,
    });
    for (const board of pending) {
      signal?.throwIfAborted();
      try {
        const screenshot = await callOpenPencilMcp({
          baseUrl: host.baseUrl,
          token: host.token,
          tool: 'get_screenshot',
          arguments: {
            nodeId: board.rootId,
            isolate: true,
            background: 'canvas',
            scale: board.sourceScreenshot?.scale ?? 1,
            maxSize: 4096,
          },
          signal,
          timeoutMs: 30_000,
        });
        const image = screenshot.images.find((item) => item.mimeType === 'image/png');
        board.visual = image
          ? compareCapturedBoard(board, image.bytes, screenshot.value)
          : unverified('Converted board screenshot is unavailable');
        const node = findNode(document, board.rootId);
        if (node) board.visual.subtreeHash = hash(JSON.stringify(node));
      } catch (error) {
        signal?.throwIfAborted();
        board.visual = unverified(error.message);
      }
    }
  } catch (error) {
    signal?.throwIfAborted();
    for (const board of pending) board.visual = unverified(error.message);
  } finally {
    await host?.close();
  }
  return updated;
}
