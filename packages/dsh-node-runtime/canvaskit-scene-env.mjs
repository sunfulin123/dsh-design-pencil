/** Cached CanvasKit runtime, bundled fonts, and optional icon catalog for headless scene evidence. */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_WEB_BUNDLE_DIR = existsSync(join(MODULE_DIR, 'web-bundle', 'canvaskit', 'canvaskit.js'))
  ? join(MODULE_DIR, 'web-bundle')
  : join(MODULE_DIR, 'bin', 'web-bundle');
const cachedEnvironments = new Map();

const SYSTEM_CJK_FONT_CANDIDATES = [
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
  '/System/Library/Fonts/STHeiti Medium.ttc',
  '/System/Library/Fonts/STHeiti Light.ttc',
  '/System/Library/Fonts/Supplemental/Songti.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
  'C:\\Windows\\Fonts\\msyh.ttc',
];

const BUNDLED_FONT_MAP = [
  ['inter', 'Inter-VF.ttf'],
  ['roboto', 'Roboto-Regular.ttf'],
  ['space grotesk', 'SpaceGrotesk-VF.ttf'],
  ['manrope', 'Manrope-VF.ttf'],
  ['outfit', 'Outfit-VF.ttf'],
  ['dm sans', 'DMSans-VF.ttf'],
  ['dm serif display', 'DMSerifDisplay-Regular.ttf'],
  ['dm mono', 'DMMono-Regular.ttf'],
  ['instrument serif', 'InstrumentSerif-Regular.ttf'],
  ['jetbrains mono', 'JetBrainsMono-VF.ttf'],
  ['cormorant garamond', 'CormorantGaramond-VF.ttf'],
];

function loadLucidePathCatalog(webBundleDir) {
  const map = new Map();
  try {
    const raw = readFileSync(join(webBundleDir, 'assets', 'iconify-catalog-core.json'), 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.icons)) {
      for (const entry of parsed.icons) {
        if (typeof entry?.name === 'string' && typeof entry.d === 'string') {
          map.set(entry.name, entry.d);
          if (typeof entry.collection === 'string') {
            map.set(`${entry.collection}:${entry.name}`, entry.d);
          }
        }
      }
    }
  } catch {
    // Optional icon catalog
  }
  return map;
}

function loadBundledFonts(CK, webBundleDir) {
  const bundledByFamily = new Map();
  for (const [familyKey, fileName] of BUNDLED_FONT_MAP) {
    const fontPath = join(webBundleDir, 'assets', 'fonts', fileName);
    if (!existsSync(fontPath)) continue;
    try {
      const tf = CK.Typeface.MakeFreeTypeFaceFromData(readFileSync(fontPath));
      if (tf !== null) bundledByFamily.set(familyKey, tf);
    } catch {
      // Unavailable bundled faces fall back to another loaded family.
    }
  }
  return bundledByFamily;
}

function loadCjkTypeface(CK) {
  for (const candidate of SYSTEM_CJK_FONT_CANDIDATES) {
    if (!existsSync(candidate)) continue;
    try {
      const tf = CK.Typeface.MakeFreeTypeFaceFromData(readFileSync(candidate));
      if (tf !== null) return tf;
    } catch {
      // A platform font may not be readable by this CanvasKit build.
    }
  }
  return null;
}

async function initCanvasKitEnvironment(webBundleDir) {
  try {
    const ckJsPath = join(webBundleDir, 'canvaskit', 'canvaskit.js');
    const ckWasmPath = join(webBundleDir, 'canvaskit', 'canvaskit.wasm');
    if (!existsSync(ckJsPath) || !existsSync(ckWasmPath)) return null;
    const req = createRequire(import.meta.url);
    const init = req(ckJsPath);
    const CK = await init({
      wasmBinary: readFileSync(ckWasmPath),
      locateFile: (name) => join(webBundleDir, 'canvaskit', name),
    });
    const bundledByFamily = loadBundledFonts(CK, webBundleDir);
    const interTypeface = bundledByFamily.get('inter') ?? bundledByFamily.get('roboto') ?? null;
    const cjkTypeface = loadCjkTypeface(CK);
    return {
      CK,
      interTypeface,
      cjkTypeface,
      bundledByFamily,
      lucidePaths: loadLucidePathCatalog(webBundleDir),
    };
  } catch {
    return null;
  }
}

export function getCanvasKitEnvironment(webBundleDir = DEFAULT_WEB_BUNDLE_DIR) {
  let pending = cachedEnvironments.get(webBundleDir);
  if (pending === undefined) {
    pending = initCanvasKitEnvironment(webBundleDir);
    cachedEnvironments.set(webBundleDir, pending);
  }
  return pending;
}
