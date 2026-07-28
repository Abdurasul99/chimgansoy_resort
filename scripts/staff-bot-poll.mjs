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

// Never let a stray rejection kill the long-poll loop.
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", String(e).slice(0, 200)));
process.on("uncaughtException", (e) => console.error("uncaughtException:", String(e).slice(0, 200)));

const tg = (m, b) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${m}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b ?? {}),
  }).then((r) => r.json());

// SAFETY: production runs on a webhook (chimgandarbaza.uz). getUpdates and a
// webhook are mutually exclusive — polling here would 409-loop, and deleting
// the webhook to "fix" that would take the LIVE bot offline. Refuse instead.
const hook = await tg("getWebhookInfo");
if (hook?.result?.url) {
  console.error(
    [
      "",
      "⛔ Бот уже работает на боевом сервере (webhook):",
      `   ${hook.result.url}`,
      "",
      "Локальный поллер сейчас НЕ нужен и работать не будет.",
      "Просто пишите боту в Telegram — он отвечает из облака 24/7.",
      "",
      "Локальная отладка (ТОЛЬКО если действительно нужно) выключит бота у гостей:",
      "   node scripts/telegram-setup.mjs delete      # ⚠️ бот перестанет отвечать",
      "   ... отладка ...",
      `   node scripts/telegram-setup.mjs set ${hook.result.url}   # вернуть обратно`,
      "",
    ].join("\n"),
  );
  process.exit(1);
}

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
