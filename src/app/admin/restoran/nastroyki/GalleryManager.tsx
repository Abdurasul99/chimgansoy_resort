"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { GALLERY_MAX } from "@/lib/restaurant/model";
import { addGalleryPhoto, galleryAction, type ActionState } from "../actions";
import { shrink } from "../PhotoInput";
import { Result, linkBtn } from "../ui";

const arrow =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[var(--paper)] text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-30";

function Tile({ url, index, count }: { url: string; index: number; count: number }) {
  const [state, act, pending] = useActionState<ActionState, FormData>(galleryAction, {});
  return (
    <li className={`rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-2 ${pending ? "opacity-60" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
      <form action={act} className="mt-2 flex items-center gap-1.5">
        <input type="hidden" name="url" value={url} />
        <button type="submit" name="op" value="up" disabled={pending || index === 0} className={arrow} aria-label="Раньше">
          ←
        </button>
        <button type="submit" name="op" value="down" disabled={pending || index === count - 1} className={arrow} aria-label="Позже">
          →
        </button>
        <span className="ml-auto text-xs tabular-nums text-[var(--muted)]">{index + 1}</span>
        <button
          type="submit"
          name="op"
          value="remove"
          disabled={pending}
          onClick={(e) => {
            if (!confirm("Убрать это фото из галереи?")) e.preventDefault();
          }}
          className={`${linkBtn} px-1 hover:text-[var(--rose,#b4413c)]`}
        >
          убрать
        </button>
      </form>
      {state.error && <Result state={state} />}
    </li>
  );
}

/**
 * Фотогалерея ресторана в панели.
 *
 * Снимки можно выбрать пачкой: каждый уменьшается в браузере и уходит
 * отдельным запросом — запрос к панели ограничен примерно мегабайтом, а с
 * телефона фото весит 3–8 МБ. Порядок — стрелками, первое фото гость видит первым.
 */
export function GalleryManager({ photos }: { photos: string[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<ActionState>({});
  const full = photos.length >= GALLERY_MAX;

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (files.length === 0) return;
    setReport({});
    let ok = 0;
    let error = "";
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length });
      const small = await shrink(file);
      const data = new FormData();
      data.append("photo", small, small.name);
      const res = await addGalleryPhoto(data).catch(() => ({ error: "нет связи с сервером" }) as ActionState);
      if (res.ok) ok++;
      else {
        error = res.error ?? "не получилось";
        // Галерея заполнена — остальные всё равно не войдут.
        if (/уже \d+ фото/.test(error)) break;
      }
    }
    setProgress(null);
    setReport(error ? { error: `Загружено ${ok} из ${files.length}. ${error}` } : { ok: `Загружено фото: ${ok}.` });
    router.refresh();
  }

  const busy = progress !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-4 py-2 text-sm font-bold text-[var(--on-accent)] transition hover:brightness-[1.05] ${
            busy || full ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input type="file" accept="image/*" multiple onChange={onChange} disabled={busy || full} className="sr-only" />
          {busy ? `Загружаем ${progress.done + 1} из ${progress.total}…` : "Добавить фото"}
        </label>
        <span className="text-sm text-[var(--muted)]">
          {photos.length} из {GALLERY_MAX}
        </span>
        <Result state={report} pending={busy} className="" />
      </div>

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--line)] p-5 text-sm text-[var(--muted)]">
          Фото пока нет — на сайте галерея не показывается, пока сюда не добавят хотя бы одно.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, i) => (
            <Tile key={url} url={url} index={i} count={photos.length} />
          ))}
        </ul>
      )}
    </div>
  );
}
