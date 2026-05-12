/**
 * process-transcripts.js
 *
 * Converts raw transcript .txt and .srt files into Astro content collection entries.
 *
 * Usage:
 *   npm run transcript
 *
 * Workflow:
 *   1. Drop your .txt or .srt file into transcripts/raw/
 *   2. Name it after the episode slug, e.g. fafo-and-the-compassion-muscle.srt
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

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.srt'));

if (files.length === 0) {
  console.log('No .txt or .srt files found in transcripts/raw/ — nothing to do.');
  process.exit(0);
}

function parseSrt(raw) {
  // Split into blocks (separated by blank lines)
  const blocks = raw.split(/\n\s*\n/);
  const lines = [];

  for (const block of blocks) {
    const blockLines = block.trim().split('\n');
    // Skip sequence number lines (pure digits) and timestamp lines (contain -->)
    const textLines = blockLines.filter(l => {
      const trimmed = l.trim();
      return trimmed.length > 0
        && !/^\d+$/.test(trimmed)
        && !trimmed.includes('-->');
    });
    if (textLines.length > 0) {
      lines.push(textLines.join(' '));
    }
  }

  // Group every ~8 lines into a paragraph for readability
  const paragraphs = [];
  const chunkSize = 8;
  for (let i = 0; i < lines.length; i += chunkSize) {
    paragraphs.push(lines.slice(i, i + chunkSize).join(' '));
  }

  return paragraphs.join('\n\n');
}

function parseTxt(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

for (const file of files) {
  const ext  = path.extname(file);
  const slug = path.basename(file, ext);
  const raw  = fs.readFileSync(path.join(RAW_DIR, file), 'utf-8');

  const cleaned = ext === '.srt' ? parseSrt(raw) : parseTxt(raw);

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
