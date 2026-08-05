/**
 * Guest-facing Telegram bot for CHIMGAN DARBAZA (@chimgandarbaza_bot).
 *
 * Designed for CLIENTS only: no staff data, no occupancy, no guest lists, no
 * finances. The guest experience:
 *   /start        — hero photo + rich menu
 *   🤖 ИИ         — AI concierge (explicit opt-in, answers marked 🤖)
 *   🗓 Даты/цены  — 2 taps to LIVE prices for a date (booking engine)
 *   🌤 Погода     — live mountain weather + clothing tip (open-meteo)
 *   📸 Фото       — drone-photo album of the venue
 *   🏷 Цены дня   — fixed day-use price list, 📞 контакты, 🌐 бронирование
 *
 * Stateless: views carry their state in callback_data, so it runs on
 * serverless (Vercel) with no session store.
 */

import {
  answerCallbackQuery,
  editMessageText,
  esc,
  sendChatAction,
  sendMediaGroup,
  sendMessage,
  sendPhoto,
  type InlineKeyboard,
} from "./telegram";
import { answerGuestQuestion } from "./staff-ai";
import { getChimganWeather, t, weatherAdvice, weatherInfo } from "./bot-weather";
import { checkAvailability } from "./exely";
import { contacts } from "@/content/contacts";
import { extraGuestPricing, parkingPricing, priceList, topchanPricing, tubingPricing } from "@/content/pricing";
import { money } from "./venue-facts";
import { ridesRu } from "./tariff";
import { recentRequests, requestsByDate, storeConfigured, type StoredRequest } from "./requests-store";

const SITE = "https://chimgandarbaza.uz";
const BOOK_URL = `${SITE}/ru/bron`;
const IMG = `${SITE}/images/resort`;

const HERO_PHOTO = `${IMG}/2026-08/pool-panorama.jpg`;
// URLs here are hardcoded, so they bypass content/images.ts and its mapping —
// which meant "Шале с видом на горы" was sending guests a photo of the padel
// courts (18 held the sport zone, not the chalets).
//
// Every frame is now a photograph. Half of this album used to be renderings
// captioned "(визуализация)", which is an honest label but still answers "what
// does it look like?" with a drawing. Those files are gone from the repo, so
// these URLs would 404 if they had been left.
const ALBUM: { url: string; caption: string }[] = [
  { url: `${IMG}/2026-08/pool-panorama.jpg`, caption: "Бассейн и горы 🏔" },
  { url: `${IMG}/2026-08/pool-logo-tall.jpg`, caption: "Мозаика на дне бассейна" },
  { url: `${IMG}/2026-08/pool-cabanas-valley.jpg`, caption: "Бунгало у воды" },
  { url: `${IMG}/2026-08/chalet-peaks.jpg`, caption: "Шале под гребнем Чимгана" },
  { url: `${IMG}/rooms/chalet-lounge.jpg`, caption: "Кухня-зал в шале" },
  { url: `${IMG}/rooms/aframe-room.jpg`, caption: "Глэмпинг A-frame внутри" },
];

// ── date helpers ──────────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function todayISO(): string {
  // Uzbekistan is UTC+5, no DST.
  const now = new Date(Date.now() + 5 * 3600_000);
  return now.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dow(iso: string): number {
  return new Date(iso + "T00:00:00Z").getUTCDay();
}
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}
/** "сб 25.07" */
function fmtDay(iso: string): string {
  return `${WEEKDAYS_SHORT[dow(iso)]} ${fmtDate(iso)}`;
}
/** Next date with the given day-of-week (may be today). */
function nextDow(fromIso: string, target: number): string {
  const diff = (target - dow(fromIso) + 7) % 7;
  return addDays(fromIso, diff);
}
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── main menu ─────────────────────────────────────────────────────────────────

