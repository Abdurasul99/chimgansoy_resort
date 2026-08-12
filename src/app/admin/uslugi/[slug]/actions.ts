"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { readAtLeast, saveOverrides, type FieldType, type FormField } from "@/lib/site-overrides";

/** rev — номер записи, которую только что сделали. Форма запомнит его и
 *  пришлёт со следующей правкой: страница может не успеть перерисоваться. */
export type FormState = { ok?: boolean; error?: string; rev?: number };

const TYPES: FieldType[] = ["text", "textarea", "number", "phone", "date", "select", "checkbox"];

/** Ключ поля — латиница из названия, чтобы ответ читался в заявке. */
function keyOf(label: string, taken: string[]): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };
  const base = label
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "pole";

  // Два поля с одним ключом перетёрли бы ответ друг друга в заявке.
  if (!taken.includes(base)) return base;
  for (let i = 2; i < 50; i++) if (!taken.includes(`${base}_${i}`)) return `${base}_${i}`;
  return `${base}_${Date.now().toString(36).slice(-4)}`;
}

/**
 * Читает услугу оператора вместе со всем документом.
 *
 * minRev — номер, который экран отдал форме, а форма вернула серверу: правка
 * применяется к документу не старше того, что оператор видел на экране.
 * Без этого хранилище успевало отдать документ БЕЗ предыдущей правки, и она
 * тихо терялась при следующем сохранении.
 */
async function withService(slug: string, minRev: number) {
  const data = await readAtLeast(minRev);
  // null — хранилище отстаёт; писать поверх старого документа нельзя.
  if (!data) return { data: null, index: -1 };
  const index = data.customServices.findIndex((c) => c.slug === slug);
  return { data, index };
}

const BEHIND = "Хранилище не успело обновиться. Нажмите ещё раз — правка не потеряется.";

/** Номер ревизии, который прислала форма. */
const revOf = (form: FormData) => Number(String(form.get("rev") ?? "0"));

async function persist(slug: string, fields: FormField[], minRev: number): Promise<FormState> {
  const { data, index } = await withService(slug, minRev);
  if (!data) return { error: BEHIND };
  if (index < 0) return { error: "Услуга не найдена." };

  const next = [...data.customServices];
  next[index] = { ...next[index], formFields: fields.length ? fields : undefined };

  const res = await saveOverrides({ ...data, customServices: next });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true, rev: res.rev };
}

/** Добавляет одно поле в конец формы. */
export async function addField(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const slug = String(form.get("slug") ?? "").trim();
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const rawType = String(form.get("type") ?? "").trim();
  const type = TYPES.find((t) => t === rawType);
  const required = form.get("required") === "on";
  const placeholder = String(form.get("placeholder") ?? "").trim().slice(0, 120);
  const options = String(form.get("options") ?? "")
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean)
    .slice(0, 24);
  const min = Number(String(form.get("min") ?? "").trim());
  const max = Number(String(form.get("max") ?? "").trim());

  if (label.length < 2) return { error: "Напишите, о чём спрашиваем гостя." };
  if (!type) return { error: "Выберите тип поля." };
  if (type === "select" && options.length < 2) {
    return { error: "Список нужен минимум с двумя вариантами — по одному в строке." };
  }
  if (type === "number" && Number.isFinite(min) && Number.isFinite(max) && min > max) {
    return { error: "«От» больше, чем «до»." };
  }

  const { data, index } = await withService(slug, revOf(form));
  if (!data) return { error: BEHIND };
  if (index < 0) return { error: "Услуга не найдена." };
  const fields = data.customServices[index].formFields ?? [];
  if (fields.length >= 20) return { error: "Двадцати полей хватит любой заявке." };

  const field: FormField = {
    key: keyOf(label, fields.map((f) => f.key)),
    label,
    type,
    required,
    placeholder: placeholder || undefined,
    options: type === "select" ? options : undefined,
    min: type === "number" && Number.isFinite(min) ? min : undefined,
    max: type === "number" && Number.isFinite(max) ? max : undefined,
  };

  return persist(slug, [...fields, field], revOf(form));
}

/** Убирает поле. Ответы в уже отправленных заявках это не трогает. */
export async function removeField(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const slug = String(form.get("slug") ?? "").trim();
  const key = String(form.get("key") ?? "").trim();
  const { data, index } = await withService(slug, revOf(form));
  if (!data) return { error: BEHIND };
  if (index < 0) return { error: "Услуга не найдена." };

  return persist(slug, (data.customServices[index].formFields ?? []).filter((f) => f.key !== key), revOf(form));
}

/** Двигает поле на одну позицию. Кнопками, а не перетаскиванием: работает и
 *  на планшете, и без мыши, и не ломается на длинном списке. */
export async function moveField(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const slug = String(form.get("slug") ?? "").trim();
  const key = String(form.get("key") ?? "").trim();
  const dir = String(form.get("dir") ?? "") === "up" ? -1 : 1;

  const { data, index } = await withService(slug, revOf(form));
  if (!data) return { error: BEHIND };
  if (index < 0) return { error: "Услуга не найдена." };

  const fields = [...(data.customServices[index].formFields ?? [])];
  const at = fields.findIndex((f) => f.key === key);
  const to = at + dir;
  if (at < 0 || to < 0 || to >= fields.length) return { ok: true };

  [fields[at], fields[to]] = [fields[to], fields[at]];
  return persist(slug, fields, revOf(form));
}
