"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { actorName, requireRole, type AdminSession } from "@/lib/admin-auth";
import { del, put } from "@/lib/blob-store";
import { sendMessage } from "@/lib/telegram";
import type { LocalizedString } from "@/content/types";
import {
  AVAILABILITY,
  DISH_STATES,
  ORDER_MODES,
  ORDER_STATUSES,
  RESTAURANT_STATES,
  TABLE_STATUSES,
  type Availability,
  type DishState,
  type OrderStatus,
  type RestaurantSettings,
  type TableStatus,
} from "@/lib/restaurant/model";
import { expireRestaurant } from "@/lib/restaurant/live";
import {
  type NotifyResult,
  notifyOrder,
  notifyTable,
  refreshOrderMessages,
  refreshTableMessages,
  restaurantChats,
  telegramReady,
} from "@/lib/restaurant/notify";
import { LINK_TTL_MS, signPreview } from "@/lib/restaurant/preview";
import { normalizeChannels, normalizeSettings, toMinutes } from "@/lib/restaurant/rules";
import * as store from "@/lib/restaurant/store";

/**
 * Действия раздела «Ресторан» в панели.
 *
 * Права — в каждом действии, а не только в layout (layout не защищает
 * server action):
 *   • заказы и столы — владелец, менеджер ресторана и сотрудник;
 *   • меню и настройки — владелец и менеджер;
 *   • показать раздел гостям (state) — только владелец: это решение о сайте
 *     комплекса, а не о ресторане.
 */
export type ActionState = { ok?: string; error?: string; url?: string };

const ANY = ["owner", "manager", "staff"] as const;
const EDITORS = ["owner", "manager"] as const;

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const id = (f: FormData, k = "id") => {
  const n = Number(f.get(k));
  return Number.isInteger(n) && n > 0 ? n : null;
};

function fail(e: unknown): ActionState {
  const msg = e instanceof Error ? e.message : String(e);
  return { error: msg === "Not authorised" ? "Нет прав на это действие." : `Не получилось: ${msg}` };
}

function actor(s: AdminSession): store.Actor {
  return { name: actorName(s), via: "admin" };
}

const ERR_TEXT: Record<string, string> = {
  not_found: "Не найдено.",
  transition: "Из текущего статуса так нельзя — обновите страницу.",
  race: "Статус уже изменили — обновите страницу.",
  reason: "Укажите причину.",
};

function resendResult(res: NotifyResult): ActionState {
  if (res === "sent") return { ok: "Отправлено в Telegram." };
  if (res === "already") return { ok: "Уже доставлено." };
  if (res === "busy") return { ok: "Отправляется прямо сейчас — обновите страницу через минуту." };
  if (res === "partial") return { error: "Дошло не во все чаты — проверьте, что бот есть в группе ресторана." };
  return { error: "Telegram не принял сообщение — проверьте чат и бота." };
}

// ─── Заказы ────────────────────────────────────────────────────────────────

export async function changeOrderStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...ANY);
    const orderId = id(form);
    const to = str(form, "status", 20) as OrderStatus;
    if (!orderId || !ORDER_STATUSES.includes(to)) return { error: "Неверные данные." };
    const reason = [str(form, "reason", 120), str(form, "reasonText", 300)].filter(Boolean).join(" — ");
    const res = await store.setOrderStatus(orderId, to, actor(s), reason);
    if (!res.ok) return { error: ERR_TEXT[res.error] };
    await refreshOrderMessages(orderId);
    revalidatePath("/admin/restoran");
    return { ok: "Статус изменён." };
  } catch (e) {
    return fail(e);
  }
}

export async function setConfirmedTime(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...ANY);
    const orderId = id(form);
    const time = str(form, "time", 40);
    if (!orderId) return { error: "Неверные данные." };
    const res = await store.setOrderConfirmedTime(orderId, time, actor(s));
    if (!res) return { error: "Заказ не найден." };
    await refreshOrderMessages(orderId);
    revalidatePath("/admin/restoran");
    return { ok: time ? "Время сохранено." : "Время снято." };
  } catch (e) {
    return fail(e);
  }
}

/** Сбор за доставку или подачу в номер, утверждённый по телефону. */
export async function setFee(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...ANY);
    const orderId = id(form);
    const raw = str(form, "fee", 20).replace(/[\s\u00a0]/g, "");
    if (!orderId) return { error: "Неверные данные." };
    if (!/^\d{1,8}$/.test(raw)) return { error: "Сбор — число в сумах, 0 — бесплатно." };
    const res = await store.setOrderFee(orderId, Number(raw), actor(s));
    if (!res) return { error: "Сбор бывает только у доставки и подачи в номер." };
    await refreshOrderMessages(orderId);
    revalidatePath("/admin/restoran");
    return { ok: "Сбор записан, итог пересчитан." };
  } catch (e) {
    return fail(e);
  }
}