function menuKeyboard(): InlineKeyboard {
  return [
    [{ text: "🤖 Поговорить с ИИ-помощником", callback_data: "ai" }],
    [{ text: "🗓 Свободные даты и цены", callback_data: "dates" }],
    [{ text: "🌐 Онлайн-бронирование", url: BOOK_URL }],
    [
      { text: "🏷 Цены дня", callback_data: "prices" },
      { text: "🌤 Погода", callback_data: "weather" },
    ],
    [
      { text: "📸 Фото", callback_data: "photos" },
      { text: "📞 Контакты", callback_data: "contacts" },
    ],
    // Open to everyone, by the operator's explicit decision. Anyone who opens
    // the bot can read the request log, guests' names and phones included.
    [{ text: "📋 Заявки и история", callback_data: "reqs" }],
  ];
}

function menuText(): string {
  return [
    "<b>👋 Добро пожаловать в CHIMGAN DARBAZA!</b>",
    "",
    "Горный курорт в 45 минутах от Ташкента, высота 1700 м.",
    "Глэмпинг A-frame и шале, бассейн включён в проживание.",
    "Заезд с 15:00, выезд до 12:00.",
    "",
    "Выберите, что вам нужно:",
  ].join("\n");
}

function heroCaption(): string {
  return [
    "<b>CHIMGAN DARBAZA</b> — ваш отдых в горах Чимгана 🏔",
    "45 минут от Ташкента · 1700 м над уровнем моря",
  ].join("\n");
}

// ── views ─────────────────────────────────────────────────────────────────────

type View = { text: string; keyboard: InlineKeyboard };

function backRow(): InlineKeyboard {
  return [[{ text: "☰ Меню", callback_data: "menu" }]];
}

function renderAiIntro(): View {
  return {
    text: [
      "<b>🤖 ИИ-помощник CHIMGAN DARBAZA</b>",
      "",
      "Вы будете общаться с <b>искусственным интеллектом</b>. Он мгновенно отвечает про цены, свободные даты, бронирование и как добраться — на любом языке.",
      "",
      "Просто напишите ваш вопрос сообщением 👇",
      "",
      `<i>Точную информацию всегда подтвердит администратор: ${esc(contacts.phone)}</i>`,
    ].join("\n"),
    keyboard: [[{ text: "🌐 Онлайн-бронирование", url: BOOK_URL }], ...backRow()],
  };
}

/** Quick date picker: today / tomorrow / next Sat / next Sun (deduped). */
function renderDates(): View {
  const today = todayISO();
  const picks: { label: string; date: string }[] = [];
  const seen = new Set<string>();
  const push = (label: string, date: string) => {
    if (seen.has(date)) return;
    seen.add(date);
    picks.push({ label, date });
  };
  push(`Сегодня (${fmtDay(today)})`, today);
  push(`Завтра (${fmtDay(addDays(today, 1))})`, addDays(today, 1));
  push(`Суббота ${fmtDate(nextDow(today, 6))}`, nextDow(today, 6));
  push(`Воскресенье ${fmtDate(nextDow(today, 0))}`, nextDow(today, 0));

  const rows: InlineKeyboard = picks.map((p) => [
    { text: `🗓 ${p.label}`, callback_data: `pr:${p.date}` },
  ]);
  return {
    text: [
      "<b>🗓 Свободные даты и цены</b>",
      "",
      "Выберите дату — покажу живые цены проживания из системы бронирования:",
      "",
      "<i>Другая дата, несколько ночей или больше гостей? Просто напишите ИИ-помощнику, например: «глэмпинг с 1 по 3 августа на четверых».</i>",
    ].join("\n"),
    keyboard: [...rows, ...backRow()],
  };
}

