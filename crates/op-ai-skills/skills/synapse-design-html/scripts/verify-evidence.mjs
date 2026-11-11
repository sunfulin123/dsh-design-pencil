import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { collectEvidenceFiles } from './verify-source.mjs';

const CONTENT_STATES = ['loading', 'empty', 'error', 'partial', 'success', 'permission'];

export function checkEvidenceLedger(report, reportDir) {
  const errors = [];
  const nonEmptyText = v => typeof v === 'string' && v.trim().length > 0;
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

  if (!isObj(report)) return ['Report must be a JSON object'];
  if (!nonEmptyText(report.contract)) errors.push('contract is required');

  const targets = Array.isArray(report.targetViewports) ? report.targetViewports : [];
  const renders = Array.isArray(report.renderedEvidence) ? report.renderedEvidence : [];
  if (!targets.length) errors.push('targetViewports must be a non-empty array');

  if (!Array.isArray(report.sourceFiles) || report.sourceFiles.length === 0) {
    errors.push('sourceFiles must contain the inspected source and its fingerprint');
  } else {
    for (const source of report.sourceFiles) {
      try {
        if (!nonEmptyText(source?.path) || !/^[a-f0-9]{64}$/.test(source?.sha256 || '')) throw new Error('missing fingerprint');
        const hash = createHash('sha256').update(fs.readFileSync(source.path)).digest('hex');
        if (hash !== source.sha256) errors.push(`Source changed since review: ${source.path}`);
      } catch { errors.push(`Source is missing or unreadable: ${source?.path || '(unknown)'}`); }
    }
  }

  if (!nonEmptyText(report.sourceTarget) || !reportDir) {
    errors.push('sourceTarget and report directory are required to verify the source inventory');
  } else {
    try {
      const current = collectEvidenceFiles(report.sourceTarget, reportDir).sort();
      const recorded = (report.sourceFiles || []).map(source => path.resolve(source.path)).sort();
      if (JSON.stringify(current) !== JSON.stringify(recorded)) errors.push('Source inventory changed since review');
    } catch (error) { errors.push(`Cannot verify source inventory: ${error.message}`); }
  }

  for (const vp of targets) {
    const match = renders.find(r => isObj(r) && String(r.viewport).trim().toLowerCase() === String(vp).trim().toLowerCase());
    if (!match) {
      errors.push(`renderedEvidence is missing target viewport ${vp}`);
    } else if (match.status !== 'captured' || !nonEmptyText(match.artifact)) {
      errors.push(`renderedEvidence for ${vp} must name a captured artifact`);
    } else if (reportDir) {
      const fullArtifact = path.resolve(reportDir, match.artifact);
      if (!fs.existsSync(fullArtifact) || fs.statSync(fullArtifact).size === 0) {
        errors.push(`Evidence artifact ${match.artifact} for viewport ${vp} is missing or empty`);
      } else {
        try {
          const root = fs.realpathSync(reportDir);
          const artifact = fs.realpathSync(fullArtifact);
          const relative = path.relative(root, artifact);
          if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('outside report directory');
          const data = fs.readFileSync(artifact);
          if (!data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw new Error('not a PNG');
          if (!nonEmptyText(match.renderer) || !/^[a-f0-9]{64}$/.test(match.sha256 || '')) throw new Error('missing renderer or fingerprint');
          if (createHash('sha256').update(data).digest('hex') !== match.sha256) errors.push(`Evidence artifact changed since review: ${match.artifact}`);
        } catch (error) { errors.push(`Evidence artifact ${match.artifact} is invalid: ${error.message}`); }
      }
    }
  }

  for (const key of ['accessibility', 'responsive', 'visualReview']) {
    const item = report[key];
    if (!isObj(item) || item.status !== 'pass' || !nonEmptyText(item.evidence)) {
      errors.push(`${key} requires status="pass" and a non-empty evidence observation`);
    }
  }

  for (const state of CONTENT_STATES) {
    const st = report.contentStates?.[state];
    const validPass = isObj(st) && st.status === 'pass' && nonEmptyText(st.evidence);
    const validNA = isObj(st) && st.status === 'not-applicable' && nonEmptyText(st.reason);
    if (!validPass && !validNA) {
      errors.push(`contentStates.${state} requires status="pass" + evidence OR status="not-applicable" + reason`);
    }
  }

  return errors;
}

/** Check local evidence only; the host separately verifies the user's style choice. */
export function checkStyleContext(outDir) {
  const contextPath = path.join(outDir, 'style-context.json');
  const fail = message => [{ severity: 'P0', category: 'style-context', rule: 'selected-design', location: contextPath, message }];
  try {
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    if (context.schemaVersion !== 1 || typeof context.styleId !== 'string' || !context.styleId.trim()
      || typeof context.contentHash !== 'string' || !/^[0-9a-f]{64}$/.test(context.contentHash)
      || typeof context.guidePath !== 'string') return fail('The selected product style context is incomplete.');
    const root = fs.realpathSync(outDir);
    const guide = fs.realpathSync(path.resolve(root, context.guidePath));
    const relative = path.relative(root, guide);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      return fail('The selected DESIGN must be inside the task directory.');
    }
    const bytes = fs.readFileSync(guide);
    if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== context.contentHash) {
      return fail('The selected DESIGN changed or is empty; reload it from the product style catalogue.');
    }
    return [];
  } catch (error) {
    return fail(`Cannot verify the task-local product style context: ${error.message}`);
  }
}

