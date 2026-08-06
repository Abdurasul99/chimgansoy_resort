"use client";

import { useActionState, useState } from "react";
import { resetRoom, saveRoom, type RoomFormState } from "./actions";

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50";
const primary =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";

export type RoomEditor = {
  slug: string;
  title: string;
  amenities: string[];
  features: string[];
  gallery: string[];
  priceNote?: string;
  edited: { amenities: boolean; features: boolean; gallery: boolean };
};

export type PhotoOption = { key: string; src: string; alt: string };

function Result({ state, pending }: { state: RoomFormState; pending: boolean }) {
  if (pending || (!state.error && !state.ok)) return null;
  return state.error ? (
    <p className="mt-3 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
  ) : (
    <p className="mt-3 text-sm font-semibold text-[var(--green,#3f7d52)]">Сохранено. Страница домика обновлена.</p>
  );
}

/**
 * One room, one form.
 *
 * The gallery is a picker over the photographs already on the site rather than
 * an upload field. Two reasons, and the second is the real one: the site has no
 * image pipeline, so a 6 MB phone photo would be sent to every visitor as-is;
 * and every frame here is already cropped, colour-matched and captioned in
 * three languages, which an upload would not be.
 */
export function RoomForm({
  room,
  photos,
  storeReady,
}: {
  room: RoomEditor;
  photos: PhotoOption[];
  storeReady: boolean;
}) {
  const [saveState, save, saving] = useActionState<RoomFormState, FormData>(saveRoom, {});
  const [resetState, reset, resetting] = useActionState<RoomFormState, FormData>(resetRoom, {});
  const [picked, setPicked] = useState<string[]>(room.gallery);

  function toggle(key: string) {
    setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  }

  return (
    <section className="rounded-2xl border border-[color:var(--line)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">{room.title}</h2>
        <a
          href={`/ru/nomera/${room.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]"
        >
          посмотреть страницу ↗
        </a>
      </div>

      <form action={save} className="mt-5">
        <input type="hidden" name="slug" value={room.slug} />
        {/* The picker keeps its selection in state; the form posts it as one
            comma-separated field so the order the operator clicked survives. */}
        <input type="hidden" name="gallery" value={picked.join(",")} />

        <label className="block">
          <span className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            <span>Удобства — по одному в строке</span>
            {room.edited.amenities && <span className="normal-case text-[var(--sun-dark)]">изменено вами</span>}
          </span>
          <textarea
            name="amenities"
            rows={7}
            defaultValue={room.amenities.join("\n")}
            disabled={!storeReady}
            className={field}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            <span>Кратко о домике — по одному в строке</span>
            {room.edited.features && <span className="normal-case text-[var(--sun-dark)]">изменено вами</span>}
          </span>
          <textarea
            name="features"
            rows={4}
            defaultValue={room.features.join("\n")}
            disabled={!storeReady}
            className={field}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Строка с ценой
          </span>
          <input
            name="priceNote"
            defaultValue={room.priceNote ?? ""}
            maxLength={120}
            placeholder="оставьте пустым — покажем живую цену из системы бронирования"
            disabled={!storeReady}
            className={field}
          />
          <span className="mt-1 block text-xs text-[var(--muted)]">
            Пока поле пустое, на карточке стоит «от …» из Exely. Заполните, только если
            нужно перебить её своим текстом.
          </span>
        </label>

        {/* ── Фотографии ─────────────────────────────────────────────── */}
        <div className="mt-6">
          <p className="flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            <span>Фотографии — выбрано {picked.length}</span>
            {room.edited.gallery && <span className="normal-case text-[var(--sun-dark)]">изменено вами</span>}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Нажмите на кадр, чтобы добавить или убрать. Порядок — как вы нажимали; первый
            занимает всю ширину на странице домика.
          </p>

          <div className="mt-3 grid max-h-96 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-[color:var(--line)] p-2 sm:grid-cols-5">
            {photos.map((p) => {
              const at = picked.indexOf(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => toggle(p.key)}
                  disabled={!storeReady}
                  title={p.alt}
                  aria-pressed={at >= 0}
                  className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${
                    at >= 0 ? "border-[var(--sun)]" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
                  {at >= 0 && (
                    <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sun)] text-[10px] font-bold text-[var(--on-accent)]">
                      {at + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving || !storeReady} className={primary}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
        <Result state={saveState} pending={saving} />
      </form>

      <form action={reset} className="mt-3">
        <input type="hidden" name="slug" value={room.slug} />
        <button
          type="submit"
          disabled={resetting || !storeReady}
          className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50"
        >
          вернуть всё как было
        </button>
        <Result state={resetState} pending={resetting} />
      </form>
    </section>
  );
}
