import type { NextRequest } from "next/server";
import { botToken } from "@/lib/telegram";
import { handleRestaurantUpdate } from "@/lib/restaurant/bot-updates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook бота ресторана (@chimgandarbaza_restaurant_bot).
 *
 * Через него идут кнопки статусов заказов и столов, поэтому без секрета
 * запросы не принимаются вовсе: подделанное нажатие с номером группы
 * ресторана иначе меняло бы статусы заказов. Секрет — свой
 * TELEGRAM_RESTAURANT_WEBHOOK_SECRET или общий TELEGRAM_WEBHOOK_SECRET.
 * Ответ всегда 200: на ошибку Telegram присылал бы то же обновление снова.
 *
 * Регистрация (на сервере, токен берётся из файла переменных):
 *   TELEGRAM_BOT=restaurant node --env-file=/etc/chimgandarbaza.env \
 *     scripts/telegram-setup.mjs set https://chimgansoy.com/api/telegram/restaurant
 */

function secret(): string | null {
  return (
    process.env.TELEGRAM_RESTAURANT_WEBHOOK_SECRET?.trim() || process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null
  );
}

export async function POST(req: NextRequest) {
  const expected = secret();
  if (!expected || req.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return Response.json({ ok: true });
  }

  try {
    await handleRestaurantUpdate(update as Parameters<typeof handleRestaurantUpdate>[0]);
  } catch (e) {
    console.error("[restaurant-bot] обновление не обработано:", e);
  }
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ ok: true, service: "restaurant bot", configured: Boolean(botToken("restaurant") && secret()) });
}
