/**
 * Web encodes for operator-supplied clips, and uploads them to Vercel Blob.
 *
 * Same three outputs as the chalet walkthrough, because they feed the same rail:
 *   • <key>.mp4          720×1280, 25 fps, H.264 + AAC — opened from a card
 *   • <key>-preview.mp4  400px wide, silent — what the card itself plays
 *   • <key>.jpg          poster frame
 *
 * The masters here range from a 15 MB phone clip to a 248 MB 4K one. Serving
 * any of them raw would be worse than serving no video: the 4K file alone is
 * larger than every photograph on this site put together, and on a mountain
 * connection it would never start.
 *
 *   BLOB_READ_WRITE_TOKEN=… & 'C:\Program Files\nodejs\node.exe' .\scripts\encode-clips.js
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { put } = require("@vercel/blob");

const FFMPEG = path.join(__dirname, "..", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const SRC_DIR = "C:/Users/Abdurasul/Downloads/Telegram Desktop";
const OUT = path.join(process.env.TEMP || ".", "clip-encodes");

/** source file -> blob key */
const CLIPS = [
  ["IMG_1096.MOV", "tubing-6"],
  ["IMG_1066.MOV", "tubing-7"],
  ["glamping.mp4", "glamping-tour"],
];

const run = (args) =>
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1) + " MB";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const uploaded = [];

  for (const [file, key] of CLIPS) {
    const src = path.join(SRC_DIR, file);
    if (!fs.existsSync(src)) {
      console.log(`MISSING  ${file}`);
      continue;
    }

    const full = path.join(OUT, `${key}.mp4`);
    const preview = path.join(OUT, `${key}-preview.mp4`);
    const poster = path.join(OUT, `${key}.jpg`);

    console.log(`\n${file} -> ${key}`);
    run([
      "-i", src,
      // Portrait phone footage; the height is pinned and the width follows so a
      // 1072- and a 2160-wide master both land on the same rail geometry.
      "-vf", "scale=-2:1280:flags=lanczos,fps=25",
      "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-profile:v", "high", "-level", "4.0",
      "-c:a", "aac", "-b:a", "96k", "-ac", "2",
      "-movflags", "+faststart",
      full,
    ]);
    run([
      "-i", src,
      "-vf", "scale=400:-2:flags=lanczos,fps=25",
      "-c:v", "libx264", "-crf", "30", "-preset", "slow",
      "-an", "-movflags", "+faststart",
      preview,
    ]);
    // Two seconds in: the first frame of a phone clip is usually mid-motion.
    run(["-ss", "2", "-i", src, "-frames:v", "1", "-vf", "scale=720:-2:flags=lanczos", "-q:v", "4", poster]);

    for (const f of [full, preview, poster]) console.log(`  ${path.basename(f).padEnd(26)} ${mb(f)}`);
    uploaded.push([full, preview, poster]);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(`\nBLOB_READ_WRITE_TOKEN not set — encoded locally, nothing uploaded.\n${OUT}`);
    return;
  }

  console.log("\nuploading…");
  for (const group of uploaded) {
    for (const f of group) {
      const name = path.basename(f);
      const res = await put(`video/${name}`, fs.readFileSync(f), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: name.endsWith(".jpg") ? "image/jpeg" : "video/mp4",
      });
      console.log(`  ${name.padEnd(26)} ${res.url}`);
    }
  }
})();
