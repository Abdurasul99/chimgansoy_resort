"use client";

import { useActionState } from "react";
import { deletePhoto, uploadPhotos, type PhotoFormState } from "./photo-actions";
import type { UploadedPhoto } from "@/lib/site-overrides";

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50";
const primary =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";

function Result({ state, pending }: { state: PhotoFormState; pending: boolean }) {
  if (pending || (!state.error && !state.ok)) return null;
  return state.error ? (
    <p className="mt-3 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
  ) : (
    <p className="mt-3 text-sm font-semibold text-[var(--green,#3f7d52)]">
      {state.added ? `Загружено: ${state.added}. ` : ""}Готово — фотографии появились в списке ниже.
    </p>
  );
}

/**
 * Upload and manage the operator's own photographs.
 *
 * Sits above the room forms because the pickers there read from this library:
 * upload first, then choose where each frame goes. The file is re-encoded on
 * the server (2400 px, mozjpeg, EXIF stripped) — see photo-actions.ts for why
 * that is not optional on a site with no image pipeline.
 */
export function PhotoLibrary({ photos, storeReady }: { photos: UploadedPhoto[]; storeReady: boolean }) {
  const [upState, upload, uploading] = useActionState<PhotoFormState, FormData>(uploadPhotos, {});
  const [delState, remove, removing] = useActionState<PhotoFormState, FormData>(deletePhoto, {});

  return (
    <section className="rounded-2xl border border-[color:var(--line)] p-5">
      <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Свои фотографии</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Загрузите снимки — они появятся в выборе у каждого домика ниже. Файл сжимается при
        загрузке, так что можно грузить прямо с телефона.
      </p>

      <form action={upload} className="mt-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Файлы
            </span>
            <input
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              required
              disabled={!storeReady}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Подпись — одна на всю загрузку
            </span>
            <input
              name="alt"
              maxLength={200}
              placeholder="напр. Интерьер шале"
              disabled={!storeReady}
              className={field}
            />
          </label>
        </div>
        <button type="submit" disabled={uploading || !storeReady} className={`${primary} mt-4`}>
          {uploading ? "Загружаем…" : "Загрузить"}
        </button>
        <Result state={upState} pending={uploading} />
      </form>

      {photos.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Загружено: {photos.length}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[color:var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="truncate text-[11px] text-[var(--muted)]" title={p.alt}>
                  {p.alt}
                </p>
                <form action={remove}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    disabled={removing || !storeReady}
                    className="text-[11px] font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50"
                  >
                    удалить
                  </button>
                </form>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Удаление убирает снимок и из галерей домиков, где он был выбран — страница не
            останется с пустой рамкой.
          </p>
        </div>
      )}
      <Result state={delState} pending={removing} />
    </section>
  );
}
