"use server";

import { contacts } from "@/content/contacts";
import { poolPricing } from "@/content/pricing";
import { esc, sendMessage } from "@/lib/telegram";
import { saveRequest } from "@/lib/requests-store";

export type PoolResult = { ok: true } | { ok: false; error: string };

const MESSAGES = {
  ru: {
    nameRequired: "Укажите имя",
    phoneRequired: "Укажите номер телефона",
    phoneInvalid: "Проверьте номер телефона",
    dateRequired: "Выберите дату визита",
    datePast: "Дата уже прошла — выберите другую",
    failed: `Не удалось отправить заявку. Позвоните нам: ${contacts.phone}`,
  },
  uz: {
    nameRequired: "Ismingizni kiriting",
    phoneRequired: "Telefon raqamingizni kiriting",
    phoneInvalid: "Telefon raqamini tekshiring",
    dateRequired: "Tashrif sanasini tanlang",
    datePast: "Bu sana o'tib ketgan — boshqasini tanlang",
    failed: `Arizani yuborib bo'lmadi. Bizga qo'ng'iroq qiling: ${contacts.phone}`,
  },
  en: {
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter your phone number",
    phoneInvalid: "Please check your phone number",
    dateRequired: "Please pick a visit date",
    datePast: "That date has passed — please pick another",
    failed: `We couldn't send your request. Please call us: ${contacts.phone}`,
  },
} as const;

type Lang = keyof typeof MESSAGES;

/** Asia/Tashkent is UTC+5 with no DST, so "today" is a fixed offset away. */
function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

/**
 * Friday, Saturday and Sunday carry the weekend tariff — the operator's poster
 * reads ПЯТНИЦА–ВОСКРЕСЕНЬЕ. Public holidays are weekend-priced too, but there
 * is no holiday calendar here, so a weekday holiday quotes low and the
 * administrator corrects it when confirming.
 */
function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 5 || day === 6;
}

