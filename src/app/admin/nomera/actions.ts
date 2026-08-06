"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { readForEdit, saveOverrides } from "@/lib/site-overrides";
import { rooms } from "@/content/rooms";
import { resortImages } from "@/content/images";

export type RoomFormState = { ok?: boolean; error?: string };

/** One item per line, blanks dropped, order preserved. */
function lines(raw: FormDataEntryValue | null, limit = 40): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((s) => s.slice(0, 160));
}

/**
 * Save one room. One room per submit rather than all three at once: the three
 * pages have nothing to do with each other, and a save that rewrites the chalet
 * because the operator was editing the glamping is a surprise nobody wants.
 */
export async function saveRoom(_prev: RoomFormState, formData: FormData): Promise<RoomFormState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const room = rooms.find((r) => r.slug === slug);
  if (!room) return { error: "Неизвестный домик." };

  const amenities = lines(formData.get("amenities"));
  const features = lines(formData.get("features"));
  const gallery = String(formData.get("gallery") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((k) => k && k in resortImages);
  const priceNote = String(formData.get("priceNote") ?? "").trim().slice(0, 120);

  if (gallery.length === 0) {
    return { error: "Выберите хотя бы одну фотографию." };
  }

  const data = await readForEdit();
  // An empty textarea means "use the code's list", not "show nothing". Clearing
  // a field is how the operator undoes their own edit and goes back to default.
  const next = {
    ...(amenities.length ? { amenities } : {}),
    ...(features.length ? { features } : {}),
    // The gallery is always stored: it is picked from a grid, so an empty one
    // is a mistake rather than an intention, and it is rejected above.
    gallery,
    ...(priceNote ? { priceNote } : {}),
  };

  const res = await saveOverrides({ ...data, rooms: { ...data.rooms, [slug]: next } });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Throw away every edit for one room and go back to what ships in the code. */
export async function resetRoom(_prev: RoomFormState, formData: FormData): Promise<RoomFormState> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const data = await readForEdit();
  const next = { ...data.rooms };
  delete next[slug];

  const res = await saveOverrides({ ...data, rooms: next });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true };
}
