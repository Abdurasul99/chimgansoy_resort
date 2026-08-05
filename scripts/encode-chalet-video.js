/**
 * Prepares the chalet walkthrough for the web and uploads it to Vercel Blob.
 *
 * The master is 260 MB: 1080×1920 at 50 fps, 21 Mbit/s, 98 seconds. Nothing on
 * this site may serve that — it is more than every photograph on the homepage
 * put together, and on a mountain 4G connection it would simply never start.
 *
 * Three outputs, the same shape the tubing clips already use:
 *   • <key>.mp4          720×1280, 25 fps, H.264 + AAC — opened from a card
 *   • <key>-preview.mp4  400px wide, silent — what the card itself plays
 *   • <key>.jpg          poster frame, for before either has loaded
 *
 * 50 → 25 fps on purpose: it is a slow walkthrough, nothing in it needs 50, and
 * it halves the bitrate for no visible loss. faststart puts the moov atom at
 * the front so playback can begin before the file has arrived — without it a
 * progressive download plays nothing until the last byte.
 *
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\encode-chalet-video.js
 *
 * Needs BLOB_READ_WRITE_TOKEN in the environment (pull it with `vercel env pull`).
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { put } = require("@vercel/blob");

const FFMPEG = path.join(__dirname, "..", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const SRC = "C:/Users/Abdurasul/Downloads/Telegram Desktop/Shale (2).mp4";
const OUT = path.join(process.env.TEMP || ".", "chalet-video");
const KEY = "chalet-tour";

const run = (args) => execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1) + " MB";

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`missing source: ${SRC}`);
  fs.mkdirSync(OUT, { recursive: true });

  const full = path.join(OUT, `${KEY}.mp4`);
  const preview = path.join(OUT, `${KEY}-preview.mp4`);
  const poster = path.join(OUT, `${KEY}.jpg`);

  console.log("encoding full…");
  run([
    "-i", SRC,
    "-vf", "scale=720:1280:flags=lanczos,fps=25",
    "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-profile:v", "high", "-level", "4.0",
    "-c:a", "aac", "-b:a", "96k", "-ac", "2",
    "-movflags", "+faststart",
    full,
  ]);

  console.log("encoding preview…");
  run([
    "-i", SRC,
    "-vf", "scale=400:-2:flags=lanczos,fps=25",
    "-c:v", "libx264", "-crf", "30", "-preset", "slow",
    "-an", "-movflags", "+faststart",
    preview,
  ]);

  console.log("grabbing poster…");
  run(["-ss", "3", "-i", SRC, "-frames:v", "1", "-vf", "scale=720:-2:flags=lanczos", "-q:v", "4", poster]);

  for (const f of [full, preview, poster]) console.log(`  ${path.basename(f).padEnd(26)} ${mb(f)}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("\nBLOB_READ_WRITE_TOKEN not set — files written locally, nothing uploaded.");
    console.log(OUT);
    return;
  }

  console.log("\nuploading…");
  for (const f of [full, preview, poster]) {
    const name = path.basename(f);
    const res = await put(`video/${name}`, fs.readFileSync(f), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: name.endsWith(".jpg") ? "image/jpeg" : "video/mp4",
    });
    console.log(`  ${name.padEnd(26)} ${res.url}`);
  }
})();
