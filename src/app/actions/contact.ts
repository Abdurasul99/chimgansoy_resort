"use server";

export type ContactResult = { ok: true } | { ok: false; error: string };

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // best-effort — never fail the form
  }
}

async function sendEmail(subject: string, html: string, replyTo?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  const toRaw = process.env.BOOKING_EMAIL_TO;
  if (!apiKey || !from || !toRaw) return;

  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return;

  try {
    await fetch("https://api.resend.com/emails", {
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
  } catch {
    // best-effort — never fail the form
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const checkin = (formData.get("checkin") as string | null)?.trim() ?? "";
  const checkout = (formData.get("checkout") as string | null)?.trim() ?? "";
  const guests = (formData.get("guests") as string | null)?.trim() ?? "";
  const room = (formData.get("room") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!name) return { ok: false, error: "Укажите имя" };
  if (!phone) return { ok: false, error: "Укажите номер телефона" };

  const dates = checkin && checkout ? `${checkin} → ${checkout}` : checkin || checkout || "";

  const tgText = [
    `📩 <b>Новая заявка — CHIMGAN DARBAZA</b>`,
    ``,
    `👤 <b>Имя:</b> ${name}`,
    `📞 <b>Телефон:</b> ${phone}`,
    email ? `✉️ <b>Email:</b> ${email}` : null,
    dates ? `📅 <b>Даты:</b> ${dates}` : null,
    guests ? `👥 <b>Гостей:</b> ${guests}` : null,
    room ? `🏡 <b>Номер:</b> ${room}` : null,
    message ? `💬 <b>Сообщение:</b> ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const rows: Array<[string, string]> = [
    ["Имя", name],
    ["Телефон", phone],
    ...(email ? [["Email", email] as [string, string]] : []),
    ...(dates ? [["Даты", dates] as [string, string]] : []),
    ...(guests ? [["Гостей", guests] as [string, string]] : []),
    ...(room ? [["Номер", room] as [string, string]] : []),
    ...(message ? [["Сообщение", message] as [string, string]] : []),
  ];

  const emailHtml = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a2418;">
  <div style="background:#1a4d2e;color:white;padding:24px 28px;border-radius:12px 12px 0 0;">
    <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;">CHIMGAN DARBAZA</p>
    <h1 style="margin:6px 0 0;font-size:22px;font-weight:600;">Новая заявка на бронирование</h1>
  </div>
  <div style="background:#fafaf7;padding:8px 28px 24px;border:1px solid #e8e6df;border-top:none;border-radius:0 0 12px 12px;">
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ece9e0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7a73;width:35%;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ece9e0;font-size:14px;color:#1a2418;font-weight:500;">${escapeHtml(v).replaceAll("\n", "<br>")}</td>
        </tr>`,
        )
        .join("")}
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#7a7a73;">
      Заявка отправлена с сайта <a href="https://chimgandarbaza.uz" style="color:#1a4d2e;">chimgandarbaza.uz</a>.
      Свяжитесь с гостем по телефону <a href="tel:${escapeHtml(phone)}" style="color:#1a4d2e;">${escapeHtml(phone)}</a>${email ? ` или почте <a href="mailto:${escapeHtml(email)}" style="color:#1a4d2e;">${escapeHtml(email)}</a>` : ""}.
    </p>
  </div>
</div>`.trim();

  const subjectParts = [
    `Новая заявка`,
    name,
    dates ? `(${dates})` : null,
    room ? `· ${room}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  await Promise.all([
    sendTelegram(tgText),
    sendEmail(subjectParts, emailHtml, email || undefined),
  ]);

  console.log(
    `[contact] New inquiry — name: ${name}, phone: ${phone}, email: ${email || "—"}, dates: ${dates || "—"}, guests: ${guests || "—"}, room: ${room || "—"}, message: ${message || "—"}`,
  );

  return { ok: true };
}
