import { contacts } from "@/content/contacts";
import { answerCallbackQuery, esc, sendMessage } from "@/lib/telegram";
import { handleRestaurantCallback, type TgCallback } from "./bot";
import { ownRestaurantChats } from "./notify";

/**
 * Входящие у бота ресторана @chimgandarbaza_restaurant_bot.
 *
 * Бот служебный: присылает заказы и брони столов в группу ресторана и
 * принимает нажатия кнопок статусов. Разговаривать он не умеет — гостю,
 * который нашёл его поиском, коротко отвечает, куда идти. Для персонала —
 * номер чата: бот не может узнать его сам, а без номера заказы туда не
 * направить. Поэтому он называет номер, как только его добавили в группу,
 * и по команде /id.
 */

type Chat = { id: number; type?: string };

export type RestaurantUpdate = {
  message?: { chat: Chat; text?: string; migrate_to_chat_id?: number };
  callback_query?: TgCallback;
  my_chat_member?: { chat: Chat; new_chat_member?: { status?: string } };
};

const BOT = "restaurant" as const;
const SITE = "https://chimgandarbaza.uz/ru/restaurant";

export function chatIdText(chatId: number): string {
  if (ownRestaurantChats().includes(String(chatId))) {
    return ["✅ <b>Этот чат подключён</b>", "Сюда приходят заказы и брони столов ресторана."].join("\n");
  }
  return [
    "🆔 <b>Номер этого чата</b>",
    "",
    `<code>${chatId}</code>`,
    "",
    "Передайте его администратору сайта — после подключения сюда будут приходить заказы и брони столов с кнопками статусов.",
  ].join("\n");
}

/** «/id@chimgandarbaza_restaurant_bot» → «/id». */
function command(text: string): string | null {
  const first = text.trim().split(/\s+/)[0] ?? "";
  return first.startsWith("/") ? first.split("@")[0].toLowerCase() : null;
}

function send(chatId: number, text: string) {
  return sendMessage(chatId, text, { bot: BOT });
}

export async function handleRestaurantUpdate(update: RestaurantUpdate): Promise<void> {
  const cq = update.callback_query;
  if (cq) {
    // Чужая кнопка здесь не появится — бот присылает только карточки ресторана.
    // Но ответить нужно в любом случае, иначе у человека крутятся часики.
    if (!(await handleRestaurantCallback(cq, BOT))) await answerCallbackQuery(cq.id, undefined, BOT);
    return;
  }

  // Бота добавили в группу — сразу называем её номер, команду искать не нужно.
  const member = update.my_chat_member;
  if (member) {
    const status = member.new_chat_member?.status;
    console.log(`[restaurant-bot] чат ${member.chat.id} (${member.chat.type ?? "?"}): ${status}`);
    if (member.chat.type !== "private" && (status === "member" || status === "administrator")) {
      await send(member.chat.id, chatIdText(member.chat.id));
    }
    return;
  }

  const m = update.message;
  if (!m) return;
  const chatId = m.chat.id;

  // Группа стала супергруппой — у неё новый номер, а по старому заказы больше не дойдут.
  if (m.migrate_to_chat_id) {
    console.warn(`[restaurant-bot] чат ${chatId} стал супергруппой ${m.migrate_to_chat_id}`);
    await send(
      m.migrate_to_chat_id,
      `⚠️ Telegram сделал эту группу супергруппой, и у неё сменился номер.\n\n${chatIdText(m.migrate_to_chat_id)}`,
    );
    return;
  }

  const text = m.text ?? "";
  if (!text) return;
  const cmd = command(text);
  console.log(`[restaurant-bot] чат ${chatId} (${m.chat.type ?? "private"}): ${text.slice(0, 40)}`);

  if (cmd === "/id" || cmd === "/chatid") {
    await send(chatId, chatIdText(chatId));
    return;
  }
  if (cmd === "/start") {
    await send(
      chatId,
      [
        "🍽 <b>Бот ресторана «Сазанчик»</b>",
        "Присылает заказы и брони столов с сайта. Статус меняется кнопками под карточкой — гость сразу видит его на своей странице заказа.",
        "",
        chatIdText(chatId),
      ].join("\n"),
    );
    return;
  }

  // В группе переписывается персонал — молчим, пока не позвали командой.
  if ((m.chat.type ?? "private") !== "private") return;

  await send(
    chatId,
    [
      "Это служебный бот ресторана «Сазанчик» — сообщения здесь не читают.",
      "",
      `Заказать еду или забронировать стол: <a href="${SITE}">chimgandarbaza.uz/restaurant</a>`,
      `Вопросы — @chimgandarbaza_bot или ${esc(contacts.phone)}`,
    ].join("\n"),
  );
}
