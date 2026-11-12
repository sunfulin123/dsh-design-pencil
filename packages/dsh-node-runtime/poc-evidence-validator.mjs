/** Pure schema, PNG dimension, and evidence-ledger validators for HTML POC handoffs. */

import { CONTENT_STATES, isRecord } from './draft-canvas-contract.mjs';
import { PNG_SIGNATURE } from './png-rgba-codec.mjs';

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function extractPngDimensions(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('A prototype screenshot must be a valid PNG');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) {
    throw new Error('A prototype screenshot must have nonzero dimensions');
  }
  return { width, height };
}

function parseViewportWidth(rawViewport) {
  const candidate = isRecord(rawViewport) ? rawViewport.width : rawViewport;
  if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 200 && candidate <= 4096) {
    return candidate;
  }
  throw new Error(
    `POC screenshot viewport must be an integer width between 200 and 4096 (got ${String(rawViewport)})`,
  );
}

export function parsePocScreenshotInputs(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 16) {
    throw new Error('Provide one to sixteen structured POC screenshots ({ path, screen, state?, viewport })');
  }
  return raw.map((entry) => {
    if (!isRecord(entry) || !nonEmptyText(entry.path) || !nonEmptyText(entry.screen)) {
      throw new Error('Each POC screenshot must be an object with non-empty path, screen, and numeric viewport');
    }
    const viewport = parseViewportWidth(entry.viewport);
    if (entry.state !== undefined && !nonEmptyText(entry.state)) {
      throw new Error('POC screenshot state must be a non-empty string when provided');
    }
    return {
      path: entry.path.trim(),
      screen: entry.screen.trim(),
      ...(entry.state === undefined ? {} : { state: entry.state.trim() }),
      viewport,
    };
  });
}

export function verifyPlannedScreensCovered(verifiedShots, plannedScreens) {
  if (!Array.isArray(plannedScreens) || plannedScreens.length === 0) return;
  const covered = new Set(verifiedShots.map((shot) => (shot.screen ?? '').toLocaleLowerCase('en-US')));
  const missing = plannedScreens
    .map((s) => s.name)
    .filter((name) => !covered.has(name.toLocaleLowerCase('en-US')));
  if (missing.length > 0) {
    throw new Error(`POC screenshots are missing planned screen(s): ${missing.join(', ')}`);
  }
}

export function groupPocScreens(screenshots) {
  const byScreen = new Map();
  for (const shot of screenshots) {
    if (!nonEmptyText(shot.screen)) continue;
    const key = shot.screen.trim().toLocaleLowerCase('en-US');
    const existing = byScreen.get(key);
    if (existing !== undefined) {
      if (!existing.screenshots.includes(shot.path)) existing.screenshots.push(shot.path);
    } else {
      byScreen.set(key, { name: shot.screen.trim(), screenshots: [shot.path] });
    }
  }
  return [...byScreen.values()];
}

function assertPassingGateEntry(report, key) {
  const entry = report[key];
  if (!isRecord(entry) || entry.status !== 'pass' || !nonEmptyText(entry.evidence)) {
    throw new Error(`POC evidence ledger requires ${key}.status="pass" with a non-empty observation`);
  }
}

function assertValidLedgerState(states, state) {
  const st = states?.[state];
  const pass = isRecord(st) && st.status === 'pass' && nonEmptyText(st.evidence);
  const na = isRecord(st) && st.status === 'not-applicable' && nonEmptyText(st.reason);
  if (!pass && !na) {
    throw new Error(
      `POC evidence ledger contentStates.${state} requires status="pass"+evidence or status="not-applicable"+reason`,
    );
  }
}

export function parseAndValidateEvidenceLedgerJson(rawBytes) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(rawBytes).toString('utf8'));
  } catch {
    throw new Error('POC evidence ledger must be valid JSON produced by verify-surface.mjs');
  }
  if (!isRecord(parsed)) throw new Error('POC evidence ledger must be a JSON object');
  for (const key of ['accessibility', 'responsive', 'visualReview']) {
    assertPassingGateEntry(parsed, key);
  }
  const states = isRecord(parsed.contentStates) ? parsed.contentStates : undefined;
  for (const state of CONTENT_STATES) assertValidLedgerState(states, state);
  if (!Array.isArray(parsed.targetViewports) || parsed.targetViewports.length === 0
      || !Array.isArray(parsed.renderedEvidence) || parsed.renderedEvidence.length === 0) {
    throw new Error('POC evidence ledger requires non-empty targetViewports and renderedEvidence');
  }
  if (!Array.isArray(parsed.sourceFiles) || parsed.sourceFiles.length === 0) {
    throw new Error('POC evidence ledger sourceFiles must record the inspected prototype files and their sha256 hashes');
  }
  const requiredRenders = parsed.targetViewports.map((viewport) => {
    if (!nonEmptyText(viewport)) {
      throw new Error('POC evidence ledger targetViewports entries must be non-empty strings');
    }
    const vpKey = viewport.trim().toLocaleLowerCase('en-US');
    const match = parsed.renderedEvidence.find(
      (item) => isRecord(item) && typeof item.viewport === 'string' && item.viewport.trim().toLocaleLowerCase('en-US') === vpKey,
    );
    if (
      !isRecord(match)
      || match.status !== 'captured'
      || !nonEmptyText(match.artifact)
      || typeof match.sha256 !== 'string'
      || !/^[a-f0-9]{64}$/u.test(match.sha256)
    ) {
      throw new Error(
        `POC evidence ledger renderedEvidence is missing a valid captured PNG entry for viewport ${viewport}`,
      );
    }
    return { viewport, artifact: match.artifact.trim(), sha256: match.sha256 };
  });
  const sourceEntries = parsed.sourceFiles.map((entry) => {
    if (
      !isRecord(entry)
      || !nonEmptyText(entry.path)
      || typeof entry.sha256 !== 'string'
      || !/^[a-f0-9]{64}$/u.test(entry.sha256)
    ) {
      throw new Error('POC evidence ledger contains an invalid sourceFiles entry');
    }
    return { path: entry.path, sha256: entry.sha256 };
  });
  return { requiredRenders, sourceEntries };
}
