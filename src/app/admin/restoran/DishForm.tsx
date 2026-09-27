"use client";

import { money } from "@/lib/tariff";
import { CHANNELS, type Availability, type Category, type Dish, type DishState } from "@/lib/restaurant/model";
import { CHANNEL_LABEL } from "@/lib/restaurant/labels";
import { saveDish } from "./actions";
import { resetOnOk, useKeptForm } from "./form-hooks";
import { Result, field, labelText, saveBtn } from "./ui";

export const AVAILABILITY_OPTIONS: { value: Availability; label: string; hint: string }[] = [
  { value: "available", label: "В наличии", hint: "заказывается обычно" },
  { value: "unavailable", label: "Нет", hint: "видно в меню, заказать нельзя" },
  { value: "preorder", label: "Предзаказ", hint: "только предзаказом к визиту" },
];

export const STATE_OPTIONS: { value: DishState; label: string; hint: string }[] = [
  { value: "published", label: "Опубликовано", hint: "гости видят" },
  { value: "hidden", label: "Скрыто", hint: "есть только здесь" },
  { value: "archived", label: "Архив", hint: "больше не готовим; старые заказы на него ссылаются" },
];

const LANGS = [
  { code: "ru", label: "RU" },
  { code: "uz", label: "UZ" },
  { code: "en", label: "EN" },
] as const;

function Radios<T extends string>({
  name,
  legend,
  options,
  value,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string; hint: string }[];
  value: T;
}) {
  return (
    <fieldset>
      <legend className={labelText}>{legend}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={o.value === value}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--sun)]"
            />
            <span>
              {o.label} <span className="text-xs text-[var(--muted)]">— {o.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Полная форма блюда — для нового и для правки.
 *
 * Новая форма после успеха очищается под следующее блюдо; форма правки —
 * нет: в ней уже то, что сохранено. После ошибки введённое остаётся всегда.
 */
export function DishForm({
  categories,
  dish,
  onCancel,
}: {
  categories: Category[];
  dish?: Dish;
  onCancel?: () => void;
}) {
  const { state, pending, onSubmit, ref } = useKeptForm(saveDish, dish ? undefined : resetOnOk);
  const d = dish;

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-5">
      {d && <input type="hidden" name="id" value={d.id} />}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="block">
          <span className={labelText}>Раздел</span>
          <select name="categoryId" defaultValue={d?.categoryId ? String(d.categoryId) : ""} className={field}>
            <option value="">— без раздела —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title.ru}
                {c.visible ? "" : " (скрыт)"}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelText}>Порция</span>
          <input name="portion" defaultValue={d?.portion ?? ""} maxLength={40} placeholder="350 г" className={field} />
        </label>
        <label className="block">
          <span className={labelText}>Цена, сум</span>
          <input
            name="price"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={d && d.price > 0 ? money(d.price) : ""}
            placeholder="45 000"
            className={`${field} text-right font-bold tabular-nums`}
          />
        </label>
      </div>

      <fieldset>
        <legend className={labelText}>Название</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LANGS.map((l) => (
            <label key={l.code} className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">
                {l.label}
                {l.code === "ru" ? " · обязательно" : ""}
              </span>
              <input
                name={`title_${l.code}`}
                defaultValue={d?.title[l.code] ?? ""}
                required={l.code === "ru"}
                maxLength={120}
                className={field}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelText}>Описание</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {LANGS.map((l) => (
            <label key={l.code} className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">{l.label}</span>
              <textarea
                name={`description_${l.code}`}
                defaultValue={d?.description[l.code] ?? ""}
                rows={3}
                maxLength={600}
                className={field}
              />
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Нет перевода — гость увидит русский текст.
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <Radios name="availability" legend="Наличие" options={AVAILABILITY_OPTIONS} value={d?.availability ?? "available"} />
        <Radios name="state" legend="Публикация" options={STATE_OPTIONS} value={d?.state ?? "published"} />
        <fieldset>
          <legend className={labelText}>Где подаём</legend>
          <div className="space-y-1.5">
            {CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  name="channels"
                  value={c}
                  defaultChecked={d ? d.channels.includes(c) : true}
                  className="h-4 w-4 accent-[var(--sun)]"
                />
                {CHANNEL_LABEL[c]}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Уберите «В номер» для блюд с сильным запахом, «Доставку» — для того, что не переживёт дорогу.
          </p>
        </fieldset>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Без цены блюдо сохраняется только скрытым — опубликовать его можно, когда цену утвердят.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={saveBtn}>
          {pending ? "Сохраняем…" : d ? "Сохранить блюдо" : "Добавить блюдо"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            Свернуть
          </button>
        )}
      </div>
      <Result state={state} pending={pending} />
    </form>
  );
}
