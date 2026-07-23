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
import { priceList } from "@/content/pricing";
import { money } from "./venue-facts";

const SITE = "https://chimgandarbaza.uz";
const BOOK_URL = `${SITE}/ru/bron`;
const IMG = `${SITE}/images/resort`;

const HERO_PHOTO = `${IMG}/02-aerial-full-territory.jpg`;
const ALBUM: { url: string; caption: string }[] = [
  { url: `${IMG}/02-aerial-full-territory.jpg`, caption: "Вся территория с высоты 🏔" },
  { url: `${IMG}/04-tapchan-zone-aerial.jpg`, caption: "Зона топчанов" },
  { url: `${IMG}/14-aframe-glamping-day.jpg`, caption: "Глэмпинг A-frame" },
  { url: `${IMG}/18-cottage-day-mountains.jpg`, caption: "Шале с видом на горы" },
  { url: `${IMG}/16-pool-day-lifestyle.jpg`, caption: "Бассейн" },
  { url: `${IMG}/09-aerial-night-masterplan.jpg`, caption: "Вечер в горах ✨" },
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
  ];
}

function menuText(): string {
  return [
    "<b>👋 Добро пожаловать в CHIMGAN DARBAZA!</b>",
    "",
    "Горный отдых в 45 минутах от Ташкента, высота 1700 м.",
    "Топчаны и мангал на день, глэмпинги и шале с ночёвкой, бассейн.",
    "Ежедневно 08:00–18:00.",
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
      "Выберите дату — покажу живые цены проживания и бассейна из системы бронирования:",
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
  if (res.services.length) {
    lines.push("");
    for (const s of res.services) {
      lines.push(
        `${icon(s.name)} ${esc(s.name)} — <b>${money(s.price)} UZS</b>${s.perPerson ? " <i>с человека</i>" : ""}`,
      );
    }
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
      "<b>🏷 Цены дневного отдыха</b>",
      "<i>будни (Пн–Чт) / выходные (Пт–Вс), в сумах</i>",
      "",
      ...rows,
      "",
      "Каждая позиция оплачивается отдельно. Блюда кухни — по меню.",
      "",
      "🏕 Проживание (глэмпинг, шале) и бассейн: цены зависят от дат — смотрите «🗓 Свободные даты и цены».",
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
      "Ежедневно 08:00–18:00 (дневной отдых).",
    ].join("\n"),
    keyboard: backRow(),
  };
}

function renderBook(): View {
  return {
    text: [
      "<b>🌐 Онлайн-бронирование</b>",
      "",
      "Выберите даты, номер или топчан и оплатите онлайн — бронь подтверждается сразу:",
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
  message?: {
    chat: { id: number };
    from?: { id: number };
    text?: string;
    reply_to_message?: { text?: string };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

/** Handle one Telegram update. The bot is public — no allowlist. */
export async function handleGuestUpdate(update: TgUpdate): Promise<void> {
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

    if (action === "photos") {
      await sendPhotoAlbum(chatId);
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
