"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { readForEdit, saveOverrides, type OverrideData } from "@/lib/site-overrides";
import { services } from "@/content/services";

export type ServicesFormState = { ok?: boolean; error?: string };

/** Latin/digit/hyphen slug, so it is safe in a URL and readable in the store. */
function slugify(raw: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };
  return raw
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Save the visibility switches and the price notes for every service at once.
 *
 * The whole grid posts on every save rather than one row at a time: the form
 * shows the operator all of it, and a per-row save would let two half-applied
 * states exist while they are still deciding.
 */
export async function saveServices(
  _prev: ServicesFormState,
  formData: FormData,
): Promise<ServicesFormState> {
  await requireAdmin();

  const data: OverrideData = await readForEdit();
  const next: OverrideData["services"] = {};

  for (const s of services) {
    const hidden = formData.get(`hidden:${s.slug}`) === "on";
    const note = String(formData.get(`note:${s.slug}`) ?? "").trim().slice(0, 120);
    // Only записываем отличия: an untouched service leaves no trace in the
    // store, so a copy change shipped in code is never masked by an empty patch.
    if (hidden || note) next[s.slug] = { ...(hidden ? { hidden } : {}), ...(note ? { priceNote: note } : {}) };
  }

  const custom = data.customServices.map((c) => {
    const hidden = formData.get(`hidden:${c.slug}`) === "on";
    const note = String(formData.get(`note:${c.slug}`) ?? "").trim().slice(0, 120);
    return { ...c, hidden, priceNote: note || undefined };
  });

  const res = await saveOverrides({ ...data, services: next, customServices: custom });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Create one operator-authored service. */
export async function addService(
  _prev: ServicesFormState,
  formData: FormData,
): Promise<ServicesFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const description = String(formData.get("description") ?? "").trim().slice(0, 600);
  const priceNote = String(formData.get("priceNote") ?? "").trim().slice(0, 120);

  if (title.length < 2) return { error: "Название слишком короткое." };
  if (description.length < 10) return { error: "Опишите услугу хотя бы одним предложением." };

  const slug = slugify(title);
  if (!slug) return { error: "Из названия не получается адрес. Добавьте латиницу или цифры." };

  const data = await readForEdit();
  if (services.some((s) => s.slug === slug) || data.customServices.some((c) => c.slug === slug)) {
    return { error: "Услуга с таким названием уже есть." };
  }

  const res = await saveOverrides({
    ...data,
    customServices: [...data.customServices, { slug, title, description, priceNote: priceNote || undefined, hidden: false }],
  });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Remove an operator-authored service. Code services are hidden, never deleted. */
export async function deleteService(
  _prev: ServicesFormState,
  formData: FormData,
): Promise<ServicesFormState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim();
  const data = await readForEdit();
  const res = await saveOverrides({
    ...data,
    customServices: data.customServices.filter((c) => c.slug !== slug),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}
