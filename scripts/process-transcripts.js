/**
 * process-transcripts.js
 *
 * Converts raw transcript .txt files into Astro content collection entries.
 *
 * Usage:
 *   npm run transcript
 *
 * Workflow:
 *   1. Drop your .txt script into transcripts/raw/
 *   2. Name it after the episode slug, e.g. fafo-and-the-compassion-muscle.txt
 *   3. Run npm run transcript
 *   4. Commit and push — transcript page goes live automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR    = path.join(__dirname, '..', 'transcripts', 'raw');
const OUT_DIR    = path.join(__dirname, '..', 'src', 'content', 'transcripts');

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.txt'));

if (files.length === 0) {
  console.log('No .txt files found in transcripts/raw/ — nothing to do.');
  process.exit(0);
}

for (const file of files) {
  const slug = path.basename(file, '.txt');
  const raw  = fs.readFileSync(path.join(RAW_DIR, file), 'utf-8');

  const cleaned = raw
    .replace(/\r\n/g, '\n')       // normalize Windows line endings
    .replace(/\n{3,}/g, '\n\n')   // collapse 3+ blank lines to one
    .trim();

  const output = `---
episodeSlug: "${slug}"
---

${cleaned}
`;

  const outPath = path.join(OUT_DIR, `${slug}.md`);
  fs.writeFileSync(outPath, output);
  console.log(`✓  ${file}  →  src/content/transcripts/${slug}.md`);
}

console.log('\nDone. Commit src/content/transcripts/ and push to deploy.');
