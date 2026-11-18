/** Resolve observed faces across captured boards and preserve unavailable icon glyph paint. */
import { join } from 'node:path';
import { FontFetcher } from './font-fetcher.mjs';
import { defaultFigmaCacheDir } from './figma-import-jobs.mjs';
import { registerPageFonts, loadedFaces, applyUnresolvedIconFallbacks } from './html-fonts.mjs';

const faceKey = ({ family, weight, italic }) => `${family.toLowerCase()}|${weight}|${italic}`;
const fontCandidate = ({ family, weight, italic }) => ({
  family,
  weight,
  style: italic ? 'italic' : 'normal',
});

export async function prepareHtmlStateFonts(snapshot, capture, known = [], { baseDir, signal }) {
  const faces = new Map(known.map((face) => [faceKey(face), face]));
  const pending = loadedFaces([capture]).filter((face) => !faces.get(faceKey(face))?.available);
  const registered = await registerPageFonts(
    [
      {
        ...capture,
        fonts: pending.filter((face) => !face.icon).map(fontCandidate),
        iconFonts: pending.filter((face) => face.icon).map(fontCandidate),
      },
    ],
    { fetcher: new FontFetcher(join(defaultFigmaCacheDir(), 'fonts')), baseDir, signal },
  );
  for (const face of registered.faces) faces.set(faceKey(face), face);
  const outcomes = [...faces.values()];
  const iconWarnings = applyUnresolvedIconFallbacks(snapshot, capture, outcomes);
  return { faces: outcomes, warnings: [...registered.warnings, ...iconWarnings] };
}
