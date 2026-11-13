import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SLOP_WORDS = [
  'seamlessly', 'unleash', 'elevate', 'supercharge', 'empower',
  'delve', 'game-changing', 'revolutionary', 'next-gen', 'synergy',
];

const VAGUE_CTA_REGEX = /<(?:button|a)\b[^>]*>\s*(?:submit|click here|learn more|read more|go)\s*<\/(?:button|a)>/gi;

function isPocTaskOutputDir(dir) {
  return ['style-context.json', 'evidence-report.json', 'DESIGN.md'].some((marker) =>
    fs.existsSync(path.join(dir, marker)),
  );
}

function taskArtifactDirs(targetRoot, outDir) {
  const bases = [];
  if (outDir) bases.push(path.resolve(outDir));
  else if (targetRoot && isPocTaskOutputDir(targetRoot)) bases.push(targetRoot);
  return new Set(bases.flatMap((base) => [path.join(base, 'review'), path.join(base, 'shots')]));
}

export function collectSourceFiles(target, outDir = null) {
  if (!target || !fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [path.resolve(target)];
  const resolvedTarget = path.resolve(target);
  const exts = new Set(['.html', '.htm', '.css', '.scss', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro']);
  const ignoreDirs = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', '__pycache__',
    '.synapse', '.synapse-review', '.impeccable', '.taste-skill',
  ]);
  const excludedArtifactDirs = taskArtifactDirs(resolvedTarget, outDir);
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignoreDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (excludedArtifactDirs.has(full)) continue;
        walk(full);
      } else if (exts.has(path.extname(entry.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  walk(resolvedTarget);
  return results;
}

/** Fingerprint all task source assets while excluding this verifier's outputs. */
export function collectEvidenceFiles(target, outDir) {
  if (!target || !fs.existsSync(target)) return [];
  const output = path.resolve(outDir);
  const ignored = new Set(['node_modules', '.git', '.next', 'dist', 'build', '__pycache__']);
  const excluded = new Set(['evidence-report.json', 'style-context.json', 'baseline.json']);
  const excludedArtifactDirs = taskArtifactDirs(path.resolve(target), output);
  const files = [];
  function visit(current) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Cannot fingerprint a symbolic link: ${current}`);
    if (stat.isDirectory()) {
      if (ignored.has(path.basename(current)) || excludedArtifactDirs.has(current)) return;
      for (const entry of fs.readdirSync(current).sort()) visit(path.join(current, entry));
    } else if (stat.isFile() && !(path.dirname(current) === output && excluded.has(path.basename(current)))) {
      if (stat.size > 32 * 1024 * 1024 || files.length >= 5000) throw new Error('POC evidence exceeds the supported file budget');
      files.push(current);
    }
  }
  visit(path.resolve(target));
  return files;
}

/** Infer sloplint scope (`page` | `app` | `component`) from explicit flag, style-context, or operational app DOM signals. */
export function inferSurfaceScope(files, reviewRoot = null, explicitScope = null) {
  if (typeof explicitScope === 'string') {
    const norm = explicitScope.trim().toLowerCase();
    if (norm === 'app' || norm === 'operational' || norm === 'workspace' || norm === 'chat' || norm === 'dashboard') return 'app';
    if (norm === 'component') return 'component';
    if (norm === 'page' || norm === 'marketing' || norm === 'landing' || norm === 'editorial') return 'page';
  }
  if (reviewRoot) {
    try {
      const ctx = JSON.parse(fs.readFileSync(path.join(reviewRoot, 'style-context.json'), 'utf8'));
      const mode = String(ctx?.surfaceMode || ctx?.scope || '').trim().toLowerCase();
      if (mode === 'app' || mode === 'operational' || mode === 'workspace' || mode === 'chat' || mode === 'dashboard') return 'app';
      if (mode === 'component') return 'component';
      if (mode === 'page' || mode === 'marketing' || mode === 'landing') return 'page';
    } catch { /* style-context may not carry surfaceMode */ }
  }
  for (const file of files) {
    if (!/\.html?$/i.test(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (/<html[^>]*\bdata-(?:scope|surface-mode)=["'](?:app|operational|chat|workspace|dashboard)["']/i.test(html)
      || /<meta[^>]*\bname=["'](?:surface-mode|page-scope)["'][^>]*\bcontent=["'](?:app|operational|chat|workspace|dashboard)["']/i.test(html)) {
      return 'app';
    }
    const hasAppShell = /<(?:aside|nav)\b/i.test(html)
      && (/\brole=["'](?:log|tablist|tree|grid|dialog|Feed)["']/i.test(html)
        || /<(?:textarea|input)\b[^>]*(?:placeholder|aria-label)=["'][^"']*(?:message|reply|search|command|filter|send|消息|回复|搜索)/i.test(html));
    const hasMarketingFooter = /<footer\b[\s\S]*?(?:copyright|©|privacy|terms)/i.test(html);
    if (hasAppShell && !hasMarketingFooter) return 'app';
  }
  return 'page';
}

export function extractInteractiveBaseline(files) {
  const links = new Set();
  const inputs = new Set();
  const headings = new Set();
  const buttons = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
      if (m[1] && !m[1].startsWith('javascript:')) links.add(m[1].trim());
    }
    for (const m of content.matchAll(/<(?:input|select|textarea)\b[^>]*?(?:name|id)=["']([^"']+)["'][^>]*>/gi)) {
      if (m[1]) inputs.add(m[1].trim());
    }
    for (const m of content.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
      const clean = m[1].replace(/<[^>]+>/g, '').trim();
      if (clean) headings.add(clean);
    }
    for (const m of content.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
      const clean = m[1].replace(/<[^>]+>/g, '').trim();
      if (clean) buttons.add(clean);
    }
  }

  return {
    capturedAt: new Date().toISOString(),
    links: [...links],
    inputs: [...inputs],
    headings: [...headings],
    buttons: [...buttons],
  };
}

export function scanAnimationAndCraftFlags(files) {
  const findings = [];
  let hasReducedMotion = false;
  let hasTransitionsOrKeyframes = false;
  let hasTabularNums = false;

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    if (/prefers-reduced-motion/.test(content)) hasReducedMotion = true;
    if (/tabular-nums/.test(content)) hasTabularNums = true;
    if (/transition\s*:|@keyframes\b|animate\(/.test(content)) hasTransitionsOrKeyframes = true;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      // 1. transition: all
      if (/transition\s*:\s*all\b/i.test(line) || /transition-property\s*:\s*all\b/i.test(line)) {
        findings.push({
          severity: 'P1',
          category: 'animation',
          rule: 'no-transition-all',
          location: `${rel}:${lineNum}`,
          message: 'Flag-on-sight: `transition: all` animates unintended layout properties. Specify `transform`, `opacity`, or color explicitly.',
        });
      }
      // 2. Layout property transition
      if (/transition(?:-property)?\s*:[^;]*(?:\bwidth\b|\bheight\b|\btop\b|\bleft\b|\bmargin\b|\bpadding\b)/i.test(line)) {
        findings.push({
          severity: 'P1',
          category: 'animation',
          rule: 'gpu-only-properties',
          location: `${rel}:${lineNum}`,
          message: 'Flag-on-sight: Animating layout property (`width/height/top/left/margin/padding`) triggers layout thrashing. Use `transform` (`scale/translate`) instead.',
        });
      }
      // 3. ease-in on UI transition
      if (/transition[^;]*\bease-in\b(?!-out)/i.test(line)) {
        findings.push({
          severity: 'P1',
          category: 'animation',
          rule: 'no-ease-in-ui',
          location: `${rel}:${lineNum}`,
          message: 'Flag-on-sight: `ease-in` starts slow and feels sluggish on UI interactions. Use `cubic-bezier(0.22, 1, 0.36, 1)` or `ease-out`.',
        });
      }
      // 4. scale(0) entrance
      if (/transform\s*:\s*scale\(\s*0\s*\)/i.test(line)) {
        findings.push({
          severity: 'P2',
          category: 'animation',
          rule: 'no-scale-zero',
          location: `${rel}:${lineNum}`,
          message: 'Physicality violation: `scale(0)` pops from nothing. Start entrances from `scale(0.94)` with `opacity: 0`.',
        });
      }
      // 5. Left-border accent card slop
      if (/border-left\s*:\s*(?:[3-9]|[1-9]\d+)px\s+solid/i.test(line)) {
        findings.push({
          severity: 'P2',
          category: 'craft-floor',
          rule: 'no-thick-left-border-card',
          location: `${rel}:${lineNum}`,
          message: 'Craft-floor violation: Colored `border-left > 1px` on cards/callouts reads as an AI template tell.',
        });
      }
    });

    // 6. Hallmark Gate 64: Monospace font applied to tags, chips, badges, or labels
    for (const block of content.matchAll(/\.(?:[a-z0-9_-]*(?:tag|badge|chip|pill|label|kicker)[a-z0-9_-]*)\s*\{([^}]*)\}/gi)) {
      if (/font-family\s*:[^;]*mono/i.test(block[1])) {
        findings.push({
          severity: 'P1',
          category: 'second-order-slop',
          rule: 'gate-64-mono-costume',
          location: rel,
          message: 'Hallmark Gate 64 violation: Monospace font used as a decorative costume on tags/chips/badges. Reserve monospace for actual code, terminal output, or aligned numeric tables.',
        });
        break;
      }
    }
  }

  if (hasTransitionsOrKeyframes && !hasReducedMotion) {
    findings.push({
      severity: 'P1',
      category: 'a11y-motion',
      rule: 'missing-prefers-reduced-motion',
      location: 'global',
      message: 'Animations/transitions detected without a `@media (prefers-reduced-motion: reduce)` fallback.',
    });
  }

  return { findings, hasReducedMotion, hasTabularNums };
}

export function scanCopyAndSlop(files, surfaceScope = 'page') {
  const findings = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro'].includes(ext)) continue;
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');

    for (const word of SLOP_WORDS) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(content)) {
        findings.push({
          severity: 'P2',
          category: 'copy-lint',
          rule: 'ai-slop-vocabulary',
          location: rel,
          message: `AI slop word "${word}" detected. Replace with plain, concrete product language.`,
        });
      }
    }

    for (const m of content.matchAll(VAGUE_CTA_REGEX)) {
      findings.push({
        severity: 'P2',
        category: 'copy-lint',
        rule: 'vague-cta-button',
        location: rel,
        message: `Vague CTA "${m[0].replace(/<[^>]+>/g, '').trim()}". Buttons should use Verb + Object (e.g., "Start free trial", "Export report").`,
      });
    }

    // Hallmark Gate 63: Middle-dot-joined meta strings on marketing cards (operational app timestamps like "10:42 · Edited" are normal UI metadata)
    if (surfaceScope === 'page' && (/[^<>\n]{2,}\s*·\s*[^<>\n]{2,}\s*·\s*[^<>\n]{2,}/.test(content) || (content.match(/<span[^>]*>\s*·\s*<\/span>/gi) || []).length >= 2)) {
      findings.push({
        severity: 'P1',
        category: 'second-order-slop',
        rule: 'gate-63-middle-dot-meta',
        location: rel,
        message: 'Hallmark Gate 63 violation: Middle-dot-joined metadata string ("A · B · C") detected. Use clean typographic hierarchy or open table rows instead of dot-separated pill bars.',
      });
    }

    // Hallmark Gate 67: All-caps badge/tag labels (e.g. <span class="...tag...">FLAGSHIP</span>)
    for (const m of content.matchAll(/<(?:span|div|p)\b[^>]*class=["'][^"']*(?:tag|badge|chip|pill|label)[^"']*["'][^>]*>\s*([A-Z0-9][A-Z0-9\s/-]{3,})\s*<\/(?:span|div|p)>/g)) {
      if (/[A-Z]{3,}/.test(m[1])) {
        findings.push({
          severity: 'P1',
          category: 'second-order-slop',
          rule: 'gate-67-tracked-caps-label',
          location: rel,
          message: `Hallmark Gate 67 violation: Uppercase small tag/badge "${m[1].trim()}" detected. Set labels and tags in sentence case using the body face, untracked.`,
        });
        break;
      }
    }

    // Hallmark Gate 80: Drawn inline SVG cartoon standing in for a product/photo inside a card visual
    for (const m of content.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)) {
      const svgTag = m[0];
      const inner = m[1];
      const isChartOrDiagram = /(?:chart|diagram|graph|leader|callout|icon)/i.test(svgTag);
      const wMatch = svgTag.match(/\bwidth=["'](\d+)/i);
      const isLarge = wMatch && Number(wMatch[1]) >= 100;
      const shapeCount = (inner.match(/<(?:circle|rect|ellipse)\b/gi) || []).length;
      const hasText = /<text\b/i.test(inner);
      if (isLarge && !isChartOrDiagram && shapeCount >= 3 && !hasText) {
        findings.push({
          severity: 'P1',
          category: 'second-order-slop',
          rule: 'gate-80-drawn-svg-standin',
          location: rel,
          message: 'Hallmark Gate 80 violation: Inline geometric SVG drawing used as a product/subject stand-in. Use real photography (`scripts/photos.mjs` or generated raster assets) or a real 3D WebGL stage.',
        });
        break;
      }
    }

    // Check for <img> without alt attribute
    for (const m of content.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)) {
      findings.push({
        severity: 'P1',
        category: 'a11y',
        rule: 'img-missing-alt',
        location: rel,
        message: `Image tag missing \`alt\` attribute: ${m[0].slice(0, 60)}`,
      });
    }

    // Check for eyebrow/kicker class tells
    if (/class=["'][^"']*\b(?:eyebrow|kicker)\b[^"']*["']/i.test(content)) {
      findings.push({
        severity: 'P2',
        category: 'craft-floor',
        rule: 'no-eyebrow-kicker',
        location: rel,
        message: 'Craft-floor ban: Eyebrow/kicker label detected. Delete the kicker and let the heading carry its own weight.',
      });
    }

    // Check WebGL / canvas budget (> 4 canvases)
    const canvasMatches = [...content.matchAll(/<canvas\b/gi)];
    if (canvasMatches.length > 4) {
      findings.push({
        severity: 'P2',
        category: 'webgl-budget',
        rule: 'max-4-canvases',
        location: rel,
        message: `Found ${canvasMatches.length} canvas elements; measure active WebGL contexts before drawing performance conclusions.`,
      });
    }
  }
  return findings;
}

