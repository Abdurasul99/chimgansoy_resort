/**
 * Importer for the A-frame glamping drop (operator, 2026-08-04, second batch).
 *
 * The two terrace frames matter out of proportion to their number: until they
 * arrived, EVERY wide A-frame exterior in the repo carried a tower crane in the
 * sky or bare geotextile on the ground, which is why the glamping room gallery
 * had to be led by an interior and the bento mosaic argued the A-frame with a
 * picture of its inside. See the exclusion list at the foot of content/images.ts.
 *
 * Same treatment as the other importers: 2400px ceiling, camera metadata
 * (including GPS) dropped, progressive mozjpeg.
 *
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\import-glamping.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Abdurasul/Downloads/Telegram Desktop";
const OUT = path.join(__dirname, "..", "public", "images", "resort", "glamping-2026-08");

/** Source file → published name. The name says what is in the frame. */
const MAP = [
  ["_DSC2515.jpg", "aframe-terrace-rail.jpg"],   // terrace, railing, glass doors, young pine — crane-free
  ["_DSC2516.jpg", "aframe-gable-sky.jpg"],      // the A-frame gable against open sky — crane-free
  ["_DSC2279-HDR.jpg", "aframe-chairs-window.jpg"], // two chairs at the panoramic window
  ["_DSC2429-HDR.jpg", "aframe-bulbs.jpg"],      // pendant bulbs under the timber ceiling
  ["_DSC2353.jpg", "aframe-robes.jpg"],          // wardrobe: robes, towels, blankets
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
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toFile(dst);
    const { width, height } = await sharp(dst).metadata();
    const kb = Math.round(fs.statSync(dst).size / 1024);
    total += kb;
    console.log(`${to.padEnd(28)} ${String(width).padStart(4)}x${String(height).padStart(4)}  ${String(kb).padStart(4)} KB`);
  }
  console.log(`\n${MAP.length} files, ${total} KB total`);
})();
