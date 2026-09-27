import { randomBytes } from "node:crypto";
import { sqlClient, type SqlClient } from "@/lib/sql-client";
import type { LocalizedString } from "@/content/types";
import { ensureSchema, resetSchema } from "./schema";
import {
  CANCEL_REASONS,
  orderNumber,
  tableNumber,
  type Availability,
  type Category,
  type Channel,
  type Dish,
  type DishState,
  type Order,
  type OrderDetails,
  type OrderItem,
  type OrderMode,
  type OrderStatus,
  type RestaurantSettings,
  type StatusLogEntry,
  type TableRequest,
  type TableStatus,
} from "./model";
import {
  canMoveOrder,
  canMoveTable,
  isAvailability,
  normalizeChannels,
  normalizeSettings,
  tashkentNow,
} from "./rules";

/**
 * База ресторана.
 *
 * Правило здесь обратное src/lib/db.ts. Там запись идёт ПОСЛЕ доставки в
 * Telegram и глотает ошибки — заявка важнее строки в журнале. Здесь заказ
 * сначала сохраняется, и только потом уходит уведомление (ТЗ, п. 7: «одного
 * сообщения в мессенджере без сохранённой заявки недостаточно»). Поэтому все
 * функции бросают исключения: вызывающий обязан узнать, что заказ не записан,
 * и не показать гостю ложный успех.
 */

function connect(): { sql: SqlClient; url: string } {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL не задан");
  return { sql: sqlClient(url), url };
}

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const { sql, url } = connect();
  await ensureSchema(sql, url);
  try {
    return (await sql.query(text, params)) as T[];
  } catch (e) {
    // 42P01 — таблицы нет: базу пересоздали или восстановили из копии, пока
    // процесс работал. Схема прогоняется заново один раз, без перезапуска сайта.
    if ((e as { code?: string }).code !== "42P01") throw e;
    resetSchema(url);
    await ensureSchema(sql, url);
    return (await sql.query(text, params)) as T[];
  }
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Токен ссылки на статус: 144 бита случайности, в адресе — 24 символа. */
export function newToken(): string {
  return randomBytes(18).toString("base64url");
}

// ─── Приведение строк ──────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function lsFrom(v: unknown): LocalizedString {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  return { ru: s(o.ru), uz: s(o.uz), en: s(o.en) };
}

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return typeof v === "string" ? v : "";
}

/** date из Postgres приходит объектом Date в полночь по UTC сервера. */
function dateOnly(v: unknown): string {
  if (v instanceof Date) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60_000);
    return d.toISOString().slice(0, 10);
  }
  return typeof v === "string" ? v.slice(0, 10) : "";
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function mapCategory(r: Row): Category {
  return { id: num(r.id), title: lsFrom(r.title), sort: num(r.sort), visible: Boolean(r.visible) };
}

function mapDish(r: Row): Dish {
  return {
    id: num(r.id),
    categoryId: r.category_id === null || r.category_id === undefined ? null : num(r.category_id),
    title: lsFrom(r.title),
    description: lsFrom(r.description),
    portion: String(r.portion ?? ""),
    price: num(r.price),
    image: String(r.image ?? ""),
    availability: isAvailability(r.availability) ? r.availability : "available",
    channels: normalizeChannels(r.channels),
    state: (["published", "hidden", "archived"].includes(String(r.state)) ? r.state : "hidden") as DishState,
    sort: num(r.sort),
  };
}