export function runImpeccableDetect(sourceTarget) {
  const impeccableBin = process.env.SYNAPSE_HTML_IMPECCABLE_BIN;
  if (!sourceTarget || !impeccableBin || !fs.existsSync(impeccableBin)) {
    return { ran: false, findings: [], reason: 'Optional detector is not configured; bundled checks remain available.' };
  }
  try {
    const res = spawnSync(impeccableBin, ['detect', '--json', sourceTarget], {
      encoding: 'utf8',
      timeout: 20000,
    });
    const stdout = (res.stdout || '').trim();
    if (res.error || !stdout) throw res.error || new Error(`Detector returned no result (exit ${res.status})`);
    const parsed = JSON.parse(stdout);
    const items = Array.isArray(parsed) ? parsed : (parsed.findings || []);
    return {
      ran: true,
      findings: items.map(f => {
        const isCriticalA11y = f.antipattern === 'low-contrast' || f.category === 'a11y';
        return {
          severity: isCriticalA11y ? 'P1' : 'P2',
          category: 'impeccable-detect',
          rule: f.antipattern || f.rule || f.id || 'detector',
          location: f.file ? `${path.relative(process.cwd(), f.file)}${f.line ? ':' + f.line : ''}` : sourceTarget,
          message: f.description ? `${f.name}: ${f.description}${f.snippet ? ` (${f.snippet})` : ''}` : JSON.stringify(f),
        };
      }),
    };
  } catch (error) {
    return { ran: false, findings: [{ severity: 'P1', category: 'verification-unavailable', rule: 'impeccable-detect',
      location: sourceTarget, message: `Configured optional detector failed: ${error.message}` }] };
  }
}

