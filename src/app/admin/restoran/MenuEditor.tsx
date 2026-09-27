"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { Category, Dish } from "@/lib/restaurant/model";
import { categoryAction, importMenu, saveCategory, type ActionState } from "./actions";
import { DishForm } from "./DishForm";
import { DishRow } from "./DishRow";
import { resetOnOk, useKeptForm } from "./form-hooks";
import { Result, field, labelText, linkBtn, plural, saveBtn } from "./ui";

const LANGS = ["ru", "uz", "en"] as const;

function Fold({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-4 p-5">
        <span>
          <span className="block font-serif text-xl font-semibold text-[var(--ink)]">{title}</span>
          <span className="mt-1 block text-sm text-[var(--muted)]">{hint}</span>
        </span>
        <span aria-hidden className="text-xl text-[var(--muted)] transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-[color:var(--line)] p-5">{children}</div>
    </details>
  );
}

/** Импорт стирает поле только когда что-то добавилось: иначе нечего исправлять и слать заново. */
const importReset = (s: ActionState) => Boolean(s.ok && !/^Добавлено блюд: 0\./.test(s.ok));

function ImportForm() {
  const { state, pending, onSubmit, ref } = useKeptForm(importMenu, importReset);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div className="text-sm leading-6 text-[var(--muted)]">
        <p>
          Одна строка — одно блюдо. Поля через точку с запятой или табуляцию (так вставляется
          столбец из Excel или Google Таблиц):
        </p>
        <p className="mt-1">
          <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[var(--ink)]">
            Раздел; Название; Цена; Порция; Описание
          </code>
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--surface-warm)] p-3 text-xs leading-5 text-[var(--ink)]">
          {"Супы; Шурпа из баранины; 45000; 350 г; Наваристый бульон с овощами\nГорячее; Сазан жареный; 120 000; 1 шт; Целиком, с луком и зеленью"}
        </pre>
        <p className="mt-2">
          Нет такого раздела — он создаётся. Цена — только цифры; пустая цена — блюдо сохранится
          скрытым. Переводы и фото добавляются потом, в карточке блюда.
        </p>
      </div>
      <label className="block">
        <span className={labelText}>Строки меню</span>
        <textarea name="text" required rows={8} spellCheck={false} className={`${field} font-mono`} />
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" name="publish" className="h-5 w-5 accent-[var(--sun)]" />
        <span className="text-sm text-[var(--ink)]">
          Сразу опубликовать <span className="text-[var(--muted)]">— иначе всё придёт скрытым, для проверки</span>
        </span>
      </label>
      <button type="submit" disabled={pending} className={saveBtn}>
        {pending ? "Загружаем…" : "Загрузить"}
      </button>
      <Result state={state} pending={pending} />
    </form>
  );
}

function CategoryTitles({ c }: { c?: Category }) {
  return (
    <>
      {LANGS.map((l) => (
        <label key={l} className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase text-[var(--muted)]">
            {l}
            {l === "ru" ? " · обязательно" : ""}
          </span>
          <input
            name={`title_${l}`}
            defaultValue={c?.title[l] ?? ""}
            required={l === "ru"}
            maxLength={80}
            className={field}
          />
        </label>
      ))}
    </>
  );
}

