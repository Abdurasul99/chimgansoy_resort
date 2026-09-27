"use client";

import { startTransition, useActionState, useEffect, useState, type ChangeEvent } from "react";
import type { ActionState } from "./actions";
import type { FormAction } from "./form-hooks";
import { Result } from "./ui";

const MAX_SIDE = 1600;
const QUALITY = 0.85;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Ниже — через <img>: так Safari открывает то, чего не берёт createImageBitmap.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Уменьшает снимок в браузере: длинная сторона до 1600 px, JPEG 0,85.
 *
 * Фото с телефона весит 3–8 МБ, а запрос к панели проходит через прокси с
 * лимитом около мегабайта — большой файл обрывается раньше, чем дойдёт до
 * сервера. Сервер всё равно пережимает в WebP; здесь только везём меньше.
 * Не получилось декодировать (редкий формат, старый браузер) — отдаём исходник.
 */
async function shrink(file: File): Promise<File> {
  try {
    const src = await decode(file);
    const w0 = "naturalWidth" in src ? src.naturalWidth : src.width;
    const h0 = "naturalHeight" in src ? src.naturalHeight : src.height;
    if (!w0 || !h0) return file;
    const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Прозрачный PNG без подложки стал бы в JPEG чёрным.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    if (!("naturalWidth" in src)) src.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.size === 0) return file;
    // Небольшой JPEG пересжатие только испортит.
    if (scale === 1 && file.type === "image/jpeg" && file.size <= blob.size) return file;
    const base = file.name.replace(/\.[^.]*$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/**
 * Кнопка «загрузить фото»: выбор файла сразу отправляет его, без второй кнопки.
 *
 * FormData собирается вручную, а не из формы: в неё кладётся уже уменьшенный
 * файл, а поле выбора остаётся пустым и не уезжает на сервер исходником.
 * `fields` — скрытые поля действия (id блюда).
 */
export function PhotoInput({
  action,
  fields = {},
  label = "Загрузить фото",
}: {
  action: FormAction;
  fields?: Record<string, string>;
  label?: string;
}) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [shrinking, setShrinking] = useState(false);

  // Старое превью освобождаем, когда появляется новое или кнопка исчезает.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Сразу чистим — тот же файл можно будет выбрать повторно после ошибки.
    e.target.value = "";
    if (!file) return;
    setPreview(null);
    setShrinking(true);
    const small = await shrink(file);
    setShrinking(false);
    setPreview(URL.createObjectURL(small));
    const data = new FormData();
    for (const [k, v] of Object.entries(fields)) data.append(k, v);
    data.append("photo", small, small.name);
    startTransition(() => dispatch(data));
  }

  const busy = shrinking || pending;

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <label
        className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--line-strong)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--sun)] ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input type="file" accept="image/*" onChange={onChange} disabled={busy} className="sr-only" />
        {shrinking ? "Готовим фото…" : pending ? "Загружаем…" : label}
      </label>
      {busy && preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-9 w-9 rounded-lg object-cover opacity-70" />
      )}
      <Result state={state} pending={busy} className="" />
    </div>
  );
}
