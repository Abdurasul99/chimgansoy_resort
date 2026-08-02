"use server";

import { contacts } from "@/content/contacts";
import { parkingPricing, poolPricing } from "@/content/pricing";
import { esc } from "@/lib/telegram";
import {
  deliverRequest,
  dialable,
  isWeekend,
  money,
  todayTashkent,
} from "@/lib/request-delivery";

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

/**
 * Pool day-pass request.
 *
 * Priced per head across two age bands and two day bands, straight off the
 * operator's tariff poster. Delivery (Telegram, e-mail copy, archive) is shared
 * with the topchan and tubing forms — see lib/request-delivery.ts.
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
  // Caps must match the form's max= exactly, or the guest is quoted a total
  // for a quantity the operator is never invoiced.
  const cars = num(((formData.get("cars") as string | null) ?? "").trim(), 60);
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
  const carRate = weekend ? parkingPricing.weekend : parkingPricing.weekday;
  const carsPrice = cars * carRate;
  const total = adults * adultRate + kids * childRate + towelsPrice + carsPrice + bungalowPrice;
  const tel = dialable(phone);

  const telegramHtml = [
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
    // menu. Anything appended to that line can break the detection.
    `📞 <b>Телефон:</b> ${esc(tel)}`,
    `<b>Дата:</b> ${esc(date)} · тариф ${tariff}`,
    "",
    `<b>Взрослые и дети 15+:</b> ${adults} × ${money(adultRate)} = ${money(adults * adultRate)} сум`,
    ...(kids ? [`<b>Дети 5–15:</b> ${kids} × ${money(childRate)} = ${money(kids * childRate)} сум`] : []),
    ...(toddlers ? [`<b>Дети до 5:</b> ${toddlers} — бесплатно`] : []),
    ...(towels ? [`<b>Полотенца:</b> ${towels} × ${money(poolPricing.extras.towel)} = ${money(towelsPrice)} сум`] : []),
    ...(cars ? [`<b>Въезд:</b> ${cars} авто × ${money(carRate)} = ${money(carsPrice)} сум`] : []),
    ...(bungalowLabel ? [`<b>${bungalowLabel}:</b> ${money(bungalowPrice)} сум`] : []),
    "",
    `<b>ИТОГО: ${money(total)} сум</b>`,
    ...(message ? ["", `<b>Комментарий:</b> ${esc(message)}`] : []),
    "",
    `<i>Заявка с сайта chimgandarbaza.uz · язык гостя: ${lang}</i>`,
  ].join("\n");

  const emailHtml = `<div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="color:#1a4d2e">🏊 Заявка на бассейн</h2>
      <p><b>Имя:</b> ${esc(name)}<br>
         <b>Телефон:</b> <a href="tel:${esc(tel)}">${esc(tel)}</a><br>
         <b>Дата:</b> ${esc(date)} · тариф ${tariff}<br>
         <b>Гостей:</b> ${adults} взр.${kids ? " + " + kids + " дет. 5–15" : ""}${toddlers ? " + " + toddlers + " до 5" : ""}<br>
         ${towels ? "<b>Полотенца:</b> " + towels + "<br>" : ""}${bungalowLabel ? "<b>" + bungalowLabel + "</b><br>" : ""}
         <b>К оплате:</b> ${money(total)} сум</p>
      ${message ? `<p><b>Комментарий:</b> ${esc(message)}</p>` : ""}
      <p style="color:#7a7a73;font-size:12px">Отправлено с chimgandarbaza.uz</p>
    </div>`;

  const { telegramOk, emailOk } = await deliverRequest({
    telegramHtml,
    emailSubject: `Бассейн · ${name} · ${date} · ${adults + kids} гост.`,
    emailHtml,
    record: {
      service: "pool",
      date,
      name,
      phone: tel,
      adults,
      kids,
      toddlers,
      extras: [
        ...(towels ? [`полотенца ×${towels}`] : []),
        ...(cars ? [`въезд ×${cars}`] : []),
        ...(bungalowLabel ? [bungalowLabel] : []),
      ],
      total,
      tariff,
      message: message || undefined,
      locale: lang,
    },
  });

  console.log(
    `[pool] telegram=${telegramOk ? "sent" : "failed"} email=${emailOk ? "sent" : "skipped/failed"} | ${name}, ${phone}, ${date}, ${adults}+${kids} guests, total ${total}`,
  );

  // Never show a fake success: if nothing left the building, tell them to call.
  if (!telegramOk && !emailOk) return { ok: false, error: m.failed };
  return { ok: true };
}
