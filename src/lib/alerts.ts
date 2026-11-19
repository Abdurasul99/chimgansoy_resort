import { lastTelegramError, sendMessage } from "@/lib/telegram";

/**
 * Тревога о сбое доставки заявки — по каналу, который не зависит от группы
 * заявок.
 *
 * 11–19.11.2026 группа «Chimgan Darbaza - Заявки» сменила ID, и 32 заявки
 * гостей неделю не доходили: гость видел «Заявка принята», почта тоже не
 * уходит, а узнали случайно. Поэтому при любом отказе группы:
 *
 *  1. Партнёрский бот (@chimgandarbaza_partners_bot) пишет в свою группу
 *     «ChimganDarbaza Partners» — другой токен, другой чат: поломка основной
 *     группы его не задевает.
 *  2. Если задан TELEGRAM_ALERT_CHAT_IDS (личные чаты ответственных, через
 *     запятую; человек должен один раз написать боту /start) — туда же через
 *     основного бота.
 *
 * В тревоге — сама заявка целиком, чтобы её можно было обработать сразу.
 * Сторож на сервере (scripts/monitor/chimgan-monitor.py) дополнительно
 * проверяет журнал, сайт и сертификаты каждые 10 минут.
 */
const LIMIT = 3500; // у Telegram 4096 символов на сообщение — с запасом на шапку

export async function alertDeliveryFailure(form: string, requestHtml: string): Promise<boolean> {
  const reason = lastTelegramError() || "нет ответа";
  const body = requestHtml.length > LIMIT ? `${requestHtml.slice(0, LIMIT)}…` : requestHtml;
  const text = [
    "🚨 <b>Сбой: заявка с сайта НЕ дошла в группу заявок</b>",
    `Форма: ${escapeHtml(form)}`,
    `Ответ Telegram: ${escapeHtml(reason)}`,
    "",
    "Заявка целиком — обработайте её отсюда:",
    "",
    body,
  ].join("\n");
  return alert(text);
}

/** Произвольное сообщение по запасным каналам. Возвращает, дошло ли хоть куда-то. */
export async function alert(text: string): Promise<boolean> {
  const results = await Promise.all([viaPartnersBot(text), ...personalChats().map((id) => sendMessage(id, text).then(Boolean))]);
  const ok = results.some(Boolean);
  if (!ok) console.error("[alert] тревогу не удалось доставить ни в один запасной канал");
  return ok;
}

function personalChats(): string[] {
  return (process.env.TELEGRAM_ALERT_CHAT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function viaPartnersBot(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_PARTNERS_BOT_TOKEN?.trim();
  const chats = (process.env.TELEGRAM_PARTNERS_CHAT_ID ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!token || chats.length === 0) return false;
  const sent = await Promise.all(
    chats.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
          signal: AbortSignal.timeout(10_000),
        });
        const data = (await res.json()) as { ok: boolean; description?: string };
        if (!data.ok) console.error(`[alert] партнёрский бот → ${chatId}: ${data.description}`);
        return data.ok;
      } catch (e) {
        console.error(`[alert] партнёрский бот → ${chatId}:`, e);
        return false;
      }
    }),
  );
  return sent.some(Boolean);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
