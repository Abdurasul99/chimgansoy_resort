/**
 * Minimal Telegram Bot API helper for the STAFF bot (no SDK, plain fetch).
 *
 * Two bots speak through here: the hotel's own (TELEGRAM_STAFF_BOT_TOKEN) and
 * the restaurant's (TELEGRAM_RESTAURANT_BOT_TOKEN), which posts orders to the
 * restaurant's chat. A call names its bot; without one it is the hotel's. All
 * calls are best-effort: a failed Telegram request is logged and swallowed so
 * a webhook handler never 500s back to Telegram (which would make Telegram
 * retry the same update forever).
 */

const API = "https://api.telegram.org";

export type TgBot = "staff" | "restaurant";

const TOKEN_ENV: Record<TgBot, string> = {
  staff: "TELEGRAM_STAFF_BOT_TOKEN",
  restaurant: "TELEGRAM_RESTAURANT_BOT_TOKEN",
};

export function botToken(bot: TgBot = "staff"): string | null {
  return process.env[TOKEN_ENV[bot]]?.trim() || null;
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
  /** Which bot sends it — the restaurant's messages are edited by the restaurant bot. */
  bot?: TgBot;
};

async function call<T = unknown>(method: string, body: Record<string, unknown>, bot: TgBot = "staff"): Promise<T | null> {
  const t = botToken(bot);
  if (!t) {
    console.error(`[telegram] ${TOKEN_ENV[bot]} not set`);
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
    ...(opts.business_connection_id ? { business_connection_id: opts.business_connection_id } : {}),
  }, opts.bot);
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
  }, opts.bot);
}

export function answerCallbackQuery(id: string, text?: string, bot: TgBot = "staff") {
  return call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) }, bot);
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