export function runCopyLint(files, surfaceScope = 'page') {
  const html = files.filter(f => /\.html?$/i.test(f));
  if (!html.length) return [];
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'copy-lint.mjs');
  const cliArgs = [script, ...html, ...(surfaceScope === 'app' ? ['--kind', 'software'] : []), '--json'];
  const r = spawnSync(process.execPath, cliArgs, { encoding: 'utf8', timeout: 60000 });
  let data; try { data = JSON.parse(r.stdout); } catch {
    return [{ severity: 'P1', category: 'verification-unavailable', rule: 'copy-lint', location: script,
      message: `Copy checks did not return a valid result: ${r.error?.message || r.stderr || `exit ${r.status}`}` }];
  }
  const appIgnoredCopyIds = new Set([
    'copy-stat-strip',
    'copy-eyebrows',
    'copy-footer-signoff',
    'copy-stale-year',
    'copy-proof-figure',
    'copy-rhythm',
  ]);
  const out = [];
  for (const file of data.files || []) {
    for (const f of file.findings || []) {
      const lv = f.sev || f.level; if (lv !== 'FAIL' && lv !== 'WARN') continue;
      if (surfaceScope === 'app' && lv === 'WARN' && appIgnoredCopyIds.has(f.id)) continue;
      out.push({ severity: lv === 'FAIL' ? 'P1' : 'P2', category: 'copy-lint', rule: f.id || 'copy', location: path.relative(process.cwd(), file.file || file.path || html[0]), message: `${f.msg || f.message || f.id}${f.fix ? ' Fix: ' + f.fix : ''}` });
    }
  }
  return out;
}

