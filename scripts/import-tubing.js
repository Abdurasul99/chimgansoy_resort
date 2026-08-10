/**
 * Импорт съёмки тюбинг-горки (10 августа 2026).
 *
 * До этого дня фотографий самой горки НЕ СУЩЕСТВОВАЛО: страница тюбинга,
 * карточка услуги и визитка показывали окружающие горы, а тексты обещали
 * только то, что видно на тех кадрах. Это была отдельная строка в списке
 * незакрытых задач — теперь она закрыта.
 *
 * Оригиналы — 27-мегапиксельные файлы по 12–19 МБ. Здесь они уменьшаются до
 * веб-потолка, теряют метаданные камеры (sharp выбрасывает их, если не просить
 * обратного, — вместе с GPS-тегами) и пишутся прогрессивным JPEG.
 *
 * Имена говорят, что в кадре, а не порядок съёмки: каждая путаница с
 * картинками на этом сайте начиналась с файла, имя которого молчало о
 * содержимом (см. предупреждение в content/images.ts).
 *
 * Запуск:
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\import-tubing.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Abdurasul/Downloads/Telegram Desktop";
const OUT = path.join(__dirname, "..", "public", "images", "resort", "tubing-2026-08");

const MAP = [
  ["_DSC3615.jpg", "tube-start-valley.jpg"], // тюбинг на старте, трасса уходит в долину
  ["_DSC3620.jpg", "two-lanes-wide.jpg"],    // обе полосы целиком, подъёмник между ними
  ["_DSC3621.jpg", "two-lanes-valley.jpg"],  // две полосы вниз, долина за ними
  ["_DSC3618.jpg", "track-from-top.jpg"],    // взгляд сверху вдоль трассы
  ["_DSC3626.jpg", "track-pattern.jpg"],     // узор покрытия крупно
  ["_DSC3619.jpg", "tube-on-mats.jpg"],      // тюбинг на матах, крупный план
  ["_DSC3614.jpg", "tubes-and-track.jpg"],   // стойка тюбингов и трасса за ней
  ["_DSC3627.jpg", "tubes-canopy.jpg"],      // тюбинги под навесом на выдаче
  ["_DSC3625.jpg", "tubes-stacked.jpg"],     // штабели тюбингов, горы позади
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
      .rotate() // учесть EXIF-ориентацию до того, как метаданные будут сброшены
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toFile(dst);
    const { width, height, size } = await sharp(dst).metadata();
    const kb = Math.round(fs.statSync(dst).size / 1024);
    total += kb;
    console.log(`${to.padEnd(26)} ${width}x${height}  ${kb} KB`);
  }
  console.log(`\nвсего: ${(total / 1024).toFixed(1)} МБ`);
})();