/** Live prices for one night on the given date, straight from the engine. */
async function renderPriceFor(date: string): Promise<View> {
  const keyboard: InlineKeyboard = [
    [{ text: "🌐 Забронировать", url: BOOK_URL }],
    [{ text: "◀︎ Другие даты", callback_data: "dates" }, { text: "☰ Меню", callback_data: "menu" }],
  ];
  if (!ISO_RE.test(date)) return renderDates();

  const res = await checkAvailability({ checkin: date });
  if (!res.ok) {
    return {
      text: [
        `<b>🗓 ${fmtDay(date)}</b>`,
        "",
        "Не получилось узнать цены прямо сейчас 😔",
        `Попробуйте ещё раз или позвоните нам: ${esc(contacts.phone)}`,
      ].join("\n"),
      keyboard,
    };
  }

  const icon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("глэмп") || n.includes("glamp")) return "🏕";
    if (n.includes("шале") || n.includes("котт")) return "🏡";
    if (n.includes("топчан") || n.includes("topchan")) return "🪵";
    if (n.includes("бассейн") || n.includes("pool")) return "🏊";
    return "•";
  };

  const lines: string[] = [`<b>🗓 ${fmtDay(date)} — 1 ночь, 2 гостя</b>`, ""];
  if (res.options.length === 0) {
    lines.push(
      "На эту дату свободных вариантов проживания нет 😔",
      "Попробуйте другую дату — или напишите ИИ-помощнику, он подберёт.",
    );
  } else {
    for (const o of res.options) {
      lines.push(`${icon(o.name)} ${esc(o.name)} — <b>${money(o.price)} UZS</b>`);
    }
  }
  /**
   * Exely's services are NOT quoted here.
   *
   * The engine returns one flat figure for the pool — 200 000 per person on
   * every date, including Пн–Чт — because the operator does not maintain a day
   * pass there. Printing it doubled the weekday adult price and erased the
   * child band entirely: a family of four read 800 000 where the tariff is
   * 400 000. The site concierge was fixed for exactly this; the bot was
   * printing it deterministically, with no AI involved. The real four-band
   * tariff lives on the pool page and in the «🏷 Цены на день» screen.
   */
  const poolNote = res.services.some((s) => /бассейн|basseyn|pool/i.test(s.name));
  if (poolNote) {
    lines.push("", "🏊 <b>Бассейн</b> — тариф зависит от возраста и дня недели, смотрите на сайте.");
  }
  lines.push("", `<i>Точную информацию подтвердит администратор: ${esc(contacts.phone)}</i>`);
  return { text: lines.join("\n"), keyboard };
}

async function renderWeather(): Promise<View> {
  const res = await getChimganWeather();
  const keyboard: InlineKeyboard = [
    [{ text: "🔄 Обновить", callback_data: "weather" }],
    ...backRow(),
  ];
  if (!res.ok) {
    return {
      text: "<b>🌤 Погода в Чимгане</b>\n\nНе удалось получить прогноз, попробуйте чуть позже.",
      keyboard,
    };
  }
  const w = res.data;
  const now = weatherInfo(w.code);
  return {
    text: [
      "<b>🌤 Погода в Чимгане</b> <i>(высота 1700 м)</i>",
      "",
      `Сейчас: ${now.emoji} ${now.desc}, <b>${t(w.tempC)}</b> (ощущается ${t(w.feelsC)})`,
      `Сегодня: ${t(w.todayMin)}…${t(w.todayMax)}, ветер до ${w.windKmh} км/ч`,
      `Завтра: ${t(w.tomorrowMin)}…${t(w.tomorrowMax)}`,
      "",
      `💡 ${weatherAdvice(w)}`,
    ].join("\n"),
    keyboard,
  };
}