export async function setPayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...ANY);
    const orderId = id(form);
    if (!orderId) return { error: "Неверные данные." };
    const paid = str(form, "paid", 3) === "1";
    const res = await store.setOrderPayment(orderId, paid, actor(s));
    if (!res) return { error: "Заказ не найден." };
    await refreshOrderMessages(orderId);
    revalidatePath("/admin/restoran");
    return { ok: paid ? "Отмечен оплаченным." : "Оплата снята." };
  } catch (e) {
    return fail(e);
  }
}

export async function resendOrder(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...ANY);
    const orderId = id(form);
    if (!orderId) return { error: "Неверные данные." };
    if (!telegramReady()) return { error: "Бот не настроен: нет TELEGRAM_STAFF_BOT_TOKEN." };
    const res = await notifyOrder(orderId);
    revalidatePath("/admin/restoran");
    return resendResult(res);
  } catch (e) {
    return fail(e);
  }
}

// ─── Столы ─────────────────────────────────────────────────────────────────

export async function changeTableStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...ANY);
    const tableId = id(form);
    const to = str(form, "status", 20) as TableStatus;
    if (!tableId || !TABLE_STATUSES.includes(to)) return { error: "Неверные данные." };
    const reason = [str(form, "reason", 120), str(form, "reasonText", 300)].filter(Boolean).join(" — ");
    const res = await store.setTableStatus(tableId, to, actor(s), reason);
    if (!res.ok) return { error: ERR_TEXT[res.error] };
    await refreshTableMessages(tableId);
    revalidatePath("/admin/restoran/stoly");
    return { ok: "Статус изменён." };
  } catch (e) {
    return fail(e);
  }
}

export async function resendTable(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...ANY);
    const tableId = id(form);
    if (!tableId) return { error: "Неверные данные." };
    if (!telegramReady()) return { error: "Бот не настроен: нет TELEGRAM_STAFF_BOT_TOKEN." };
    const res = await notifyTable(tableId);
    revalidatePath("/admin/restoran/stoly");
    return resendResult(res);
  } catch (e) {
    return fail(e);
  }
}

// ─── Меню ──────────────────────────────────────────────────────────────────

function ls(form: FormData, prefix: string, max = 400): LocalizedString {
  return { ru: str(form, `${prefix}_ru`, max), uz: str(form, `${prefix}_uz`, max), en: str(form, `${prefix}_en`, max) };
}

function menuChanged() {
  expireRestaurant();
  revalidatePath("/admin/restoran/menu");
}

export async function saveCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const title = ls(form, "title", 80);
    if (!title.ru) return { error: "Название раздела по-русски обязательно." };
    const catId = id(form);
    if (catId) await store.updateCategory(catId, { title });
    else await store.createCategory(title);
    menuChanged();
    return { ok: catId ? "Раздел сохранён." : "Раздел добавлен." };
  } catch (e) {
    return fail(e);
  }
}

export async function categoryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const catId = id(form);
    const op = str(form, "op", 10);
    if (!catId) return { error: "Неверные данные." };
    if (op === "up" || op === "down") await store.moveCategory(catId, op === "up" ? -1 : 1);
    else if (op === "show" || op === "hide") await store.updateCategory(catId, { visible: op === "show" });
    else if (op === "delete") await store.deleteCategory(catId);
    else return { error: "Неизвестное действие." };
    menuChanged();
    return {
      ok: op === "delete" ? "Раздел удалён. Его блюда остались без раздела и скрыты — опубликуйте нужные." : "Готово.",
    };
  } catch (e) {
    return fail(e);
  }
}

function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[\s ]/g, "");
  if (!/^\d{0,9}$/.test(digits)) return null;
  return digits ? Number(digits) : 0;
}

export async function saveDish(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const title = ls(form, "title", 120);
    if (!title.ru) return { error: "Название блюда по-русски обязательно." };
    const price = parsePrice(str(form, "price", 20));
    if (price === null) return { error: "Цена — только цифры, в сумах." };
    const availability = str(form, "availability", 20) as Availability;
    const state = str(form, "state", 20) as DishState;
    const catRaw = str(form, "categoryId", 12);
    const input: store.DishInput = {
      categoryId: catRaw ? Number(catRaw) || null : null,
      title,
      description: ls(form, "description", 600),
      portion: str(form, "portion", 40),
      price,
      availability: AVAILABILITY.includes(availability) ? availability : "available",
      channels: normalizeChannels(form.getAll("channels").map(String)),
      state: DISH_STATES.includes(state) ? state : "published",
    };
    if (input.channels.length === 0) return { error: "Отметьте хотя бы один способ подачи." };
    if (input.state === "published" && price === 0) {
      return { error: "Без цены блюдо нельзя опубликовать — сохраните его скрытым." };
    }
    const dishId = id(form);
    if (dishId) await store.updateDish(dishId, input);
    else await store.createDish(input);
    menuChanged();
    return { ok: dishId ? "Блюдо сохранено." : "Блюдо добавлено." };
  } catch (e) {
    return fail(e);
  }
}

