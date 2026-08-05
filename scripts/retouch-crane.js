/**
 * Removes the tower crane from the lawn-era A-frame frames.
 *
 * Why this is legitimate and the AI "upscale" was not
 * -------------------------------------------------
 * A ChatGPT-regenerated version of one of these photographs was offered on
 * 2026-08-04 to replace the low-resolution original. That is a synthesised
 * picture of a real building — the same substitution the render purge undid
 * that morning, only harder to spot, and it still had the crane in it.
 *
 * This is the opposite operation. Every pixel of the building, the lawn and the
 * trees is the photograph, untouched. Only pixels that ARE the crane are
 * rewritten, and they are rewritten with sky measured from the same rows of the
 * same frame. A tower crane is temporary equipment parked behind the property,
 * not a feature of it.
 *
 * Why these frames matter
 * -----------------------
 * They are the only photographs in the repo showing an A-frame with its roof
 * intact AND the landscaping finished. Every alternative fails one of the two:
 *   hero-aframe-row / -pines, aframe-exterior — bare geotextile and sand
 *   hero-lawn-banner                          — clean, but cropped through the
 *                                               roof apex, which is the whole
 *                                               silhouette
 * Without this the site cannot show the thing it rents.
 *
 * How, and what the first attempt got wrong
 * -----------------------------------------
 * The first version filled the bounding RECTANGLE with sky sampled from a
 * distant column. Two visible failures, both in the before/after:
 *   • the sky is a gradient in x as well as y — a sample from 250px away came
 *     back lighter, and the patch read as a pale rectangle;
 *   • the box necessarily overlaps the roof below the crane, so it bit a
 *     rectangular notch out of the roofline.
 *
 * So this version is mask-based. A pixel is repainted only if it is part of the
 * crane — bright, and not sky-blue, and not roof-dark. Everything else in the
 * box is left exactly as photographed, which makes overlapping the roof
 * harmless. The replacement colour is the median of the SKY-ONLY pixels in the
 * rows immediately around it, taken from windows on both sides of the crane, so
 * the horizontal gradient is preserved. The mask is dilated by one pixel and
 * feathered, because a hard mask leaves the crane's own anti-aliased fringe
 * behind as a faint outline.
 *
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\retouch-crane.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "public", "images", "resort");

/**
 * Search boxes, one per frame — the three files are the same scene at different
 * crops. Generous on purpose: the mask decides what is actually repainted, so
 * the box only has to CONTAIN the crane, not trace it.
 */
const FRAMES = [
  { file: "rooms/aframe-lawn.jpg", box: { x0: 340, x1: 410, y0: 340, y1: 440 } },
  { file: "rooms/aframe-lawn-tall.jpg", box: { x0: 334, x1: 406, y0: 360, y1: 464 } },
  { file: "rooms/aframe-lawn-wide.jpg", box: { x0: 340, x1: 410, y0: 165, y1: 262 } },
];

const isSky = (r, g, b) => b > r + 22 && b > 95;
const lum = (r, g, b) => (r + g + b) / 3;

/**
 * Deviation from the sky colour measured on that row, per channel, largest wins.
 *
 * This replaced a "not blue-dominant" test that missed the crane's white
 * lattice entirely. The lattice is a thin structure over sky, so its pixels are
 * blends — around r150 g180 b210 — which is still blue-dominant and passed for
 * sky, leaving the mast standing after the red sections had been erased. What
 * the lattice IS, unmistakably, is different from the sky beside it.
 */
const deviation = (px, sky) => Math.max(Math.abs(px[0] - sky[0]), Math.abs(px[1] - sky[1]), Math.abs(px[2] - sky[2]));

function median(a) {
  if (!a.length) return null;
  a.sort((x, y) => x - y);
  return a[a.length >> 1];
}

