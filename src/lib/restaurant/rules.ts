import type { Locale } from "@/i18n/config";
import type { LocalizedString } from "@/content/types";
import {
  AVAILABILITY,
  CHANNELS,
  MODE_CHANNEL,
  ORDER_MODES,
  RESTAURANT_STATES,
  type Channel,
  type Dish,
  type OrderItem,
  type OrderMode,
  type OrderStatus,
  type RestaurantSettings,
  type TableStatus,
} from "./model";

/**
 * Правила ресторана без базы и без React — то, что одинаково должны считать
 * корзина в браузере и сервер, который принимает заказ.
 *
 * Сервер никогда не верит сумме из браузера: он получает только «блюдо × N» и
 * пересчитывает всё по своему меню. Эти функции — единственный калькулятор,
 * поэтому гость видит в корзине ровно ту сумму, что уйдёт ресторану.
 */

// ─── Время по Ташкенту ─────────────────────────────────────────────────────

/** Ташкент — UTC+5 без перехода на летнее время. */
const TZ_OFFSET_MS = 5 * 3600_000;

/** «Сейчас» по Ташкенту как дата и минуты от полуночи. */
export function tashkentNow(now = Date.now()): { date: string; minutes: number } {
  const d = new Date(now + TZ_OFFSET_MS);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/** Абсолютное время для «YYYY-MM-DD» + «HH:MM» по Ташкенту, в мс. */
export function tashkentMs(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+05:00`);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(hhmm: string): number | null {
  const m = HHMM.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function fromMinutes(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Попадает ли время в часы работы.
 *
 * Часы могут переходить через полночь (12:00–02:00) — тогда «открыто» это
 * «после открытия ИЛИ до закрытия». Если часы не заданы, ограничения нет:
 * лучше принять заявку и перезвонить, чем отказать гостю из-за пустого поля.
 *
 * Закрытие — не рабочая минута: заказ «к 22:00» у кухни, закрывающейся в
 * 22:00, — это заказ, который некому готовить.
 */
export function withinHours(settings: Pick<RestaurantSettings, "hoursOpen" | "hoursClose">, minutes: number): boolean {
  const open = toMinutes(settings.hoursOpen);
  const close = toMinutes(settings.hoursClose);
  if (open === null || close === null || open === close) return true;
  if (open < close) return minutes >= open && minutes < close;
  return minutes >= open || minutes < close;
}

/** Часы переходят через полночь (12:00–02:00). */
export function crossesMidnight(settings: Pick<RestaurantSettings, "hoursOpen" | "hoursClose">): boolean {
  const open = toMinutes(settings.hoursOpen);
  const close = toMinutes(settings.hoursClose);
  return open !== null && close !== null && open > close;
}

/** Запас до времени «ко времени»: кухне нужно успеть принять и подтвердить. */
export const MIN_LEAD_MIN = 30;
/** Дальше двух недель обычный заказ не планируют — это уже предзаказ. */
export const MAX_AHEAD_DAYS = 14;
export const TABLE_MAX_AHEAD_DAYS = 60;

export type Slot = {
  /** Настоящая календарная дата слота — для ночных часов это следующий день. */
  date: string;
  time: string;
  /** Слот после полуночи в списке выбранного дня («ночь на …»). */
  nextDay: boolean;
};

/**
 * Время на выбор для даты — шагом 30 минут, только будущее не ближе `leadMs`.
 *
 * Без часов работы — с 08:00 до 23:30: сайт не знает расписания кухни, но и
 * ночной заказ на 03:00 никто не примет.
 *
 * Часы через полночь (12:00–02:00): ночные слоты в списке дня D — это уже
 * утро D+1, и уходят они с датой D+1. Иначе гость, выбравший «27.09, 01:00»
 * в конце списка вечера 27-го, получал заказ на сутки раньше — на ночь с 26-го
 * на 27-е. Для сегодняшнего дня в начало списка добавляются ночные слоты этой
 * ночи, если они ещё впереди.
 */
export function timeSlots(
  settings: Pick<RestaurantSettings, "hoursOpen" | "hoursClose">,
  date: string,
  opts: { now?: number; leadMs?: number; step?: number } = {},
): Slot[] {
  const step = opts.step ?? 30;
  const now = opts.now ?? Date.now();
  const lead = opts.leadMs ?? MIN_LEAD_MIN * 60_000;
  const open = toMinutes(settings.hoursOpen);
  const close = toMinutes(settings.hoursClose);
  const hasHours = open !== null && close !== null && open !== close;
  const today = tashkentNow(now).date;
  if (date < today) return [];

  const range = (d: string, from: number, to: number, nextDay: boolean): Slot[] => {
    const out: Slot[] = [];
    for (let m = from; m < to; m += step) out.push({ date: d, time: fromMinutes(m), nextDay });
    return out;
  };

  let slots: Slot[];
  if (!hasHours) slots = range(date, 8 * 60, 23 * 60 + 31, false);
  else if (open! < close!) slots = range(date, open!, close!, false);
  else {
    slots = [
      ...(date === today ? range(date, 0, close!, false) : []),
      ...range(date, open!, 1440, false),
      ...range(addDaysISO(date, 1), 0, close!, true),
    ];
  }
  return slots.filter((s) => tashkentMs(s.date, s.time) >= now + lead);
}

// ─── Настройки ─────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: RestaurantSettings = {
  state: "hidden",
  // Рабочее название из ТЗ. Публичное название утверждают обе стороны — оно
  // меняется в админке, а не здесь.
  name: { ru: "Сазанчик", uz: "Sazanchik", en: "Sazanchik" },
  tagline: {
    ru: "Ресторан в CHIMGAN DARBAZA",
    uz: "CHIMGAN DARBAZA’dagi restoran",
    en: "The restaurant at CHIMGAN DARBAZA",
  },
  about: {
    ru: "Кухня ресторана «Сазанчик» — в горах, на территории CHIMGAN DARBAZA. Выберите блюда на сайте: заберите сами, закажите доставку или подачу в домик. Менеджер ресторана подтвердит состав, время и стоимость.",
    uz: "«Sazanchik» restorani oshxonasi — tog'larda, CHIMGAN DARBAZA hududida. Taomlarni saytda tanlang: o'zingiz olib keting, yetkazib berishga yoki uychaga buyurtma bering. Restoran menejeri tarkib, vaqt va narxni tasdiqlaydi.",
    en: "The Sazanchik kitchen is in the mountains, on the grounds of CHIMGAN DARBAZA. Choose your dishes online — pick them up, have them delivered or brought to your cabin. The restaurant manager confirms the order, the time and the price.",
  },
  announcement: { ru: "", uz: "", en: "" },
  hoursOpen: "",
  hoursClose: "",
  phones: [],
  instagram: "",
  telegram: "",
  modes: { takeaway: true, delivery: true, room: true, preorder: false },
  tables: true,
  deliveryFee: null,
  roomFee: null,
  deliveryNote: {
    ru: "Зону и стоимость доставки подтвердит менеджер ресторана при звонке.",
    uz: "Yetkazib berish hududi va narxini restoran menejeri qo'ng'iroq paytida tasdiqlaydi.",
    en: "The restaurant manager will confirm the delivery area and fee when they call you.",
  },
  preorderLeadHours: 24,
  heroImage: "",
  notifyHotel: true,
};

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function ls(v: unknown, fallback: LocalizedString, max = 2000): LocalizedString {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Record<string, unknown>;
  return { ru: str(o.ru, max), uz: str(o.uz, max), en: str(o.en, max) };
}

function fee(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : null;
}

const SAFE_URL = /^https:\/\/[^\s"'<>]+$/;

/**
 * Настройки из базы → полная и проверенная структура.
 *
 * Никогда не бросает: битая строка в базе не должна ронять страницы. Чего нет
 * или что не прошло проверку — берётся из DEFAULT_SETTINGS.
 */
export function normalizeSettings(raw: unknown): RestaurantSettings {
  const d = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== "object") return { ...d };
  const o = raw as Record<string, unknown>;
  const modesRaw = (o.modes && typeof o.modes === "object" ? o.modes : {}) as Record<string, unknown>;
  const lead = Math.round(Number(o.preorderLeadHours));
  const hours = (v: unknown) => (toMinutes(str(v, 5)) === null ? "" : str(v, 5));
  const url = (v: unknown) => (SAFE_URL.test(str(v, 300)) ? str(v, 300) : "");

  return {
    state: RESTAURANT_STATES.includes(o.state as never) ? (o.state as RestaurantSettings["state"]) : d.state,
    name: ls(o.name, d.name, 80),
    tagline: ls(o.tagline, d.tagline, 160),
    about: ls(o.about, d.about, 1500),
    announcement: ls(o.announcement, d.announcement, 300),
    hoursOpen: hours(o.hoursOpen),
    hoursClose: hours(o.hoursClose),
    phones: Array.isArray(o.phones)
      ? o.phones.map((p) => str(p, 32)).filter((p) => /^\+?[\d\s()-]{7,20}$/.test(p)).slice(0, 4)
      : [],
    instagram: url(o.instagram),
    telegram: url(o.telegram),
    modes: Object.fromEntries(
      ORDER_MODES.map((m) => [m, typeof modesRaw[m] === "boolean" ? modesRaw[m] : d.modes[m]]),
    ) as RestaurantSettings["modes"],
    tables: typeof o.tables === "boolean" ? o.tables : d.tables,
    deliveryFee: fee(o.deliveryFee),
    roomFee: fee(o.roomFee),
    deliveryNote: ls(o.deliveryNote, d.deliveryNote, 400),
    preorderLeadHours: Number.isFinite(lead) && lead >= 1 && lead <= 168 ? lead : d.preorderLeadHours,
    heroImage: /^(https:\/\/|\/)[^\s"'<>]+$/.test(str(o.heroImage, 400)) ? str(o.heroImage, 400) : "",
    notifyHotel: typeof o.notifyHotel === "boolean" ? o.notifyHotel : d.notifyHotel,
  };
}

/** Принимаются ли сейчас заказы этого вида. */
export function modeOpen(settings: RestaurantSettings, mode: OrderMode): boolean {
  return settings.state === "open" && settings.modes[mode];
}

export function tablesOpen(settings: RestaurantSettings): boolean {
  return settings.state === "open" && settings.tables;
}

/** Какие виды заказа сейчас принимаются — в порядке показа. */
export function openModes(settings: RestaurantSettings): OrderMode[] {
  return ORDER_MODES.filter((m) => modeOpen(settings, m));
}

// ─── Блюда ─────────────────────────────────────────────────────────────────

export function normalizeChannels(v: unknown): Channel[] {
  if (!Array.isArray(v)) return [];
  return CHANNELS.filter((c) => v.includes(c));
}

export function isAvailability(v: unknown): v is Dish["availability"] {
  return AVAILABILITY.includes(v as never);
}

export type DishProblem = "missing" | "unavailable" | "preorder_only" | "channel" | "no_price";

/**
 * Можно ли заказать блюдо этим способом, и если нет — почему.
 *
 * «По предзаказу» — только предзаказом к посещению (ТЗ, п. 3): обычным
 * заказом такую позицию не отправить, иначе кухня получит блюдо, которое
 * готовится сутки, с пометкой «как можно скорее».
 */
export function dishProblem(dish: Dish | undefined, mode: OrderMode): DishProblem | null {
  if (!dish || dish.state !== "published") return "missing";
  if (dish.price <= 0) return "no_price";
  if (dish.availability === "unavailable") return "unavailable";
  if (dish.availability === "preorder" && mode !== "preorder") return "preorder_only";
  if (!dish.channels.includes(MODE_CHANNEL[mode])) return "channel";
  return null;
}

/**
 * Показывать ли блюдо в меню при выбранном способе получения. Выбран способ
 * — показываем только то, что им можно заказать (ТЗ, п. 3), кроме «временно
 * нет»: такое блюдо видно, чтобы гость знал, что оно бывает.
 */
export function dishVisibleIn(dish: Dish, mode: OrderMode | null): boolean {
  if (dish.state !== "published") return false;
  if (!mode) return true;
  if (dish.availability === "preorder" && mode !== "preorder") return false;
  return dish.channels.includes(MODE_CHANNEL[mode]);
}

export function pickText(value: LocalizedString, locale: Locale): string {
  return value[locale]?.trim() || value.ru?.trim() || value.uz?.trim() || value.en?.trim() || "";
}

// ─── Корзина ───────────────────────────────────────────────────────────────

export const MAX_QTY = 50;
export const MAX_LINES = 60;

export type CartLine = { dishId: number; qty: number };

/**
 * Строки корзины из того, что прислал браузер: целые id, количество 1..50,
 * повторы одного блюда складываются. Всё прочее выбрасывается молча — это
 * вход от клиента, и ошибка в нём не должна ронять сервер.
 */
export function cleanCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<number, number>();
  for (const r of raw.slice(0, MAX_LINES * 2)) {
    if (!r || typeof r !== "object") continue;
    const id = Number((r as Record<string, unknown>).dishId);
    const qty = Math.floor(Number((r as Record<string, unknown>).qty));
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    byId.set(id, Math.min((byId.get(id) ?? 0) + qty, MAX_QTY));
  }
  return [...byId.entries()].slice(0, MAX_LINES).map(([dishId, qty]) => ({ dishId, qty }));
}

export type PricedCart = {
  items: OrderItem[];
  problems: { dishId: number; title: string; problem: DishProblem }[];
  subtotal: number;
  /** Утверждённый сбор или null, если его подтвердит менеджер. */
  fee: number | null;
  feePending: boolean;
  total: number;
};

/** Сбор за способ получения. Самовывоз и зал бесплатны по определению. */
export function modeFee(
  settings: Pick<RestaurantSettings, "deliveryFee" | "roomFee">,
  mode: OrderMode,
): { fee: number | null; pending: boolean } {
  if (mode === "delivery") return { fee: settings.deliveryFee, pending: settings.deliveryFee === null };
  if (mode === "room") return { fee: settings.roomFee, pending: settings.roomFee === null };
  return { fee: 0, pending: false };
}

export function priceCart(
  lines: CartLine[],
  dishes: Dish[],
  mode: OrderMode,
  settings: RestaurantSettings,
  locale: Locale,
): PricedCart {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const items: OrderItem[] = [];
  const problems: PricedCart["problems"] = [];

  for (const line of lines) {
    const dish = byId.get(line.dishId);
    const problem = dishProblem(dish, mode);
    if (problem) {
      problems.push({ dishId: line.dishId, title: dish ? pickText(dish.title, locale) : `#${line.dishId}`, problem });
      continue;
    }
    items.push({
      dishId: dish!.id,
      title: pickText(dish!.title, "ru"),
      titleLocal: pickText(dish!.title, locale),
      portion: dish!.portion,
      price: dish!.price,
      qty: line.qty,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { fee, pending } = modeFee(settings, mode);
  return { items, problems, subtotal, fee, feePending: pending, total: subtotal + (fee ?? 0) };
}

// ─── Время заказа ──────────────────────────────────────────────────────────

export type TimeCheck =
  | { ok: true; value: string }
  | { ok: false; error: "required" | "invalid" | "past" | "too_far" | "closed" | "hours" | "lead" };

/**
 * Проверка желаемого времени.
 *
 * «Как можно скорее» — только когда кухня сейчас работает: ночью это
 * обещание, которое никто не выполнит. Предзаказ — не раньше, чем через
 * `preorderLeadHours`, и только к конкретному времени.
 */
export function checkDesiredTime(
  settings: RestaurantSettings,
  mode: OrderMode,
  input: { asap: boolean; date: string; time: string },
  now = Date.now(),
): TimeCheck {
  const nowT = tashkentNow(now);
  if (input.asap) {
    if (mode === "preorder") return { ok: false, error: "required" };
    if (!withinHours(settings, nowT.minutes)) return { ok: false, error: "closed" };
    return { ok: true, value: "asap" };
  }
  if (!input.date || !input.time) return { ok: false, error: "required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || toMinutes(input.time) === null) {
    return { ok: false, error: "invalid" };
  }
  const at = tashkentMs(input.date, input.time);
  if (!Number.isFinite(at)) return { ok: false, error: "invalid" };
  if (at < now + MIN_LEAD_MIN * 60_000 - 60_000) return { ok: false, error: "past" };
  if (mode === "preorder" && at < now + settings.preorderLeadHours * 3600_000 - 60_000) {
    return { ok: false, error: "lead" };
  }
  const maxDays = mode === "preorder" ? TABLE_MAX_AHEAD_DAYS : MAX_AHEAD_DAYS;
  if (input.date > addDaysISO(nowT.date, maxDays)) return { ok: false, error: "too_far" };
  if (!withinHours(settings, toMinutes(input.time)!)) return { ok: false, error: "hours" };
  return { ok: true, value: `${input.date} ${input.time}` };
}

export function checkTableTime(
  settings: RestaurantSettings,
  date: string,
  time: string,
  now = Date.now(),
): TimeCheck {
  if (!date || !time) return { ok: false, error: "required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toMinutes(time) === null) return { ok: false, error: "invalid" };
  const at = tashkentMs(date, time);
  if (!Number.isFinite(at)) return { ok: false, error: "invalid" };
  if (at < now + MIN_LEAD_MIN * 60_000 - 60_000) return { ok: false, error: "past" };
  if (date > addDaysISO(tashkentNow(now).date, TABLE_MAX_AHEAD_DAYS)) return { ok: false, error: "too_far" };
  if (!withinHours(settings, toMinutes(time)!)) return { ok: false, error: "hours" };
  return { ok: true, value: `${date} ${time}` };
}

// ─── Статусы ───────────────────────────────────────────────────────────────

/**
 * Куда можно перевести заказ. Готовку можно пропустить (напиток, десерт из
 * витрины), отменить — на любом шаге до выдачи. Финальные статусы не
 * переоткрываются: ошибочно закрытый заказ оформляют заново, а история
 * остаётся честной.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["cooking", "ready", "cancelled"],
  cooking: ["ready", "cancelled"],
  ready: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export const TABLE_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  new: ["confirmed", "declined", "cancelled"],
  confirmed: ["done", "cancelled"],
  declined: [],
  cancelled: [],
  done: [],
};

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canMoveTable(from: TableStatus, to: TableStatus): boolean {
  return TABLE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Телефон ───────────────────────────────────────────────────────────────

/**
 * Телефон в виде, по которому Telegram предложит позвонить: +998XXXXXXXXX.
 * Девять цифр — узбекский номер без кода. Иностранный номер оставляем как
 * есть, только с плюсом. null — не похоже на телефон.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  // Набранные по-старому, с «восьмёркой» или нулём: «8 90 123 45 67» —
  // узбекский номер, «8 916 123 45 67» — российский (+7).
  if (digits.length === 10 && (digits[0] === "8" || digits[0] === "0")) return `+998${digits.slice(1)}`;
  if (digits.length === 11 && digits[0] === "8") return `+7${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15 && !digits.startsWith("998") && !/^[08]/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}

/** «+998 90 *** ** 67» — для страницы статуса, которую могут переслать. */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return "***";
  // Код страны — всё, что до девяти последних цифр; из них видны код
  // оператора и две последние: этого хватит, чтобы узнать свой номер.
  return `+${d.slice(0, d.length - 9)} ${d.slice(-9, -7)} *** ** ${d.slice(-2)}`;
}