function renderPrices(): View {
  const rows = priceList.map((p) => {
    const sub = p.subtitle ? ` (${esc(p.subtitle.ru)})` : "";
    return `• ${esc(p.title.ru)}${sub} — <b>${money(p.weekday)}</b> / <b>${money(p.weekend)}</b>`;
  });
  return {
    text: [
      "<b>🏷 Цены на день</b>",
      "<i>будни (Пн–Чт) / выходные (Пт–Вс), в сумах</i>",
      "",
      `🛖 <b>Топчан</b> (до ${topchanPricing.capacity} чел.) — <b>${money(topchanPricing.rent.weekday)}</b> / <b>${money(topchanPricing.rent.weekend)}</b>`,
      "",
      // Tubing is priced per package of rides, so it cannot sit in the two-column
      // weekday/weekend table above without implying a band it does not have.
      `🛷 <b>Тюбинг-горка</b> — ${tubingPricing.packages
        .map((p) => `${p.rides} ${ridesRu(p.rides)} <b>${money(p.price)}</b>`)
        .join(" · ")} <i>(цена одна всю неделю)</i>`,
      // Parking is charged to tubing visitors only, so it is stated beside
      // tubing rather than as a line everyone reads as applying to them.
      `🚗 <b>Парковка</b> (1 авто, только для тюбинга) — <b>${money(parkingPricing.weekday)}</b> / <b>${money(parkingPricing.weekend)}</b>`,
      "<i>Проживающим, гостям бассейна и топчана парковка бесплатна.</i>",
      "",
      "<b>Аренда и расходники:</b>",
      ...rows,
      "",
      "Каждая позиция оплачивается отдельно. Блюда кухни — по меню.",
      "",
      "🏊 <b>Бассейн</b> — тариф по возрастам, смотрите на сайте.",
      "🏕 Проживание (глэмпинг, шале): цены зависят от дат — смотрите «🗓 Свободные даты и цены».",
      "",
      // The three charges that a guest only meets at the door if nobody says
      // them out loud. Same figures as the room pages and the AI briefing.
      "<b>➕ Дополнительное место за ночь</b> (в глэмпинге и шале одинаково):",
      `• Взрослый — <b>${money(extraGuestPricing.adult)}</b>`,
      `• Ребёнок ${extraGuestPricing.childFrom}–${extraGuestPricing.childTo} лет — <b>${money(extraGuestPricing.child)}</b>`,
      `• Дети до ${extraGuestPricing.freeThroughAge} лет включительно — <b>бесплатно</b>`,
      `🚪 Гостевой визит в шале (без ночёвки) — <b>${money(extraGuestPricing.guestVisitCottage)}</b>`,
      "",
      "<i>Ранний заезд и поздний выезд — за доплату, по загрузке. Дополнительно взимается обязательный туристский сбор.</i>",
    ].join("\n"),
    keyboard: [
      [
        { text: "🗓 Даты и цены", callback_data: "dates" },
        { text: "🌐 Бронирование", url: BOOK_URL },
      ],
      ...backRow(),
    ],
  };
}

function renderContacts(): View {
  const phoneDigits = contacts.phone.replaceAll(" ", "");
  return {
    text: [
      "<b>📞 Контакты CHIMGAN DARBAZA</b>",
      "",
      `Телефон: <a href="tel:${phoneDigits}">${esc(contacts.phone)}</a>`,
      `WhatsApp: ${contacts.whatsapp}`,
      `Telegram: ${contacts.telegram}`,
      `Instagram: ${contacts.instagram}`,
      `E-mail: ${esc(contacts.email)}`,
      "",
      `📍 ${esc(contacts.address.ru)}`,
      `Карта: ${contacts.googleMapsUrl}`,
      "",
      "Заезд с 15:00, выезд до 12:00.",
    ].join("\n"),
    keyboard: backRow(),
  };
}

function renderBook(): View {
  return {
    text: [
      "<b>🌐 Онлайн-бронирование</b>",
      "",
      "Выберите даты и номер и оплатите онлайн — бронь подтверждается сразу:",
      "",
      BOOK_URL,
    ].join("\n"),
    keyboard: [[{ text: "🌐 Открыть бронирование", url: BOOK_URL }], ...backRow()],
  };
}

/** The photo album can't be an in-place edit — it sends new messages. */
async function sendPhotoAlbum(chatId: number): Promise<void> {
  await sendChatAction(chatId, "upload_photo");
  await sendMediaGroup(chatId, ALBUM);
  await sendMessage(
    chatId,
    `Ещё больше фото и видео — в Instagram и на сайте ${SITE} 📷`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📷 Instagram", url: contacts.instagram }],
          [{ text: "🌐 Онлайн-бронирование", url: BOOK_URL }],
          ...backRow(),
        ],
      },
    },
  );
}

/**
 * Date shortcuts for the request log. Typing "/zayavki 2026-08-09" on a phone
 * is painful, and the dates anyone actually asks about are today, tomorrow and
 * the coming weekend — the same picks the price view offers.
 */
