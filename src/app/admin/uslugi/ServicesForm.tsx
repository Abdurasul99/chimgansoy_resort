"use client";

import { useActionState } from "react";
import { addService, deleteService, saveServices, type ServicesFormState } from "./actions";
import type { LiveService } from "@/lib/services-live";
import type { UploadedPhoto } from "@/lib/site-overrides";

const input =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50";
const button =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";

function Result({ state, pending }: { state: ServicesFormState; pending: boolean }) {
  if (pending) return null;
  if (state.error) {
    return <p className="mt-3 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>;
  }
  if (state.ok) {
    return <p className="mt-3 text-sm font-semibold text-[var(--green,#3f7d52)]">Сохранено. Сайт обновлён.</p>;
  }
  return null;
}

/**
 * Two forms on one screen, deliberately separate.
 *
 * The visibility grid posts everything it shows; adding a service posts one new
 * record. Merging them would mean a half-filled "new service" block blocking a
 * save that was only meant to hide a card.
 */
export function ServicesForm({
  items,
  photos,
  storeReady,
}: {
  items: LiveService[];
  /** Загруженные фотографии — из них выбирается обложка своей услуги. */
  photos: UploadedPhoto[];
  storeReady: boolean;
}) {
  const [saveState, save, saving] = useActionState<ServicesFormState, FormData>(saveServices, {});
  const [addState, add, adding] = useActionState<ServicesFormState, FormData>(addService, {});
  const [delState, del, deleting] = useActionState<ServicesFormState, FormData>(deleteService, {});

  return (
    <div className="space-y-10">
      {!storeReady && (
        <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-4 text-sm text-[var(--muted)]">
          Хранилище не подключено: в проекте нет переменной <code>BLOB_READ_WRITE_TOKEN</code>.
          Пока её нет, изменения сохранить нельзя — сайт показывает то, что заложено в коде.
        </div>
      )}

      {/* ── Что показывать ─────────────────────────────────────────────── */}
      <form action={save}>
        <div className="overflow-hidden rounded-2xl border border-[color:var(--line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-warm)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Услуга</th>
                <th className="px-4 py-3 font-semibold">Строка с ценой на карточке</th>
                <th className="px-4 py-3 text-center font-semibold">На главной</th>
                <th className="px-4 py-3 text-center font-semibold">Место</th>
                <th className="px-4 py-3 text-center font-semibold">Показывать</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--line)]">
              {items.map((s) => (
                <tr key={s.slug}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--ink)]">
                      {s.isCustom ? s.custom?.title : s.base?.title.ru}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      /{s.slug}
                      {s.isCustom && " · добавлена вами"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      name={`note:${s.slug}`}
                      defaultValue={s.priceNote ?? ""}
                      placeholder="напр. от 150 000 сум"
                      maxLength={120}
                      disabled={!storeReady}
                      className={input}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* Главная и каталог — разные решения: услугу можно снять с
                        главной, оставив её на странице услуг и на своей. */}
                    <input
                      type="checkbox"
                      name={`home:${s.slug}`}
                      defaultChecked={s.showOnHome}
                      disabled={!storeReady}
                      className="h-5 w-5 accent-[var(--sun)]"
                      aria-label={`Показывать услугу ${s.slug} на главной`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* Меньше число — выше карточка. На главную помещается три. */}
                    <input
                      type="number"
                      min={0}
                      max={99}
                      name={`order:${s.slug}`}
                      defaultValue={s.order}
                      disabled={!storeReady}
                      className={`${input} w-20 text-center`}
                      aria-label={`Место услуги ${s.slug}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* Checked = visible, which is how the operator thinks about
                        it. The stored flag is the inverse, so the name says
                        hidden and the default is inverted here rather than in
                        the store, where `hidden` reads correctly in JSON. */}
                    <input
                      type="checkbox"
                      name={`hidden:${s.slug}`}
                      defaultChecked={s.hidden}
                      disabled={!storeReady}
                      className="h-5 w-5 accent-[var(--sun)]"
                      aria-label={`Скрыть услугу ${s.slug}`}
                    />
                    <span className="ml-2 align-middle text-xs text-[var(--muted)]">скрыть</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.isCustom && (
                      <a
                        href={`/admin/uslugi/${s.slug}`}
                        className="mr-3 text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)]"
                      >
                        форма заявки
                      </a>
                    )}
                    {s.isCustom && (
                      /**
                       * Кнопка принадлежит отдельной форме ниже, а не этой.
                       *
                       * Раньше она стояла здесь же с formAction={del} — и слаг,
                       * который она несёт, до действия не доезжал: удаление
                       * отфильтровывало пустую строку, сохраняло всё как было и
                       * рапортовало «Сохранено». Услуга оставалась на месте.
                       * Вложить <form> в <form> нельзя, поэтому связь идёт через
                       * атрибут form — так кнопка становится отправителем именно
                       * той формы, и её имя со значением уходят вместе с ней.
                       */
                      <button
                        type="submit"
                        form="delete-service"
                        name="slug"
                        value={s.slug}
                        disabled={deleting || !storeReady}
                        className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50"
                      >
                        удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button type="submit" disabled={saving || !storeReady} className={button}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
        <Result state={saveState} pending={saving} />
      </form>

      {/* Цель кнопок «удалить» в таблице: своя форма, вне сетки. */}
      <form action={del} id="delete-service">
        <Result state={delState} pending={deleting} />
      </form>

      {/* ── Добавить свою ──────────────────────────────────────────────── */}
      <form action={add} className="rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Добавить услугу</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Появится в каталоге услуг, а на главной — если поставить галочку. Текст
          показывается на всех трёх языках одинаково: если нужен перевод, напишите его
          в описании сами.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Название
            </span>
            <input name="title" required maxLength={80} disabled={!storeReady} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Строка с ценой
            </span>
            <input
              name="priceNote"
              maxLength={120}
              placeholder="напр. 200 000 сум · по запросу"
              disabled={!storeReady}
              className={input}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Раздел
            </span>
            <select name="category" defaultValue="relax" disabled={!storeReady} className={input}>
              <option value="relax">Отдых</option>
              <option value="food">Еда</option>
              <option value="activity">Активности</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Фото на карточке
            </span>
            {/* Только из загруженных: свой файл сюда не вписать, и это намеренно
                — иначе сохранённый адрес мог бы указать сайт на чужой сервер. */}
            <select name="image" defaultValue="" disabled={!storeReady} className={input}>
              <option value="">— выбрать позже —</option>
              {photos.map((p) => (
                <option key={p.id} value={p.url}>
                  {p.alt || p.id}
                </option>
              ))}
            </select>
            {photos.length === 0 && (
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Пока нечего выбрать: загрузите фотографии в разделе «Домики».
              </span>
            )}
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Короткое описание <span className="font-normal normal-case">— строка под названием на карточке</span>
          </span>
          <input name="shortDescription" maxLength={180} disabled={!storeReady} className={input} />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Описание
          </span>
          <textarea
            name="description"
            required
            rows={4}
            maxLength={600}
            disabled={!storeReady}
            className={input}
          />
        </label>

        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            name="showOnHome"
            disabled={!storeReady}
            className="h-5 w-5 accent-[var(--sun)]"
          />
          <span className="text-sm text-[var(--ink)]">
            Показывать на главной <span className="text-[var(--muted)]">— там три места, лишние уйдут в каталог</span>
          </span>
        </label>

        <button type="submit" disabled={adding || !storeReady} className={`${button} mt-5`}>
          {adding ? "Добавляем…" : "Добавить услугу"}
        </button>
        <Result state={addState} pending={adding} />
      </form>
    </div>
  );
}
