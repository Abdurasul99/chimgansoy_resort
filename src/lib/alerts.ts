import { lastTelegramError } from "@/lib/telegram";

/**
 * Тревога о сбое с заявками — ТОЛЬКО письмом.
 *
 * 11–19.11.2026 группа «Chimgan Darbaza - Заявки» сменила ID, и 32 заявки
 * гостей неделю не доходили: гость видел «Заявка принята», а узнали случайно.
 * Если группа не приняла заявку, она уходит письмом целиком, с причиной.
 *
 * В Telegram тревоги не идут вовсе (владелец, 20.11.2026): ни в группу, ни в
 * личные чаты, ни партнёрским ботом.
 *
 * Куда — ALERT_EMAIL_TO (адреса через запятую). Не задан — тревога только в
 * журнал. Пока домен chimgandarbaza.uz не подтверждён в Resend, письмо с
 * onboarding@resend.dev Resend доставляет только владельцу аккаунта
 * (manager@chimgandarbaza.uz), остальным отвечает 403. Тогда то же письмо
 * уходит на почту заявок (RESERVATIONS_EMAIL_TO); тема всегда начинается с
 * ALERT_TAG — по ней фильтр в ящике пересылает его дальше. После
 * подтверждения домена письма пойдут прямо на ALERT_EMAIL_TO, без правок кода.
 *
 * Сторож на сервере (scripts/monitor/chimgan-monitor.py) шлёт так же и туда же,
 * а строку журнала UNDELIVERED_MARK превращает в отдельное письмо.
 */
export const ALERT_TAG = "[Сбой заявок]";
/** Сторож ищет эту строку в журнале — менять только вместе с chimgan-monitor.py. */
export const UNDELIVERED_MARK = "письмо-тревога: НЕ ушло";
const LIMIT = 20_000; // заявку-простыню режем, чтобы письмо не отбросили

export async function alertDeliveryFailure(form: string, requestHtml: string): Promise<boolean> {
  const reason = lastTelegramError() || "нет ответа";
  const body = requestHtml.length > LIMIT ? `${requestHtml.slice(0, LIMIT)}…` : requestHtml;
  const ok = await alert(
    `заявка не дошла в группу Telegram — ${form}`,
    [
      "🚨 <b>Заявка с сайта НЕ дошла в группу заявок</b>",
      `Форма: ${escapeHtml(form)}`,
      `Ответ Telegram: ${escapeHtml(reason)}`,
      "",
      "Заявка целиком — обработайте её отсюда:",
      "",
      body,
    ].join("\n"),
  );
  // Одна строка на заявку, без имени и телефона гостя: по ней сторож видит,
  // дошла ли тревога. Форма и заявка — только в самом письме.
  console.error(`[alert] заявка не дошла в группу заявок — ${ok ? "письмо-тревога: ушло" : UNDELIVERED_MARK}`);
  return ok;
}

/**
 * Письмо о сбое. `html` — в разметке Telegram (переносы строк «\n», <b>, <code>).
 * Дошло ли хоть на один адрес.
 */
export async function alert(subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.BOOKING_EMAIL_FROM?.trim();
  const direct = addresses(process.env.ALERT_EMAIL_TO);
  if (direct.length === 0) {
    console.error("[alert] ALERT_EMAIL_TO не задан — тревогу некуда отправить (заявка сохранена в архиве)");
    return false;
  }
  if (!apiKey || !from) {
    console.error("[alert] RESEND_API_KEY / BOOKING_EMAIL_FROM не заданы — тревогу не отправить");
    return false;
  }
  const mail = {
    from: from.includes("<") ? from : `CHIMGAN DARBAZA <${from}>`,
    subject: `${ALERT_TAG} ${subject}`.slice(0, 200),
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${html}</div>`,
  };
  if (await post(apiKey, { ...mail, to: direct }, "ALERT_EMAIL_TO")) return true;

  // Resend пока не пускает на чужие адреса — в ящик заявок, оттуда пересылка.
  const fallback = addresses(process.env.RESERVATIONS_EMAIL_TO ?? process.env.BOOKING_EMAIL_TO).filter(
    (a) => !direct.includes(a),
  );
  if (fallback.length > 0 && (await post(apiKey, { ...mail, to: fallback }, "почта заявок"))) return true;

  console.error("[alert] тревогу не удалось отправить ни на одну почту");
  return false;
}

async function post(apiKey: string, payload: Record<string, unknown>, label: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return true;
    const text = await res.text().catch(() => "");
    console.error(`[alert] ${label}: письмо не принято — ${res.status} ${text.slice(0, 200)}`);
  } catch (e) {
    console.error(`[alert] ${label}: почта недоступна —`, e instanceof Error ? e.message : e);
  }
  return false;
}

function addresses(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
