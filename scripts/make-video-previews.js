/**
 * Builds the lightweight rail previews for the tubing page.
 *
 * The five published clips are 720x1280 H.264 and weigh 37 MB together, of
 * which one is 15.6 MB. The rail renders each card about 280px wide, so those
 * files are ~2.5x oversampled for the place they are shown — and the reason the
 * rail only ever autoplayed a single clip was that five of them at once was an
 * unacceptable download. That made four of the five cards look broken: frozen
 * posters that never move.
 *
 * So the rail gets its own encode — 400px wide, no audio track (the rail is
 * muted by definition), tuned for a small moving thumbnail — and the full clip
 * is fetched only when a guest taps a card open. Previews come out around
 * 1 MB each, so the whole rail costs less than one of the originals did.
 *
 * Run with:
 *   & 'C:\Program Files\nodejs\npm.cmd' install --no-save ffmpeg-static
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\make-video-previews.js
 *
 * ffmpeg-static is installed with --no-save on purpose: it is a ~40 MB binary
 * needed for one manual step, and putting it in package.json would download it
 * on every CI install and every Vercel build for the rest of the site's life.
 * It reads BLOB_READ_WRITE_TOKEN from .env.local and uploads the results.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const { put } = require("@vercel/blob");

const BASE = "https://rxblzbvichchznop.public.blob.vercel-storage.com/video";
const KEYS = ["tubing-1", "tubing-2", "tubing-3", "tubing-4", "tubing-5"];
const WORK = path.join(os.tmpdir(), "cg-video-previews");

// The token lives in .env.local, which is gitignored. No dotenv dependency for
// a one-off script — the file is four lines of KEY=value.
function loadEnv() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function download(url, dst) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  fs.writeFileSync(dst, Buffer.from(await res.arrayBuffer()));
}

(async () => {
  loadEnv();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN missing — cannot upload");
    process.exit(1);
  }
  fs.mkdirSync(WORK, { recursive: true });

  for (const key of KEYS) {
    const src = path.join(WORK, `${key}.mp4`);
    const out = path.join(WORK, `${key}-preview.mp4`);

    if (!fs.existsSync(src)) {
      process.stdout.write(`${key}: downloading… `);
      await download(`${BASE}/${key}.mp4`, src);
      console.log(`${Math.round(fs.statSync(src).size / 1048576)} MB`);
    }

    execFileSync(
      ffmpeg,
      [
        "-y",
        "-i", src,
        // 400px wide keeps a 280px card sharp on a 2x screen; -2 keeps the
        // height even, which H.264 requires.
        "-vf", "scale=400:-2",
        "-c:v", "libx264",
        "-profile:v", "main",
        "-crf", "30",
        "-preset", "slow",
        "-an", // the rail is always muted; sound only matters full screen
        "-movflags", "+faststart",
        out,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    const kb = Math.round(fs.statSync(out).size / 1024);
    const blob = await put(`video/${key}-preview.mp4`, fs.readFileSync(out), {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`${key}-preview.mp4  ${String(kb).padStart(5)} KB  ->  ${blob.url}`);
  }
})().catch((e) => {
  console.error(e.stderr ? e.stderr.toString().slice(-1500) : e);
  process.exit(1);
});
