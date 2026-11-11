#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosPath = path.resolve(__dirname, '../data/photos.json');
const raw = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
const photos = Array.isArray(raw) ? raw : (raw.photos || []);

const args = process.argv.slice(2);
const cmd = args[0] || 'search';
const query = (args[1] && !args[1].startsWith('--') ? args[1] : '').toLowerCase();
const catIdx = args.indexOf('--cat');
const catFilter = catIdx >= 0 ? args[catIdx + 1]?.toLowerCase() : null;
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 6 : 6;

if (cmd === 'categories') {
  const cats = {};
  for (const p of photos) cats[p.cat] = (cats[p.cat] || 0) + 1;
  console.log(JSON.stringify(cats, null, 2));
  process.exit(0);
}

const terms = query.split(/\s+/).filter(Boolean);
const scored = photos
  .filter(p => !catFilter || String(p.cat).toLowerCase() === catFilter)
  .map(p => {
    const hay = `${p.id} ${p.subject} ${(p.tags || []).join(' ')} ${p.cat}`.toLowerCase();
    let score = (p.q || 1) * 2;
    for (const t of terms) {
      if (hay.includes(t)) score += 10;
    }
    return { score, photo: p };
  })
  .filter(x => terms.length === 0 || x.score > (x.photo.q || 1) * 2)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(x => ({
    id: x.photo.id,
    url: x.photo.file,
    subject: x.photo.subject,
    dimensions: `${x.photo.w}x${x.photo.h}`,
    color: x.photo.color,
    cat: x.photo.cat,
    credit: `Photo: ${x.photo.author} (${x.photo.license}, Wikimedia Commons)`,
  }));

console.log(JSON.stringify(scored, null, 2));