function requestsKeyboard(current?: string | null): InlineKeyboard {
  const today = todayISO();
  const picks: { label: string; date: string }[] = [];
  const seen = new Set<string>();
  const push = (label: string, date: string) => {
    if (seen.has(date)) return;
    seen.add(date);
    picks.push({ label, date });
  };
  push("Сегодня", today);
  push("Завтра", addDays(today, 1));
  push(`Сб ${fmtDate(nextDow(today, 6))}`, nextDow(today, 6));
  push(`Вс ${fmtDate(nextDow(today, 0))}`, nextDow(today, 0));

  const dateRow = picks.map((p) => ({
    // A checkmark marks the day being shown, so tapping around stays oriented.
    text: p.date === current ? `✅ ${p.label}` : p.label,
    callback_data: `reqs:${p.date}`,
  }));
  return [
    dateRow.slice(0, 2),
    dateRow.slice(2),
    [{ text: current ? "🕘 Последние заявки" : "✅ Последние заявки", callback_data: "reqs" }],
    ...backRow(),
  ];
}

/** One glance tells the operator which form a row came from. */
const SERVICE_LABEL: Record<string, string> = {
  pool: "🏊",
  topchan: "🛖",
  tubing: "🛷",
  booking: "🏡",
  inquiry: "💬",
};

/**
 * Who is booked in, and for how much.
 *
 * Two shapes: a specific date, which spans the pool, tubing and accommodation
 * requests filed against it, or the last few submissions of any kind. The phone
 * is deliberately a bare +998… so a tap dials, same as the request messages.
 */
export async function renderRequests(arg?: string): Promise<View> {
  if (!storeConfigured()) {
    return {
      text: [
        "<b>📋 История заявок</b>",
        "",
        "Хранилище не подключено, поэтому история пока не ведётся.",
        "Заявки продолжают приходить сюда сообщениями — теряются только архив и поиск по датам.",
      ].join("\n"),
      keyboard: backRow(),
    };
  }

  const wantsRecent = !arg || arg === "recent";
  const date = wantsRecent ? null : arg;
  if (date && !ISO_RE.test(date)) {
    return {
      text: [
        "<b>📋 История заявок</b>",
        "",
        "Дату пишите как <code>/zayavki 2026-08-09</code>.",
        "Без даты — последние заявки.",
      ].join("\n"),
      keyboard: backRow(),
    };
  }

  const rows: StoredRequest[] = date ? await requestsByDate(date) : await recentRequests(10);
  const head = date ? `<b>📋 Заявки на ${fmtDay(date)}</b>` : "<b>📋 Последние заявки</b>";

  if (rows.length === 0) {
    return {
      text: [head, "", date ? "На эту дату заявок нет." : "Заявок пока нет."].join("\n"),
      keyboard: requestsKeyboard(date),
    };
  }

  const people = rows.reduce((n, r) => n + r.adults + r.kids + r.toddlers, 0);
  /**
   * Topchan occupancy for the day — how many are BOOKED, never how many exist.
   *
   * This bot is public and the request log was deliberately left open, so
   * anything printed here is printed to strangers. The operator's instruction
   * was explicit: track the thirty, don't advertise them. "Занято 27 из 30"
   * would hand a competitor the property's capacity and a guest a false
   * urgency nobody asked for, so only the booked figure appears.
   */
  const topchansTaken = rows
    .filter((r) => r.service === "topchan")
    .reduce((n, r) => n + (r.units ?? 0), 0);
  // Only the day-visit forms carry a price. An accommodation request is quoted
  // by the PMS after the administrator confirms, so counting its zero into the
  // day's takings would understate nothing — but showing "0 сум" on its line
  // would read as free, hence the per-row check below.
  const sum = rows.reduce((n, r) => n + r.total, 0);

  const header = [
    head,
    `<i>${rows.length} заявк(и) · ${people} гост(ей)${sum ? ` · ${money(sum)} сум` : ""}</i>`,
    ...(date && topchansTaken ? [`🛖 <b>Топчанов забронировано:</b> ${topchansTaken}`] : []),
    "",
  ];

  const blocks = rows.map((r) => {
      const guests = [
        `${r.adults} взр.`,
        ...(r.kids ? [`${r.kids} дет.`] : []),
        ...(r.toddlers ? [`${r.toddlers} до 5`] : []),
      ].join(" + ");
      const detail = [
        ...(r.adults ? [guests] : []),
        ...(r.total ? [`<b>${money(r.total)} сум</b>`] : []),
        ...(r.extras.length ? [esc(r.extras.join(", "))] : []),
        // Accommodation: the nights matter more than a price nobody has yet.
        ...(r.checkin && r.checkout ? [`${esc(r.checkin)} → ${esc(r.checkout)}`] : []),
        ...(r.room ? [esc(r.room)] : []),
      ].join(" · ");
      return [
        `${SERVICE_LABEL[r.service] ?? "📄"} ${date ? "" : fmtDay(r.date) + " · "}<b>${esc(r.name)}</b>`,
        `${esc(r.phone)}`,
        ...(detail ? [detail] : []),
        ...(r.message ? [`<i>${esc(r.message)}</i>`] : []),
        "",
      ].join("\n");
  });

  /**
   * Telegram rejects a message over 4096 characters, so a busy day has to be
   * trimmed. Whole request blocks only: slicing at a character offset can cut
   * through a tag, and unbalanced HTML makes Telegram reject the entire
   * message — a busy day would get no reply at all.
   */
  const LIMIT = 3900;
  const kept: string[] = [];
  let size = header.join("\n").length;
  for (const block of blocks) {
    if (size + block.length > LIMIT) break;
    kept.push(block);
    size += block.length + 1;
  }
  const dropped = blocks.length - kept.length;
  const text = [
    ...header,
    ...kept,
    ...(dropped ? [`<i>…и ещё ${dropped} — список обрезан, не поместился в сообщение.</i>`] : []),
  ]
    .join("\n")
    .trim();

  return { text, keyboard: requestsKeyboard(date) };
}

