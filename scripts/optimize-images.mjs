#!/usr/bin/env node
/**
 * One-time image optimization for public/images/resort/*.
 * Re-encodes JPGs at 80% quality with progressive scan + strips EXIF.
 * Typically saves 40-60% vs the source files.
 *
 * Run:  node scripts/optimize-images.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public/images/resort");
const QUALITY_JPG = 78;
const MAX_WIDTH = 2200; // larger than this is wasted bytes for any viewport
const SIZE_FLOOR_BYTES = 80_000; // skip files already small enough

const fmt = (n) => `${(n / 1024).toFixed(0)}kb`;

async function processOne(file) {
  const absPath = path.join(ROOT, file);
  const stat = await fs.stat(absPath);
  if (stat.size < SIZE_FLOOR_BYTES) {
    return { file, skipped: true, before: stat.size, after: stat.size };
  }

  const original = await fs.readFile(absPath);
  const meta = await sharp(original).metadata();

  let pipeline = sharp(original);
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const optimized = await pipeline
    .jpeg({ quality: QUALITY_JPG, progressive: true, mozjpeg: true })
    .toBuffer();

  // Only write if the optimized version is smaller — preserves quality
  // for already-optimized files.
  if (optimized.length < original.length) {
    await fs.writeFile(absPath, optimized);
    return { file, before: original.length, after: optimized.length };
  }
  return { file, skipped: true, before: original.length, after: original.length };
}

(async () => {
  const all = await fs.readdir(ROOT);
  const jpgs = all.filter((f) => /\.(jpe?g)$/i.test(f));
  console.log(`Optimizing ${jpgs.length} JPG files in ${ROOT}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let skipped = 0;

  for (const file of jpgs) {
    try {
      const r = await processOne(file);
      totalBefore += r.before;
      totalAfter += r.after;
      if (r.skipped) {
        skipped++;
        console.log(`  ⊝ ${file} (${fmt(r.before)}, skipped)`);
      } else {
        const pct = ((1 - r.after / r.before) * 100).toFixed(0);
        console.log(`  ✓ ${file}  ${fmt(r.before)} → ${fmt(r.after)} (-${pct}%)`);
      }
    } catch (e) {
      console.error(`  ✗ ${file}: ${e.message}`);
    }
  }

  const pct = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) : 0;
  console.log(
    `\nTotal: ${fmt(totalBefore)} → ${fmt(totalAfter)} (-${pct}%, ${skipped} skipped)`,
  );
})();
