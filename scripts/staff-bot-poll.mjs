/**
 * LOCAL DEV ONLY — run the staff bot without a public webhook.
 *
 * Long-polls Telegram getUpdates and forwards each update to the real route
 * (http://localhost:3000/api/telegram/staff) with the secret header, so it
 * exercises the exact production code path (no logic duplication). Use this to
 * test before the Vercel webhook is live.
 *
 * Prereq: `next dev` running on port 3000, token+secret in .env.local.
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\staff-bot-poll.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envTxt = readFileSync(join(root, ".env.local"), "utf8");
const env = (n) => (envTxt.match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] ?? "").trim();

const TOKEN = env("TELEGRAM_STAFF_BOT_TOKEN");
const SECRET = env("TELEGRAM_WEBHOOK_SECRET");
const ROUTE = process.env.ROUTE_URL || "http://localhost:3000/api/telegram/staff";
if (!TOKEN) { console.error("no TELEGRAM_STAFF_BOT_TOKEN"); process.exit(1); }

const tg = (m, b) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${m}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b ?? {}),
  }).then((r) => r.json());

console.log("Polling as staff bot → forwarding to", ROUTE, "\nCtrl+C to stop.\n");
let offset = 0;
for (;;) {
  let res;
  try {
    res = await tg("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
  } catch (e) { console.error("getUpdates error:", String(e)); await new Promise((r) => setTimeout(r, 2000)); continue; }
  for (const u of res.result ?? []) {
    offset = u.update_id + 1;
    const f = u.message?.from ?? u.callback_query?.from;
    if (f) console.log(`update from ${f.id} (${f.first_name ?? ""} @${f.username ?? "-"}):`, u.message?.text ?? u.callback_query?.data ?? "");
    try {
      const r = await fetch(ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": SECRET },
        body: JSON.stringify(u),
      });
      if (!r.ok) console.error("  route responded", r.status);
    } catch (e) { console.error("  forward error:", String(e).slice(0, 120)); }
  }
}
