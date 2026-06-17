"use server";

export type ContactResult = { ok: true } | { ok: false; error: string };

type DeliveryStatus = "sent" | "skipped" | "failed";

const MESSAGES = {
  ru: {
    nameRequired: "Укажите имя",
    phoneRequired: "Укажите номер телефона",
    phoneInvalid: "Проверьте номер телефона",
    dateInvalid: "Дата выезда должна быть позже даты заезда",
    deliveryFailed:
      "Не удалось отправить заявку. Пожалуйста, позвоните нам: +998 70 176 00 11",
  },
  uz: {
    nameRequired: "Ismingizni kiriting",
    phoneRequired: "Telefon raqamingizni kiriting",
    phoneInvalid: "Telefon raqamini tekshiring",
    dateInvalid: "Ketish sanasi kelish sanasidan keyin bo'lishi kerak",
    deliveryFailed:
      "Arizani yuborib bo'lmadi. Iltimos, bizga qo'ng'iroq qiling: +998 70 176 00 11",
  },
  en: {
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter your phone number",
    phoneInvalid: "Please check your phone number",
    dateInvalid: "Check-out must be after check-in",
    deliveryFailed:
      "We couldn't send your request. Please call us: +998 70 176 00 11",
  },
} as const;

type Lang = keyof typeof MESSAGES;

async function sendTelegram(text: string): Promise<DeliveryStatus> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return "skipped";

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[contact] Telegram send failed: ${res.status} ${body}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[contact] Telegram send threw:", err);
    return "failed";
  }
}

async function sendEmail(
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
      console.error(`[contact] Resend send failed: ${res.status} ${body}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[contact] Resend send threw:", err);
    return "failed";
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
  // Honeypot: a hidden field no human fills. If a bot fills it, silently
  // pretend success and drop the submission (don't tip off the bot).
  const honeypot = (formData.get("company") as string | null)?.trim() ?? "";
  if (honeypot) return { ok: true };

  const localeRaw = (formData.get("locale") as string | null)?.trim() ?? "";
  const lang: Lang = localeRaw === "uz" || localeRaw === "en" ? localeRaw : "ru";
  const m = MESSAGES[lang];

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const checkin = (formData.get("checkin") as string | null)?.trim() ?? "";
  const checkout = (formData.get("checkout") as string | null)?.trim() ?? "";
  const guests = (formData.get("guests") as string | null)?.trim() ?? "";
  const room = (formData.get("room") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const formTypeRaw = (formData.get("formType") as string | null)?.trim() ?? "";
  const formType: "booking" | "inquiry" = formTypeRaw === "inquiry" ? "inquiry" : "booking";

  // Validation
  if (!name) return { ok: false, error: m.nameRequired };
  if (!phone) return { ok: false, error: m.phoneRequired };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: m.phoneInvalid };
  // ISO dates (YYYY-MM-DD) compare correctly as strings.
  if (checkin && checkout && checkout <= checkin) {
    return { ok: false, error: m.dateInvalid };
  }

  const dates = checkin && checkout ? `${checkin} → ${checkout}` : checkin || checkout || "";

  // Route to the right inbox: bookings -> reservations@, general questions -> info@.
  // Fall back to the legacy BOOKING_EMAIL_TO for backwards compatibility.
  const emailTo =
    formType === "booking"
      ? process.env.RESERVATIONS_EMAIL_TO ?? process.env.BOOKING_EMAIL_TO
      : process.env.INFO_EMAIL_TO ?? process.env.BOOKING_EMAIL_TO;

  const tgHeader = formType === "booking"
    ? "🏡 <b>Новая бронь — CHIMGAN DARBAZA</b>"
    : "💬 <b>Новый вопрос — CHIMGAN DARBAZA</b>";

  const tgText = [
    tgHeader,
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
    <h1 style="margin:6px 0 0;font-size:22px;font-weight:600;">${formType === "booking" ? "Новая заявка на бронирование" : "Новый вопрос"}</h1>
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

  const subjectPrefix = formType === "booking" ? "Бронь" : "Вопрос";
  const subjectParts = [
    subjectPrefix,
    name,
    dates ? `(${dates})` : null,
    room ? `· ${room}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const [tgStatus, emailStatus] = await Promise.all([
    sendTelegram(tgText),
    sendEmail(subjectParts, emailHtml, emailTo, email || undefined),
  ]);

  const delivered = tgStatus === "sent" || emailStatus === "sent";

  console.log(
    `[contact:${formType}] tg=${tgStatus} email=${emailStatus} → ${emailTo || "no-email"} | name: ${name}, phone: ${phone}, dates: ${dates || "—"}, guests: ${guests || "—"}, room: ${room || "—"}`,
  );

  // If NOTHING reached us, do not show a fake success — tell the guest to call.
  if (!delivered) {
    console.error(
      `[contact:${formType}] DELIVERY FAILED — lead not received. tg=${tgStatus} email=${emailStatus}. Check TELEGRAM_*/RESEND_* env vars.`,
    );
    return { ok: false, error: m.deliveryFailed };
  }

  return { ok: true };
}