(async () => {
  for (const frame of FRAMES) {
    const file = path.join(ROOT, frame.file);
    if (!fs.existsSync(file)) {
      console.log(`MISSING  ${frame.file}`);
      continue;
    }

    const img = sharp(file);
    const { width, height } = await img.metadata();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    const { x0, x1, y0, y1 } = frame.box;

    const at = (x, y) => {
      const i = (y * width + x) * ch;
      return [data[i], data[i + 1], data[i + 2]];
    };

    // ── 0. Sky colour per row, measured either side of the crane ───────────
    // Done before the mask, because the mask is defined by deviation from it.
    // Windows adjacent to the box, so the sky's horizontal gradient survives —
    // a sample from 250px away came back lighter and left a pale rectangle.
    const rowSky = new Map();
    for (let y = y0 - 3; y <= y1 + 3; y++) {
      const chans = [[], [], []];
      const take = (xa, xb) => {
        for (let x = xa; x <= xb; x++) {
          if (x < 0 || x >= width) continue;
          const [r, g, b] = at(x, y);
          if (!isSky(r, g, b)) continue; // never sample the roof or the trees
          chans[0].push(r); chans[1].push(g); chans[2].push(b);
        }
      };
      take(x0 - 40, x0 - 5);
      take(x1 + 5, x1 + 40);
      const m = chans.map(median);
      if (m[0] !== null && chans[0].length >= 12) rowSky.set(y, m);
    }

    /**
     * ── 1. Where the roof starts, per column ─────────────────────────────
     *
     * The box has to overlap the roof, because the crane stands behind it and
     * its base is occluded by the ridge. Excluding the roof by darkness alone
     * is not enough: the roof carries a BRIGHT grey fascia along its edge, and
     * a previous attempt repainted a stripe of it as sky — a pale bar cut
     * straight through the roofline.
     *
     * So the roof is excluded geometrically instead. Scanning each column from
     * the top, the first genuinely dark pixel is the roof's leading edge;
     * nothing at or below it is ever touched, fascia included.
     */
    const roofTop = new Int32Array(width).fill(Number.MAX_SAFE_INTEGER);
    for (let x = x0 - 3; x <= x1 + 3; x++) {
      if (x < 0 || x >= width) continue;
      for (let y = y0; y <= Math.min(height - 1, y1 + 60); y++) {
        const [r, g, b] = at(x, y);
        // Dark AND navy. Darkness alone is not enough: the crane's shadowed red
        // members fall below the luminance threshold too, and taking one of
        // those for the roofline protected everything beneath it — which is
        // exactly how a red block survived on the roof edge for three attempts.
        // The roof is blue-grey; the crane is red.
        if (lum(r, g, b) < 88 && b >= r - 6) {
          roofTop[x] = y;
          break;
        }
      }
    }

    // ── 2. Mask: anything above the roofline that is not its row's sky ─────
    const mask = new Float32Array(width * height);
    let found = 0;
    for (let y = y0; y <= y1; y++) {
      const sky = rowSky.get(y);
      if (!sky) continue;
      for (let x = x0; x <= x1; x++) {
        // Two pixels of clearance, so the fascia's own soft edge survives.
        if (y >= roofTop[x] - 2) continue;
        const px = at(x, y);
        const L = lum(px[0], px[1], px[2]);
        if (L < 95) continue; // the guy wire and any deep shadow
        if (deviation(px, sky) < 11) continue; // sky, within sensor noise
        mask[y * width + x] = 1;
        found++;
      }
    }
    if (!found) {
      console.log(`${frame.file.padEnd(28)} no crane pixels in the box — skipped`);
      continue;
    }

    // Dilate by one pixel, then blur, so the crane's anti-aliased fringe goes
    // with it and the repaint has no hard edge of its own.
    const grown = Float32Array.from(mask);
    for (let y = y0 - 2; y <= y1 + 2; y++) {
      for (let x = x0 - 2; x <= x1 + 2; x++) {
        if (y < 1 || x < 1 || y >= height - 1 || x >= width - 1) continue;
        let m = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m = Math.max(m, mask[(y + dy) * width + x + dx]);
        grown[y * width + x] = m;
      }
    }
    const soft = Float32Array.from(grown);
    for (let y = y0 - 2; y <= y1 + 2; y++) {
      for (let x = x0 - 2; x <= x1 + 2; x++) {
        if (y < 1 || x < 1 || y >= height - 1 || x >= width - 1) continue;
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += grown[(y + dy) * width + x + dx];
        soft[y * width + x] = s / 9;
      }
    }

    /**
     * ── 2b. The crane's base, where it meets the roofline ────────────────
     *
     * The roofline guard above protects two pixels of clearance, and the
     * crane's red base sits inside exactly that band — leaving a red speck on
     * the roof edge, small but visible at display size. It cannot be painted
     * with sky (it is below the roofline; that would put a hole in the roof),
     * so it is painted with ROOF, sampled from the same rows either side.
     *
     * Safe to target by colour: the roof is navy, blue-dominant. Anything
     * red-dominant along its edge is the crane and nothing else.
     */
    const roofFix = [];
    for (let x = x0; x <= x1; x++) {
      const top = roofTop[x];
      if (top === Number.MAX_SAFE_INTEGER) continue;
      for (let y = top - 3; y <= Math.min(height - 1, top + 6); y++) {
        const [r, g, b] = at(x, y);
        if (r < b + 18) continue; // navy roof, or its shadow: leave it
        if (lum(r, g, b) < 55) continue;
        // Sample the roof on this row, skipping the neighbourhood of the crane.
        const chans = [[], [], []];
        for (const xs of [x - 46, x + 20]) {
          for (let x2 = xs; x2 < xs + 26; x2++) {
            if (x2 < 0 || x2 >= width || Math.abs(x2 - x) < 14) continue;
            const p = at(x2, y);
            if (isSky(p[0], p[1], p[2])) continue;
            if (p[0] >= p[2] + 18) continue; // another crane pixel
            chans[0].push(p[0]); chans[1].push(p[1]); chans[2].push(p[2]);
          }
        }
        if (chans[0].length < 10) continue;
        roofFix.push([x, y, chans.map(median)]);
      }
    }
    for (const [x, y, col] of roofFix) {
      const i = (y * width + x) * ch;
      for (let k = 0; k < 3; k++) data[i + k] = col[k];
    }

    // ── 3. Repaint ─────────────────────────────────────────────────────────
    let painted = 0;
    for (let y = y0 - 2; y <= y1 + 2; y++) {
      const sky = rowSky.get(y);
      if (!sky) continue; // a row with no clean sky either side: leave it alone
      for (let x = x0 - 2; x <= x1 + 2; x++) {
        const a = soft[y * width + x];
        if (a <= 0.01) continue;
        const i = (y * width + x) * ch;
        for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] * (1 - a) + sky[k] * a);
        painted++;
      }
    }

    /**
     * ── 4. Final sweep: isolated red left anywhere in the box ─────────────
     *
     * Geometry-based rules keep leaving a few pixels of the crane's base right
     * where it crosses the roof edge — whichever way the roofline is defined,
     * some of the crane falls on the wrong side of it. This pass ignores
     * geometry entirely: inside the box, nothing is red. The sky is blue, the
     * roof is navy, and the wooden wall is outside these columns.
     *
     * A pixel is only replaced if its 5×5 neighbourhood is mostly NOT red, so
     * this can shave a speck but cannot eat into a red area if one ever existed
     * here. The replacement is the median of those non-red neighbours, which is
     * whatever the speck is sitting on — sky or roof, decided by the pixels
     * themselves rather than by a rule about where the roof begins.
     */
    let specks = 0;
    for (let y = y0; y <= y1 + 8; y++) {
      for (let x = x0; x <= x1; x++) {
        if (y < 2 || x < 2 || y >= height - 2 || x >= width - 2) continue;
        const [r, , b] = at(x, y);
        if (r < b + 22) continue;
        const chans = [[], [], []];
        let red = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (!dx && !dy) continue;
            const p = at(x + dx, y + dy);
            if (p[0] >= p[2] + 22) { red++; continue; }
            chans[0].push(p[0]); chans[1].push(p[1]); chans[2].push(p[2]);
          }
        }
        if (red > 20 || chans[0].length < 4) continue; // a genuinely red area
        const m = chans.map(median);
        const i = (y * width + x) * ch;
        for (let k = 0; k < 3; k++) data[i + k] = m[k];
        specks++;
      }
    }

    await sharp(data, { raw: { width, height, channels: ch } })
      .jpeg({ quality: 90, progressive: true, mozjpeg: true })
      .toFile(file + ".tmp");
    fs.renameSync(file + ".tmp", file);

    console.log(
      `${frame.file.padEnd(28)} ${width}x${height}  crane px=${found}` +
        `  repainted=${painted}  roofEdge=${roofFix.length}  specks=${specks}`,
    );
  }
})();
