/**
 * Minimal Telegram Bot API helper for the STAFF bot (no SDK, plain fetch).
 *
 * This is a separate bot from anything guest-facing. Its token lives in
 * TELEGRAM_STAFF_BOT_TOKEN. All calls are best-effort: a failed Telegram
 * request is logged and swallowed so a webhook handler never 500s back to
 * Telegram (which would make Telegram retry the same update forever).
 */

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
};

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const t = token();
  if (!t) {
    console.error("[telegram] TELEGRAM_STAFF_BOT_TOKEN not set");
    return null;
  }
  try {
    const res = await fetch(`${API}/bot${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok) {
      console.error(`[telegram] ${method} failed:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (e) {
    console.error(`[telegram] ${method} error:`, e);
    return null;
  }
}

export function sendMessage(chatId: number | string, text: string, opts: SendOpts = {}) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: opts.disable_web_page_preview ?? true,
    ...(opts.reply_markup ? { reply_markup: opts.reply_markup } : {}),
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
export function sendChatAction(chatId: number | string, action = "typing") {
  return call("sendChatAction", { chat_id: chatId, action });
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
