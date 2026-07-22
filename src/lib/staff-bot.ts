/**
 * Staff Telegram bot — command + callback handlers.
 *
 * Turns Exely WebPMS data into chat messages for hotel staff: free rooms
 * (шахматка), money flow, visitor flow, and one-tap online-booking links.
 * Stateless: every interactive step carries its state in inline callback_data,
 * so it runs on serverless (Vercel) with no session store.
 */

import {
  answerCallbackQuery,
  editMessageText,
  esc,
  sendMessage,
  type InlineKeyboard,
} from "./telegram";
import { getAvailability, getFinance, getGuestFlow, pingPms } from "./exely-pms";

const SITE = "https://chimgandarbaza.uz";

// ── date / money helpers ──────────────────────────────────────────────────────

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
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
function fmtMoney(n: number, currency = "UZS"): string {
  const s = Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");
  return `${s} ${currency}`;
}

// ── main menu ─────────────────────────────────────────────────────────────────

function menuKeyboard(): InlineKeyboard {
  const t = todayISO();
  return [
    [{ text: "🏠 Свободные номера", callback_data: `av:${t}` }],
    [
      { text: "💰 Деньги", callback_data: `fin:${t}:${t}` },
      { text: "👥 Гости", callback_data: `gf:${t}:${t}` },
    ],
    [{ text: "🆕 Онлайн-бронь", callback_data: "book" }],
    [{ text: "🔌 Диагностика API", callback_data: "ping" }],
  ];
}

function menuText(): string {
  return [
    "<b>CHIMGAN DARBAZA — панель персонала</b>",
    "",
    "Живые данные из системы бронирования Exely (отель 514200).",
    "Выберите раздел:",
  ].join("\n");
}

// ── renderers: each returns { text, keyboard } ────────────────────────────────

type View = { text: string; keyboard: InlineKeyboard };

async function renderAvailability(date: string): Promise<View> {
  const res = await getAvailability(date);
  const nav: InlineKeyboard = [
    [
      { text: "◀︎ День", callback_data: `av:${addDays(date, -1)}` },
      { text: "🔄", callback_data: `av:${date}` },
      { text: "День ▶︎", callback_data: `av:${addDays(date, 1)}` },
    ],
    [{ text: "🆕 Забронировать", callback_data: "book" }, { text: "☰ Меню", callback_data: "menu" }],
  ];

  if (!res.ok) return { text: apiError("свободные номера", res.error, res.status), keyboard: nav };

  const a = res.data;
  const lines = [
    `<b>🏠 Свободные номера — ${fmtDate(date)}</b>`,
    "",
    ...a.byType.map(
      (t) => `• <b>${esc(t.name)}</b> — свободно <b>${t.free}</b> из ${t.total} (занято ${t.occupied})`,
    ),
    "",
    `Итого свободно: <b>${a.totalFree}</b> из ${a.totalRooms} · загрузка ${
      a.totalRooms ? Math.round((a.totalOccupied / a.totalRooms) * 100) : 0
    }%`,
  ];
  if (a.byType.length === 0) lines.splice(2, 0, "<i>Номерной фонд пуст или не отдан API.</i>", "");
  return { text: lines.join("\n"), keyboard: nav };
}

async function renderFinance(from: string, to: string): Promise<View> {
  const res = await getFinance(from, to);
  const t = todayISO();
  const nav: InlineKeyboard = [
    [
      { text: "Сегодня", callback_data: `fin:${t}:${t}` },
      { text: "7 дней", callback_data: `fin:${addDays(t, -6)}:${t}` },
      { text: "30 дней", callback_data: `fin:${addDays(t, -29)}:${t}` },
    ],
    [{ text: "☰ Меню", callback_data: "menu" }],
  ];
  if (!res.ok) return { text: apiError("финансы", res.error, res.status), keyboard: nav };

  const f = res.data;
  const period = from === to ? fmtDate(from) : `${fmtDate(from)} — ${fmtDate(to)}`;
  const lines = [
    `<b>💰 Деньги — ${period}</b>`,
    "",
    `Поступления: <b>${fmtMoney(f.gross, f.currency)}</b>`,
    f.refunds ? `Возвраты: −${fmtMoney(f.refunds, f.currency)}` : "",
    `Итого (нетто): <b>${fmtMoney(f.net, f.currency)}</b>`,
    `Платежей: ${f.count}`,
  ].filter(Boolean);
  if (f.byMethod.length) {
    lines.push("", "<b>По способам оплаты:</b>");
    for (const m of f.byMethod) lines.push(`• ${esc(m.method)} — ${fmtMoney(m.amount, f.currency)}`);
  }
  return { text: lines.join("\n"), keyboard: nav };
}

async function renderGuests(from: string, to: string): Promise<View> {
  const res = await getGuestFlow(from, to);
  const t = todayISO();
  const nav: InlineKeyboard = [
    [
      { text: "Сегодня", callback_data: `gf:${t}:${t}` },
      { text: "7 дней", callback_data: `gf:${t}:${addDays(t, 6)}` },
    ],
    [{ text: "☰ Меню", callback_data: "menu" }],
  ];
  if (!res.ok) return { text: apiError("гостей", res.error, res.status), keyboard: nav };

  const g = res.data;
  const period = from === to ? fmtDate(from) : `${fmtDate(from)} — ${fmtDate(to)}`;
  const text = [
    `<b>👥 Поток гостей — ${period}</b>`,
    "",
    `Заезды: <b>${g.arrivals}</b>`,
    `Выезды: <b>${g.departures}</b>`,
    `Гостей (человек): <b>${g.guests}</b>`,
    `Броней: ${g.bookings}`,
  ].join("\n");
  return { text, keyboard: nav };
}