/** Быстрые действия из строки таблицы: наличие, публикация, порядок, цена. */
export async function dishAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const dishId = id(form);
    const op = str(form, "op", 20);
    if (!dishId) return { error: "Неверные данные." };
    if (op === "up" || op === "down") await store.moveDish(dishId, op === "up" ? -1 : 1);
    else if (AVAILABILITY.includes(op as Availability)) await store.setDishAvailability(dishId, op as Availability);
    else if (DISH_STATES.includes(op as DishState)) await store.setDishState(dishId, op as DishState);
    else if (op === "price") {
      const price = parsePrice(str(form, "price", 20));
      if (price === null) return { error: "Цена — только цифры." };
      await store.setDishPrice(dishId, price);
    } else return { error: "Неизвестное действие." };
    menuChanged();
    return { ok: "Сохранено." };
  } catch (e) {
    return fail(e);
  }
}

const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

async function storeImage(file: File, folder: string): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) throw new Error("файл больше 12 МБ");
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) throw new Error("нужен JPEG, PNG, WebP или HEIC");
  const input = Buffer.from(await file.arrayBuffer());
  const out = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const blob = await put(`${folder}/${Date.now().toString(36)}.webp`, out, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function uploadDishPhoto(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const dishId = id(form);
    const file = form.get("photo");
    if (!dishId || !(file instanceof File) || file.size === 0) return { error: "Выберите фото." };
    const url = await storeImage(file, "restaurant/dishes");
    const old = await store.setDishImage(dishId, url);
    if (old) await del(old).catch(() => {});
    menuChanged();
    return { ok: "Фото загружено." };
  } catch (e) {
    return fail(e);
  }
}

export async function removeDishPhoto(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const dishId = id(form);
    if (!dishId) return { error: "Неверные данные." };
    const old = await store.setDishImage(dishId, "");
    if (old) await del(old).catch(() => {});
    menuChanged();
    return { ok: "Фото убрано." };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Загрузка меню списком — строка на блюдо, поля через «;» или табуляцию:
 *   Раздел; Название; Цена; Порция; Описание
 * Так меню партнёра переносится из таблицы за минуту, а не по одному блюду.
 * Раздела нет — создаётся. Цена пустая — блюдо сохраняется скрытым.
 */
export async function importMenu(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const text = str(form, "text", 100_000);
    const publish = form.get("publish") === "on";
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { error: "Вставьте строки меню." };
    if (lines.length > 400) return { error: "За раз — не больше 400 строк." };

    const cats = await store.listCategories();
    const byName = new Map(cats.map((c) => [c.title.ru.toLowerCase(), c.id]));
    let added = 0;
    const skipped: string[] = [];

    for (const [i, line] of lines.entries()) {
      const cells = line.split(line.includes("\t") ? "\t" : ";").map((c) => c.trim());
      const [catName, title, priceRaw = "", portion = "", description = ""] = cells;
      if (!title) {
        skipped.push(`строка ${i + 1}: нет названия`);
        continue;
      }
      const price = parsePrice(priceRaw);
      if (price === null) {
        skipped.push(`строка ${i + 1}: цена «${priceRaw}» не число`);
        continue;
      }
      let categoryId: number | null = null;
      if (catName) {
        const key = catName.toLowerCase();
        categoryId = byName.get(key) ?? null;
        if (!categoryId) {
          categoryId = await store.createCategory({ ru: catName.slice(0, 80), uz: "", en: "" });
          byName.set(key, categoryId);
        }
      }
      await store.createDish({
        categoryId,
        title: { ru: title.slice(0, 120), uz: "", en: "" },
        description: { ru: description.slice(0, 600), uz: "", en: "" },
        portion: portion.slice(0, 40),
        price,
        availability: "available",
        channels: ["hall", "takeaway", "delivery", "room"],
        state: publish && price > 0 ? "published" : "hidden",
      });
      added++;
    }
    menuChanged();
    return {
      ok: `Добавлено блюд: ${added}.${skipped.length ? ` Пропущено: ${skipped.slice(0, 5).join("; ")}${skipped.length > 5 ? "…" : ""}` : ""}`,
    };
  } catch (e) {
    return fail(e);
  }
}

// ─── Настройки ─────────────────────────────────────────────────────────────

