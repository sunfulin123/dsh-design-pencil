#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { collectSourceFiles, collectEvidenceFiles, extractInteractiveBaseline, inferSurfaceScope, scanAnimationAndCraftFlags,
  scanCopyAndSlop, runImpeccableDetect, runCopyLint, runSloplint, scanCssTrackedCaps } from './verify-source.mjs';
import { captureAndInspectViewports } from './verify-browser.mjs';
import { checkEvidenceLedger, checkStyleContext } from './verify-evidence.mjs';
export { checkEvidenceLedger } from './verify-evidence.mjs';

function buildViewports(mobileWidth = 390) {
  const mobileHeight = mobileWidth === 375 ? 812 : 844;
  return [
    { label: `${mobileWidth}px`, width: mobileWidth, height: mobileHeight, file: `shots/${mobileWidth}.png` },
    { label: '768px', width: 768, height: 1024, file: 'shots/768.png' },
    { label: '1440px', width: 1440, height: 900, file: 'shots/1440.png' },
  ];
}

function parseArgs(argv) {
  const opts = {
    url: null,
    source: null,
    out: '.synapse/html-design',
    reviewRoot: null,
    baseline: null,
    snapshotBefore: null,
    checkEvidence: null,
    scope: null,
    mobileWidth: 390,
    timeoutMs: undefined,
    quick: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url') opts.url = argv[++i];
    else if (arg === '--source') opts.source = argv[++i];
    else if (arg === '--out') opts.out = argv[++i];
    else if (arg === '--review-root') opts.reviewRoot = argv[++i];
    else if (arg === '--baseline') opts.baseline = argv[++i];
    else if (arg === '--snapshot-before') opts.snapshotBefore = argv[++i];
    else if (arg === '--check-evidence') opts.checkEvidence = argv[++i];
    else if (arg === '--scope' || arg === '--mode') opts.scope = argv[++i];
    else if (arg === '--mobile-width') opts.mobileWidth = Number(argv[++i] ?? 390) || 390;
    else if (arg === '--timeout-ms') opts.timeoutMs = Number(argv[++i]);
    else if (arg === '--quick') opts.quick = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
  }
  return opts;
}