function CategoryRow({ c, count, first, last }: { c: Category; count: number; first: boolean; last: boolean }) {
  const { state: renameState, pending: renamePending, onSubmit: renameSubmit, ref: renameRef } = useKeptForm(saveCategory);
  const [st, act, pending] = useActionState<ActionState, FormData>(categoryAction, {});
  const formId = `cat-${c.id}`;
  const small =
    "min-h-9 rounded-lg border border-[color:var(--line)] px-2.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-30";

  return (
    <li className="p-4">
      <form id={formId} action={act} className="hidden">
        <input type="hidden" name="id" value={c.id} />
      </form>

      <form ref={renameRef} onSubmit={renameSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="id" value={c.id} />
        <CategoryTitles c={c} />
        <button
          type="submit"
          disabled={renamePending}
          className="min-h-10 rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--sun)] disabled:opacity-50"
        >
          {renamePending ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--muted)]">
          {count} {plural(count, "блюдо", "блюда", "блюд")}
        </span>
        {!c.visible && (
          <span className="rounded-full bg-[var(--line)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">
            скрыт от гостей
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="submit" form={formId} name="op" value="up" disabled={pending || first} className={small} aria-label="Раздел выше">
            ↑
          </button>
          <button type="submit" form={formId} name="op" value="down" disabled={pending || last} className={small} aria-label="Раздел ниже">
            ↓
          </button>
          <button type="submit" form={formId} name="op" value={c.visible ? "hide" : "show"} disabled={pending} className={small}>
            {c.visible ? "Скрыть" : "Показать"}
          </button>
          <button
            type="submit"
            form={formId}
            name="op"
            value="delete"
            disabled={pending}
            onClick={(e) => {
              if (!confirm(`Удалить раздел «${c.title.ru}»? Блюда раздела останутся без раздела.`)) e.preventDefault();
            }}
            className={`${linkBtn} px-1 hover:text-[var(--rose,#b4413c)]`}
          >
            удалить
          </button>
        </span>
      </div>
      <Result state={renameState} pending={renamePending} />
      <Result state={st} pending={pending} />
    </li>
  );
}

function AddCategory() {
  const { state, pending, onSubmit, ref } = useKeptForm(saveCategory, resetOnOk);
  return (
    <form ref={ref} onSubmit={onSubmit} className="p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Добавить раздел</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <CategoryTitles />
        <button
          type="submit"
          disabled={pending}
          className="min-h-10 rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-4 py-2 text-sm font-bold text-[var(--on-accent)] transition hover:brightness-[1.05] disabled:opacity-50"
        >
          {pending ? "Добавляем…" : "Добавить"}
        </button>
      </div>
      <Result state={state} pending={pending} />
    </form>
  );
}

/**
 * Редактор меню: добавить, загрузить списком, разделы, блюда по разделам.
 *
 * Архив по умолчанию спрятан — это блюда, которые больше не готовят, и в
 * ежедневной работе они только мешают. Порядок ↑/↓ при этом считается по всем
 * блюдам раздела, включая архивные: если между двумя видимыми лежит архивное,
 * блюдо может сдвинуться только со второго нажатия.
 */
export function MenuEditor({
  categories,
  dishes,
  showArchived,
}: {
  categories: Category[];
  dishes: Dish[];
  showArchived: boolean;
}) {
  const shown = showArchived ? dishes : dishes.filter((d) => d.state !== "archived");
  const known = new Set(categories.map((c) => c.id));
  const groups = [
    ...categories.map((c) => ({
      key: String(c.id),
      title: c.title.ru,
      hidden: !c.visible,
      items: shown.filter((d) => d.categoryId === c.id),
    })),
    {
      key: "none",
      title: "Без раздела",
      hidden: false,
      items: shown.filter((d) => d.categoryId === null || !known.has(d.categoryId)),
    },
  ].filter((g) => g.key !== "none" || g.items.length > 0);
  const archivedCount = dishes.filter((d) => d.state === "archived").length;

  return (
    <div className="space-y-6">
      <Fold title="Добавить блюдо" hint="Одно блюдо со всеми полями — переводы, наличие, где подаём.">
        <DishForm categories={categories} />
      </Fold>

      <Fold title="Загрузить списком" hint="Меню из таблицы — сразу десятками строк.">
        <ImportForm />
      </Fold>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]">
        <h2 className="border-b border-[color:var(--line)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Разделы меню
        </h2>
        <ul className="divide-y divide-[color:var(--line)]">
          {categories.map((c, i) => (
            <CategoryRow
              key={c.id}
              c={c}
              count={dishes.filter((d) => d.categoryId === c.id && d.state !== "archived").length}
              first={i === 0}
              last={i === categories.length - 1}
            />
          ))}
          <li>
            <AddCategory />
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">Блюда</h2>
        {archivedCount > 0 && (
          <Link
            href={showArchived ? "/admin/restoran/menu" : "/admin/restoran/menu?arhiv=1"}
            prefetch={false}
            className="text-sm font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            {showArchived ? "Спрятать архив" : `Показать архив (${archivedCount})`}
          </Link>
        )}
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 text-sm text-[var(--muted)]">
          Блюд пока нет. Добавьте первое выше или загрузите меню списком.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            {g.title}
            {g.hidden && (
              <span className="rounded-full bg-[var(--line)] px-2 py-0.5 normal-case tracking-normal">
                раздел скрыт — гости его блюд не видят
              </span>
            )}
          </h3>
          {g.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[color:var(--line)] p-4 text-sm text-[var(--muted)]">
              В разделе пока нет блюд.
            </p>
          ) : (
            <ul className="space-y-2">
              {g.items.map((d, i) => (
                <DishRow key={d.id} dish={d} categories={categories} first={i === 0} last={i === g.items.length - 1} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
