import type { LocalizedString } from "@/content/types";

/**
 * Модель ресторана «Сазанчик» — типы и словари статусов.
 *
 * Ресторан живёт внутри сайта CHIMGAN DARBAZA, но данные у него свои и
 * меняются без программиста: меню, цены, доступность и настройки лежат в базе,
 * а не в src/content. Поэтому здесь только форма данных и допустимые значения;
 * сами блюда приходят из таблиц restaurant_* (см. schema.ts).
 *
 * Статусы — строки с CHECK в базе, а не enum Postgres: у брони домиков enum
 * (booking_status), и добавить в него значение можно только отдельной
 * миграцией вне транзакции. Статусы ресторана ещё будут уточняться с кухней.
 */

/**
 * Как гость получает заказ. «Предзаказ к посещению» — блюда к приходу в зал;
 * по ТЗ включается только после согласования регламента, поэтому по умолчанию
 * выключен в настройках.
 */
export const ORDER_MODES = ["takeaway", "delivery", "room", "preorder"] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

/**
 * Где блюдо можно подать. У каждой позиции настраивается отдельно: блюдо с
 * сильным запахом не носят в домик, суп не везут за 40 км.
 */
export const CHANNELS = ["hall", "takeaway", "delivery", "room"] as const;
export type Channel = (typeof CHANNELS)[number];

/** Режим заказа → канал, по которому фильтруется меню. */
export const MODE_CHANNEL: Record<OrderMode, Channel> = {
  takeaway: "takeaway",
  delivery: "delivery",
  room: "room",
  // Предзаказ едят в зале — значит, годится всё, что подают в зале.
  preorder: "hall",
};

/**
 * Доступность позиции.
 *  • available — в наличии, заказывается обычно;
 *  • unavailable — временно нет: видна в меню, но отправить нельзя;
 *  • preorder — только предзаказом к посещению, не обычным заказом.
 */
export const AVAILABILITY = ["available", "unavailable", "preorder"] as const;
export type Availability = (typeof AVAILABILITY)[number];

/** Публикация позиции. Архив не удаляет — старые заказы ссылаются на блюдо. */
export const DISH_STATES = ["published", "hidden", "archived"] as const;
export type DishState = (typeof DISH_STATES)[number];

export const ORDER_STATUSES = ["new", "confirmed", "cooking", "ready", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TABLE_STATUSES = ["new", "confirmed", "declined", "cancelled", "done"] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

/** Причины отмены. ТЗ: причина сохраняется всегда. */
export const CANCEL_REASONS = ["guest", "unavailable", "unreachable", "zone", "not_guest", "other"] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export type Category = {
  id: number;
  title: LocalizedString;
  sort: number;
  visible: boolean;
};

export type Dish = {
  id: number;
  categoryId: number | null;
  title: LocalizedString;
  description: LocalizedString;
  /** «350 г», «1 шт», «0,5 л» — как напишет кухня. */
  portion: string;
  /** Сумы, целое. 0 — цена не указана, такую позицию заказать нельзя. */
  price: number;
  image: string;
  availability: Availability;
  channels: Channel[];
  state: DishState;
  sort: number;
};

/** Публичное состояние раздела. */
export const RESTAURANT_STATES = ["hidden", "announce", "open"] as const;
export type RestaurantState = (typeof RESTAURANT_STATES)[number];

export type RestaurantSettings = {
  /**
   * hidden — раздела нет в меню сайта и в поиске, страница открывается только
   * по прямой ссылке, заказы закрыты (тестовые — из предпросмотра); announce —
   * анонс: пункт в меню сайта, заказы закрыты; open — всё работает по
   * включённым каналам.
   */
  state: RestaurantState;
  name: LocalizedString;
  tagline: LocalizedString;
  about: LocalizedString;
  /** Баннер наверху раздела: «Открытие 10 октября», «Сегодня кухня до 20:00». */
  announcement: LocalizedString;
  /** «HH:MM» или пусто — тогда часы не печатаются, а время выбирается шире. */
  hoursOpen: string;
  hoursClose: string;
  /** Номера ресторана. Пусто — печатается общий номер комплекса. */
  phones: string[];
  instagram: string;
  telegram: string;
  /** Какие виды заказа принимаются сейчас. */
  modes: Record<OrderMode, boolean>;
  tables: boolean;
  /**
   * Сбор за доставку и за подачу в домик. null — не утверждён: корзина пишет
   * «стоимость подтвердит менеджер», а не выдумывает сумму (ТЗ, п. 4).
   */
  deliveryFee: number | null;
  roomFee: number | null;
  /** Зона и условия доставки словами — пока радиус не утверждён. */
  deliveryNote: LocalizedString;
  /** За сколько часов до визита принимается предзаказ. */
  preorderLeadHours: number;
  /** Главное фото раздела; пусто — берётся кадр комплекса. */
  heroImage: string;
  /** Дублировать заказы ответственному CHIMGAN DARBAZA (TELEGRAM_ADMIN_CHAT_ID). */
  notifyHotel: boolean;
};

export type OrderItem = {
  dishId: number;
  /** Название на момент заказа: блюдо потом переименуют, а заказ — документ. */
  title: string;
  titleLocal: string;
  portion: string;
  price: number;
  qty: number;
};

export type OrderDetails = {
  locality?: string;
  address?: string;
  unitType?: "aframe" | "chalet";
  unitNo?: string;
  guests?: number;
};

export type Order = {
  id: number;
  number: string;
  token: string;
  mode: OrderMode;
  status: OrderStatus;
  name: string;
  phone: string;
  details: OrderDetails;
  /** «asap» или «YYYY-MM-DD HH:MM» по Ташкенту. */
  desiredTime: string;
  confirmedTime: string;
  items: OrderItem[];
  subtotal: number;
  fee: number | null;
  /** Сумма без неутверждённого сбора; feePending говорит, что он ещё будет. */
  total: number;
  feePending: boolean;
  paymentStatus: "unpaid" | "paid";
  comment: string;
  locale: string;
  source: string;
  page: string;
  cancelReason: string;
  isTest: boolean;
  notifiedAt: string | null;
  /** В скольких чатах лежит карточка — «доставлено не во все», если notifiedAt пуст. */
  tgSent: number;
  createdAt: string;
  updatedAt: string;
};

export type TableRequest = {
  id: number;
  number: string;
  token: string;
  status: TableStatus;
  date: string;
  time: string;
  adults: number;
  kids: number;
  name: string;
  phone: string;
  comment: string;
  locale: string;
  source: string;
  page: string;
  cancelReason: string;
  isTest: boolean;
  notifiedAt: string | null;
  /** В скольких чатах лежит карточка — «доставлено не во все», если notifiedAt пуст. */
  tgSent: number;
  createdAt: string;
  updatedAt: string;
};

export type StatusLogEntry = {
  kind: "order" | "table";
  entityId: number;
  from: string | null;
  to: string;
  byWhom: string;
  via: "site" | "admin" | "telegram";
  reason: string;
  at: string;
};

/** «#R-00125» — как в ТЗ. Номер — это id: он и так уникален и растёт. */
export function orderNumber(id: number): string {
  return `R-${String(id).padStart(5, "0")}`;
}

export function tableNumber(id: number): string {
  return `T-${String(id).padStart(5, "0")}`;
}

export const EMPTY_LS: LocalizedString = { ru: "", uz: "", en: "" };
