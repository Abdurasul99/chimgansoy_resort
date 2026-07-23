import type { NextRequest } from "next/server";
import { handleGuestUpdate } from "@/lib/staff-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The AI path (Groq tool loop + booking-engine calls) can take 10-20s.
export const maxDuration = 30;

/**
 * Telegram webhook for the guest-facing bot (@chimgandarbaza_bot).
 *
 * The bot is PUBLIC — any Telegram user can talk to it (AI concierge, prices,
 * booking link, contacts). We verify the webhook secret and ALWAYS answer 200
 * quickly — if we returned an error, Telegram would retry the same update
 * indefinitely.
 *
 * Register the webhook once (see scripts/telegram-setup.mjs):
 *   setWebhook url=https://chimgandarbaza.uz/api/telegram/staff
 *              secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */

export async function POST(req: NextRequest) {
  // Verify the shared secret Telegram echoes back on every call.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) {
      return new Response("forbidden", { status: 403 });
    }
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return Response.json({ ok: true }); // ignore malformed bodies
  }

  // Never let a handler error bubble to a non-200 (Telegram would retry).
  try {
    await handleGuestUpdate(update as Parameters<typeof handleGuestUpdate>[0]);
  } catch (e) {
    console.error("[telegram/bot] handler error:", e);
  }

  return Response.json({ ok: true });
}

// A GET is handy for a quick "is the route deployed?" check in the browser.
export async function GET() {
  const configured = !!process.env.TELEGRAM_STAFF_BOT_TOKEN && !!process.env.GROQ_API_KEY;
  return Response.json({ ok: true, service: "chimgandarbaza guest bot", configured });
}