function money(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Normalises whatever the guest typed into a number Telegram will recognise.
 *
 * Telegram only turns a phone into a tappable "call" when it reads as an
 * international number, so "90 000 00 00" or "+998 90 000-00-00" have to be
 * flattened to +998900000000 first. Uzbek numbers arrive in several shapes:
 * with +998, with a bare 998, or as the 9 national digits.
 */
function telLink(raw: string): { display: string } {
  const digits = raw.replace(/\D/g, "");
  let intl = "";
  if (digits.length === 12 && digits.startsWith("998")) intl = digits;
  else if (digits.length === 9) intl = `998${digits}`;
  else if (digits.length > 9 && digits.length <= 15) intl = digits;

  // Nothing recognisable — show it back exactly as typed rather than guess.
  if (!intl) return { display: raw };
  return { display: `+${intl}` };
}

/**
 * Where pool leads land in Telegram.
 *
 * TELEGRAM_ADMIN_CHAT_ID is the intended name; TELEGRAM_STAFF_IDS is accepted
 * because it already holds the operator's id from the previous staff bot. Both
 * take a comma-separated list, so a whole duty team can be notified.
 */
function adminChatIds(): string[] {
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
      console.error(`[pool] Resend failed: ${res.status} ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[pool] Resend threw:", err);
    return false;
  }
}

/**
 * Pool day-pass request.
 *
 * Telegram is the primary channel — the operator watches the bot, and a pool
 * visit is usually booked for the same or next day, so e-mail alone is too slow.
 * The e-mail copy is a safety net, and the guest is only told "accepted" if at
 * least one channel actually delivered.
 */
export async function submitPoolRequest(formData: FormData): Promise<PoolResult> {
  // Honeypot — a field no human sees. Bots that fill it get a silent success.
  if (((formData.get("company") as string | null) ?? "").trim()) return { ok: true };

  const localeRaw = ((formData.get("locale") as string | null) ?? "").trim();
  const lang: Lang = localeRaw === "uz" || localeRaw === "en" ? localeRaw : "ru";
  const m = MESSAGES[lang];

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const phone = ((formData.get("phone") as string | null) ?? "").trim();
  const date = ((formData.get("date") as string | null) ?? "").trim();
  const guestsRaw = ((formData.get("guests") as string | null) ?? "").trim();
  const message = ((formData.get("message") as string | null) ?? "").trim();

  if (!name) return { ok: false, error: m.nameRequired };
  if (!phone) return { ok: false, error: m.phoneRequired };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: m.phoneInvalid };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: m.dateRequired };
  if (date < todayTashkent()) return { ok: false, error: m.datePast };

  // No upper cap — the pool takes groups of any size; 200 is only a sanity
  // bound so a typo can't produce a nonsense total.
  const num = (v: string, max = 200) => Math.min(Math.max(parseInt(v, 10) || 0, 0), max);
  const adults = Math.max(num(guestsRaw), 1);
  const kids = num(((formData.get("kids") as string | null) ?? "").trim());
  const toddlers = num(((formData.get("toddlers") as string | null) ?? "").trim());
  const towels = num(((formData.get("towels") as string | null) ?? "").trim(), 50);
  const bungalowRaw = ((formData.get("bungalow") as string | null) ?? "none").trim();

  const weekend = isWeekend(date);
  const tariff = weekend ? "Пт–Вс" : "Пн–Чт";
  const adultRate = weekend ? poolPricing.adult.weekend : poolPricing.adult.weekday;
  const childRate = weekend ? poolPricing.child.weekend : poolPricing.child.weekday;

  const bungalowPrice =
    bungalowRaw === "b4" ? poolPricing.extras.bungalow4
    : bungalowRaw === "b10" ? poolPricing.extras.bungalow10
    : 0;
  const bungalowLabel =
    bungalowRaw === "b4" ? "Бунгало до 4 чел."
    : bungalowRaw === "b10" ? "Бунгало до 10 чел."
    : null;

  const towelsPrice = towels * poolPricing.extras.towel;
  const total = adults * adultRate + kids * childRate + towelsPrice + bungalowPrice;

  const tel = telLink(phone);

  // Archiving runs alongside delivery rather than before it, so the guest never
  // waits on the store. It is awaited before the action returns, so the write
  // can't be cut short by the function ending. Failures are swallowed inside
  // the store — an unarchived request that still reaches the operator beats a
  // failed submission.
  const archived = saveRequest({
    service: "pool",
    date,
    name,
    phone: tel.display,
    adults,
    kids,
    toddlers,
    extras: [
      ...(towels ? [`полотенца ×${towels}`] : []),
      ...(bungalowLabel ? [bungalowLabel] : []),
    ],
    total,
    tariff,
    message: message || undefined,
    locale: lang,
  });

  const lines = [
    "<b>🏊 Заявка на бассейн</b>",
    "",
    `<b>Имя:</b> ${esc(name)}`,
    // Bare international number on its own line, deliberately NOT wrapped in a
    // link and not followed by anything.
    //
    // There is no way to put a dial link in a Telegram message: <a href> in
    // HTML mode accepts only http(s) and tg://, and inline keyboard buttons
    // accept only http(s). tel: is rejected in both. What DOES work is a plain
    // international number — Telegram recognises it and tapping opens the call
    // menu. Anything appended to that line (a dash, a note) can break the
    // detection, so the line ends with the number.
    `📞 <b>Телефон:</b> ${esc(tel.display)}`,
    `<b>Дата:</b> ${esc(date)} · тариф ${tariff}`,
    "",
    `<b>Взрослые и дети 15+:</b> ${adults} × ${money(adultRate)} = ${money(adults * adultRate)} сум`,
    ...(kids ? [`<b>Дети 5–15:</b> ${kids} × ${money(childRate)} = ${money(kids * childRate)} сум`] : []),
    ...(toddlers ? [`<b>Дети до 5:</b> ${toddlers} — бесплатно`] : []),
    ...(towels ? [`<b>Полотенца:</b> ${towels} × ${money(poolPricing.extras.towel)} = ${money(towelsPrice)} сум`] : []),
    ...(bungalowLabel ? [`<b>${bungalowLabel}:</b> ${money(bungalowPrice)} сум`] : []),
    "",
    `<b>ИТОГО: ${money(total)} сум</b>`,
    ...(message ? ["", `<b>Комментарий:</b> ${esc(message)}`] : []),
    "",
    `<i>Заявка с сайта chimgandarbaza.uz · язык гостя: ${lang}</i>`,
  ].join("\n");


  const chatIds = adminChatIds();
  if (chatIds.length === 0) {
    console.error("[pool] no TELEGRAM_ADMIN_CHAT_ID / TELEGRAM_STAFF_IDS set — Telegram skipped");
  }
  const [results] = await Promise.all([
    Promise.all(chatIds.map((id) => sendMessage(id, lines))),
    archived,
  ]);
  const telegramOk = results.some((r) => r !== null);

  const emailOk = await sendEmailCopy(
    `Бассейн · ${name} · ${date} · ${adults + kids} гост.`,
    `<div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="color:#1a4d2e">🏊 Заявка на бассейн</h2>
      <p><b>Имя:</b> ${esc(name)}<br>
         <b>Телефон:</b> <a href="tel:${esc(tel.display)}">${esc(tel.display)}</a><br>
         <b>Дата:</b> ${esc(date)} · тариф ${tariff}<br>
         <b>Гостей:</b> ${adults} взр.${kids ? " + " + kids + " дет. 5–15" : ""}${toddlers ? " + " + toddlers + " до 5" : ""}<br>
         ${towels ? "<b>Полотенца:</b> " + towels + "<br>" : ""}${bungalowLabel ? "<b>" + bungalowLabel + "</b><br>" : ""}
         <b>К оплате:</b> ${money(total)} сум</p>
      ${message ? `<p><b>Комментарий:</b> ${esc(message)}</p>` : ""}
      <p style="color:#7a7a73;font-size:12px">Отправлено с chimgandarbaza.uz</p>
    </div>`,
  );

  console.log(
    `[pool] telegram=${telegramOk ? "sent" : "failed"} (${chatIds.length} chat(s)) email=${emailOk ? "sent" : "skipped/failed"} | ${name}, ${phone}, ${date}, ${adults}+${kids} guests, total ${total}`,
  );

  // Never show a fake success: if nothing left the building, tell them to call.
  if (!telegramOk && !emailOk) return { ok: false, error: m.failed };

  return { ok: true };
}