export async function saveRestaurantSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...EDITORS);
    const current = await store.readSettings();
    const stateRaw = str(form, "state", 10);
    // Показать раздел на сайте — решение владельца сайта, не ресторана.
    const state =
      s.role === "owner" && RESTAURANT_STATES.includes(stateRaw as RestaurantSettings["state"])
        ? (stateRaw as RestaurantSettings["state"])
        : current.state;
    const fee = (k: string) => {
      const raw = str(form, k, 20).replace(/[\s ]/g, "");
      return raw === "" ? null : /^\d{1,8}$/.test(raw) ? Number(raw) : undefined;
    };
    const deliveryFee = fee("deliveryFee");
    const roomFee = fee("roomFee");
    if (deliveryFee === undefined || roomFee === undefined) return { error: "Сбор — число в сумах или пусто." };
    const hoursOpen = str(form, "hoursOpen", 5);
    const hoursClose = str(form, "hoursClose", 5);
    if ((hoursOpen && toMinutes(hoursOpen) === null) || (hoursClose && toMinutes(hoursClose) === null)) {
      return { error: "Часы — в виде ЧЧ:ММ, например 09:00." };
    }
    const next: RestaurantSettings = normalizeSettings({
      ...current,
      state,
      name: ls(form, "name", 80),
      tagline: ls(form, "tagline", 160),
      about: ls(form, "about", 1500),
      announcement: ls(form, "announcement", 300),
      hoursOpen,
      hoursClose,
      phones: str(form, "phones", 200)
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean),
      instagram: str(form, "instagram", 300),
      telegram: str(form, "telegram", 300),
      modes: Object.fromEntries(ORDER_MODES.map((m) => [m, form.get(`mode_${m}`) === "on"])),
      tables: form.get("tables") === "on",
      deliveryFee,
      roomFee,
      deliveryNote: ls(form, "deliveryNote", 400),
      preorderLeadHours: Number(str(form, "preorderLeadHours", 4)) || current.preorderLeadHours,
      notifyHotel: form.get("notifyHotel") === "on",
    });
    if (!next.name.ru) return { error: "Название ресторана по-русски обязательно." };
    await store.saveSettings(next, actorName(s));
    // Меню сайта, подвал и карта сайта зависят только от «скрыт или нет» —
    // пересобирать ради текста или часов весь сайт незачем.
    expireRestaurant({ listing: (next.state === "hidden") !== (current.state === "hidden") });
    revalidatePath("/admin/restoran/nastroyki");
    return { ok: "Настройки сохранены." };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadHeroImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...EDITORS);
    const file = form.get("photo");
    const remove = form.get("remove") === "1";
    const current = await store.readSettings();
    let url = "";
    if (!remove) {
      if (!(file instanceof File) || file.size === 0) return { error: "Выберите фото." };
      url = await storeImage(file, "restaurant/hero");
    }
    await store.saveSettings({ ...current, heroImage: url }, actorName(s));
    if (current.heroImage) await del(current.heroImage).catch(() => {});
    expireRestaurant();
    revalidatePath("/admin/restoran/nastroyki");
    return { ok: remove ? "Фото убрано — стоит кадр комплекса." : "Фото загружено." };
  } catch (e) {
    return fail(e);
  }
}

export async function sendTestMessage(): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    if (!telegramReady()) return { error: "Бот не настроен: нет TELEGRAM_STAFF_BOT_TOKEN." };
    const chats = restaurantChats(await store.readSettings());
    if (chats.length === 0) return { error: "Не задан ни TELEGRAM_RESTAURANT_CHAT_ID, ни TELEGRAM_ADMIN_CHAT_ID." };
    const results = await Promise.all(
      chats.map((c) => sendMessage(c, "🍽 <b>Проверка связи</b>\nСюда будут приходить заказы и брони столов ресторана.")),
    );
    const ok = results.filter(Boolean).length;
    return ok === chats.length
      ? { ok: `Сообщение ушло во все чаты (${ok}).` }
      : { error: `Дошло в ${ok} из ${chats.length} чатов — проверьте, что бот добавлен в группу.` };
  } catch (e) {
    return fail(e);
  }
}

/** Ссылка предпросмотра: ставит на сайте cookie, пока раздел скрыт. */
export async function previewLink(): Promise<ActionState> {
  try {
    await requireRole(...EDITORS);
    const token = signPreview(Date.now() + LINK_TTL_MS, "link");
    if (!token) return { error: "Не задан AUTH_SECRET." };
    return {
      ok: "Ссылка действует два часа.",
      url: `https://chimgandarbaza.uz/api/restaurant/preview?t=${encodeURIComponent(token)}`,
    };
  } catch (e) {
    return fail(e);
  }
}
