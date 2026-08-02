/**
 * Shared delivery for every day-visit request form (pool, topchan, tubing).
 *
 * Each product formats its own message — a topchan booking and a tubing pass
 * have nothing in common to say — but they all reach the operator the same way:
 * Telegram first, e-mail as a copy, and the archive so the request survives
 * both. Keeping that in one place means a fix to the delivery path (a new chat
 * id, a timeout, a retry) applies to all three instead of two of them.
 */

import { sendMessage } from "@/lib/telegram";
import { saveRequest, type StoredRequest } from "@/lib/requests-store";
import { isWeekendISO, money } from "@/lib/tariff";

// Re-exported so a server action needs one import for the whole request path;
// the rule itself lives in lib/tariff.ts, which the client forms share.
export { money };
export const isWeekend = isWeekendISO;

/** Asia/Tashkent is UTC+5 with no DST, so "today" is a fixed offset away. */
export function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

/**
 * Normalises whatever the guest typed into a number Telegram will dial.
 *
 * Telegram only offers a call when the text reads as one international number,
 * so "90 000 00 00" has to be flattened to +998900000000. Uzbek numbers arrive
 * with +998, with a bare 998, or as the nine national digits. Anything
 * unrecognisable is returned untouched — a wrong number is worse than an
 * unlinked one.
 */
export function dialable(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length > 9 && digits.length <= 15) return `+${digits}`;
  return raw;
}

/**
 * Where day-visit leads land in Telegram.
 *
 * TELEGRAM_ADMIN_CHAT_ID is the intended name; TELEGRAM_STAFF_IDS is accepted
 * because it already holds the operator's id from the previous staff bot. Both
 * take a comma-separated list, so a whole duty team can be notified.
 */
export function adminChatIds(): string[] {
  const raw =
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_STAFF_IDS?.trim() || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendEmailCopy(subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  const toRaw = process.env.RESERVATIONS_EMAIL_TO ?? process.env.BOOKING_EMAIL_TO;
  if (!apiKey || !from || !toRaw) return false;

  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[request] Resend failed: ${res.status} ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[request] Resend threw:", err);
    return false;
  }
}

/**
 * Sends one request everywhere it needs to go.
 *
 * Telegram is the primary channel — the operator watches the bot, and a day
 * visit is usually booked for the same or the next day, so e-mail alone is too
 * slow. All three legs run together so the guest never waits on the slowest,
 * and all three are awaited so the serverless function cannot end mid-write.
 *
 * Returns whether each channel delivered. The caller decides what to tell the
 * guest — but it must never report success when both channels failed.
 */
export async function deliverRequest(opts: {
  telegramHtml: string;
  emailSubject: string;
  emailHtml: string;
  record: Omit<StoredRequest, "id" | "createdAt">;
}): Promise<{ telegramOk: boolean; emailOk: boolean }> {
  const chatIds = adminChatIds();
  if (chatIds.length === 0) {
    console.error("[request] no TELEGRAM_ADMIN_CHAT_ID / TELEGRAM_STAFF_IDS set — Telegram skipped");
  }

  const [sent, emailOk] = await Promise.all([
    Promise.all(chatIds.map((id) => sendMessage(id, opts.telegramHtml))),
    sendEmailCopy(opts.emailSubject, opts.emailHtml),
    // Archiving failures are swallowed inside the store: an unarchived request
    // that still reaches the operator beats a failed submission.
    saveRequest(opts.record),
  ]);

  return { telegramOk: sent.some((r) => r !== null), emailOk };
}