function renderBook(): View {
  // Exely's booking engine is a JS embed on /bron (hotel BE-INT-chimgandarbaza-
  // uz_2026-06-24); it has no create-reservation REST endpoint and no hosted URL
  // that pre-fills dates, so the honest path is a single link into the engine
  // where the guest picks dates + room and pays online.
  const url = `${SITE}/ru/bron`;
  const text = [
    "<b>🆕 Онлайн-бронирование</b>",
    "",
    "Модуль бронирования Exely — выбор дат, номера/топчана и оплата онлайн.",
    "Откройте сами или перешлите ссылку гостю — он забронирует и оплатит сам:",
    "",
    url,
  ].join("\n");
  const keyboard: InlineKeyboard = [
    [{ text: "🌐 Открыть онлайн-бронирование", url }],
    [{ text: "☰ Меню", callback_data: "menu" }],
  ];
  return { text, keyboard };
}

async function renderPing(): Promise<View> {
  const res = await pingPms();
  const base = process.env.EXELY_API_BASE?.trim() || "connect.hopenapi.com/api/exelypms/v1";
  const keyboard: InlineKeyboard = [[{ text: "🔄 Ещё раз", callback_data: "ping" }, { text: "☰ Меню", callback_data: "menu" }]];
  if (res.ok) {
    return {
      text: [
        "<b>🔌 Диагностика API</b>",
        "",
        "✅ Соединение с Exely WebPMS установлено.",
        `Номеров получено: <b>${res.data.length}</b>`,
        `Хост: <code>${esc(base)}</code>`,
      ].join("\n"),
      keyboard,
    };
  }
  return {
    text: [
      "<b>🔌 Диагностика API</b>",
      "",
      "❌ Нет доступа к Exely WebPMS.",
      `Ошибка: <code>${esc(res.error)}</code>`,
      `Хост: <code>${esc(base)}</code>`,
      "",
      "Проверьте ключ <code>EXELY_API_KEY</code> и хост <code>EXELY_API_BASE</code>, либо уточните у поддержки Exely адрес API и нужен ли whitelisting IP.",
    ].join("\n"),
    keyboard,
  };
}

function apiError(what: string, error: string, status?: number): string {
  return [
    `<b>⚠️ Не удалось получить ${what}</b>`,
    "",
    `Exely API вернул ошибку${status ? ` (HTTP ${status})` : ""}:`,
    `<code>${esc(error)}</code>`,
    "",
    "Попробуйте позже или запустите «Диагностика API».",
  ].join("\n");
}

// ── dispatch ──────────────────────────────────────────────────────────────────

async function viewFor(action: string): Promise<View> {
  const [cmd, ...args] = action.split(":");
  switch (cmd) {
    case "menu":
      return { text: menuText(), keyboard: menuKeyboard() };
    case "av":
      return renderAvailability(args[0] || todayISO());
    case "fin":
      return renderFinance(args[0] || todayISO(), args[1] || todayISO());
    case "gf":
      return renderGuests(args[0] || todayISO(), args[1] || todayISO());
    case "book":
      return renderBook();
    case "ping":
      return renderPing();
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
    case "/svobodno":
    case "/rooms":
      return "av";
    case "/dengi":
    case "/money":
      return "fin";
    case "/gosti":
    case "/guests":
      return "gf";
    case "/bron":
    case "/book":
      return "book";
    case "/ping":
      return "ping";
    default:
      return null;
  }
}

// ── Telegram update entry point ───────────────────────────────────────────────

type TgUpdate = {
  message?: { chat: { id: number }; from?: { id: number }; text?: string };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

/**
 * Handle one Telegram update. `authorized(userId)` decides access; unauthorized
 * users get a short refusal and nothing else.
 */
export async function handleStaffUpdate(
  update: TgUpdate,
  authorized: (userId: number) => boolean,
): Promise<void> {
  // Callback (button taps) — edit the message in place.
  if (update.callback_query) {
    const cq = update.callback_query;
    const userId = cq.from.id;
    if (!authorized(userId)) {
      await answerCallbackQuery(cq.id, "Доступ только для персонала.");
      return;
    }
    await answerCallbackQuery(cq.id);
    if (!cq.message) return;
    const view = await viewFor(cq.data || "menu");
    await editMessageText(cq.message.chat.id, cq.message.message_id, view.text, {
      reply_markup: { inline_keyboard: view.keyboard },
    });
    return;
  }

  // Text message / command.
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const userId = update.message.from?.id ?? chatId;
    if (!authorized(userId)) {
      await sendMessage(
        chatId,
        [
          "🔒 Доступ к панели персонала CHIMGAN DARBAZA закрыт.",
          "",
          `Ваш Telegram ID: <code>${userId}</code>`,
          "Передайте его администратору, чтобы получить доступ.",
        ].join("\n"),
      );
      return;
    }
    const action = commandToAction(update.message.text);
    const view = await viewFor(action ?? "menu");
    await sendMessage(chatId, view.text, { reply_markup: { inline_keyboard: view.keyboard } });
  }
}
