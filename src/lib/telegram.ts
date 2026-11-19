/**
 * Minimal Telegram Bot API helper for the STAFF bot (no SDK, plain fetch).
 *
 * This is a separate bot from anything guest-facing. Its token lives in
 * TELEGRAM_STAFF_BOT_TOKEN. All calls are best-effort: a failed Telegram
 * request is logged and swallowed so a webhook handler never 500s back to
 * Telegram (which would make Telegram retry the same update forever).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const API = "https://api.telegram.org";

function token(): string | null {
  return process.env.TELEGRAM_STAFF_BOT_TOKEN?.trim() || null;
}

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = InlineButton[][];

type SendOpts = {
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: { inline_keyboard: InlineKeyboard };
  disable_web_page_preview?: boolean;
  /**
   * Telegram Business. Present only when replying inside a chat the bot handles
   * on the hotel account's behalf — without it Telegram has no idea whose voice
   * to speak in and rejects the send.
   */
  business_connection_id?: string;
};

/**
 * Группа стала супергруппой — у неё новый id.
 *
 * Telegram сам превращает обычную группу в супергруппу, когда в ней меняют
 * некоторые настройки (видимость истории, права админов и т. п.). Старый id
 * после этого не принимает сообщений: «group chat was upgraded to a supergroup
 * chat», а новый приходит в parameters.migrate_to_chat_id. Так 11.11.2026
 * группа «Chimgan Darbaza - Заявки» перестала получать заявки — 34 штуки
 * за неделю ушли только в архив, гость при этом видел «Заявка принята».
 *
 * Теперь отправка сама повторяется в новый чат и запоминает его в файле
 * (MIGRATIONS_FILE) — и после перезапуска сайта шлёт сразу в новый чат. До
 * 19.11.2026 переезд помнился только до перезапуска: после каждой выкладки
 * первая заявка снова стучалась в старый id, а группа получала «сменила ID»
 * и тревогу сторожа — ложную, заявка-то доходила.
 */
const migratedChats = new Map<string, number | string>();
const MIGRATIONS_FILE = path.join(
  process.env.BLOB_DIR?.trim() || "/var/lib/chimgan-blob",
  "site",
  "telegram-chat-migrations.json",
);
let migrationsLoaded: Promise<void> | null = null;

function loadMigrations(): Promise<void> {
  migrationsLoaded ??= fs
    .readFile(MIGRATIONS_FILE, "utf8")
    .then((raw) => {
      for (const [from, to] of Object.entries(JSON.parse(raw) as Record<string, number | string>)) {
        migratedChats.set(from, to);
      }
    })
    .catch(() => undefined); // файла нет — переездов не было
  return migrationsLoaded;
}

async function saveMigrations(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(MIGRATIONS_FILE), { recursive: true });
    await fs.writeFile(MIGRATIONS_FILE, JSON.stringify(Object.fromEntries(migratedChats)), "utf8");
  } catch (e) {
    console.error("[telegram] не удалось сохранить новый id группы:", e);
  }
}

/** Последняя ошибка Telegram — для текста тревоги (lib/alerts.ts). */
let lastError = "";
export function lastTelegramError(): string {
  return lastError;
}

type ApiReply<T> = { ok: boolean; result?: T; description?: string; parameters?: { migrate_to_chat_id?: number } };

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const t = token();
  if (!t) {
    console.error("[telegram] TELEGRAM_STAFF_BOT_TOKEN not set");
    return null;
  }
  const original = body.chat_id;
  await loadMigrations();
  const known = original !== undefined ? migratedChats.get(String(original)) : undefined;
  const payload = known !== undefined ? { ...body, chat_id: known } : body;
  try {
    let data = await post<T>(t, method, payload);
    const movedTo = data.parameters?.migrate_to_chat_id;
    if (!data.ok && movedTo !== undefined && original !== undefined && String(payload.chat_id) !== String(movedTo)) {
      migratedChats.set(String(original), movedTo);
      await saveMigrations();
      console.error(
        `[telegram] chat ${String(original)} was upgraded to supergroup ${movedTo} — sending there; set TELEGRAM_ADMIN_CHAT_ID=${movedTo}`,
      );
      data = await post<T>(t, method, { ...body, chat_id: movedTo });
      // Один раз — при первом обнаружении переезда (дальше id берётся из файла).
      await post(t, "sendMessage", {
        chat_id: movedTo,
        parse_mode: "HTML",
        text:
          "ℹ️ <b>Эта группа сменила ID</b> — Telegram перевёл её в супергруппу. Заявки уже идут сюда, " +
          `но в настройках сервера стоит старый номер: обновите <code>TELEGRAM_ADMIN_CHAT_ID=${movedTo}</code>.`,
      }).catch(() => undefined);
    }
    if (!data.ok) {
      lastError = data.description ?? "unknown error";
      console.error(`[telegram] ${method} failed:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.error(`[telegram] ${method} error:`, e);
    return null;
  }
}

async function post<T>(t: string, method: string, body: Record<string, unknown>): Promise<ApiReply<T>> {
  const res = await fetch(`${API}/bot${t}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return (await res.json()) as ApiReply<T>;
}

export function sendMessage(chatId: number | string, text: string, opts: SendOpts = {}) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    ...(opts.reply_markup ? { reply_markup: opts.reply_markup } : {}),
    ...(opts.business_connection_id ? { business_connection_id: opts.business_connection_id } : {}),
  });
}

export function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  opts: SendOpts = {},
) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    ...(opts.reply_markup ? { reply_markup: opts.reply_markup } : {}),
  });
}

export function answerCallbackQuery(id: string, text?: string) {
  return call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
}

/** Show "typing…" while the AI thinks (auto-expires after ~5s on Telegram's side). */
export function sendChatAction(chatId: number | string, action = "typing", businessConnectionId?: string) {
  return call("sendChatAction", {
    chat_id: chatId,
    action,
    ...(businessConnectionId ? { business_connection_id: businessConnectionId } : {}),
  });
}

/** Photo card by public URL, with an HTML caption and optional buttons. */
export function sendPhoto(
  chatId: number | string,
  photoUrl: string,
  caption: string,
  opts: SendOpts = {},
) {
  return call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: opts.parse_mode ?? "HTML",
    ...(opts.reply_markup ? { reply_markup: opts.reply_markup } : {}),
  });
}

/** Album of photos (2-10) by public URLs; per-photo captions supported. */
export function sendMediaGroup(
  chatId: number | string,
  photos: { url: string; caption?: string }[],
) {
  return call("sendMediaGroup", {
    chat_id: chatId,
    media: photos.slice(0, 10).map((p) => ({
      type: "photo",
      media: p.url,
      ...(p.caption ? { caption: p.caption, parse_mode: "HTML" } : {}),
    })),
  });
}

/** Escape user/content text for safe HTML parse_mode. */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
