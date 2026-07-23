/**
 * Guest-facing Telegram bot for CHIMGAN DARBAZA (@chimgandarbaza_bot).
 *
 * Designed for CLIENTS only (по требованию оператора): no staff data, no
 * occupancy, no guest lists, no finances. What guests get:
 *   🤖 AI concierge (prices, free dates, booking, directions — any language)
 *   🌐 online booking link (Exely engine on the site)
 *   🏷 fixed day-use price list
 *   📞 contacts & directions
 *
 * The guest explicitly chooses «Поговорить с ИИ» first, and every AI answer
 * is prefixed with 🤖 so it's always clear they are talking to an AI.
 * Stateless: views carry their state in callback_data, so it runs on
 * serverless (Vercel) with no session store.
 */

import {
  answerCallbackQuery,
  editMessageText,
  esc,
  sendChatAction,
  sendMessage,
  type InlineKeyboard,
} from "./telegram";
import { answerGuestQuestion } from "./staff-ai";
import { contacts } from "@/content/contacts";
import { priceList } from "@/content/pricing";
import { money } from "./venue-facts";

const SITE = "https://chimgandarbaza.uz";
const BOOK_URL = `${SITE}/ru/bron`;

// ── main menu ─────────────────────────────────────────────────────────────────

function menuKeyboard(): InlineKeyboard {
  return [
    [{ text: "🤖 Поговорить с ИИ-помощником", callback_data: "ai" }],
    [{ text: "🌐 Онлайн-бронирование", url: BOOK_URL }],
    [
      { text: "🏷 Цены дня", callback_data: "prices" },
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
      "🏕 Проживание (глэмпинг, шале) и бассейн: цены зависят от дат — спросите ИИ-помощника или откройте онлайн-бронирование.",
    ].join("\n"),
    keyboard: [
      [{ text: "🤖 Спросить ИИ", callback_data: "ai" }, { text: "🌐 Бронирование", url: BOOK_URL }],
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

// ── dispatch ──────────────────────────────────────────────────────────────────

function viewFor(action: string): View {
  switch (action.split(":")[0]) {
    case "ai":
      return renderAiIntro();
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
    case "/ceny":
    case "/prices":
      return "prices";
    case "/contacts":
    case "/kontakty":
      return "contacts";
    case "/bron":
    case "/book":
      return "book";
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
  // Callback (button taps) — edit the message in place.
  if (update.callback_query) {
    const cq = update.callback_query;
    await answerCallbackQuery(cq.id);
    if (!cq.message) return;
    const view = viewFor(cq.data || "menu");
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
    if (action || text.trim().startsWith("/")) {
      // Known command → its view; unknown command → menu.
      const view = viewFor(action ?? "menu");
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
