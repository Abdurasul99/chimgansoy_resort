/**
 * Importer for the chalet-interior drop (operator, 2026-08-04).
 *
 * Same treatment as scripts/import-photos.js — 29-megapixel camera originals,
 * 13–21 MB each, resized to a web ceiling with EXIF (including GPS) dropped.
 * A separate script rather than another entry in that one because these are a
 * different shoot going to a different folder, and the August file keeps its
 * value as the record of what that drop contained.
 *
 * These are the first photographs of the chalet inside that are not from the
 * June set, and they arrived while the homepage archive was down to seven
 * frames for lack of material.
 *
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\import-chalet-interiors.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Abdurasul/Downloads/Telegram Desktop";
const OUT = path.join(__dirname, "..", "public", "images", "resort", "chalet-2026-08");

/** Source file → published name. The name says what is in the frame. */
const MAP = [
  ["_DSC3061.jpg", "chalet-hall-beams.jpg"],      // lounge: vaulted beam ceiling, pendants, sofa, kitchen behind
  ["_DSC2881.jpg", "chalet-bedroom-hall.jpg"],    // corridor opening onto the double bedroom
  ["_DSC2919.jpg", "chalet-bedroom-twin-hall.jpg"], // same corridor, twin beds, wardrobe wall
  ["_DSC2794-HDR.jpg", "chalet-robes.jpg"],       // wardrobe: two bathrobes and slippers
  ["_DSC2789-HDR.jpg", "chalet-linen-safe.jpg"],  // wardrobe: folded towels, hangers, in-room safe
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
    console.log(`${to.padEnd(30)} ${String(width).padStart(4)}x${String(height).padStart(4)}  ${String(kb).padStart(4)} KB`);
  }
  console.log(`\n${MAP.length} files, ${total} KB total`);
})();