export function runSloplint(files, surfaceScope = 'page') {
  const html = files.filter(f => /\.html?$/i.test(f));
  if (!html.length) return [];
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sloplint.mjs');
  const scopeArg = ['page', 'app', 'component'].includes(surfaceScope) ? surfaceScope : 'page';
  const r = spawnSync(process.execPath, [script, ...html, '--scope', scopeArg, '--json'], { encoding: 'utf8', timeout: 90000 });
  let data; try { data = JSON.parse(r.stdout); } catch {
    return [{ severity: 'P1', category: 'verification-unavailable', rule: 'sloplint', location: script,
      message: `Design checks did not return a valid result: ${r.error?.message || r.stderr || `exit ${r.status}`}` }];
  }
  return (data.findings || [])
    .filter(f => f.grade === 'FAIL' || f.grade === 'WARN')
    .map(f => ({ severity: 'P2', category: 'hallmark-sloplint', rule: `gate-${f.gate}`, location: `${f.file}:${f.line}`, message: `${f.evidence}. Consider in the context of the selected DESIGN: ${f.fix}` }));
}

export function scanCssTrackedCaps(files) {
  const out = [];
  for (const file of files) {
    if (!/\.(css|html?|jsx|tsx|vue|svelte|astro|scss)$/i.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    let n = 0;
    for (const m of content.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2];
      if (/text-transform\s*:\s*uppercase/i.test(body) && /letter-spacing\s*:\s*(0?\.\d+|[1-9][\d.]*)\s*(em|rem|px)/i.test(body)) n++;
    }
    if (n >= 3) out.push({ severity: 'P2', category: 'second-order-slop', rule: 'gate-67-css-tracked-caps', location: path.relative(process.cwd(), file), message: `${n} CSS rules use uppercase labels with letter spacing; review readability and the selected DESIGN.` });
  }
  return out;
}

