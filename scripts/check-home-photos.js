#!/usr/bin/env node
/**
 * check-home-photos — no photograph may appear on two homepage surfaces.
 *
 * Why this exists
 * ---------------
 * The operator reviewed the homepage on a phone (2026-08-04) and asked for
 * "что в этой зоне, что в этой зоне — разные фотографии, пусть чтобы дублей не
 * было". At that point `homeGallery` was a superset of everything above it: all
 * twelve frames of the photo strip and six of the eight bento cells appeared
 * again in the archive, and poolPanorama alone was the hero, the pool room
 * card, the picnic-zone service card, a bento cell and an archive tile — five
 * places on one page.
 *
 * Nothing in the type system stops that: every surface just holds
 * `keyof typeof resortImages`, so a repeat is a perfectly valid program. Hence
 * a check rather than a type.
 *
 * It parses the sources with regexes instead of importing them, because these
 * are TypeScript modules with JSX-adjacent syntax and this has to run under
 * plain `node` with no build step. That is fine for the shapes involved — flat
 * arrays of string literals and `image: "key"` fields — and the script fails
 * loudly if a list it expects to find comes back empty, so a refactor that
 * moves one of them cannot silently turn this into a no-op.
 *
 *   node scripts/check-home-photos.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

/** All string literals inside the first match group of `re`. */
function listFrom(source, re, label) {
  const m = source.match(re);
  if (!m) throw new Error(`check-home-photos: could not find ${label} — has it moved or been renamed?`);
  const keys = (m[1].match(/"([A-Za-z][A-Za-z0-9]*)"/g) || []).map((s) => s.slice(1, -1));
  if (keys.length === 0) throw new Error(`check-home-photos: ${label} parsed to an empty list`);
  return keys;
}

const images = read("src/content/images.ts");
const marqueeSrc = read("src/components/sections/PhotoMarquee.tsx");
const bentoSrc = read("src/components/sections/BentoGallery.tsx");
const showcaseSrc = read("src/content/home-showcase.ts");
const roomsSrc = read("src/content/rooms.ts");
const servicesSrc = read("src/content/services.ts");
const heroSrc = read("src/components/sections/HeroSlideshow.tsx");
const pageSrc = read("src/app/[locale]/page.tsx");
const promoSrc = read("src/components/sections/PromoBand.tsx");

/** localSrc/src path -> image key, so the hero's file paths can be compared. */
function pathToKey() {
  const map = new Map();
  const re = /^ {2}([A-Za-z][A-Za-z0-9]*): \{([\s\S]*?)^ {2}\},/gm;
  let m;
  while ((m = re.exec(images))) {
    for (const f of ["localSrc", "src"]) {
      const hit = m[2].match(new RegExp(`${f}:\\s*"([^"]+)"`));
      if (hit && !map.has(hit[1])) map.set(hit[1], m[1]);
    }
  }
  return map;
}

const byPath = pathToKey();

// The hero holds file paths rather than keys, so it is resolved through the
// registry instead of going via listFrom().
const heroBlock = heroSrc.match(/const SUMMER_SLIDES = \[([\s\S]*?)\];/);
if (!heroBlock) throw new Error("check-home-photos: could not find HeroSlideshow SUMMER_SLIDES");
const heroKeys = (heroBlock[1].match(/"([^"]+)"/g) || [])
  .map((s) => s.slice(1, -1))
  .map((p) => {
    const key = byPath.get(p);
    if (!key) throw new Error(`check-home-photos: hero slide ${p} is not registered in images.ts`);
    return key;
  });
if (heroKeys.length === 0) throw new Error("check-home-photos: SUMMER_SLIDES parsed to an empty list");

/**
 * `image:` fields, in source order. LeisureShowcase renders `limit={3}` on the
 * homepage and RoomCatalog renders every room, so only the services list is
 * truncated here.
 */
const imageFields = (src) => (src.match(/^\s*image: "([A-Za-z0-9]+)"/gm) || []).map((s) => s.split('"')[1]);

/**
 * `resortImages.someKey` written straight into JSX. The homepage builds three
 * of its photo zones this way rather than through a content module, which is
 * exactly how they escaped the first version of this check: it read the
 * content files, the page rendered five more photographs, and the browser had
 * to be the one to notice.
 */
function inlineKeys(src, label) {
  const keys = [...new Set((src.match(/resortImages\.([A-Za-z][A-Za-z0-9]*)/g) || []).map((s) => s.split(".")[1]))];
  if (keys.length === 0) throw new Error(`check-home-photos: no resortImages.* references in ${label}`);
  return keys;
}

/** `{ image: "key", caption: ... }` entries — the five-frame day strip. */
const inlineImageProps = (src) =>
  [...new Set((src.match(/\{ image: "([A-Za-z0-9]+)"/g) || []).map((s) => s.split('"')[1]))];

const dayStrip = inlineImageProps(pageSrc);
if (dayStrip.length !== 5) {
  throw new Error(`check-home-photos: expected 5 frames in the day strip, parsed ${dayStrip.length}`);
}

const SURFACES = {
  hero: heroKeys,
  "page.tsx inline": inlineKeys(pageSrc, "page.tsx"),
  "day strip": dayStrip,
  "promo band": inlineKeys(promoSrc, "PromoBand.tsx"),
  marquee: [
    ...listFrom(marqueeSrc, /const ROW_A = \[([\s\S]*?)\] as const;/, "PhotoMarquee ROW_A"),
    ...listFrom(marqueeSrc, /const ROW_B = \[([\s\S]*?)\] as const;/, "PhotoMarquee ROW_B"),
  ],
  bento: imageFields(bentoSrc),
  showcase: imageFields(showcaseSrc),
  "room cards": imageFields(roomsSrc),
  "service cards": imageFields(servicesSrc).slice(0, 3),
  archive: listFrom(images, /export const homeGallery = \[([\s\S]*?)\] as const/, "homeGallery"),
};

const owner = new Map();
const clashes = [];
for (const [surface, keys] of Object.entries(SURFACES)) {
  const seen = new Set();
  for (const key of keys) {
    if (seen.has(key)) clashes.push({ key, a: surface, b: `${surface} (twice)` });
    seen.add(key);
    if (owner.has(key)) clashes.push({ key, a: owner.get(key), b: surface });
    else owner.set(key, surface);
  }
}

for (const [surface, keys] of Object.entries(SURFACES)) {
  console.log(`${surface.padEnd(14)} ${String(keys.length).padStart(2)}  ${keys.join(", ")}`);
}
console.log(`\n${owner.size} distinct photographs on the homepage`);

if (clashes.length) {
  console.error(`\n${clashes.length} photo(s) used on more than one homepage surface:`);
  for (const c of clashes) console.error(`  ${c.key} — ${c.a} + ${c.b}`);
  process.exit(1);
}
console.log("ok — every homepage photo is used exactly once");
