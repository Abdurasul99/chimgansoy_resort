import { adminChatIds } from "@/lib/request-delivery";
import { sendMessage } from "@/lib/telegram";

/**
 * Куда уходят заявки «🤝 Партнёрство».
 *
 * С 11.11.2026 у партнёрского раздела свой бот — @chimgandarbaza_partners_bot
 * (владелец: «для него отдельный будет телеграм»): B2B-заявки не смешиваются с
 * гостевыми бронями в рабочей группе. Токен — TELEGRAM_PARTNERS_BOT_TOKEN, кому
 * слать — TELEGRAM_PARTNERS_CHAT_ID (через запятую можно несколько: личка
 * владельца, группа «Партнёры»). Бот пишет только тем, кто нажал у него
 * «Старт», или в группу, куда его добавили.
 *
 * Пока хоть одной из двух переменных нет — или бот настроен, но не доставил ни
 * в один чат, — заявка идёт в общую группу через служебного бота, как до 11.11:
 * потерять лид из-за недонастроенного бота хуже, чем показать его не в том чате.
 *
 * Возвращает число чатов, куда сообщение дошло.
 */
export async function sendPartnerTelegram(html: string): Promise<number> {
  const token = process.env.TELEGRAM_PARTNERS_BOT_TOKEN?.trim();
  const chats = (process.env.TELEGRAM_PARTNERS_CHAT_ID ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const toStaffGroup = async () => {
    const sent = await Promise.all(adminChatIds().map((id) => sendMessage(id, html)));
    return sent.filter((r) => r !== null).length;
  };

  if (!token || chats.length === 0) return toStaffGroup();

  const results = await Promise.all(
    chats.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
          signal: AbortSignal.timeout(10_000),
        });
        const data = (await res.json()) as { ok: boolean; description?: string };
        if (!data.ok) console.error(`[partners] telegram ${chatId}: ${data.description}`);
        return data.ok;
      } catch (e) {
        console.error(`[partners] telegram ${chatId} error:`, e);
        return false;
      }
    }),
  );
  const delivered = results.filter(Boolean).length;
  // Бот настроен, но не дошло никуда (бота удалили из группы, владелец его
  // заблокировал) — заявка уходит в общую группу, а не пропадает.
  if (delivered === 0) {
    console.error("[partners] партнёрский бот не доставил — отправляю в общую группу");
    return toStaffGroup();
  }
  return delivered;
}
