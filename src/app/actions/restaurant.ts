"use server";

import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { contacts } from "@/content/contacts";
import { restaurantText } from "@/content/restaurant";
import type { Locale } from "@/i18n/config";
import { pageLine, trafficSource } from "@/lib/request-context";
import { ORDER_MODES, type OrderMode, type RestaurantSettings } from "@/lib/restaurant/model";
import { notifyOrder, notifyTable, retryPendingNotifications } from "@/lib/restaurant/notify";
import { PREVIEW_COOKIE, verifyPreview } from "@/lib/restaurant/preview";
import { allow, clientIp } from "@/lib/restaurant/rate-limit";
import {
  checkDesiredTime,
  checkTableTime,
  cleanCart,
  normalizePhone,
  priceCart,
  type DishProblem,
} from "@/lib/restaurant/rules";
import { dishesByIds, insertOrder, insertTable, orderByIdem, readSettings, tableByIdem } from "@/lib/restaurant/store";

/**
 * Заказ и бронь стола с сайта ресторана.
 *
 * Порядок — главное в этом файле:
 *   1. проверить всё, что прислал браузер, и пересчитать сумму по меню из базы;
 *   2. СОХРАНИТЬ заявку — не сохранилась, значит гостю ошибка и телефон;
 *   3. только потом уведомить ресторан в Telegram.
 * Уведомление не удалось — заявка всё равно в базе, панель её покажет, а
 * досылка отправит позже. Гостю при этом честно «получено»: так и есть.
 *
 * Повторная отправка с тем же ключом попытки (idemKey) возвращает уже
 * созданный заказ — двойной тап и обрыв связи в горах не плодят дублей.
 */

export type OrderResult =
  | { ok: true; token: string; duplicate?: boolean }
  | {
      ok: false;
      error: string;
      problems?: { dishId: number; title: string; problem: DishProblem }[];
      priceChanged?: boolean;
    };

export type TableResult = { ok: true; token: string; duplicate?: boolean } | { ok: false; error: string };

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);

function localeOf(f: FormData): Locale {
  const v = str(f, "locale", 4);
  return v === "uz" || v === "en" ? v : "ru";
}

function failedMessage(locale: Locale, settings?: RestaurantSettings): string {
  const phone = settings?.phones[0] || contacts.phone;
  return `${restaurantText(locale).errors.failed} ${phone}`;
}

/**
 * Предпросмотр действует, только пока раздел не открыт: оставшаяся на сутки
 * cookie не должна помечать тестовыми настоящие заказы владельца после
 * открытия.
 */
async function access(): Promise<{ settings: RestaurantSettings; preview: boolean }> {
  const settings = await readSettings();
  let preview = false;
  try {
    preview = settings.state !== "open" && verifyPreview((await cookies()).get(PREVIEW_COOKIE)?.value, "cookie");
  } catch {
    preview = false;
  }
  return { settings, preview };
}

async function limited(): Promise<boolean> {
  try {
    return !allow(clientIp(await headers()));
  } catch {
    return false;
  }
}

const IDEM = /^[A-Za-z0-9_-]{16,64}$/;

