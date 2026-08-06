"use client";

import { useActionState } from "react";
import { addNews, deleteNews, toggleNews, type NewsFormState } from "./actions";
import type { NewsItem } from "@/lib/site-overrides";

const input =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50";
const button =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";

function Result({ state, pending }: { state: NewsFormState; pending: boolean }) {
  if (pending || (!state.error && !state.ok)) return null;
  return state.error ? (
    <p className="mt-3 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
  ) : (
    <p className="mt-3 text-sm font-semibold text-[var(--green,#3f7d52)]">Готово. Сайт обновлён.</p>
  );
}

export function NewsForm({ items, storeReady, today }: { items: NewsItem[]; storeReady: boolean; today: string }) {
  const [addState, add, adding] = useActionState<NewsFormState, FormData>(addNews, {});
  const [togState, toggle, toggling] = useActionState<NewsFormState, FormData>(toggleNews, {});
  const [delState, del, deleting] = useActionState<NewsFormState, FormData>(deleteNews, {});

  return (
    <div className="space-y-10">
      {!storeReady && (
        <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-4 text-sm text-[var(--muted)]">
          Хранилище не подключено: в проекте нет переменной <code>BLOB_READ_WRITE_TOKEN</code>.
          Пока её нет, новость сохранить нельзя.
        </div>
      )}

      {/* ── Новая новость ──────────────────────────────────────────────── */}
      <form action={add} className="rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Новая новость</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Заголовок
            </span>
            <input name="title" required maxLength={140} disabled={!storeReady} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Дата
            </span>
            <input type="date" name="date" defaultValue={today} disabled={!storeReady} className={input} />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Текст
          </span>
          <textarea name="body" required rows={6} maxLength={4000} disabled={!storeReady} className={input} />
        </label>
        <button type="submit" disabled={adding || !storeReady} className={`${button} mt-5`}>
          {adding ? "Публикуем…" : "Опубликовать"}
        </button>
        <Result state={addState} pending={adding} />
      </form>

      {/* ── Уже опубликованные ─────────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">
          Опубликовано <span className="text-[var(--muted)]">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Пока ничего. Первая новость появится на сайте сразу после публикации.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border border-[color:var(--line)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {n.date}
                      {!n.published && " · скрыта"}
                    </p>
                    <p className="mt-0.5 font-semibold text-[var(--ink)]">{n.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--muted)]">
                      {n.body.length > 240 ? `${n.body.slice(0, 240)}…` : n.body}
                    </p>
                  </div>
                  {/* Two separate one-field forms rather than one with two
                      submits: a nested form is invalid HTML, and formAction on
                      a shared form would post both ids. */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <form action={toggle}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        disabled={toggling || !storeReady}
                        className="rounded-lg border border-[color:var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-warm)] disabled:opacity-50"
                      >
                        {n.published ? "Скрыть" : "Показать"}
                      </button>
                    </form>
                    <form action={del}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        disabled={deleting || !storeReady}
                        className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50"
                      >
                        удалить
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Result state={togState} pending={toggling} />
        <Result state={delState} pending={deleting} />
      </div>
    </div>
  );
}
