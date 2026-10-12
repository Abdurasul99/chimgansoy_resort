import { sqlClient, type SqlClient } from "@/lib/sql-client";
import type { LocalizedString } from "@/content/types";
import { ensureSchema, resetSchema } from "./schema";
import { AVAILABILITY, type Availability, type Category, type Dish, type DishState, type RestaurantSettings } from "./model";
import { normalizeSettings } from "./rules";

/**
 * База ресторана: настройки и меню.
 *
 * Все функции бросают исключения — вызывающий обязан узнать, что запись не
 * прошла, и не показать в панели ложное «сохранено». Публичные страницы читают
 * базу через live.ts, который ошибки глотает.
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

// ─── Приведение строк ──────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function lsFrom(v: unknown): LocalizedString {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  return { ru: s(o.ru), uz: s(o.uz), en: s(o.en) };
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
    availability: AVAILABILITY.includes(r.availability as never) ? (r.availability as Availability) : "available",
    state: (["published", "hidden", "archived"].includes(String(r.state)) ? r.state : "hidden") as DishState,
    sort: num(r.sort),
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
  state: DishState;
  image?: string;
};

export async function createDish(d: DishInput): Promise<number> {
  const rows = await q<{ id: number }>(
    `INSERT INTO restaurant_dishes
       (category_id, title, description, portion, price, image, availability, state, sort)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, $8,
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
      d.state,
    ],
  );
  return Number(rows[0].id);
}

export async function updateDish(id: number, d: DishInput): Promise<void> {
  await q(
    `UPDATE restaurant_dishes
        SET category_id = $2, title = $3::jsonb, description = $4::jsonb, portion = $5, price = $6,
            availability = $7, state = $8, updated_at = now()
      WHERE id = $1`,
    [
      id,
      d.categoryId,
      JSON.stringify(d.title),
      JSON.stringify(d.description),
      d.portion,
      Math.max(0, Math.round(d.price)),
      d.availability,
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
