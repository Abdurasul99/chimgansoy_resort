"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { actorName, requireRole } from "@/lib/admin-auth";
import { del, put } from "@/lib/blob-store";
import type { LocalizedString } from "@/content/types";
import {
  AVAILABILITY,
  DISH_STATES,
  GALLERY_MAX,
  RESTAURANT_STATES,
  type Availability,
  type DishState,
  type RestaurantSettings,
} from "@/lib/restaurant/model";
import { expireRestaurant } from "@/lib/restaurant/live";
import { LINK_TTL_MS, signPreview } from "@/lib/restaurant/preview";
import { normalizeSettings, toMinutes } from "@/lib/restaurant/rules";
import * as store from "@/lib/restaurant/store";

/**
 * Действия раздела «Ресторан» в панели.
 *
 * Права — в каждом действии, а не только в layout (layout не защищает
 * server action):
 *   • наличие блюда — владелец, менеджер ресторана и сотрудник;
 *   • остальное меню, настройки и фото — владелец и менеджер;
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
      state: DISH_STATES.includes(state) ? state : "published",
    };
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

/**
 * Быстрые действия из строки таблицы: наличие, публикация, порядок, цена.
 * Наличие может менять и сотрудник ресторана — «сегодня нет» знает смена, а не
 * менеджер; остальное — только владелец и менеджер.
 */
export async function dishAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const op = str(form, "op", 20);
    await requireRole(...(AVAILABILITY.includes(op as Availability) ? ANY : EDITORS));
    const dishId = id(form);
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

// ─── Фотогалерея ───────────────────────────────────────────────────────────

/**
 * Одно фото в галерею. Вызывается из браузера напрямую, по фото за раз: снимки
 * выбирают пачкой, а запрос к панели ограничен примерно мегабайтом — пачка
 * целиком не прошла бы.
 */
export async function addGalleryPhoto(form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...EDITORS);
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) return { error: "Выберите фото." };
    const current = await store.readSettings();
    if (current.gallery.length >= GALLERY_MAX) return { error: `В галерее уже ${GALLERY_MAX} фото — уберите лишние.` };
    const url = await storeImage(file, "restaurant/gallery");
    await store.saveSettings({ ...current, gallery: [...current.gallery, url] }, actorName(s));
    expireRestaurant();
    return { ok: "Фото добавлено." };
  } catch (e) {
    return fail(e);
  }
}

/** Убрать фото или сдвинуть его в порядке показа. */
export async function galleryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const s = await requireRole(...EDITORS);
    const url = str(form, "url", 400);
    const op = str(form, "op", 10);
    const current = await store.readSettings();
    const i = current.gallery.indexOf(url);
    if (i < 0) return { error: "Фото уже нет — обновите страницу." };
    const gallery = [...current.gallery];
    if (op === "remove") gallery.splice(i, 1);
    else if (op === "up" || op === "down") {
      const j = op === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= gallery.length) return { ok: "Готово." };
      [gallery[i], gallery[j]] = [gallery[j], gallery[i]];
    } else return { error: "Неизвестное действие." };
    await store.saveSettings({ ...current, gallery }, actorName(s));
    if (op === "remove") await del(url).catch(() => {});
    expireRestaurant();
    revalidatePath("/admin/restoran/nastroyki");
    return { ok: op === "remove" ? "Фото убрано." : "Готово." };
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
