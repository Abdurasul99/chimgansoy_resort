import type { NextRequest } from "next/server";
import { handleStaffUpdate } from "@/lib/staff-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The AI path (Groq tool loop + Exely calls) can take 10-20s.
export const maxDuration = 30;

/**
 * Telegram webhook for the STAFF bot.
 *
 * Telegram POSTs each update here. We verify the secret token, check the
 * sender against the staff allowlist, and ALWAYS answer 200 quickly — if we
 * returned an error, Telegram would retry the same update indefinitely.
 *
 * Register the webhook once (see scripts/telegram-setup.mjs):
 *   setWebhook url=https://chimgandarbaza.uz/api/telegram/staff
 *              secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */

function allowedIds(): Set<number> {
  const raw = process.env.TELEGRAM_STAFF_IDS ?? "";
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
}

export async function POST(req: NextRequest) {
  // 1. Verify the shared secret Telegram echoes back on every call.
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

  const ids = allowedIds();
  const authorized = (userId: number) => ids.has(userId);

  // Never let a handler error bubble to a non-200 (Telegram would retry).
  try {
    await handleStaffUpdate(update as Parameters<typeof handleStaffUpdate>[0], authorized);
  } catch (e) {
    console.error("[telegram/staff] handler error:", e);
  }

  return Response.json({ ok: true });
}

// A GET is handy for a quick "is the route deployed?" check in the browser.
export async function GET() {
  const configured =
    !!process.env.TELEGRAM_STAFF_BOT_TOKEN &&
    !!process.env.EXELY_API_KEY &&
    allowedIds().size > 0;
  return Response.json({ ok: true, service: "chimgandarbaza staff bot", configured });
}
