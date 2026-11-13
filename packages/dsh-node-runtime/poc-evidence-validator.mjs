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
  if (!Array.isArray(raw) || raw.length > 16) {
    throw new Error('Provide zero to sixteen structured POC screenshots ({ path, screen, state?, viewport })');
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
  if (Array.isArray(verifiedShots) && verifiedShots.length === 0) return;
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

const ACTION_KINDS = ['verifiable', 'visual-only', 'not-implemented'];

/**
 * A ledger entry records what was actually done. `unverified` is a valid,
 * honest result (a tab-order check does not verify accessibility), so the gate
 * accepts it with a statement of what was not covered instead of demanding pass.
 */
function assertHonestGateEntry(report, key, unverified) {
  const entry = report[key];
  if (isRecord(entry) && entry.status === 'pass' && nonEmptyText(entry.evidence)) return;
  if (isRecord(entry) && entry.status === 'unverified' && nonEmptyText(entry.uncovered)) {
    unverified.push({ check: key, uncovered: entry.uncovered.trim() });
    return;
  }
  throw new Error(
    `POC evidence ledger ${key} requires status="pass" with the observed evidence, or status="unverified" with "uncovered" stating what was not checked`,
  );
}

function assertValidLedgerState(states, state, unverified) {
  const st = states?.[state];
  if (isRecord(st) && st.status === 'pass' && nonEmptyText(st.evidence)) return;
  if (isRecord(st) && st.status === 'not-applicable' && nonEmptyText(st.reason)) return;
  if (isRecord(st) && st.status === 'unverified' && nonEmptyText(st.uncovered)) {
    unverified.push({ check: `contentStates.${state}`, uncovered: st.uncovered.trim() });
    return;
  }
  throw new Error(
    `POC evidence ledger contentStates.${state} requires status="pass"+evidence, status="not-applicable"+reason, or status="unverified"+uncovered`,
  );
}

/** Each primary action states what was delivered; only an observed result makes it verifiable. */
function validateLedgerActions(rawActions) {
  if (!Array.isArray(rawActions)) {
    throw new Error(
      `POC evidence ledger actions must list each primary action as ${ACTION_KINDS.join(', ')} (an empty list states that the prototype has no actions)`,
    );
  }
  return rawActions.map((entry) => {
    if (!isRecord(entry) || !nonEmptyText(entry.label) || !ACTION_KINDS.includes(entry.kind)) {
      throw new Error(`POC evidence ledger actions entries require a label and kind (${ACTION_KINDS.join(', ')})`);
    }
    if (entry.kind === 'verifiable' && !nonEmptyText(entry.evidence)) {
      throw new Error(
        `POC evidence ledger action "${entry.label.trim()}" is marked verifiable and requires evidence of the result observed in the browser; a notice that the feature is unavailable makes it not-implemented`,
      );
    }
    return {
      label: entry.label.trim(),
      kind: entry.kind,
      ...(nonEmptyText(entry.screen) ? { screen: entry.screen.trim() } : {}),
    };
  });
}

export function parseAndValidateEvidenceLedgerJson(rawBytes) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(rawBytes).toString('utf8'));
  } catch {
    throw new Error('POC evidence ledger must be valid JSON produced by verify-surface.mjs');
  }
  if (!isRecord(parsed)) throw new Error('POC evidence ledger must be a JSON object');
  const unverified = [];
  for (const key of ['accessibility', 'responsive', 'visualReview']) {
    assertHonestGateEntry(parsed, key, unverified);
  }
  const states = isRecord(parsed.contentStates) ? parsed.contentStates : undefined;
  for (const state of CONTENT_STATES) assertValidLedgerState(states, state, unverified);
  const actions = validateLedgerActions(parsed.actions);
  if (!Array.isArray(parsed.targetViewports) || parsed.targetViewports.length === 0
      || !Array.isArray(parsed.renderedEvidence) || parsed.renderedEvidence.length === 0) {
    throw new Error('POC evidence ledger requires non-empty targetViewports and renderedEvidence');
  }
  if (!Array.isArray(parsed.sourceFiles) || parsed.sourceFiles.length === 0) {
    throw new Error('POC evidence ledger sourceFiles must record the inspected prototype files and their sha256 hashes');
  }
  const requiredRenders = [];
  for (const viewport of parsed.targetViewports) {
    if (!nonEmptyText(viewport)) {
      throw new Error('POC evidence ledger targetViewports entries must be non-empty strings');
    }
    const vpKey = viewport.trim().toLocaleLowerCase('en-US');
    const match = parsed.renderedEvidence.find(
      (item) => isRecord(item) && typeof item.viewport === 'string' && item.viewport.trim().toLocaleLowerCase('en-US') === vpKey,
    );
    if (isRecord(match) && match.status === 'unverified' && nonEmptyText(match.uncovered)) {
      unverified.push({ check: `renderedEvidence.${viewport.trim()}`, uncovered: match.uncovered.trim() });
      continue;
    }
    if (
      !isRecord(match)
      || match.status !== 'captured'
      || !nonEmptyText(match.artifact)
      || typeof match.sha256 !== 'string'
      || !/^[a-f0-9]{64}$/u.test(match.sha256)
    ) {
      throw new Error(
        `POC evidence ledger renderedEvidence is missing a valid captured PNG entry or status="unverified"+uncovered for viewport ${viewport}`,
      );
    }
    requiredRenders.push({ viewport, artifact: match.artifact.trim(), sha256: match.sha256 });
  }
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
  return { requiredRenders, sourceEntries, unverified, actions };
}
