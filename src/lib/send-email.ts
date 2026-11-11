export type DeliveryStatus = "sent" | "skipped" | "failed";

/**
 * Письмо через Resend HTTP API (без SDK).
 *
 * Жило внутри app/actions/contact.ts. Партнёрской форме нужно то же самое, а
 * экспортировать функцию из файла "use server" нельзя: каждый экспорт там —
 * публичная серверная экшен-точка, и чужой мог бы слать письма от имени сайта.
 * Поэтому — обычный серверный модуль.
 */
export async function sendEmail(
  subject: string,
  html: string,
  toRaw: string | undefined,
  replyTo?: string,
): Promise<DeliveryStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  if (!apiKey || !from || !toRaw) return "skipped";

  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return "skipped";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend send failed: ${res.status} ${body}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[email] Resend send threw:", err);
    return "failed";
  }
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
