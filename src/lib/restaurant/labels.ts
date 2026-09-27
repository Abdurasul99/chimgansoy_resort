import type { CancelReason, Channel, OrderMode, OrderStatus, TableStatus } from "./model";

/**
 * Подписи для персонала — одинаковые в Telegram и в панели.
 *
 * Отдельным модулем без базы и без node:crypto, чтобы их могли импортировать
 * клиентские компоненты админки. В src/lib/pms.ts подписи лежат рядом с pg, и
 * каждый список в админке копирует их себе — здесь этой ошибки не повторяем.
 */
export const MODE_LABEL: Record<OrderMode, string> = {
  takeaway: "Самовывоз",
  delivery: "Доставка",
  room: "В номер",
  preorder: "Предзаказ к визиту",
};

export const MODE_EMOJI: Record<OrderMode, string> = {
  takeaway: "🥡",
  delivery: "🚗",
  room: "🛖",
  preorder: "🍽",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  hall: "Зал",
  takeaway: "Самовывоз",
  delivery: "Доставка",
  room: "В номер",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  cooking: "Готовится",
  ready: "Готова",
  done: "Выполнена",
  cancelled: "Отменена",
};

export const ORDER_STATUS_EMOJI: Record<OrderStatus, string> = {
  new: "🆕",
  confirmed: "✅",
  cooking: "👨‍🍳",
  ready: "🔔",
  done: "✔️",
  cancelled: "❌",
};

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  declined: "Отказ",
  cancelled: "Отменена",
  done: "Состоялась",
};

export const TABLE_STATUS_EMOJI: Record<TableStatus, string> = {
  new: "🆕",
  confirmed: "✅",
  declined: "🚫",
  cancelled: "❌",
  done: "✔️",
};

/** Кнопка действия — глагол, а не название статуса. */
export const ORDER_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Подтвердить",
  cooking: "Готовится",
  ready: "Готова",
  done: "Выполнена",
  cancelled: "Отменить",
};

export const TABLE_ACTION_LABEL: Partial<Record<TableStatus, string>> = {
  confirmed: "Подтвердить",
  declined: "Отказать",
  cancelled: "Отменить",
  done: "Состоялась",
};

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  guest: "Гость отказался",
  unavailable: "Блюда нет в наличии",
  unreachable: "Не дозвонились",
  zone: "Вне зоны доставки",
  not_guest: "Проживание не подтвердилось",
  other: "Другая причина",
};

/** Причины отказа или отмены брони стола. */
export const TABLE_REASONS = ["full", "guest", "unreachable", "other"] as const;
export type TableReason = (typeof TABLE_REASONS)[number];

export const TABLE_REASON_LABEL: Record<TableReason, string> = {
  full: "Нет свободных столов",
  guest: "Гость отказался",
  unreachable: "Не дозвонились",
  other: "Другая причина",
};

export const UNIT_LABEL = { aframe: "A-frame", chalet: "Chalet" } as const;

/** Tailwind-тона чипов статуса в панели — те же, что у броней домиков. */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-[var(--sun)] text-[var(--on-accent)]",
  confirmed: "bg-[var(--sun)]/25 text-[var(--sun-dark)]",
  cooking: "bg-[#ff6b2c]/15 text-[#c2410c]",
  ready: "bg-[var(--green,#3f7d52)]/15 text-[var(--green,#3f7d52)]",
  done: "bg-[var(--mist)] text-[var(--muted)]",
  cancelled: "bg-[var(--rose,#b4413c)]/12 text-[var(--rose,#b4413c)]",
};

export const TABLE_STATUS_TONE: Record<TableStatus, string> = {
  new: "bg-[var(--sun)] text-[var(--on-accent)]",
  confirmed: "bg-[var(--green,#3f7d52)]/15 text-[var(--green,#3f7d52)]",
  declined: "bg-[var(--rose,#b4413c)]/12 text-[var(--rose,#b4413c)]",
  cancelled: "bg-[var(--line)] text-[var(--muted)]",
  done: "bg-[var(--mist)] text-[var(--muted)]",
};

/** «27.09 19:30» из «2026-09-27 19:30»; «как можно скорее» из «asap». */
export function timeLabel(t: string): string {
  if (!t || t === "asap") return "как можно скорее";
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})$/.exec(t);
  return m ? `${m[3]}.${m[2]} ${m[4]}` : t;
}

/** Дата и время по Ташкенту для истории и карточек: «25.09 18:03». */
export function stamp(isoString: string): string {
  const t = Date.parse(isoString);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t + 5 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
