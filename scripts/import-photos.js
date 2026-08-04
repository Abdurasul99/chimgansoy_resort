/**
 * One-off importer for the August-2026 photo drop (pool + chalets).
 *
 * The originals are 29-megapixel camera files, 13–27 MB each — three of them
 * would outweigh the entire rest of the site. This resizes every one to a web
 * ceiling, strips camera metadata (sharp drops it unless asked to keep it, which
 * also removes the GPS tags the camera wrote), and writes progressive JPEG.
 *
 * Run once with:
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\import-photos.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Abdurasul/Downloads/Telegram Desktop";
const OUT = path.join(__dirname, "..", "public", "images", "resort", "2026-08");

/**
 * Source file → published name. Names describe the frame, not the shoot order:
 * every past mix-up on this site came from filenames that did not say what was
 * inside them (see the warning block in content/images.ts).
 */
const MAP = [
  // ── Pool ──────────────────────────────────────────────────────────────────
  ["_DSC3387.jpg", "pool-panorama.jpg"],          // whole pool + swim-up gazebo + mountains
  ["_DSC3363.jpg", "pool-wide-chalets.jpg"],      // pool, loungers, chalet row, ridge
  ["_DSC3362.jpg", "pool-loungers.jpg"],          // parasols and loungers along the deck
  ["_DSC3364.jpg", "pool-deck-chalets.jpg"],      // loungers close, chalets behind
  ["_DSC3367.jpg", "pool-curve-tall.jpg"],        // portrait: pool curve under the hills
  ["_DSC3369.jpg", "pool-steps-tall.jpg"],        // portrait: shallow entry, handrail, mosaic
  ["_DSC3397.jpg", "pool-cabanas-sky.jpg"],       // cabanas across the water
  ["_DSC3388.jpg", "pool-cabanas-valley.jpg"],    // cabanas with the valley behind
  ["_DSC3428.jpg", "pool-cabanas.jpg"],           // cabana row from the deck
  ["_DSC3405.jpg", "pool-water.jpg"],             // clear water, mosaic showing through
  ["_DSC3417.jpg", "pool-logo-tall.jpg"],         // portrait: CHIMGAN DARBAZA mosaic underwater
  // ── Chalets ───────────────────────────────────────────────────────────────
  ["\u0428\u0430\u043b\u0435 1.png", "chalet-lawn.jpg"],   // chalet + lawn + peaks
  ["\u0428\u0430\u043b\u0435 2.png", "chalet-terrace.jpg"], // terrace close, evening light
  ["3.png", "chalet-row-tall.jpg"],               // portrait: chalets along the drive
  ["4.png", "chalet-front.jpg"],                  // chalet head-on, full terrace
  ["5.png", "chalet-peaks.jpg"],                  // chalets under the rock face
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const [from, to] of MAP) {
    const src = path.join(SRC, from);
    if (!fs.existsSync(src)) {
      console.log(`MISSING  ${from}`);
      continue;
    }
    const dst = path.join(OUT, to);
    await sharp(src)
      .rotate() // honour the EXIF orientation before metadata is dropped
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toFile(dst);
    const { width, height } = await sharp(dst).metadata();
    const kb = Math.round(fs.statSync(dst).size / 1024);
    total += kb;
    console.log(`${to.padEnd(26)} ${String(width).padStart(4)}x${String(height).padStart(4)}  ${String(kb).padStart(4)} KB`);
  }
  console.log(`\n${MAP.length} files, ${total} KB total`);
})();
