"use server";

import { contacts } from "@/content/contacts";
import { parkingPricing, tubingPricing } from "@/content/pricing";
import { getPricing } from "@/lib/pricing-live";
import { esc } from "@/lib/telegram";
import { ridesRu } from "@/lib/tariff";
import {
  deliverRequest,
  dialable,
  isWeekend,
  money,
  todayTashkent,
} from "@/lib/request-delivery";

export type TubingResult = { ok: true } | { ok: false; error: string };

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
 * Tubing hill day pass.
 *
 * Priced by package of rides, with no weekday/weekend band — the operator gave
 * one price per package and nothing else, so nothing here invents a tariff
 * split. The entry fee for a car does still follow the day band, which is why
 * the tariff label is still recorded.
 */
export async function submitTubingRequest(formData: FormData): Promise<TubingResult> {
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

  const num = (v: string, max = 200) => Math.min(Math.max(parseInt(v, 10) || 0, 0), max);
  const guests = Math.max(num(((formData.get("guests") as string | null) ?? "").trim()), 1);
  const cars = num(((formData.get("cars") as string | null) ?? "").trim(), 60);

  // One quantity per package, posted as pack0 / pack1 … so adding a third
  // package to pricing.ts needs no change here.
  const live = await getPricing();
  const packs = live.tubing.packages.map((p, i) => ({
    ...p,
    qty: num(((formData.get(`pack${i}`) as string | null) ?? "").trim(), 100),
  }));

  const weekend = isWeekend(date);
  const tariff = weekend ? "Пт–Вс" : "Пн–Чт";
  const carRate = weekend ? live.parking.weekend : live.parking.weekday;

  const lines: { label: string; qty: number; rate: number }[] = [
    ...packs
      .filter((p) => p.qty > 0)
      .map((p) => ({ label: `Пакет ${p.rides} ${ridesRu(p.rides)}`, qty: p.qty, rate: p.price })),
    { label: "Въезд, 1 автомобиль", qty: cars, rate: carRate },
  ].filter((l) => l.qty > 0);

  const total = lines.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const rides = packs.reduce((n, p) => n + p.qty * p.rides, 0);
  const tel = dialable(phone);

  const telegramHtml = [
    "<b>🛷 Заявка на тюбинг</b>",
    "",
    `<b>Имя:</b> ${esc(name)}`,
    // Bare international number on its own line — see the note in topchan.ts.
    `📞 <b>Телефон:</b> ${esc(tel)}`,
    `<b>Дата:</b> ${esc(date)} · тариф въезда ${tariff}`,
    `<b>Гостей:</b> ${guests}${rides ? ` · <b>спусков:</b> ${rides}` : ""}`,
    "",
    ...(lines.length
      ? lines.map(
          (l) => `<b>${esc(l.label)}:</b> ${l.qty} × ${money(l.rate)} = ${money(l.qty * l.rate)} сум`,
        )
      : ["<i>Пакет не выбран — подберите с гостем по телефону.</i>"]),
    "",
    `<b>ИТОГО: ${money(total)} сум</b>`,
    ...(message ? ["", `<b>Комментарий:</b> ${esc(message)}`] : []),
    "",
    `<i>Заявка с сайта chimgandarbaza.uz · язык гостя: ${lang}</i>`,
  ].join("\n");

  const emailHtml = `<div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="color:#1a4d2e">🛷 Заявка на тюбинг</h2>
      <p><b>Имя:</b> ${esc(name)}<br>
         <b>Телефон:</b> <a href="tel:${esc(tel)}">${esc(tel)}</a><br>
         <b>Дата:</b> ${esc(date)}<br>
         <b>Гостей:</b> ${guests}${rides ? ` · спусков: ${rides}` : ""}</p>
      <ul>${lines
        .map((l) => `<li>${esc(l.label)}: ${l.qty} × ${money(l.rate)} = ${money(l.qty * l.rate)} сум</li>`)
        .join("")}</ul>
      <p><b>К оплате:</b> ${money(total)} сум</p>
      ${message ? `<p><b>Комментарий:</b> ${esc(message)}</p>` : ""}
      <p style="color:#7a7a73;font-size:12px">Отправлено с chimgandarbaza.uz</p>
    </div>`;

  const { telegramOk, emailOk } = await deliverRequest({
    telegramHtml,
    emailSubject: `Тюбинг · ${name} · ${date} · ${guests} гост.`,
    emailHtml,
    record: {
      service: "tubing",
      date,
      name,
      phone: tel,
      adults: guests,
      kids: 0,
      toddlers: 0,
      units: rides,
      extras: lines.map((l) => `${l.label} ×${l.qty}`),
      total,
      tariff,
      message: message || undefined,
      locale: lang,
    },
  });

  console.log(
    `[tubing] telegram=${telegramOk ? "sent" : "failed"} email=${emailOk ? "sent" : "skipped/failed"} | ${name}, ${date}, ${guests} guests, ${rides} rides, total ${total}`,
  );

  if (!telegramOk && !emailOk) return { ok: false, error: m.failed };
  return { ok: true };
}
