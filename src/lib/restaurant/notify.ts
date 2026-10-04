import { botToken, editMessageText, esc, sendMessage, type InlineKeyboard, type TgBot } from "@/lib/telegram";
import { adminChatIds } from "@/lib/request-delivery";
import { money } from "@/lib/tariff";
import { CANCEL_REASONS, type Order, type RestaurantSettings, type StatusLogEntry, type TableRequest } from "./model";
import {
  CANCEL_REASON_LABEL,
  MODE_EMOJI,
  MODE_LABEL,
  ORDER_ACTION_LABEL,
  ORDER_STATUS_EMOJI,
  ORDER_STATUS_LABEL,
  TABLE_ACTION_LABEL,
  TABLE_REASONS,
  TABLE_REASON_LABEL,
  TABLE_STATUS_EMOJI,
  TABLE_STATUS_LABEL,
  UNIT_LABEL,
  stamp,
  timeLabel,
} from "./labels";
import { ORDER_TRANSITIONS, TABLE_TRANSITIONS, DEFAULT_SETTINGS } from "./rules";
import {
  claimNotify,
  getOrder,
  getTable,
  history,
  isNotified,
  markNotified,
  pendingNotifications,
  readSettings,
  releaseNotify,
  savePartial,
  tgMessages,
} from "./store";

/**
 * Заказы и столы — в Telegram ресторана, с кнопками статусов.
 *
 * Чат — TELEGRAM_RESTAURANT_CHAT_ID, если ресторан завёл свою группу; иначе
 * TELEGRAM_ADMIN_CHAT_ID комплекса. В чаты ресторана пишет свой бот
 * @chimgandarbaza_restaurant_bot (TELEGRAM_RESTAURANT_BOT_TOKEN), в чат
 * комплекса — общий бот заявок (TELEGRAM_STAFF_BOT_TOKEN). Номера сообщений
 * сохраняются в заказе: смена статуса — в панели или кнопкой — переписывает
 * ту же карточку, и в чате не растёт лента из «подтверждена», «готовится»,
 * «готова».
 */

function split(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    // Любое целое: отброшенный «неправильный» id превращал список сотрудников
    // в «пускать всех» — пустой список значит «без ограничений».
    .filter((s) => /^-?\d{1,20}$/.test(s));
}

export function ownRestaurantChats(): string[] {
  return split(process.env.TELEGRAM_RESTAURANT_CHAT_ID);
}

/** Куда уходит новый заказ. */
export function restaurantChats(settings: Pick<RestaurantSettings, "notifyHotel">): string[] {
  const own = ownRestaurantChats();
  const hotel = adminChatIds().filter((s) => /^-?\d{1,20}$/.test(s));
  if (own.length === 0) return hotel;
  return settings.notifyHotel ? [...new Set([...own, ...hotel])] : own;
}

/**
 * Кто может нажимать кнопки статусов.
 *
 * Бот публичный — им пользуются гости. Кнопка работает только в чатах, куда
 * бот сам присылает заказы, а если задан TELEGRAM_RESTAURANT_STAFF_IDS — ещё и
 * только у перечисленных сотрудников. Проверка по чату обязательна: callback
 * можно прислать и из чужого клиента, подделав данные кнопки.
 */
export function staffAllowed(chatId: number | string, userId: number | string): boolean {
  const chats = new Set([...ownRestaurantChats(), ...adminChatIds()]);
  if (!chats.has(String(chatId))) return false;
  const users = split(process.env.TELEGRAM_RESTAURANT_STAFF_IDS);
  return users.length === 0 || users.includes(String(userId));
}

export function restaurantBotReady(): boolean {
  return Boolean(botToken("restaurant"));
}

/**
 * Какой бот пишет в этот чат.
 *
 * Карточку может переписать только тот бот, который её отправил, поэтому выбор
 * зависит от чата, а не от заказа: группа ресторана — бот ресторана (если его
 * токен задан), чат комплекса — общий бот. Без токена ресторана всё идёт через
 * общий бот, как до появления отдельного.
 */
export function botFor(chatId: number | string): TgBot {
  return restaurantBotReady() && ownRestaurantChats().includes(String(chatId)) ? "restaurant" : "staff";
}

export function telegramReady(): boolean {
  return Boolean(botToken("staff") || botToken("restaurant"));
}

function adminLink(path: string): string | null {
  const host = process.env.ADMIN_HOST?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return host ? `https://${host}${path}` : null;
}

function lastLine(last: StatusLogEntry | undefined, label: (status: string) => string): string[] {
  if (!last || last.via === "site") return [];
  const who = `${last.byWhom} (${last.via === "telegram" ? "Telegram" : "панель"})`;
  const what = last.from === last.to ? last.reason : `${label(last.to)}${last.reason ? ` — ${last.reason}` : ""}`;
  return ["", `<i>Последнее изменение: ${esc(what)} · ${esc(who)} · ${stamp(last.at)}</i>`];
}