// ── dispatch ──────────────────────────────────────────────────────────────────

async function viewFor(action: string): Promise<View> {
  const [cmd, arg] = action.split(":");
  switch (cmd) {
    case "ai":
      return renderAiIntro();
    case "dates":
      return renderDates();
    case "pr":
      return renderPriceFor(arg || todayISO());
    case "weather":
      return renderWeather();
    case "prices":
      return renderPrices();
    case "contacts":
      return renderContacts();
    case "book":
      return renderBook();
    case "reqs":
      return renderRequests(arg);
    case "menu":
    default:
      return { text: menuText(), keyboard: menuKeyboard() };
  }
}

/** Map a typed slash command to an internal action string. */
function commandToAction(text: string): string | null {
  const cmd = text.trim().split(/\s+/)[0].replace(/@\w+$/, "").toLowerCase();
  switch (cmd) {
    case "/start":
    case "/menu":
    case "/help":
      return "menu";
    case "/ai":
      return "ai";
    case "/daty":
    case "/dates":
      return "dates";
    case "/pogoda":
    case "/weather":
      return "weather";
    case "/ceny":
    case "/prices":
      return "prices";
    // Self-service for wiring up who receives pool requests. A bot cannot look
    // up a chat id on its own, and getUpdates is unavailable while the webhook
    // is set — so the chat tells us its own id, and that value goes into
    // TELEGRAM_ADMIN_CHAT_ID (comma-separated for several recipients).
    case "/id":
    case "/chatid":
      return "chatid";
    case "/zayavki":
    case "/requests":
    case "/istoriya": {
      // "/zayavki 2026-08-09" → reqs:2026-08-09, bare command → recent
      const arg = text.trim().split(/\s+/)[1];
      return arg ? `reqs:${arg}` : "reqs";
    }
    case "/contacts":
    case "/kontakty":
      return "contacts";
    case "/bron":
    case "/book":
      return "book";
    case "/foto":
    case "/photos":
      return "photos";
    default:
      return null;
  }
}

// ── Telegram update entry point ───────────────────────────────────────────────

