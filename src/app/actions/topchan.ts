"use server";

import { contacts } from "@/content/contacts";
import { parkingPricing, poolPricing, priceList, topchanPricing } from "@/content/pricing";
import { esc } from "@/lib/telegram";
import {
  deliverRequest,
  dialable,
  isWeekend,
  money,
  todayTashkent,
} from "@/lib/request-delivery";

export type TopchanResult = { ok: true } | { ok: false; error: string };

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

/** The cooking rentals, looked up by key so a price change lands in one place. */
function extraRate(key: string, weekend: boolean): number {
  const item = priceList.find((p) => p.key === key);
  if (!item) return 0;
  return weekend ? item.weekend : item.weekday;
}

/**
 * Topchan day booking.
 *
 * Priced per topchan, not per guest — the single most expensive mistake this
 * form could make. One seats up to eight, so the number of topchans is derived
 * from the party size rather than typed in, and a party of nine quietly becomes
 * two topchans instead of being told to book again.
 */
export async function submitTopchanRequest(formData: FormData): Promise<TopchanResult> {
  // Honeypot — a field no human sees. Bots that fill it get a silent success.
  if (((formData.get("company") as string | null) ?? "").trim()) return { ok: true };

  const localeRaw = ((formData.get("locale") as string | null) ?? "").trim();
  const lang: Lang = localeRaw === "uz" || localeRaw === "en" ? localeRaw : "ru";
  const m = MESSAGES[lang];

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const phone = ((formData.get("phone") as string | null) ?? "").trim();
  const date = ((formData.get("date") as string | null) ?? "").trim();
  const message = ((formData.get("message") as string | null) ?? "").trim();

  if (!name) return { ok: false, error: m.nameRequired };
  if (!phone) return { ok: false, error: m.phoneRequired };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: m.phoneInvalid };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: m.dateRequired };
  if (date < todayTashkent()) return { ok: false, error: m.datePast };

  // 240 = the whole property's thirty topchans at eight each; a sanity bound so
  // a typo can't produce a nonsense total, not a booking limit anyone will hit.
  const num = (v: string, max = 240) => Math.min(Math.max(parseInt(v, 10) || 0, 0), max);
  const guests = Math.max(num(((formData.get("guests") as string | null) ?? "").trim()), 1);
  const cars = num(((formData.get("cars") as string | null) ?? "").trim(), 60);
  const kazan = num(((formData.get("kazan") as string | null) ?? "").trim(), 30);
  const mangal = num(((formData.get("mangal") as string | null) ?? "").trim(), 30);
  const firewood = num(((formData.get("firewood") as string | null) ?? "").trim(), 50);
  const charcoal = num(((formData.get("charcoal") as string | null) ?? "").trim(), 50);
  const towels = num(((formData.get("towels") as string | null) ?? "").trim(), 50);
  // Pool upsell — the CMO's «Добавить доступ в бассейн». Charged per head at the
  // published pool tariff, so it has to know the age split.
  const poolAdults = num(((formData.get("poolAdults") as string | null) ?? "").trim());
  const poolKids = num(((formData.get("poolKids") as string | null) ?? "").trim());

  const weekend = isWeekend(date);
  const tariff = weekend ? "Пт–Вс" : "Пн–Чт";

  const topchans = Math.max(Math.ceil(guests / topchanPricing.capacity), 1);
  const rent = weekend ? topchanPricing.rent.weekend : topchanPricing.rent.weekday;
  const carRate = weekend ? parkingPricing.weekend : parkingPricing.weekday;

  const kazanRate = extraRate("kazan", weekend);
  const mangalRate = extraRate("mangal", weekend);
  const firewoodRate = extraRate("firewood", weekend);
  const charcoalRate = extraRate("charcoal", weekend);
  const poolAdultRate = weekend ? poolPricing.adult.weekend : poolPricing.adult.weekday;
  const poolKidRate = weekend ? poolPricing.child.weekend : poolPricing.child.weekday;

  const lines: { label: string; qty: number; rate: number }[] = [
    { label: `Топчан (до ${topchanPricing.capacity} чел.)`, qty: topchans, rate: rent },
    { label: "Въезд, 1 автомобиль", qty: cars, rate: carRate },
    { label: "Бассейн, взрослые и 15+", qty: poolAdults, rate: poolAdultRate },
    { label: "Бассейн, дети 5–15", qty: poolKids, rate: poolKidRate },
    { label: "Аренда казана", qty: kazan, rate: kazanRate },
    { label: "Аренда мангала", qty: mangal, rate: mangalRate },
    { label: "Дрова, пучок", qty: firewood, rate: firewoodRate },
    { label: "Уголь, кг", qty: charcoal, rate: charcoalRate },
    { label: "Полотенце", qty: towels, rate: poolPricing.extras.towel },
  ].filter((l) => l.qty > 0);

  const total = lines.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const tel = dialable(phone);

  const telegramHtml = [
    "<b>🛖 Заявка на топчан</b>",
    "",
    `<b>Имя:</b> ${esc(name)}`,
    // Bare international number on its own line: Telegram rejects tel: links in
    // both HTML and inline buttons, but recognises a plain number and offers to
    // call. Anything appended to this line can break that detection.
    `📞 <b>Телефон:</b> ${esc(tel)}`,
    `<b>Дата:</b> ${esc(date)} · тариф ${tariff}`,
    `<b>Гостей:</b> ${guests} · <b>топчанов:</b> ${topchans}`,
    "",
    ...lines.map(
      (l) => `<b>${esc(l.label)}:</b> ${l.qty} × ${money(l.rate)} = ${money(l.qty * l.rate)} сум`,
    ),
    "",
    `<b>ИТОГО: ${money(total)} сум</b>`,
    ...(message ? ["", `<b>Комментарий:</b> ${esc(message)}`] : []),
    "",
    `<i>Заявка с сайта chimgandarbaza.uz · язык гостя: ${lang}</i>`,
  ].join("\n");

  const emailHtml = `<div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="color:#1a4d2e">🛖 Заявка на топчан</h2>
      <p><b>Имя:</b> ${esc(name)}<br>
         <b>Телефон:</b> <a href="tel:${esc(tel)}">${esc(tel)}</a><br>
         <b>Дата:</b> ${esc(date)} · тариф ${tariff}<br>
         <b>Гостей:</b> ${guests} · <b>топчанов:</b> ${topchans}</p>
      <ul>${lines
        .map((l) => `<li>${esc(l.label)}: ${l.qty} × ${money(l.rate)} = ${money(l.qty * l.rate)} сум</li>`)
        .join("")}</ul>
      <p><b>К оплате:</b> ${money(total)} сум</p>
      ${message ? `<p><b>Комментарий:</b> ${esc(message)}</p>` : ""}
      <p style="color:#7a7a73;font-size:12px">Отправлено с chimgandarbaza.uz</p>
    </div>`;

  const { telegramOk, emailOk } = await deliverRequest({
    telegramHtml,
    emailSubject: `Топчан · ${name} · ${date} · ${guests} гост.`,
    emailHtml,
    record: {
      service: "topchan",
      date,
      name,
      phone: tel,
      adults: guests,
      kids: 0,
      toddlers: 0,
      units: topchans,
      extras: lines.slice(1).map((l) => `${l.label} ×${l.qty}`),
      total,
      tariff,
      message: message || undefined,
      locale: lang,
    },
  });

  console.log(
    `[topchan] telegram=${telegramOk ? "sent" : "failed"} email=${emailOk ? "sent" : "skipped/failed"} | ${name}, ${date}, ${guests} guests, ${topchans} topchan(s), total ${total}`,
  );

  // Never show a fake success: if nothing left the building, tell them to call.
  if (!telegramOk && !emailOk) return { ok: false, error: m.failed };
  return { ok: true };
}