// ─── Тексты ────────────────────────────────────────────────────────────────

/** Потолок Telegram — 4096 символов; запас на строку «последнее изменение». */
const TG_LIMIT = 3900;
const MAX_ITEM_LINES = 40;

function clip(text: string): string {
  return text.length <= TG_LIMIT ? text : `${text.slice(0, TG_LIMIT - 40)}\n…\n<i>полностью — в панели</i>`;
}

function short(v: string, max: number): string {
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

export function orderText(o: Order, last?: StatusLogEntry): string {
  const where: string[] = [];
  if (o.mode === "room" && o.details.unitType) {
    where.push(`${UNIT_LABEL[o.details.unitType]} №${esc(o.details.unitNo ?? "")}`);
  }
  if (o.mode === "delivery") {
    if (o.details.locality) where.push(esc(o.details.locality));
    if (o.details.address) where.push(esc(o.details.address));
  }

  const feeLine =
    o.mode === "delivery" || o.mode === "room"
      ? `<b>${o.mode === "delivery" ? "Доставка" : "Подача в номер"}:</b> ${
          o.feePending ? "уточнить у гостя" : o.fee ? `${money(o.fee)} сум` : "бесплатно"
        }`
      : null;

  const lines = [
    `${MODE_EMOJI[o.mode]} <b>Заказ #${o.number}</b>${o.isTest ? " · 🧪 ТЕСТ" : ""}`,
    `<b>Статус:</b> ${ORDER_STATUS_EMOJI[o.status]} ${ORDER_STATUS_LABEL[o.status]}${
      o.status === "cancelled" && o.cancelReason ? ` — ${esc(o.cancelReason)}` : ""
    }`,
    `<b>Способ:</b> ${MODE_LABEL[o.mode]}`,
    ...(where.length ? [`<b>Куда:</b> ${where.join(", ")}`] : []),
    `<b>Время:</b> ${timeLabel(o.desiredTime)}${o.confirmedTime ? ` · подтверждено: ${esc(o.confirmedTime)}` : ""}`,
    ...(o.details.guests ? [`<b>Гостей:</b> ${o.details.guests}`] : []),
    "",
    `<b>Имя:</b> ${esc(o.name)}`,
    // Номер отдельной строкой и без обвеса — так Telegram предлагает позвонить.
    `📞 <b>Телефон:</b> ${esc(o.phone)}`,
    "",
    "<b>Состав:</b>",
    ...o.items
      .slice(0, MAX_ITEM_LINES)
      .map((i) => `${i.qty} × ${esc(i.title)}${i.portion ? ` (${esc(i.portion)})` : ""} — ${money(i.qty * i.price)}`),
    ...(o.items.length > MAX_ITEM_LINES ? [`<i>… ещё ${o.items.length - MAX_ITEM_LINES} поз. — в панели</i>`] : []),
    "",
    `<b>Блюда:</b> ${money(o.subtotal)} сум`,
    ...(feeLine ? [feeLine] : []),
    `<b>Итого:</b> ${money(o.total)} сум${o.feePending ? " + сбор (уточнить)" : ""}`,
    `<b>Оплата:</b> ${o.paymentStatus === "paid" ? "оплачен" : "не оплачен"}`,
    ...(o.comment ? ["", `<b>Комментарий:</b> ${esc(short(o.comment, 600))}`] : []),
    ...lastLine(last, (x) => ORDER_STATUS_LABEL[x as Order["status"]] ?? x),
    "",
    `<i>${stamp(o.createdAt)} · с сайта · язык гостя: ${esc(o.locale)}${o.source ? ` · пришёл из: ${esc(o.source)}` : ""}</i>`,
  ];
  return clip(lines.join("\n"));
}

export function tableText(t: TableRequest, last?: StatusLogEntry): string {
  const [y, m, d] = t.date.split("-");
  return [
    `🪑 <b>Стол #${t.number}</b>${t.isTest ? " · 🧪 ТЕСТ" : ""}`,
    `<b>Статус:</b> ${TABLE_STATUS_EMOJI[t.status]} ${TABLE_STATUS_LABEL[t.status]}${
      (t.status === "declined" || t.status === "cancelled") && t.cancelReason ? ` — ${esc(t.cancelReason)}` : ""
    }`,
    `<b>Когда:</b> ${d}.${m}.${y} в ${esc(t.time)}`,
    `<b>Гостей:</b> ${t.adults}${t.kids ? ` + дети ${t.kids}` : ""}`,
    "",
    `<b>Имя:</b> ${esc(t.name)}`,
    `📞 <b>Телефон:</b> ${esc(t.phone)}`,
    ...(t.comment ? ["", `<b>Комментарий:</b> ${esc(short(t.comment, 600))}`] : []),
    ...lastLine(last, (x) => TABLE_STATUS_LABEL[x as TableRequest["status"]] ?? x),
    "",
    `<i>Бронь не действует, пока её не подтвердил администратор.</i>`,
    `<i>${stamp(t.createdAt)} · с сайта · язык гостя: ${esc(t.locale)}${t.source ? ` · пришёл из: ${esc(t.source)}` : ""}</i>`,
  ].join("\n");
}

// ─── Кнопки ────────────────────────────────────────────────────────────────

/** Буква действия в callback_data: коротко, лимит Telegram — 64 байта. */
export const ORDER_CODE = { confirmed: "c", cooking: "k", ready: "r", done: "d" } as const;
export const TABLE_CODE = { confirmed: "c", done: "d" } as const;

export function orderKeyboard(o: Pick<Order, "id" | "status">, view: "main" | "cancel" = "main"): InlineKeyboard {
  if (view === "cancel") {
    const rows: InlineKeyboard = [];
    CANCEL_REASONS.forEach((r, i) => {
      const btn = { text: CANCEL_REASON_LABEL[r], callback_data: `ro:${o.id}:x${i}` };
      if (i % 2 === 0) rows.push([btn]);
      else rows[rows.length - 1].push(btn);
    });
    rows.push([{ text: "← Назад", callback_data: `ro:${o.id}:b` }]);
    return rows;
  }
  const next = ORDER_TRANSITIONS[o.status];
  const forward = next
    .filter((s) => s !== "cancelled")
    .map((s) => ({
      text: `${ORDER_STATUS_EMOJI[s]} ${ORDER_ACTION_LABEL[s]}`,
      callback_data: `ro:${o.id}:${ORDER_CODE[s as keyof typeof ORDER_CODE]}`,
    }));
  const rows: InlineKeyboard = [];
  if (forward.length) rows.push(forward);
  if (next.includes("cancelled")) rows.push([{ text: "❌ Отменить", callback_data: `ro:${o.id}:x` }]);
  const link = adminLink(`/admin/restoran?o=${o.id}`);
  if (link) rows.push([{ text: "Открыть в панели", url: link }]);
  return rows;
}

export function tableKeyboard(t: Pick<TableRequest, "id" | "status">, view: "main" | "decline" | "cancel" = "main"): InlineKeyboard {
  if (view !== "main") {
    const prefix = view === "decline" ? "n" : "x";
    const rows: InlineKeyboard = TABLE_REASONS.map((r, i) => [
      { text: TABLE_REASON_LABEL[r], callback_data: `rt:${t.id}:${prefix}${i}` },
    ]);
    rows.push([{ text: "← Назад", callback_data: `rt:${t.id}:b` }]);
    return rows;
  }
  const next = TABLE_TRANSITIONS[t.status];
  const rows: InlineKeyboard = [];
  const first = [];
  if (next.includes("confirmed")) first.push({ text: `✅ ${TABLE_ACTION_LABEL.confirmed}`, callback_data: `rt:${t.id}:c` });
  if (next.includes("done")) first.push({ text: `✔️ ${TABLE_ACTION_LABEL.done}`, callback_data: `rt:${t.id}:d` });
  if (first.length) rows.push(first);
  const second = [];
  if (next.includes("declined")) second.push({ text: `🚫 ${TABLE_ACTION_LABEL.declined}`, callback_data: `rt:${t.id}:n` });
  if (next.includes("cancelled")) second.push({ text: `❌ ${TABLE_ACTION_LABEL.cancelled}`, callback_data: `rt:${t.id}:x` });
  if (second.length) rows.push(second);
  const link = adminLink(`/admin/restoran/stoly?t=${t.id}`);
  if (link) rows.push([{ text: "Открыть в панели", url: link }]);
  return rows;
}

// ─── Отправка ──────────────────────────────────────────────────────────────

async function settingsOrDefault(): Promise<RestaurantSettings> {
  try {
    return await readSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function sendAll(chats: string[], text: string, keyboard: InlineKeyboard) {
  const results = await Promise.all(
    chats.map((chat) =>
      sendMessage(chat, text, { bot: botFor(chat), ...(keyboard.length ? { reply_markup: { inline_keyboard: keyboard } } : {}) }),
    ),
  );
  return results
    .map((r, i) => {
      const id = (r as { message_id?: unknown } | null)?.message_id;
      return typeof id === "number" ? { chat_id: chats[i], message_id: id } : null;
    })
    .filter((m): m is { chat_id: string; message_id: number } => m !== null);
}

export type NotifyResult = "sent" | "partial" | "already" | "busy" | "failed";

/**
 * Отправка карточки по чатам — с учётом уже доставленного.
 *
 * Доставка считается по каждому чату: если группа ресторана не приняла
 * сообщение (бота удалили, группу превратили в супергруппу), а чат комплекса
 * принял, заказ не записывается как доставленный — досылка будет пытаться
 * дослать именно в группу ресторана, а панель показывает «не во все чаты».
 */
async function deliver(
  kind: "order" | "table",
  id: number,
  build: () => Promise<{ text: string; keyboard: InlineKeyboard } | null>,
): Promise<NotifyResult> {
  try {
    if (!telegramReady()) return "failed";
    if (!(await claimNotify(kind, id))) return (await isNotified(kind, id)) ? "already" : "busy";
    const [card, settings, have] = await Promise.all([build(), settingsOrDefault(), tgMessages(kind, id)]);
    const chats = restaurantChats(settings);
    if (!card || chats.length === 0) {
      await releaseNotify(kind, id);
      return "failed";
    }
    const done = new Set(have.map((m) => m.chat_id));
    const missing = chats.filter((c) => !done.has(c));
    const sent = missing.length ? await sendAll(missing, card.text, card.keyboard) : [];
    const all = [...have.filter((m) => chats.includes(m.chat_id)), ...sent];
    if (sent.length === missing.length) {
      await markNotified(kind, id, all);
      return "sent";
    }
    await savePartial(kind, id, all);
    return all.length ? "partial" : "failed";
  } catch (e) {
    console.error(`[restaurant] уведомление (${kind} ${id}) не ушло:`, e);
    return "failed";
  }
}

/**
 * Первое уведомление о заказе. Не бросает: вызывается после того, как заказ
 * уже сохранён, и ошибка здесь не должна стать для гостя «заказ не отправлен».
 */
export async function notifyOrder(id: number): Promise<NotifyResult> {
  return deliver("order", id, async () => {
    const order = await getOrder(id);
    return order ? { text: orderText(order), keyboard: orderKeyboard(order) } : null;
  });
}

export async function notifyTable(id: number): Promise<NotifyResult> {
  return deliver("table", id, async () => {
    const table = await getTable(id);
    return table ? { text: tableText(table), keyboard: tableKeyboard(table) } : null;
  });
}

/** Переписать карточку во всех чатах после смены статуса. */
export async function refreshOrderMessages(id: number, view: "main" | "cancel" = "main", only?: { chat: string; message: number }) {
  try {
    const [order, msgs, log] = await Promise.all([getOrder(id), tgMessages("order", id), history("order", id)]);
    if (!order) return;
    const text = orderText(order, log[log.length - 1]);
    const targets = only ? msgs.filter((m) => m.chat_id === only.chat && m.message_id === only.message) : msgs;
    await Promise.all(
      targets.map((m) => {
        const kb = orderKeyboard(order, only ? view : "main");
        return editMessageText(m.chat_id, m.message_id, text, {
          bot: botFor(m.chat_id),
          ...(kb.length ? { reply_markup: { inline_keyboard: kb } } : {}),
        });
      }),
    );
  } catch (e) {
    console.error(`[restaurant] карточка заказа ${id} не обновлена:`, e);
  }
}

export async function refreshTableMessages(
  id: number,
  view: "main" | "decline" | "cancel" = "main",
  only?: { chat: string; message: number },
) {
  try {
    const [table, msgs, log] = await Promise.all([getTable(id), tgMessages("table", id), history("table", id)]);
    if (!table) return;
    const text = tableText(table, log[log.length - 1]);
    const targets = only ? msgs.filter((m) => m.chat_id === only.chat && m.message_id === only.message) : msgs;
    await Promise.all(
      targets.map((m) => {
        const kb = tableKeyboard(table, only ? view : "main");
        return editMessageText(m.chat_id, m.message_id, text, {
          bot: botFor(m.chat_id),
          ...(kb.length ? { reply_markup: { inline_keyboard: kb } } : {}),
        });
      }),
    );
  } catch (e) {
    console.error(`[restaurant] карточка стола ${id} не обновлена:`, e);
  }
}

/**
 * Досылка того, что не ушло: Telegram лежал, токен не был задан, сеть
 * моргнула. Вызывается после каждого нового заказа и при открытии панели —
 * отдельного планировщика нет, и он не нужен: заказы и так приходят.
 */
export async function retryPendingNotifications(): Promise<void> {
  if (!telegramReady()) return;
  try {
    const [orders, tables] = await Promise.all([pendingNotifications("order"), pendingNotifications("table")]);
    for (const id of orders) await notifyOrder(id);
    for (const id of tables) await notifyTable(id);
  } catch (e) {
    console.error("[restaurant] досылка уведомлений не удалась:", e);
  }
}
