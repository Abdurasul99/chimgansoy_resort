import { lastTelegramError, sendMessage } from "@/lib/telegram";

/**
 * Тревога о сбое доставки заявки — только через бота заявок.
 *
 * 11–19.11.2026 группа «Chimgan Darbaza - Заявки» сменила ID, и 32 заявки
 * гостей неделю не доходили: гость видел «Заявка принята», а узнали случайно.
 * Если группа не приняла заявку, тот же бот шлёт её целиком с причиной в
 * личные чаты ответственных — TELEGRAM_ALERT_CHAT_IDS, через запятую (человек
 * должен один раз написать боту /start; свой id бот подскажет по /chatid).
 *
 * Партнёрского бота и его группу не трогаем (владелец, 19.11.2026): тревоги
 * идут только по каналам заявок. Сторож на сервере
 * (scripts/monitor/chimgan-monitor.py) дополнительно проверяет журнал, сайт и
 * сертификаты каждые 10 минут.
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

/** Сообщение в личные чаты ответственных через бота заявок. Дошло ли хоть кому-то. */
export async function alert(text: string): Promise<boolean> {
  const chats = alertChats();
  if (chats.length === 0) {
    console.error("[alert] TELEGRAM_ALERT_CHAT_IDS не задан — тревогу некуда отправить (заявка сохранена в архиве)");
    return false;
  }
  const results = await Promise.all(chats.map((id) => sendMessage(id, text)));
  const ok = results.some((r) => r !== null);
  if (!ok) console.error("[alert] тревогу не удалось доставить ни в один личный чат");
  return ok;
}

function alertChats(): string[] {
  return (process.env.TELEGRAM_ALERT_CHAT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