type TgUpdate = {
  /** Telegram Business: a message in a chat the bot handles for the hotel account. */
  business_message?: {
    chat: { id: number; type?: string };
    from?: { id: number; is_bot?: boolean };
    text?: string;
    business_connection_id?: string;
  };
  /** Sent when the account owner connects or revokes the bot. */
  business_connection?: { id: string; user?: { id: number }; is_enabled?: boolean };
  message?: {
    chat: { id: number; type?: string };
    from?: { id: number };
    text?: string;
    reply_to_message?: { text?: string; from?: { is_bot?: boolean } };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

/**
 * Night window for the auto-reply in the hotel's personal chats, Asia/Tashkent
 * (UTC+5 year-round, so a fixed offset is exact here).
 *
 * The operator answers their own DMs during the day and only wants cover while
 * they are asleep. Guests write at 01:00 asking whether the venue is open
 * tomorrow, and that question keeps until morning badly.
 */
const NIGHT_FROM = 23; // inclusive
const NIGHT_UNTIL = 8; // exclusive — the venue opens at 08:00

function isNight(): boolean {
  const hour = new Date(Date.now() + 5 * 3600 * 1000).getUTCHours();
  return hour >= NIGHT_FROM || hour < NIGHT_UNTIL;
}

/**
 * The "this is a bot" note goes out once per conversation per night, not under
 * every message — repeated five times in a row it reads like a machine
 * apologising for itself. Kept in memory: a cold lambda may re-introduce
 * itself, which is a far cheaper failure than a store, and the same trade-off
 * the AI's own history map already makes.
 */
const nightNoteSent = new Map<number, number>();

function needsNightNote(chatId: number): boolean {
  const last = nightNoteSent.get(chatId) ?? 0;
  if (Date.now() - last < 6 * 3600 * 1000) return false;
  nightNoteSent.set(chatId, Date.now());
  return true;
}

/** Handle one Telegram update. The bot is public — no allowlist. */
/**
 * Telegram Business: the bot answering in the hotel account's own DMs.
 *
 * A guest who taps "Telegram" on the site lands on t.me/+998701760011 — the
 * hotel's personal account, not this bot — and until now nothing answered
 * there. With Business mode connected, those messages arrive here as
 * `business_message` instead of `message`, and replies must carry the
 * connection id or Telegram doesn't know whose voice to use.
 *
 * Deliberately different from the bot's own chat: no menu, no buttons, no
 * commands. The guest believes they are writing to the hotel, and a bot menu
 * unfolding in that conversation would be jarring. Straight to the concierge,
 * and — unlike the bot chat — without the 🤖 prefix, since the account is
 * answering as itself.
 */
async function handleBusinessMessage(update: TgUpdate): Promise<void> {
  const m = update.business_message;
  if (!m?.text || !m.business_connection_id) return;
  const chatId = m.chat.id;
  const connection = m.business_connection_id;
  const text = m.text.trim();

  console.log(`[bot] business chat ${chatId}: ${text.slice(0, 40)}`);

  // Never answer the account owner's own outgoing messages — the hotel replying
  // by hand would otherwise trigger the AI on its own words.
  if (m.from?.id && m.chat.id === m.from.id && m.from.is_bot) return;

  // During the day the operator answers personally; the AI only covers the
  // hours nobody is awake. Silence here is the correct behaviour, not a miss.
  if (!isNight()) return;

  await sendChatAction(chatId, "typing", connection);
  const ai = await answerGuestQuestion(text, { chatId });
  const reply = ai.ok
    ? ai.text
    : [
        "Извините, сейчас не могу ответить автоматически.",
        `Менеджер напишет утром, с ${String(NIGHT_UNTIL).padStart(2, "0")}:00. Телефон: ${contacts.phone}`,
      ].join("\n");
  const note = needsNightNote(chatId)
    ? `\n\n<i>Сейчас ночь — отвечает автоматический помощник. Менеджер прочитает переписку утром, с ${String(NIGHT_UNTIL).padStart(2, "0")}:00.</i>`
    : "";
  await sendMessage(chatId, esc(reply) + note, { business_connection_id: connection });
}

export async function handleGuestUpdate(update: TgUpdate): Promise<void> {
  // Business-account chats take a different path entirely.
  if (update.business_message) return handleBusinessMessage(update);
  if (update.business_connection) {
    const c = update.business_connection;
    console.log(`[bot] business connection ${c.id} with user ${c.user?.id} — enabled: ${c.is_enabled}`);
    return;
  }

  // Callback (button taps) — edit the message in place (photos are special).
  if (update.callback_query) {
    const cq = update.callback_query;
    await answerCallbackQuery(cq.id);
    if (!cq.message) return;
    if ((cq.data || "") === "photos") {
      await sendPhotoAlbum(cq.message.chat.id);
      return;
    }
    const view = await viewFor(cq.data || "menu");
    await editMessageText(cq.message.chat.id, cq.message.message_id, view.text, {
      reply_markup: { inline_keyboard: view.keyboard },
    });
    return;
  }

  // Text message / command.
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    const action = commandToAction(text);

    // Logged so a new group's id can be read straight from the runtime logs.
    // A bot cannot look up its own chats, and getUpdates is unavailable while a
    // webhook is set, so without this the only way to learn a chat id is to ask
    // someone in that chat to run /id and copy the number back.
    console.log(`[bot] chat ${chatId} (${update.message.chat.type ?? "private"}) says: ${text.slice(0, 40)}`);

    /**
     * In a group the bot must keep quiet unless it is spoken to.
     *
     * This handler was written for one-to-one chats, where every message is a
     * question for the concierge. Dropped into the staff group that receives
     * pool requests, that same rule would have the bot answer each message
     * colleagues send each other — unusable, and it would burn the Groq
     * allowance on chatter. So outside a private chat we act only on an
     * explicit command, an @mention, or a reply to something the bot said.
     */
    const isGroup = (update.message.chat.type ?? "private") !== "private";
    if (isGroup) {
      const addressed =
        text.trim().startsWith("/") ||
        /@chimgandarbaza_bot/i.test(text) ||
        update.message.reply_to_message?.from?.is_bot === true;
      if (!addressed) return;
    }

    if (action === "photos") {
      await sendPhotoAlbum(chatId);
      return;
    }
    // Handled here rather than in viewFor(), which never sees the chat id.
    // Works in a group too — add the bot, send /id, and the group's own id
    // (negative number) comes back, so a whole duty team can be notified.
    if (action === "chatid") {
      await sendMessage(
        chatId,
        [
          "<b>🆔 ID этого чата</b>",
          "",
          `<code>${chatId}</code>`,
          "",
          "Передайте это значение администратору сайта — его нужно добавить в",
          "<code>TELEGRAM_ADMIN_CHAT_ID</code>, чтобы заявки с бассейна приходили сюда.",
          "Несколько получателей перечисляются через запятую.",
        ].join("\n"),
      );
      return;
    }
    if (action === "menu") {
      // /start: hero photo first, then the menu (photo messages can't be
      // edited into text views, so the menu lives in its own message).
      await sendPhoto(chatId, HERO_PHOTO, heroCaption());
      await sendMessage(chatId, menuText(), {
        reply_markup: { inline_keyboard: menuKeyboard() },
      });
      return;
    }
    if (action || text.trim().startsWith("/")) {
      const view = await viewFor(action ?? "menu");
      await sendMessage(chatId, view.text, { reply_markup: { inline_keyboard: view.keyboard } });
      return;
    }

    // Free text → the AI concierge. Every answer is visibly marked 🤖.
    await sendChatAction(chatId, "typing");
    const ai = await answerGuestQuestion(text, {
      chatId,
      repliedTo: update.message.reply_to_message?.text,
    });
    if (ai.ok) {
      await sendMessage(chatId, `🤖 ${esc(ai.text)}`, {
        reply_markup: { inline_keyboard: backRow() },
      });
    } else {
      const phoneDigits = contacts.phone.replaceAll(" ", "");
      await sendMessage(
        chatId,
        [
          "🤖 Помощник сейчас недоступен, извините!",
          "",
          `Напишите или позвоните администратору: <a href="tel:${phoneDigits}">${esc(contacts.phone)}</a>`,
          `WhatsApp: ${contacts.whatsapp}`,
        ].join("\n"),
        { reply_markup: { inline_keyboard: menuKeyboard() } },
      );
    }
  }
}