function mapOrder(r: Row): Order {
  const id = num(r.id);
  return {
    id,
    number: orderNumber(id),
    token: String(r.token),
    mode: String(r.mode) as OrderMode,
    status: String(r.status) as OrderStatus,
    name: String(r.guest_name ?? ""),
    phone: String(r.phone ?? ""),
    details: (r.details && typeof r.details === "object" ? r.details : {}) as OrderDetails,
    desiredTime: String(r.desired_time ?? "asap"),
    confirmedTime: String(r.confirmed_time ?? ""),
    items: (Array.isArray(r.items) ? r.items : []) as OrderItem[],
    subtotal: num(r.subtotal),
    fee: r.fee === null || r.fee === undefined ? null : num(r.fee),
    total: num(r.total),
    feePending: Boolean(r.fee_pending),
    paymentStatus: r.payment_status === "paid" ? "paid" : "unpaid",
    comment: String(r.comment ?? ""),
    locale: String(r.locale ?? "ru"),
    source: String(r.source ?? ""),
    page: String(r.page ?? ""),
    cancelReason: String(r.cancel_reason ?? ""),
    isTest: Boolean(r.is_test),
    notifiedAt: r.notified_at ? iso(r.notified_at) : null,
    tgSent: Array.isArray(r.tg_messages) ? r.tg_messages.length : 0,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapTable(r: Row): TableRequest {
  const id = num(r.id);
  return {
    id,
    number: tableNumber(id),
    token: String(r.token),
    status: String(r.status) as TableStatus,
    date: dateOnly(r.visit_date),
    time: String(r.visit_time ?? ""),
    adults: num(r.adults),
    kids: num(r.kids),
    name: String(r.guest_name ?? ""),
    phone: String(r.phone ?? ""),
    comment: String(r.comment ?? ""),
    locale: String(r.locale ?? "ru"),
    source: String(r.source ?? ""),
    page: String(r.page ?? ""),
    cancelReason: String(r.cancel_reason ?? ""),
    isTest: Boolean(r.is_test),
    notifiedAt: r.notified_at ? iso(r.notified_at) : null,
    tgSent: Array.isArray(r.tg_messages) ? r.tg_messages.length : 0,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapLog(r: Row): StatusLogEntry {
  return {
    kind: r.kind === "table" ? "table" : "order",
    entityId: num(r.entity_id),
    from: r.from_status === null || r.from_status === undefined ? null : String(r.from_status),
    to: String(r.to_status),
    byWhom: String(r.by_whom ?? ""),
    via: (["site", "admin", "telegram"].includes(String(r.via)) ? r.via : "admin") as StatusLogEntry["via"],
    reason: String(r.reason ?? ""),
    at: iso(r.at),
  };
}

// ─── Настройки ─────────────────────────────────────────────────────────────

export async function readSettings(): Promise<RestaurantSettings> {
  const rows = await q(`SELECT data FROM restaurant_settings WHERE id = 1`);
  return normalizeSettings(rows[0]?.data);
}

export async function saveSettings(s: RestaurantSettings, by: string): Promise<void> {
  const clean = normalizeSettings(s);
  await q(
    `INSERT INTO restaurant_settings (id, data, updated_at, updated_by) VALUES (1, $1::jsonb, now(), $2)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [JSON.stringify(clean), by.slice(0, 120)],
  );
}

// ─── Меню ──────────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  return (await q(`SELECT * FROM restaurant_categories ORDER BY sort, id`)).map(mapCategory);
}

export async function listDishes(opts: { withArchived?: boolean } = {}): Promise<Dish[]> {
  const rows = await q(
    `SELECT * FROM restaurant_dishes ${opts.withArchived ? "" : "WHERE state <> 'archived'"} ORDER BY sort, id`,
  );
  return rows.map(mapDish);
}

/** Меню для гостя: только опубликованные блюда в видимых разделах. */
export async function publicMenu(): Promise<{ categories: Category[]; dishes: Dish[] }> {
  const [cats, dishes] = await Promise.all([
    q(`SELECT * FROM restaurant_categories WHERE visible ORDER BY sort, id`),
    q(
      `SELECT d.* FROM restaurant_dishes d
         LEFT JOIN restaurant_categories c ON c.id = d.category_id
        WHERE d.state = 'published' AND (c.id IS NULL OR c.visible)
        ORDER BY d.sort, d.id`,
    ),
  ]);
  return { categories: cats.map(mapCategory), dishes: dishes.map(mapDish) };
}

/**
 * Блюда по id — без кэша, для пересчёта заказа на сервере. Блюдо из скрытого
 * раздела считается скрытым: страница, открытая до того, как раздел убрали,
 * не должна протащить его в заказ.
 */
export async function dishesByIds(ids: number[]): Promise<Dish[]> {
  if (ids.length === 0) return [];
  const rows = await q(
    `SELECT d.*, CASE WHEN c.id IS NOT NULL AND NOT c.visible THEN 'hidden' ELSE d.state END AS state
       FROM restaurant_dishes d
       LEFT JOIN restaurant_categories c ON c.id = d.category_id
      WHERE d.id = ANY($1::int[])`,
    [ids],
  );
  return rows.map(mapDish);
}

export async function createCategory(title: LocalizedString): Promise<number> {
  const rows = await q<{ id: number }>(
    `INSERT INTO restaurant_categories (title, sort)
     VALUES ($1::jsonb, COALESCE((SELECT max(sort) + 1 FROM restaurant_categories), 0))
     RETURNING id`,
    [JSON.stringify(title)],
  );
  return Number(rows[0].id);
}

export async function updateCategory(id: number, patch: { title?: LocalizedString; visible?: boolean }): Promise<void> {
  await q(
    `UPDATE restaurant_categories
        SET title = COALESCE($2::jsonb, title), visible = COALESCE($3, visible), updated_at = now()
      WHERE id = $1`,
    [id, patch.title ? JSON.stringify(patch.title) : null, patch.visible ?? null],
  );
}

/**
 * Раздел удаляется, блюда остаются — «без раздела» и скрытыми: иначе блюда
 * скрытого раздела после удаления сами собой оказались бы в меню у гостей.
 * Вернуть их на сайт — одно нажатие «Опубликовано» в админке.
 */
export async function deleteCategory(id: number): Promise<void> {
  await q(
    `WITH hide AS (
       UPDATE restaurant_dishes SET state = 'hidden', updated_at = now()
        WHERE category_id = $1 AND state = 'published'
     )
     DELETE FROM restaurant_categories WHERE id = $1`,
    [id],
  );
}

/** Новый порядок — одним запросом: позиция в массиве становится sort. */
async function applyOrder(table: "restaurant_categories" | "restaurant_dishes", ids: number[]): Promise<void> {
  await q(
    `UPDATE ${table} t SET sort = v.ord
       FROM (SELECT unnest($1::int[]) AS id, generate_subscripts($1::int[], 1) AS ord) v
      WHERE t.id = v.id`,
    [ids],
  );
}

function swap(ids: number[], id: number, dir: -1 | 1): number[] | null {
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const out = [...ids];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export async function moveCategory(id: number, dir: -1 | 1): Promise<void> {
  const ids = (await listCategories()).map((c) => c.id);
  const next = swap(ids, id, dir);
  if (next) await applyOrder("restaurant_categories", next);
}

export async function moveDish(id: number, dir: -1 | 1): Promise<void> {
  const all = await listDishes({ withArchived: true });
  const me = all.find((d) => d.id === id);
  if (!me) return;
  const ids = all.filter((d) => d.categoryId === me.categoryId).map((d) => d.id);
  const next = swap(ids, id, dir);
  if (next) await applyOrder("restaurant_dishes", next);
}

export type DishInput = {
  categoryId: number | null;
  title: LocalizedString;
  description: LocalizedString;
  portion: string;
  price: number;
  availability: Availability;
  channels: Channel[];
  state: DishState;
  image?: string;
};

export async function createDish(d: DishInput): Promise<number> {
  const rows = await q<{ id: number }>(
    `INSERT INTO restaurant_dishes
       (category_id, title, description, portion, price, image, availability, channels, state, sort)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, $8::text[], $9,
             COALESCE((SELECT max(sort) + 1 FROM restaurant_dishes WHERE category_id IS NOT DISTINCT FROM $1), 0))
     RETURNING id`,
    [
      d.categoryId,
      JSON.stringify(d.title),
      JSON.stringify(d.description),
      d.portion,
      Math.max(0, Math.round(d.price)),
      d.image ?? "",
      d.availability,
      d.channels,
      d.state,
    ],
  );
  return Number(rows[0].id);
}

export async function updateDish(id: number, d: DishInput): Promise<void> {
  await q(
    `UPDATE restaurant_dishes
        SET category_id = $2, title = $3::jsonb, description = $4::jsonb, portion = $5, price = $6,
            availability = $7, channels = $8::text[], state = $9, updated_at = now()
      WHERE id = $1`,
    [
      id,
      d.categoryId,
      JSON.stringify(d.title),
      JSON.stringify(d.description),
      d.portion,
      Math.max(0, Math.round(d.price)),
      d.availability,
      d.channels,
      d.state,
    ],
  );
}

export async function setDishAvailability(id: number, a: Availability): Promise<void> {
  await q(`UPDATE restaurant_dishes SET availability = $2, updated_at = now() WHERE id = $1`, [id, a]);
}

export async function setDishState(id: number, s: DishState): Promise<void> {
  await q(`UPDATE restaurant_dishes SET state = $2, updated_at = now() WHERE id = $1`, [id, s]);
}

export async function setDishPrice(id: number, price: number): Promise<void> {
  await q(`UPDATE restaurant_dishes SET price = $2, updated_at = now() WHERE id = $1`, [
    id,
    Math.max(0, Math.round(price)),
  ]);
}

/** Возвращает прежний адрес фото, чтобы вызывающий удалил файл. */
export async function setDishImage(id: number, url: string): Promise<string> {
  const rows = await q<{ old: string }>(
    `UPDATE restaurant_dishes d SET image = $2, updated_at = now()
       FROM (SELECT image AS old FROM restaurant_dishes WHERE id = $1) prev
      WHERE d.id = $1 RETURNING prev.old`,
    [id, url],
  );
  return String(rows[0]?.old ?? "");
}

// ─── Заказы ────────────────────────────────────────────────────────────────

export type NewOrder = {
  idemKey: string;
  mode: OrderMode;
  name: string;
  phone: string;
  details: OrderDetails;
  desiredTime: string;
  items: OrderItem[];
  subtotal: number;
  fee: number | null;
  feePending: boolean;
  total: number;
  comment: string;
  locale: string;
  source: string;
  page: string;
  isTest: boolean;
};

/**
 * Сохраняет заказ один раз на ключ попытки.
 *
 * Вставка и первая строка истории — одним запросом: заказ без записи «создан»
 * в истории был бы документом без начала. Повтор с тем же ключом (двойное
 * нажатие, обрыв связи и повторная отправка) получает уже созданный заказ и
 * `created: false` — второй раз в Telegram он не уйдёт.
 */
export async function insertOrder(o: NewOrder): Promise<{ order: Order; created: boolean }> {
  const rows = await q(
    `WITH ins AS (
       INSERT INTO restaurant_orders
         (token, idem_key, mode, guest_name, phone, details, desired_time, items, subtotal, fee,
          fee_pending, total, comment, locale, source, page, is_test)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (idem_key) DO NOTHING
       RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via)
       SELECT 'order', id, NULL, 'new', 'гость', 'site' FROM ins
     )
     SELECT * FROM ins`,
    [
      newToken(),
      o.idemKey,
      o.mode,
      o.name,
      o.phone,
      JSON.stringify(o.details),
      o.desiredTime,
      JSON.stringify(o.items),
      o.subtotal,
      o.fee,
      o.feePending,
      o.total,
      o.comment,
      o.locale,
      o.source,
      o.page,
      o.isTest,
    ],
  );
  if (rows[0]) return { order: mapOrder(rows[0]), created: true };
  const existing = await q(`SELECT * FROM restaurant_orders WHERE idem_key = $1`, [o.idemKey]);
  if (!existing[0]) throw new Error("заказ не сохранён");
  return { order: mapOrder(existing[0]), created: false };
}

export async function getOrder(id: number): Promise<Order | null> {
  const rows = await q(`SELECT * FROM restaurant_orders WHERE id = $1`, [id]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

/** Заказ по ключу попытки — повтор находит его раньше, чем начнёт проверки заново. */
export async function orderByIdem(idemKey: string): Promise<Order | null> {
  const rows = await q(`SELECT * FROM restaurant_orders WHERE idem_key = $1`, [idemKey]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function tableByIdem(idemKey: string): Promise<TableRequest | null> {
  const rows = await q(`SELECT * FROM restaurant_tables WHERE idem_key = $1`, [idemKey]);
  return rows[0] ? mapTable(rows[0]) : null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT * FROM restaurant_orders WHERE token = $1`, [token]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

export type OrderFilter = "active" | "new" | "today" | "done" | "cancelled" | "all";

export async function listOrders(filter: OrderFilter, opts: { tests?: boolean; limit?: number } = {}): Promise<Order[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter === "active") where.push(`status IN ('new', 'confirmed', 'cooking', 'ready')`);
  if (filter === "new") where.push(`status = 'new'`);
  if (filter === "done") where.push(`status = 'done'`);
  if (filter === "cancelled") where.push(`status = 'cancelled'`);
  if (filter === "today") {
    params.push(tashkentNow().date);
    where.push(`(created_at AT TIME ZONE 'Asia/Tashkent')::date = $${params.length}::date`);
  }
  if (!opts.tests) where.push(`NOT is_test`);
  params.push(Math.min(Math.max(opts.limit ?? 200, 1), 500));
  const rows = await q(
    `SELECT * FROM restaurant_orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(mapOrder);
}

export async function countNewOrders(): Promise<{ orders: number; tables: number }> {
  const rows = await q<{ o: number; t: number }>(
    `SELECT (SELECT count(*)::int FROM restaurant_orders WHERE status = 'new' AND NOT is_test) AS o,
            (SELECT count(*)::int FROM restaurant_tables WHERE status = 'new' AND NOT is_test) AS t`,
  );
  return { orders: Number(rows[0]?.o ?? 0), tables: Number(rows[0]?.t ?? 0) };
}

export type Actor = { name: string; via: "admin" | "telegram" | "site" };

export type StatusResult<T> =
  | { ok: true; item: T; from: string }
  | { ok: false; error: "not_found" | "transition" | "race" | "reason"; current?: string };

function cleanReason(to: string, reason: string | undefined): string | null {
  if (to !== "cancelled" && to !== "declined") return "";
  const r = (reason ?? "").trim().slice(0, 300);
  if (!r) return null;
  return r;
}

/**
 * Смена статуса заказа — сравнение-и-замена.
 *
 * UPDATE срабатывает только если статус всё ещё тот, что прочитан: две
 * кнопки, нажатые одновременно в Telegram и в панели, не проведут заказ дважды.
 * Проигравший получает `race` и перечитывает заказ.
 */
export async function setOrderStatus(
  id: number,
  to: OrderStatus,
  actor: Actor,
  reason?: string,
): Promise<StatusResult<Order>> {
  const current = await getOrder(id);
  if (!current) return { ok: false, error: "not_found" };
  if (!canMoveOrder(current.status, to)) return { ok: false, error: "transition", current: current.status };
  const why = cleanReason(to, reason);
  if (why === null) return { ok: false, error: "reason", current: current.status };
  const rows = await q(
    `WITH upd AS (
       UPDATE restaurant_orders
          SET status = $2,
              cancel_reason = CASE WHEN $2 = 'cancelled' THEN $3 ELSE cancel_reason END,
              updated_at = now()
        WHERE id = $1 AND status = $4
        RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via, reason)
       SELECT 'order', id, $4, $2, $5, $6, $3 FROM upd
     )
     SELECT * FROM upd`,
    [id, to, why, current.status, actor.name.slice(0, 160), actor.via],
  );
  if (!rows[0]) return { ok: false, error: "race", current: (await getOrder(id))?.status ?? current.status };
  return { ok: true, item: mapOrder(rows[0]), from: current.status };
}

/** Подтверждённое время и оплата — не статусы, но тоже пишутся в историю. */
export async function setOrderConfirmedTime(id: number, time: string, actor: Actor): Promise<Order | null> {
  const rows = await q(
    `WITH upd AS (
       UPDATE restaurant_orders SET confirmed_time = $2, updated_at = now() WHERE id = $1 RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via, reason)
       SELECT 'order', id, status, status, $3, $4, $5 FROM upd
     )
     SELECT * FROM upd`,
    [id, time.slice(0, 40), actor.name.slice(0, 160), actor.via, time ? `время подтверждено: ${time}` : "подтверждённое время снято"],
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

/** Сбор, который менеджер утвердил по телефону: он входит в итог заказа. */
export async function setOrderFee(id: number, fee: number, actor: Actor): Promise<Order | null> {
  const rows = await q(
    `WITH upd AS (
       UPDATE restaurant_orders
          SET fee = $2, fee_pending = false, total = subtotal + $2, updated_at = now()
        WHERE id = $1 AND mode IN ('delivery', 'room')
        RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via, reason)
       SELECT 'order', id, status, status, $3, $4, $5 FROM upd
     )
     SELECT * FROM upd`,
    [id, Math.max(0, Math.round(fee)), actor.name.slice(0, 160), actor.via, `сбор: ${Math.max(0, Math.round(fee))} сум`],
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function setOrderPayment(id: number, paid: boolean, actor: Actor): Promise<Order | null> {
  const rows = await q(
    `WITH upd AS (
       UPDATE restaurant_orders SET payment_status = $2, updated_at = now() WHERE id = $1 RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via, reason)
       SELECT 'order', id, status, status, $3, $4, $5 FROM upd
     )
     SELECT * FROM upd`,
    [id, paid ? "paid" : "unpaid", actor.name.slice(0, 160), actor.via, paid ? "оплата: оплачен" : "оплата: не оплачен"],
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function history(kind: "order" | "table", id: number): Promise<StatusLogEntry[]> {
  const rows = await q(
    `SELECT * FROM restaurant_status_log WHERE kind = $1 AND entity_id = $2 ORDER BY at, id`,
    [kind, id],
  );
  return rows.map(mapLog);
}

export async function historyFor(kind: "order" | "table", ids: number[]): Promise<Map<number, StatusLogEntry[]>> {
  const out = new Map<number, StatusLogEntry[]>();
  if (ids.length === 0) return out;
  const rows = await q(
    `SELECT * FROM restaurant_status_log WHERE kind = $1 AND entity_id = ANY($2::bigint[]) ORDER BY at, id`,
    [kind, ids],
  );
  for (const r of rows.map(mapLog)) {
    const list = out.get(r.entityId) ?? [];
    list.push(r);
    out.set(r.entityId, list);
  }
  return out;
}

// ─── Столы ─────────────────────────────────────────────────────────────────

export type NewTable = {
  idemKey: string;
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
  isTest: boolean;
};

export async function insertTable(t: NewTable): Promise<{ table: TableRequest; created: boolean }> {
  const rows = await q(
    `WITH ins AS (
       INSERT INTO restaurant_tables
         (token, idem_key, visit_date, visit_time, adults, kids, guest_name, phone, comment, locale, source, page, is_test)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (idem_key) DO NOTHING
       RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via)
       SELECT 'table', id, NULL, 'new', 'гость', 'site' FROM ins
     )
     SELECT * FROM ins`,
    [newToken(), t.idemKey, t.date, t.time, t.adults, t.kids, t.name, t.phone, t.comment, t.locale, t.source, t.page, t.isTest],
  );
  if (rows[0]) return { table: mapTable(rows[0]), created: true };
  const existing = await q(`SELECT * FROM restaurant_tables WHERE idem_key = $1`, [t.idemKey]);
  if (!existing[0]) throw new Error("заявка не сохранена");
  return { table: mapTable(existing[0]), created: false };
}

export async function getTable(id: number): Promise<TableRequest | null> {
  const rows = await q(`SELECT * FROM restaurant_tables WHERE id = $1`, [id]);
  return rows[0] ? mapTable(rows[0]) : null;
}

export async function getTableByToken(token: string): Promise<TableRequest | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await q(`SELECT * FROM restaurant_tables WHERE token = $1`, [token]);
  return rows[0] ? mapTable(rows[0]) : null;
}

export type TableFilter = "upcoming" | "new" | "today" | "past" | "all";

export async function listTables(filter: TableFilter, opts: { tests?: boolean; limit?: number } = {}): Promise<TableRequest[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const today = tashkentNow().date;
  if (filter === "upcoming") {
    params.push(today);
    where.push(`visit_date >= $${params.length}::date AND status IN ('new', 'confirmed')`);
  }
  if (filter === "new") where.push(`status = 'new'`);
  if (filter === "today") {
    params.push(today);
    where.push(`visit_date = $${params.length}::date`);
  }
  if (filter === "past") {
    params.push(today);
    where.push(`(visit_date < $${params.length}::date OR status IN ('declined', 'cancelled', 'done'))`);
  }
  if (!opts.tests) where.push(`NOT is_test`);
  params.push(Math.min(Math.max(opts.limit ?? 200, 1), 500));
  const order = filter === "upcoming" || filter === "today" ? "visit_date, visit_time, id" : "created_at DESC";
  const rows = await q(
    `SELECT * FROM restaurant_tables ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ${order} LIMIT $${params.length}`,
    params,
  );
  return rows.map(mapTable);
}

export async function setTableStatus(
  id: number,
  to: TableStatus,
  actor: Actor,
  reason?: string,
): Promise<StatusResult<TableRequest>> {
  const current = await getTable(id);
  if (!current) return { ok: false, error: "not_found" };
  if (!canMoveTable(current.status, to)) return { ok: false, error: "transition", current: current.status };
  const why = cleanReason(to, reason);
  if (why === null) return { ok: false, error: "reason", current: current.status };
  const rows = await q(
    `WITH upd AS (
       UPDATE restaurant_tables
          SET status = $2,
              cancel_reason = CASE WHEN $2 IN ('cancelled', 'declined') THEN $3 ELSE cancel_reason END,
              updated_at = now()
        WHERE id = $1 AND status = $4
        RETURNING *
     ), log AS (
       INSERT INTO restaurant_status_log (kind, entity_id, from_status, to_status, by_whom, via, reason)
       SELECT 'table', id, $4, $2, $5, $6, $3 FROM upd
     )
     SELECT * FROM upd`,
    [id, to, why, current.status, actor.name.slice(0, 160), actor.via],
  );
  if (!rows[0]) return { ok: false, error: "race", current: (await getTable(id))?.status ?? current.status };
  return { ok: true, item: mapTable(rows[0]), from: current.status };
}

// ─── Уведомления ───────────────────────────────────────────────────────────

export type TgMessage = { chat_id: string; message_id: number };

const NOTIFY_TABLE = { order: "restaurant_orders", table: "restaurant_tables" } as const;

/**
 * Захват права отправить уведомление.
 *
 * Отправить может только тот, кто первым поставил отметку: повтор заказа с
 * тем же ключом, фоновая досылка и кнопка «отправить ещё раз» не пришлют
 * ресторану один заказ трижды. Захват протухает через минуту — если
 * отправивший процесс умер, следующая попытка его перехватит.
 */
export async function claimNotify(kind: "order" | "table", id: number): Promise<boolean> {
  const rows = await q(
    `UPDATE ${NOTIFY_TABLE[kind]} SET notify_claimed_at = now(), notify_tries = notify_tries + 1
      WHERE id = $1 AND notified_at IS NULL
        AND (notify_claimed_at IS NULL OR notify_claimed_at < now() - interval '60 seconds')
      RETURNING id`,
    [id],
  );
  return rows.length > 0;
}

export async function markNotified(kind: "order" | "table", id: number, messages: TgMessage[]): Promise<void> {
  await q(
    `UPDATE ${NOTIFY_TABLE[kind]} SET notified_at = now(), tg_messages = $2::jsonb WHERE id = $1`,
    [id, JSON.stringify(messages)],
  );
}

/**
 * Доставлено не во все чаты: запоминаем, куда дошло, и снимаем захват —
 * досылка отправит только в оставшиеся.
 */
export async function savePartial(kind: "order" | "table", id: number, messages: TgMessage[]): Promise<void> {
  await q(
    `UPDATE ${NOTIFY_TABLE[kind]} SET tg_messages = $2::jsonb, notify_claimed_at = NULL WHERE id = $1`,
    [id, JSON.stringify(messages)],
  );
}

export async function isNotified(kind: "order" | "table", id: number): Promise<boolean> {
  const rows = await q(`SELECT 1 FROM ${NOTIFY_TABLE[kind]} WHERE id = $1 AND notified_at IS NOT NULL`, [id]);
  return rows.length > 0;
}

/** Неудача: снимаем захват, чтобы следующая попытка могла отправить сразу. */
export async function releaseNotify(kind: "order" | "table", id: number): Promise<void> {
  await q(`UPDATE ${NOTIFY_TABLE[kind]} SET notify_claimed_at = NULL WHERE id = $1`, [id]);
}

export async function tgMessages(kind: "order" | "table", id: number): Promise<TgMessage[]> {
  const rows = await q<{ tg_messages: unknown }>(`SELECT tg_messages FROM ${NOTIFY_TABLE[kind]} WHERE id = $1`, [id]);
  const v = rows[0]?.tg_messages;
  return Array.isArray(v) ? (v as TgMessage[]) : [];
}

/** Недоставленные за сутки — для досылки; первыми — кого пробовали реже. */
export async function pendingNotifications(kind: "order" | "table", limit = 10): Promise<number[]> {
  const rows = await q<{ id: number }>(
    `SELECT id FROM ${NOTIFY_TABLE[kind]}
      WHERE notified_at IS NULL AND created_at > now() - interval '1 day'
        AND (notify_claimed_at IS NULL OR notify_claimed_at < now() - interval '60 seconds')
      ORDER BY notify_tries, id LIMIT $1`,
    [limit],
  );
  return rows.map((r) => Number(r.id));
}

export { CANCEL_REASONS };
