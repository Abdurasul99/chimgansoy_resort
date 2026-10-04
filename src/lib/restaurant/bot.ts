import { answerCallbackQuery, type TgBot } from "@/lib/telegram";
import { CANCEL_REASONS, type OrderStatus, type TableStatus } from "./model";
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS_LABEL,
  TABLE_REASONS,
  TABLE_REASON_LABEL,
  TABLE_STATUS_LABEL,
} from "./labels";
import { refreshOrderMessages, refreshTableMessages, staffAllowed } from "./notify";
import { setOrderStatus, setTableStatus, type Actor } from "./store";

/**
 * Кнопки статусов ресторана в Telegram.
 *
 * Нажатие приходит тому боту, который прислал карточку: в группе ресторана —
 * боту ресторана (src/lib/restaurant/bot-updates.ts), в чате комплекса —
 * общему, где это вызывается из src/lib/staff-bot.ts ДО общего разбора кнопок:
 * иначе неизвестный там префикс «ro:» уходит в default и затирает карточку
 * заказа гостевым меню бота.
 */
export type TgCallback = {
  id: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
  data?: string;
  message?: { chat: { id: number }; message_id: number };
};

const ORDER_ACTIONS: Record<string, OrderStatus> = { c: "confirmed", k: "cooking", r: "ready", d: "done" };
const TABLE_ACTIONS: Record<string, TableStatus> = { c: "confirmed", d: "done" };

/** «Азиз Каримов @aziz (tg 123)» — кто нажал, для истории. */
export function tgActorName(from: TgCallback["from"]): string {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
  return [name || "Сотрудник", from.username ? `@${from.username}` : "", `(tg ${from.id})`]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);
}

const PATTERN = /^r([ot]):(\d{1,12}):([a-z])(\d)?$/;

/** true — это была кнопка ресторана, и она обработана (успешно или нет). */
export async function handleRestaurantCallback(cq: TgCallback, bot: TgBot = "staff"): Promise<boolean> {
  if (!PATTERN.test(cq.data ?? "")) return false;
  // Ответ на нажатие принимает только бот, которому оно пришло.
  const answer = (text?: string) => answerCallbackQuery(cq.id, text, bot);
  try {
    return await handle(cq, answer);
  } catch (e) {
    // База не ответила — говорим об этом сразу, а не оставляем кнопку крутиться.
    console.error(`[restaurant] кнопка ${cq.data} не сработала:`, e);
    await answer("Не удалось — попробуйте ещё раз или откройте панель").catch(() => null);
    return true;
  }
}

async function handle(cq: TgCallback, answer: (text?: string) => Promise<unknown>): Promise<boolean> {
  const m = PATTERN.exec(cq.data ?? "");
  if (!m) return false;
  const [, kind, idRaw, code, idxRaw] = m;
  const id = Number(idRaw);

  if (!cq.message || !staffAllowed(cq.message.chat.id, cq.from.id)) {
    console.warn(`[restaurant] кнопка ${cq.data} отклонена: чат ${cq.message?.chat.id}, пользователь ${cq.from.id}`);
    await answer("Нет доступа");
    return true;
  }

  const here = { chat: String(cq.message.chat.id), message: cq.message.message_id };
  const actor: Actor = { name: tgActorName(cq.from), via: "telegram" };
  const idx = idxRaw === undefined ? null : Number(idxRaw);

  if (kind === "o") {
    // Меню причин и возврат из него меняют только эту карточку.
    if (code === "x" && idx === null) {
      await answer("Выберите причину отмены");
      await refreshOrderMessages(id, "cancel", here);
      return true;
    }
    if (code === "b") {
      await answer();
      await refreshOrderMessages(id, "main", here);
      return true;
    }
    let to: OrderStatus | undefined = ORDER_ACTIONS[code];
    let reason: string | undefined;
    if (code === "x" && idx !== null && CANCEL_REASONS[idx]) {
      to = "cancelled";
      reason = CANCEL_REASON_LABEL[CANCEL_REASONS[idx]];
    }
    if (!to) {
      await answer("Неизвестная кнопка");
      return true;
    }
    const res = await setOrderStatus(id, to, actor, reason);
    console.log(`[restaurant] заказ ${id} → ${to} (${res.ok ? "ок" : res.error}) · ${actor.name}`);
    await answer(
      res.ok
        ? `Статус: ${ORDER_STATUS_LABEL[to]}`
        : res.error === "not_found"
          ? "Заказ не найден"
          : `Уже изменён: ${ORDER_STATUS_LABEL[res.current as OrderStatus] ?? res.current}`,
    );
    await refreshOrderMessages(id);
    return true;
  }

  // Столы.
  if ((code === "x" || code === "n") && idx === null) {
    await answer(code === "n" ? "Причина отказа?" : "Причина отмены?");
    await refreshTableMessages(id, code === "n" ? "decline" : "cancel", here);
    return true;
  }
  if (code === "b") {
    await answer();
    await refreshTableMessages(id, "main", here);
    return true;
  }
  let to: TableStatus | undefined = TABLE_ACTIONS[code];
  let reason: string | undefined;
  if ((code === "x" || code === "n") && idx !== null && TABLE_REASONS[idx]) {
    to = code === "n" ? "declined" : "cancelled";
    reason = TABLE_REASON_LABEL[TABLE_REASONS[idx]];
  }
  if (!to) {
    await answer("Неизвестная кнопка");
    return true;
  }
  const res = await setTableStatus(id, to, actor, reason);
  console.log(`[restaurant] стол ${id} → ${to} (${res.ok ? "ок" : res.error}) · ${actor.name}`);
  await answer(
    res.ok
      ? `Статус: ${TABLE_STATUS_LABEL[to]}`
      : res.error === "not_found"
        ? "Заявка не найдена"
        : `Уже изменена: ${TABLE_STATUS_LABEL[res.current as TableStatus] ?? res.current}`,
  );
  await refreshTableMessages(id);
  return true;
}
