/**
 * Register / inspect / remove the STAFF bot's Telegram webhook.
 *
 * Reads TELEGRAM_STAFF_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and (optionally)
 * STAFF_BOT_WEBHOOK_URL from .env.local. No dependencies.
 *
 * Usage (Windows / PowerShell):
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs set     https://chimgandarbaza.uz/api/telegram/staff
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs info
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs delete
 *   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs me       # getMe — verify token
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(name) {
  try {
    const txt = readFileSync(join(root, ".env.local"), "utf8");
    const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^"(.*)"$/, "$1") : (process.env[name] ?? "");
  } catch {
    return process.env[name] ?? "";
  }
}

const TOKEN = env("TELEGRAM_STAFF_BOT_TOKEN");
const SECRET = env("TELEGRAM_WEBHOOK_SECRET");
if (!TOKEN) {
  console.error("✗ TELEGRAM_STAFF_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const [cmd, arg] = process.argv.slice(2);

switch (cmd) {
  case "set": {
    const url = arg || env("STAFF_BOT_WEBHOOK_URL");
    if (!url) {
      console.error("✗ Provide the webhook URL: ... set https://<host>/api/telegram/staff");
      process.exit(1);
    }
    const res = await api("setWebhook", {
      url,
      secret_token: SECRET || undefined,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    console.log(res.ok ? `✓ Webhook set → ${url}` : `✗ ${res.description}`);
    break;
  }
  case "info": {
    const res = await api("getWebhookInfo");
    console.log(JSON.stringify(res.result ?? res, null, 2));
    break;
  }
  case "delete": {
    const res = await api("deleteWebhook", { drop_pending_updates: false });
    console.log(res.ok ? "✓ Webhook removed" : `✗ ${res.description}`);
    break;
  }
  case "me": {
    const res = await api("getMe");
    console.log(JSON.stringify(res.result ?? res, null, 2));
    break;
  }
  case "updates": {
    // Find who has messaged the bot (to fill TELEGRAM_STAFF_IDS).
    // Only works while NO webhook is set (webhook + getUpdates are exclusive).
    const res = await api("getUpdates", {});
    const seen = new Map();
    for (const u of res.result ?? []) {
      const f = u.message?.from ?? u.callback_query?.from;
      if (f) seen.set(f.id, `${f.first_name ?? ""} ${f.last_name ?? ""} @${f.username ?? "-"}`.trim());
    }
    if (seen.size === 0) console.log("No messages yet. Send any message to the bot, then re-run.");
    for (const [id, name] of seen) console.log(`${id}\t${name}`);
    break;
  }
  case "meta": {
    // Bot profile polish: command list + descriptions (shown before /start).
    const commands = [
      { command: "start", description: "☰ Главное меню" },
      { command: "ai", description: "🤖 ИИ-помощник — задать вопрос" },
      { command: "daty", description: "🗓 Свободные даты и цены" },
      { command: "ceny", description: "🏷 Цены дневного отдыха" },
      { command: "pogoda", description: "🌤 Погода в Чимгане" },
      { command: "foto", description: "📸 Фотографии комплекса" },
      { command: "bron", description: "🌐 Онлайн-бронирование" },
      { command: "contacts", description: "📞 Контакты и как добраться" },
    ];
    const r1 = await api("setMyCommands", { commands });
    const r2 = await api("setMyShortDescription", {
      short_description: "ИИ-помощник CHIMGAN DARBAZA: цены, свободные даты, бронирование 🏔",
    });
    const r3 = await api("setMyDescription", {
      description:
        "Горный отдых в 45 минутах от Ташкента: топчаны и мангал на день, глэмпинги и шале с ночёвкой, бассейн. 1700 м над уровнем моря 🏔\n\nИИ-помощник ответит на любой вопрос, покажет живые цены и свободные даты, поможет забронировать онлайн.",
    });
    console.log("setMyCommands:", r1.ok, "| shortDescription:", r2.ok, "| description:", r3.ok);
    break;
  }
  default:
    console.log("Commands: set <url> | info | delete | me | updates | meta");
}
