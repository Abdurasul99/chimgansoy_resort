"use client";

import { useActionState, useState } from "react";
import { money } from "@/lib/tariff";
import type { Category, Dish } from "@/lib/restaurant/model";
import { CHANNEL_LABEL } from "@/lib/restaurant/labels";
import { dishAction, removeDishPhoto, uploadDishPhoto, type ActionState } from "./actions";
import { submitKeeping } from "./form-hooks";
import { AVAILABILITY_OPTIONS, DishForm, STATE_OPTIONS } from "./DishForm";
import { PhotoInput } from "./PhotoInput";
import { Result, fieldBase, linkBtn } from "./ui";

function Thumb({ dish }: { dish: Dish }) {
  if (dish.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={dish.image}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-xl border border-[color:var(--line)] object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--mist)] font-serif text-xl font-bold text-[var(--muted)]"
    >
      {(dish.title.ru.trim() || "?").charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Сегменты «наличие» и «публикация». Кнопки — чужие для формы, в которой
 * стоят: через атрибут form они отправляют одну скрытую форму строки. Так
 * наличие, публикация и порядок живут в одном месте карточки, а вложенных
 * форм нет.
 */
function Segmented({
  formId,
  label,
  value,
  options,
  pending,
  locked = {},
}: {
  formId: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  pending: boolean;
  locked?: Record<string, string>;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex overflow-hidden rounded-xl border border-[color:var(--line-strong)] ${pending ? "opacity-60" : ""}`}
    >
      {options.map((o) => {
        const on = o.value === value;
        const why = locked[o.value];
        return (
          <button
            key={o.value}
            type="submit"
            form={formId}
            name="op"
            value={o.value}
            disabled={pending || on || Boolean(why)}
            aria-pressed={on}
            title={why}
            className={`min-h-9 border-l border-[color:var(--line)] px-3 py-1.5 text-xs font-bold transition first:border-l-0 ${
              on
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : why
                  ? "cursor-not-allowed text-[var(--muted)] opacity-50"
                  : "text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--ink)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const arrow =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--line)] text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-30";

/** Строка блюда: всё, что меняют каждый день, — в один тап; остальное — в «Изменить». */
export function DishRow({
  dish,
  categories,
  first,
  last,
}: {
  dish: Dish;
  categories: Category[];
  first: boolean;
  last: boolean;
}) {
  const [quick, act, pending] = useActionState<ActionState, FormData>(dishAction, {});
  const [rm, removePhoto, removing] = useActionState<ActionState, FormData>(removeDishPhoto, {});
  const [editing, setEditing] = useState(false);
  const formId = `dish-${dish.id}`;
  const missing = [!dish.title.uz.trim() && "UZ", !dish.title.en.trim() && "EN"].filter(Boolean) as string[];
  const archived = dish.state === "archived";

  return (
    <li
      className={`rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-3 sm:p-4 ${
        archived ? "opacity-70" : ""
      }`}
    >
      {/* Цель кнопок наличия, публикации и порядка — см. Segmented. */}
      <form id={formId} action={act} className="hidden">
        <input type="hidden" name="id" value={dish.id} />
      </form>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <Thumb dish={dish} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[var(--ink)]">{dish.title.ru}</span>
              {missing.map((l) => (
                <span
                  key={l}
                  className="rounded-full bg-[var(--sun)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--sun-dark)]"
                >
                  нет {l}
                </span>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="mr-1 text-xs text-[var(--muted)]">{dish.portion || "порция не указана"}</span>
              {dish.channels.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-[var(--mist)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink)]"
                >
                  {CHANNEL_LABEL[c]}
                </span>
              ))}
              {dish.channels.length === 0 && (
                <span className="text-[10px] font-semibold text-[var(--rose,#b4413c)]">нигде не подаётся</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Цена — своя форма: Enter в поле не должен нажать чужую кнопку. */}
          <form onSubmit={submitKeeping(act)} className="flex items-center gap-1">
            <input type="hidden" name="id" value={dish.id} />
            <input type="hidden" name="op" value="price" />
            <input
              name="price"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={dish.price > 0 ? money(dish.price) : ""}
              placeholder="цена"
              aria-label={`Цена блюда «${dish.title.ru}», сум`}
              className={`${fieldBase} min-h-9 w-28 py-1.5 text-right font-bold tabular-nums`}
            />
            <span className="text-xs text-[var(--muted)]">сум</span>
            <button type="submit" disabled={pending} className={arrow} aria-label="Сохранить цену" title="Сохранить цену">
              ✓
            </button>
          </form>

          <Segmented
            formId={formId}
            label="Наличие"
            value={dish.availability}
            options={AVAILABILITY_OPTIONS}
            pending={pending}
          />
          <Segmented
            formId={formId}
            label="Публикация"
            value={dish.state}
            options={STATE_OPTIONS}
            pending={pending}
            locked={dish.price > 0 ? {} : { published: "Сначала укажите цену" }}
          />

          <div className="flex gap-1">
            <button type="submit" form={formId} name="op" value="up" disabled={pending || first} className={arrow} aria-label="Выше">
              ↑
            </button>
            <button type="submit" form={formId} name="op" value="down" disabled={pending || last} className={arrow} aria-label="Ниже">
              ↓
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          className="min-h-9 rounded-xl border border-[color:var(--line-strong)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--sun)]"
        >
          {editing ? "Свернуть" : "Изменить"}
        </button>
        <PhotoInput
          action={uploadDishPhoto}
          fields={{ id: String(dish.id) }}
          label={dish.image ? "Заменить фото" : "Добавить фото"}
        />
        {dish.image && (
          <form
            action={removePhoto}
            onSubmit={(e) => {
              if (!confirm(`Убрать фото у «${dish.title.ru}»?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={dish.id} />
            <button type="submit" disabled={removing} className={linkBtn}>
              {removing ? "Убираем…" : "убрать фото"}
            </button>
          </form>
        )}
        <Result state={quick} pending={pending} className="" />
        <Result state={rm} pending={removing} className="" />
      </div>

      {editing && (
        <div className="mt-4 border-t border-[color:var(--line)] pt-4">
          <DishForm categories={categories} dish={dish} onCancel={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}
