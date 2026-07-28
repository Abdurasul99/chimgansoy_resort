/**
 * Exit 1 if the bot is already served by a production webhook (so local dev
 * tooling should not start), exit 0 if the webhook is free.
 * Used by scripts/start-staff-bot.bat.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envTxt = readFileSync(join(root, ".env.local"), "utf8");
const TOKEN = (envTxt.match(/^TELEGRAM_STAFF_BOT_TOKEN=(.*)$/m)?.[1] ?? "").trim();
if (!TOKEN) {
  console.error("TELEGRAM_STAFF_BOT_TOKEN не задан в .env.local");
  process.exit(1);
}

try {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`);
  const json = await res.json();
  const url = json?.result?.url;
  if (url) {
    console.log("");
    console.log("✅ Бот УЖЕ работает 24/7 на боевом сервере:");
    console.log(`   ${url}`);
    console.log("");
    console.log("   Просто пишите боту в Telegram — он отвечает из облака.");
    console.log("   Ваш компьютер для этого не нужен.");
    process.exit(1);
  }
  console.log("Боевой webhook не настроен — можно запускать локально.");
  process.exit(0);
} catch (e) {
  console.error("Не удалось проверить webhook:", String(e).slice(0, 120));
  process.exit(1);
}
