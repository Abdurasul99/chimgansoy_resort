/**
 * Small derivatives for the photo strip under the hero.
 *
 * The strip renders twelve photographs at ~250px tall and was being served the
 * masters: 2200–2400px files, 200–800 KB each, about 4 MB for a decorative band
 * that appears before anything a guest can act on. This is the first thing
 * under the hero, so it is also the first thing competing with the hero's own
 * photograph for bandwidth.
 *
 * 560px tall is 2× the largest rendered height, which covers a retina screen
 * and nothing more. Widths follow each photograph's own aspect, because the
 * cards size by height now (see .marquee-card in globals.css).
 *
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\make-strip-derivatives.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "public", "images", "resort");
const OUT = path.join(ROOT, "strip");

/**
 * Кадры ленты читаются ИЗ САМОГО КОМПОНЕНТА, а не дублируются здесь.
 *
 * Копия списка уже разошлась однажды: 05.09.2026 в ленте заменили два кадра
 * бассейна, а этот файл остался со старыми ключами — деривативы новых не
 * собрались, и на главной висел битый прямоугольник с подписью «Два домика
 * A-frame крупным планом». Проверка check-home-photos это поймала, но её
 * вывод отфильтровали и не прочли.
 *
 * Так же читает список check-home-photos.js: один источник на троих.
 */
const marqueeSrc = fs.readFileSync(
  path.join(__dirname, "..", "src", "components", "sections", "PhotoMarquee.tsx"),
  "utf8",
);
const KEYS = ["ROW_A", "ROW_B"].flatMap((row) => {
  // Без регулярок намеренно: экранирование в этом файле уже терялось.
  const after = marqueeSrc.split("const " + row + " = [")[1];
  if (!after) throw new Error("make-strip-derivatives: не нашёл " + row + " в PhotoMarquee.tsx");
  const body = after.split("] as const;")[0];
  const NL = String.fromCharCode(10);
  const Q = String.fromCharCode(34);
  return body.split(NL).map((l) => l.trim()).filter((l) => l.startsWith(Q))
    .map((l) => l.split(Q)[1]);
});

const registry = fs.readFileSync(path.join(__dirname, "..", "src", "content", "images.ts"), "utf8");

function fileFor(key) {
  const block = registry.match(new RegExp(`^ {2}${key}: \\{([\\s\\S]*?)^ {2}\\},`, "m"));
  if (!block) return null;
  const p = (block[1].match(/localSrc:\s*"([^"]+)"/) || block[1].match(/src:\s*"([^"]+)"/) || [])[1];
  return p ? path.join(__dirname, "..", "public", p) : null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let before = 0;
  let after = 0;

  for (const key of KEYS) {
    const src = fileFor(key);
    if (!src || !fs.existsSync(src)) {
      console.log(`MISSING  ${key}`);
      continue;
    }
    const name = path.basename(src).replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg");
    const dst = path.join(OUT, name);

    before += fs.statSync(src).size;
    await sharp(src)
      .resize({ height: 560, withoutEnlargement: true })
      .jpeg({ quality: 76, progressive: true, mozjpeg: true })
      .toFile(dst);
    const meta = await sharp(dst).metadata();
    const kb = Math.round(fs.statSync(dst).size / 1024);
    after += fs.statSync(dst).size;
    console.log(`${name.padEnd(30)} ${String(meta.width).padStart(4)}x${meta.height}  ${String(kb).padStart(4)} KB`);
  }

  console.log(
    `\nstrip total: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB` +
      ` (${Math.round((1 - after / before) * 100)}% less)`,
  );
})();
