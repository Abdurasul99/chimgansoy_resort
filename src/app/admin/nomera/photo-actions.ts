"use server";

import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-auth";
import { readForEdit, saveOverrides, type UploadedPhoto } from "@/lib/site-overrides";

export type PhotoFormState = { ok?: boolean; error?: string; added?: number };

/**
 * Photo upload for the room galleries.
 *
 * The site has no on-the-fly image pipeline: whatever URL ends up in a gallery
 * is sent to every visitor byte for byte. A modern phone photo is 4–8 MB, and a
 * gallery of twelve would be a 60 MB page. So the file is re-encoded HERE,
 * once, at upload time — which is also the only moment anybody is willing to
 * wait a second for it.
 *
 * 2400 px on the long side matches the existing photography in the repo (the
 * August shoot is 1802×2400), and mozjpeg at 82 lands those around 300–600 KB.
 * EXIF goes with it: these are phone photos and they carry GPS.
 */

const MAX_BYTES = 25 * 1024 * 1024; // what a phone produces, before our resize
const MAX_SIDE = 2400;
const MAX_PHOTOS = 200;

/** A readable id that sorts by upload order and cannot collide. */
function photoId(existing: UploadedPhoto[]): string {
  const n = existing.length + 1;
  return `up-${String(n).padStart(3, "0")}-${Date.now().toString(36)}`;
}

export async function uploadPhotos(
  _prev: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  await requireAdmin();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Не выбрано ни одного файла." };

  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);

  const data = await readForEdit();
  if (data.photos.length + files.length > MAX_PHOTOS) {
    return { error: `Больше ${MAX_PHOTOS} загруженных фотографий хранить не будем — удалите ненужные.` };
  }

  const added: UploadedPhoto[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return { error: `«${file.name}» больше 25 МБ — это не похоже на фотографию.` };
    }
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) {
      return { error: `«${file.name}»: поддерживаются JPEG, PNG, WebP и HEIC.` };
    }

    try {
      const input = Buffer.from(await file.arrayBuffer());
      const pipeline = sharp(input, { failOn: "none" })
        // Phone photos carry orientation in EXIF; baking it in before the resize
        // is what stops a portrait shot rendering on its side.
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true });

      const { data: out, info } = await pipeline.toBuffer({ resolveWithObject: true });
      const id = photoId([...data.photos, ...added]);

      const blob = await put(`site/photos/${id}.jpg`, out, {
        access: "public",
        contentType: "image/jpeg",
        // The id already carries a timestamp, so the URL is stable and readable.
        addRandomSuffix: false,
      });

      added.push({
        id,
        url: blob.url,
        alt: alt || file.name.replace(/\.[a-z0-9]+$/i, ""),
        width: info.width,
        height: info.height,
        uploadedAt: new Date().toISOString().slice(0, 10),
      });
    } catch {
      return { error: `Не удалось обработать «${file.name}». Попробуйте другой файл.` };
    }
  }

  const res = await saveOverrides({ ...data, photos: [...data.photos, ...added] });
  if (!res.ok) return { error: res.error };

  revalidatePath("/", "layout");
  return { ok: true, added: added.length };
}

/**
 * Delete an uploaded photo.
 *
 * Also pulls it out of every gallery that referenced it — otherwise the room
 * page would render a frame pointing at a blob that no longer exists, and the
 * operator would have no way to see which page broke.
 */
export async function deletePhoto(
  _prev: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const data = await readForEdit();
  const photo = data.photos.find((p) => p.id === id);
  if (!photo) return { error: "Такой фотографии нет." };

  const rooms = Object.fromEntries(
    Object.entries(data.rooms).map(([slug, patch]) => [
      slug,
      patch.gallery ? { ...patch, gallery: patch.gallery.filter((k) => k !== id) } : patch,
    ]),
  );

  const res = await saveOverrides({ ...data, rooms, photos: data.photos.filter((p) => p.id !== id) });
  if (!res.ok) return { error: res.error };

  // Best-effort: a leftover blob costs pennies, a failed save loses the edit.
  await del(photo.url).catch(() => {});

  revalidatePath("/", "layout");
  return { ok: true };
}
