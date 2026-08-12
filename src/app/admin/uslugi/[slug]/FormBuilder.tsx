"use client";

import { useActionState, useState } from "react";
import { addField, moveField, removeField, type FormState } from "./actions";
import type { FieldType, FormField } from "@/lib/site-overrides";

const input =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30 disabled:opacity-50";
const button =
  "rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

const TYPE_LABEL: Record<FieldType, string> = {
  text: "Строка",
  textarea: "Текст в несколько строк",
  number: "Число",
  phone: "Телефон",
  date: "Дата",
  select: "Список вариантов",
  checkbox: "Галочка",
};

function Result({ state, pending }: { state: FormState; pending: boolean }) {
  if (pending || (!state.error && !state.ok)) return null;
  return state.error ? (
    <p className="mt-3 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
  ) : (
    <p className="mt-3 text-sm font-semibold text-[var(--green,#3f7d52)]">Сохранено. Форма на сайте обновлена.</p>
  );
}

export function FormBuilder({
  slug,
  title,
  fields,
  rev,
  storeReady,
}: {
  slug: string;
  title: string;
  fields: FormField[];
  /**
   * Номер версии, которую видит оператор прямо сейчас.
   *
   * Уезжает вместе с каждой правкой: сервер по нему дожидается, пока хранилище
   * отдаст документ не старше этого — иначе правка ложится поверх документа БЕЗ
   * предыдущей, и та тихо теряется.
   */
  rev: number;
  storeReady: boolean;
}) {
  const [addState, add, adding] = useActionState<FormState, FormData>(addField, {});
  const [rmState, rm, removing] = useActionState<FormState, FormData>(removeField, {});
  const [mvState, mv, moving] = useActionState<FormState, FormData>(moveField, {});
  // Варианты и границы нужны не всем типам — показываем их по месту, чтобы
  // оператор не гадал, какие поля к чему относятся.
  const [type, setType] = useState<FieldType>("text");

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Поля формы</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Имя и телефон гость заполняет всегда — их добавлять не нужно. Здесь то, что вы
          хотите спросить дополнительно для услуги «{title}».
        </p>

        {fields.length === 0 ? (
          <p className="mt-5 rounded-xl bg-[var(--surface-warm)] p-4 text-sm text-[var(--muted)]">
            Полей пока нет — на странице услуги стоят кнопки брони. Добавьте первое поле,
            и вместо них появится форма заявки.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {fields.map((f, i) => (
              <li
                key={f.key}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--line)] px-4 py-3"
              >
                <span className="font-semibold text-[var(--ink)]">{f.label}</span>
                <span className="text-xs text-[var(--muted)]">
                  {TYPE_LABEL[f.type]}
                  {f.required ? " · обязательное" : ""}
                  {f.options?.length ? ` · ${f.options.join(", ")}` : ""}
                  {f.type === "number" && (f.min !== undefined || f.max !== undefined)
                    ? ` · от ${f.min ?? 0} до ${f.max ?? 999}`
                    : ""}
                </span>

                <span className="ml-auto flex items-center gap-1">
                  <form action={mv}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="rev" value={rev} />
                    <input type="hidden" name="key" value={f.key} />
                    <input type="hidden" name="dir" value="up" />
                    <button
                      type="submit"
                      disabled={i === 0 || moving || !storeReady}
                      aria-label={`Поднять поле ${f.label}`}
                      className="rounded-lg border border-[color:var(--line)] px-2.5 py-1 text-sm transition hover:border-[var(--sun)] disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={mv}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="rev" value={rev} />
                    <input type="hidden" name="key" value={f.key} />
                    <input type="hidden" name="dir" value="down" />
                    <button
                      type="submit"
                      disabled={i === fields.length - 1 || moving || !storeReady}
                      aria-label={`Опустить поле ${f.label}`}
                      className="rounded-lg border border-[color:var(--line)] px-2.5 py-1 text-sm transition hover:border-[var(--sun)] disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={rm}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="rev" value={rev} />
                    <input type="hidden" name="key" value={f.key} />
                    <button
                      type="submit"
                      disabled={removing || !storeReady}
                      className="ml-2 text-xs font-semibold text-[var(--muted)] underline underline-offset-2 transition hover:text-[var(--ink)] disabled:opacity-50"
                    >
                      убрать
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Result state={rmState} pending={removing} />
        <Result state={mvState} pending={moving} />
      </div>

      <form action={add} className="rounded-2xl border border-[color:var(--line)] p-5">
        <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">Добавить поле</h2>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="rev" value={rev} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>О чём спрашиваем</span>
            <input name="label" required maxLength={80} placeholder="напр. Количество человек" disabled={!storeReady} className={input} />
          </label>
          <label className="block">
            <span className={label}>Тип поля</span>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              disabled={!storeReady}
              className={input}
            >
              {(Object.keys(TYPE_LABEL) as FieldType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {type === "select" && (
          <label className="mt-4 block">
            <span className={label}>Варианты — по одному в строке</span>
            <textarea name="options" rows={4} placeholder={"Стандарт\nПремиум"} disabled={!storeReady} className={input} />
          </label>
        )}

        {type === "number" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Не меньше</span>
              <input name="min" type="number" defaultValue={1} disabled={!storeReady} className={input} />
            </label>
            <label className="block">
              <span className={label}>Не больше</span>
              <input name="max" type="number" defaultValue={20} disabled={!storeReady} className={input} />
            </label>
          </div>
        )}

        {type !== "checkbox" && type !== "select" && (
          <label className="mt-4 block">
            <span className={label}>Подсказка внутри поля <span className="font-normal normal-case">— необязательно</span></span>
            <input name="placeholder" maxLength={120} disabled={!storeReady} className={input} />
          </label>
        )}

        <label className="mt-4 flex items-center gap-3">
          <input type="checkbox" name="required" disabled={!storeReady} className="h-5 w-5 accent-[var(--sun)]" />
          <span className="text-sm text-[var(--ink)]">Обязательное — без него заявку не отправить</span>
        </label>

        <button type="submit" disabled={adding || !storeReady} className={`${button} mt-5`}>
          {adding ? "Добавляем…" : "Добавить поле"}
        </button>
        <Result state={addState} pending={adding} />
      </form>
    </div>
  );
}