function reviewRootFor(outDir, override) {
  return override ? path.resolve(override) : outDir;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`Usage:
  node scripts/verify-surface.mjs --snapshot-before <path> --out .synapse/html-design/baseline.json
  node scripts/verify-surface.mjs --url <url-or-html> --source <path> --out .synapse/html-design [--review-root <dir>] [--baseline .synapse/html-design/baseline.json] [--quick]
  node scripts/verify-surface.mjs --check-evidence .synapse/html-design/evidence-report.json`);
    process.exit(0);
  }

  // Mode 1: Snapshot Before Redesign
  if (opts.snapshotBefore) {
    const files = collectSourceFiles(opts.snapshotBefore);
    const snapshot = extractInteractiveBaseline(files);
    const outPath = path.resolve(opts.out.endsWith('.json') ? opts.out : path.join(opts.out, 'baseline.json'));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
    console.log(`BASELINE_SAVED: ${outPath} (${snapshot.links.length} links, ${snapshot.inputs.length} inputs, ${snapshot.buttons.length} buttons, ${snapshot.headings.length} headings)`);
    process.exit(0);
  }

  // Mode 3: Standalone Evidence Ledger Check
  if (opts.checkEvidence) {
    const reportPath = path.resolve(opts.checkEvidence);
    if (!fs.existsSync(reportPath)) {
      console.error(`GATE: OPEN — Evidence report not found: ${reportPath}`);
      process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const errors = [
      ...checkStyleContext(path.dirname(reportPath)).map(finding => finding.message),
      ...checkEvidenceLedger(report, path.dirname(reportPath)),
    ];
    if (errors.length) {
      console.error('GATE: OPEN — Evidence ledger incomplete:\n  - ' + errors.join('\n  - '));
      process.exit(1);
    }
    console.log('GATE: PASS — Evidence ledger complete and all viewport artifacts verified.');
    process.exit(0);
  }

  // Mode 2: Full 6-in-1 Verification Gate
  const outDir = path.resolve(opts.out);
  fs.mkdirSync(outDir, { recursive: true });

  const sourceTarget = opts.source || (opts.url && !/^https?:\/\//i.test(opts.url) ? path.dirname(path.resolve(opts.url)) : process.cwd());
  const files = collectSourceFiles(sourceTarget, outDir);
  const sourceFiles = collectEvidenceFiles(sourceTarget, outDir)
    .map(file => ({ path: file, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
  const surfaceScope = inferSurfaceScope(files, reviewRootFor(outDir, opts.reviewRoot), opts.scope);

  // 1. Animation & Craft-Floor Static Scan
  const animScan = scanAnimationAndCraftFlags(files);
  // 2. Copy-Lint Scan
  const copyFindings = scanCopyAndSlop(files, surfaceScope);
  // 3. Impeccable Detector Bridge
  const impeccableScan = runImpeccableDetect(sourceTarget);

  const allFindings = [
    ...checkStyleContext(reviewRootFor(outDir, opts.reviewRoot)),
    ...animScan.findings,
    ...copyFindings,
    ...runCopyLint(files, surfaceScope),
    ...runSloplint(files, surfaceScope),
    ...scanCssTrackedCaps(files),
    ...impeccableScan.findings,
  ];

  // 4. Redesign Baseline Comparison (--kept)
  if (opts.baseline && fs.existsSync(opts.baseline)) {
    const before = JSON.parse(fs.readFileSync(opts.baseline, 'utf8'));
    const after = extractInteractiveBaseline(files);
    for (const link of before.links || []) {
      if (!after.links.includes(link)) {
        allFindings.push({
          severity: 'P0',
          category: 'redesign-kept',
          rule: 'missing-baseline-link',
          location: sourceTarget,
          message: `Redesign regression: link "${link}" from baseline is missing.`,
        });
      }
    }
    for (const input of before.inputs || []) {
      if (!after.inputs.includes(input)) {
        allFindings.push({
          severity: 'P0',
          category: 'redesign-kept',
          rule: 'missing-baseline-input',
          location: sourceTarget,
          message: `Redesign regression: form field "${input}" from baseline is missing.`,
        });
      }
    }
  }

  // 5. Multi-Viewport Browser Screenshots
  const viewports = buildViewports(opts.mobileWidth);
  const activeViewports = opts.quick ? [viewports[0], viewports[2]] : viewports;
  const renderResult = await captureAndInspectViewports(opts.url, outDir, activeViewports, {
    timeoutMs: opts.timeoutMs,
  });
  allFindings.push(...renderResult.domFindings);

  // 6. Write / Merge Evidence Report
  const reportPath = path.join(outDir, 'evidence-report.json');
  const existingReport = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    : {};

  const priorRenders = (existingReport.renderedEvidence || []).map(({ viewport, sha256 }) => ({ viewport, sha256 }));
  const currentRenders = renderResult.renderedEvidence.map(({ viewport, sha256 }) => ({ viewport, sha256 }));
  const preserveReview = JSON.stringify(existingReport.sourceFiles) === JSON.stringify(sourceFiles)
    && JSON.stringify(priorRenders) === JSON.stringify(currentRenders);

  const blockingFindings = allFindings.filter(f => f.severity === 'P0' || f.severity === 'P1');

  const report = {
    contract: existingReport.contract || 'Synapse Design 6-Stage Surface Contract',
    generatedAt: new Date().toISOString(),
    targetViewports: activeViewports.map(v => v.label),
    sourceTarget: path.resolve(sourceTarget),
    sourceFiles,
    accessibility: (preserveReview && existingReport.accessibility) || {
      status: blockingFindings.some(f => f.category.includes('a11y')) ? 'fail' : 'pending',
      evidence: `Source scans alone cannot verify accessibility; inspect actual interaction. Scanned ${files.length} file(s).`,
    },
    visualReview: (preserveReview && existingReport.visualReview) || {
      status: 'pending', evidence: 'A screenshot capture does not establish that the image was reviewed.',
    },
    responsive: (preserveReview && existingReport.responsive) || {
      status: 'pending',
      evidence: renderResult.captured
        ? `Captured ${renderResult.renderedEvidence.length} viewport(s); inspect each relevant responsive layout.`
        : renderResult.reason,
    },
    contentStates: (preserveReview && existingReport.contentStates) || {
      loading: { status: 'pending', evidence: '' },
      empty: { status: 'pending', evidence: '' },
      error: { status: 'pending', evidence: '' },
      partial: { status: 'pending', evidence: '' },
      success: { status: 'pending', evidence: '' },
      permission: { status: 'pending', evidence: '' },
    },
    // Left unset on purpose: the primary actions must be classified by review, not defaulted.
    actions: (preserveReview && existingReport.actions) || null,
    renderedEvidence: renderResult.renderedEvidence,
    findings: allFindings,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const ledgerErrors = checkEvidenceLedger(report, outDir);
  const p0Count = allFindings.filter(f => f.severity === 'P0').length;
  const p1Count = allFindings.filter(f => f.severity === 'P1').length;
  const p2Count = allFindings.filter(f => f.severity === 'P2').length;

  console.log('--- Synapse Design Verification Summary ---');
  console.log(`Files Scanned      : ${files.length}`);
  console.log(`Impeccable Detect  : ${impeccableScan.ran ? 'ran' : `not run (${impeccableScan.reason || 'configured detector failed'})`}`);
  console.log(`Viewports Captured : ${renderResult.renderedEvidence.map(r => `${r.viewport} (${r.status})`).join(', ') || 'none'}`);
  console.log(`Findings           : P0=${p0Count}, P1=${p1Count}, P2=${p2Count}`);
  if (allFindings.length > 0) {
    for (const f of allFindings) {
      console.log(`  [${f.severity}] (${f.category}/${f.rule}) ${f.location}: ${f.message}`);
    }
  }

  if (p0Count > 0 || p1Count > 0 || ledgerErrors.length > 0) {
    if (ledgerErrors.length > 0) {
      console.log('Ledger Checks      : ' + ledgerErrors.join('; '));
    }
    console.log(`GATE: OPEN (${p0Count} P0, ${p1Count} P1, ${ledgerErrors.length} ledger gap(s))`);
    process.exit(1);
  }

  console.log(`GATE: PASS (Report: ${reportPath})`);
}

main().catch(err => {
  console.error('GATE: ERROR —', err.message);
  process.exit(1);
});