export async function submitRestaurantOrder(formData: FormData): Promise<OrderResult> {
  const locale = localeOf(formData);
  const t = restaurantText(locale).errors;

  // Ловушка для ботов — поле, которого человек не видит. Тихий «успех».
  if (str(formData, "company")) return { ok: true, token: "" };

  const idemKey = str(formData, "idemKey", 80);
  if (!IDEM.test(idemKey)) return { ok: false, error: failedMessage(locale) };

  // Повтор уже сохранённого заказа (ответ потерялся в дороге) — сразу его
  // ссылка, без новых проверок: за минуту выбранное время могло «пройти», и
  // гость получил бы отказ, а потом второй заказ с другим временем.
  try {
    const existing = await orderByIdem(idemKey);
    if (existing) return { ok: true, token: existing.token, duplicate: true };
  } catch (e) {
    console.error("[restaurant] база недоступна:", e);
    return { ok: false, error: failedMessage(locale) };
  }

  if (formData.get("privacyConsent") !== "on") return { ok: false, error: t.consent };
  if (await limited()) return { ok: false, error: t.tooMany };

  let settings: RestaurantSettings;
  let preview: boolean;
  try {
    ({ settings, preview } = await access());
  } catch (e) {
    console.error("[restaurant] настройки недоступны:", e);
    return { ok: false, error: failedMessage(locale) };
  }

  const modeRaw = str(formData, "mode", 20);
  if (!ORDER_MODES.includes(modeRaw as OrderMode)) return { ok: false, error: t.modeClosed };
  const mode = modeRaw as OrderMode;
  // Предпросмотр пропускает только закрытость раздела, не выключенный способ:
  // владелец проверяет ровно то, что увидят гости после открытия.
  if (settings.state !== "open" && !preview) return { ok: false, error: t.closed };
  if (!settings.modes[mode]) return { ok: false, error: t.modeClosed };

  const name = str(formData, "name", 120);
  const phoneRaw = str(formData, "phone", 40);
  if (!name) return { ok: false, error: t.name };
  if (!phoneRaw) return { ok: false, error: t.phone };
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, error: t.phoneInvalid };

  const details: Record<string, unknown> = {};
  if (mode === "delivery") {
    const locality = str(formData, "locality", 160);
    const address = str(formData, "address", 300);
    if (!locality) return { ok: false, error: t.locality };
    if (!address) return { ok: false, error: t.address };
    Object.assign(details, { locality, address });
  }
  if (mode === "room") {
    const unitType = str(formData, "unitType", 10);
    const unitNo = str(formData, "unitNo", 12);
    if ((unitType !== "aframe" && unitType !== "chalet") || !/^[\p{L}\d\s-]{1,12}$/u.test(unitNo)) {
      return { ok: false, error: t.unit };
    }
    Object.assign(details, { unitType, unitNo });
  }
  if (mode === "preorder") {
    const guests = Math.floor(Number(str(formData, "guests", 4)));
    if (!Number.isFinite(guests) || guests < 1 || guests > 40) return { ok: false, error: t.guests };
    details.guests = guests;
  }

  let cartRaw: unknown = [];
  try {
    cartRaw = JSON.parse(str(formData, "cart", 20_000) || "[]");
  } catch {
    cartRaw = [];
  }
  const lines = cleanCart(cartRaw);
  if (lines.length === 0) return { ok: false, error: t.cart };

  const when = checkDesiredTime(settings, mode, {
    asap: formData.get("asap") === "1",
    date: str(formData, "date", 10),
    time: str(formData, "time", 5),
  });
  if (!when.ok) return { ok: false, error: t.time[when.error] };

  let order;
  try {
    // Цены — из базы, без кэша: гость видел меню минуту назад, а кухня за
    // эту минуту могла снять блюдо с продажи.
    const dishes = await dishesByIds(lines.map((l) => l.dishId));
    const priced = priceCart(lines, dishes, mode, settings, locale);
    if (priced.problems.length) {
      return {
        ok: false,
        error: restaurantText(locale).checkout.problemsTitle,
        problems: priced.problems,
      };
    }
    // Цену поменяли, пока гость оформлял: не сохраняем молча другую сумму, а
    // показываем новую — страница перечитает меню.
    const seen = Number(str(formData, "clientSubtotal", 12));
    if (Number.isFinite(seen) && seen > 0 && seen !== priced.subtotal) {
      return { ok: false, error: restaurantText(locale).errors.priceChanged, priceChanged: true };
    }
    order = await insertOrder({
      idemKey,
      mode,
      name,
      phone,
      details,
      desiredTime: when.value,
      items: priced.items,
      subtotal: priced.subtotal,
      fee: priced.fee,
      feePending: priced.feePending,
      total: priced.total,
      comment: str(formData, "comment", 1000),
      locale,
      source: trafficSource(formData),
      page: pageLine(formData),
      // Из предпросмотра — всегда тест: владелец проверяет, а кухня не готовит.
      isTest: preview,
    });
  } catch (e) {
    console.error("[restaurant] заказ не сохранён:", e);
    return { ok: false, error: failedMessage(locale, settings) };
  }

  if (order.created) {
    const sent = await notifyOrder(order.order.id);
    console.log(`[restaurant] заказ ${order.order.number} сохранён · telegram=${sent} · ${mode} · ${order.order.total}`);
  }
  // Заодно — досылка того, что не ушло раньше. После ответа гостю.
  after(() => retryPendingNotifications());

  return { ok: true, token: order.order.token, duplicate: !order.created };
}

export async function submitRestaurantTable(formData: FormData): Promise<TableResult> {
  const locale = localeOf(formData);
  const t = restaurantText(locale).errors;

  if (str(formData, "company")) return { ok: true, token: "" };

  const idemKey = str(formData, "idemKey", 80);
  if (!IDEM.test(idemKey)) return { ok: false, error: failedMessage(locale) };
  try {
    const existing = await tableByIdem(idemKey);
    if (existing) return { ok: true, token: existing.token, duplicate: true };
  } catch (e) {
    console.error("[restaurant] база недоступна:", e);
    return { ok: false, error: failedMessage(locale) };
  }
  if (formData.get("privacyConsent") !== "on") return { ok: false, error: t.consent };
  if (await limited()) return { ok: false, error: t.tooMany };

  let settings: RestaurantSettings;
  let preview: boolean;
  try {
    ({ settings, preview } = await access());
  } catch (e) {
    console.error("[restaurant] настройки недоступны:", e);
    return { ok: false, error: failedMessage(locale) };
  }
  if ((settings.state !== "open" && !preview) || !settings.tables) return { ok: false, error: t.tablesClosed };

  const name = str(formData, "name", 120);
  const phoneRaw = str(formData, "phone", 40);
  if (!name) return { ok: false, error: t.name };
  if (!phoneRaw) return { ok: false, error: t.phone };
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, error: t.phoneInvalid };

  const adults = Math.floor(Number(str(formData, "adults", 4)));
  const kidsRaw = Math.floor(Number(str(formData, "kids", 4) || "0"));
  if (!Number.isFinite(adults) || adults < 1 || adults > 40) return { ok: false, error: t.adults };
  const kids = Number.isFinite(kidsRaw) ? Math.min(Math.max(kidsRaw, 0), 20) : 0;

  const date = str(formData, "date", 10);
  const time = str(formData, "time", 5);
  const when = checkTableTime(settings, date, time);
  if (!when.ok) return { ok: false, error: t.time[when.error] };

  let saved;
  try {
    saved = await insertTable({
      idemKey,
      date,
      time,
      adults,
      kids,
      name,
      phone,
      comment: str(formData, "comment", 1000),
      locale,
      source: trafficSource(formData),
      page: pageLine(formData),
      isTest: preview,
    });
  } catch (e) {
    console.error("[restaurant] заявка на стол не сохранена:", e);
    return { ok: false, error: failedMessage(locale, settings) };
  }

  if (saved.created) {
    const sent = await notifyTable(saved.table.id);
    console.log(`[restaurant] стол ${saved.table.number} сохранён · telegram=${sent}`);
  }
  after(() => retryPendingNotifications());

  return { ok: true, token: saved.table.token, duplicate: !saved.created };
}
