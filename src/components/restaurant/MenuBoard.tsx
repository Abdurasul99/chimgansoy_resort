"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { SAZANCHIK_SERVICE_PERCENT } from "@/content/restaurant-media";
import { trackEvent } from "@/lib/analytics";
import { localizePortion } from "@/lib/restaurant/portion";
import { money } from "@/lib/tariff";
import type { Category, Dish } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { DishSheet } from "./DishSheet";
import { MountainLine } from "./MountainLine";
import { RestIcon } from "./RestIcon";

const OTHER: Record<Locale, string> = { ru: "Ещё", uz: "Yana", en: "More" };

/** Строка меню: одно блюдо или несколько порций одного блюда («0,5 / 1 порция»). */
type Row = { key: string; title: string; dishes: Dish[] };
type Section = { key: string; title: string; rows: Row[]; preorder: boolean };

/**
 * Меню «доской», как печатное меню ресторана: разделы в две колонки на
 * компьютере, у блюда — название, порция, точки и цена. До 24.11.2026 меню
 * было сеткой карточек из приложения доставки, и из 125 карточек ни у одной
 * не было фото — страница была стеной серых заглушек.
 *
 * Сверху — липкая лента разделов и поиск (ищет и по-русски на любой версии
 * сайта: гость часто знает блюдо по русскому названию). Блюдо с фото или
 * описанием открывается крупно.
 */
export function MenuBoard({ locale, categories, dishes }: { locale: Locale; categories: Category[]; dishes: Dish[] }) {
  const t = restaurantText(locale);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const showSearch = searchOpen || query !== "";
  const [active, setActive] = useState("");
  const [sheet, setSheet] = useState<Dish | null>(null);
  // Лента прокручена — слева появляется затемнение, иначе обрезанный раздел у лупы читается как обломок.
  const [chipsScrolled, setChipsScrolled] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const chipsRef = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (d: Dish) =>
      !q ||
      pickText(d.title, locale).toLowerCase().includes(q) ||
      d.title.ru.toLowerCase().includes(q) ||
      pickText(d.description, locale).toLowerCase().includes(q);
    const visible = dishes.filter((d) => d.state === "published" && match(d));
    const known = new Set(categories.map((c) => c.id));
    const toRows = (items: Dish[]): Row[] => {
      const rows: Row[] = [];
      for (const d of items) {
        const title = pickText(d.title, locale);
        const last = rows[rows.length - 1];
        // Соседние позиции с одним названием и разной порцией — одна строка.
        if (last && last.title === title && d.portion && last.dishes[0].portion) last.dishes.push(d);
        else rows.push({ key: `d${d.id}`, title, dishes: [d] });
      }
      return rows;
    };
    const out: Section[] = categories
      .map((c) => {
        const items = visible.filter((d) => d.categoryId === c.id);
        return {
          key: `c${c.id}`,
          title: pickText(c.title, locale),
          rows: toRows(items),
          preorder: items.length > 0 && items.every((d) => d.availability === "preorder"),
        };
      })
      .filter((s) => s.rows.length > 0);
    const rest = visible.filter((d) => d.categoryId === null || !known.has(d.categoryId));
    if (rest.length) out.push({ key: "other", title: OTHER[locale], rows: toRows(rest), preorder: false });
    return out;
  }, [categories, dishes, query, locale]);

  // Подсветка раздела по мере прокрутки.
  useEffect(() => {
    const els = [...sectionRefs.current.values()];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: "-150px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Активный раздел виден в ленте: лента сама доезжает до него.
  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-key="${active}"]`);
    const bar = chipsRef.current;
    if (!chip || !bar) return;
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2;
    bar.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  // Поиск сжимает список: возвращаем к началу меню, чтобы найденное было видно.
  useEffect(() => {
    const el = top.current;
    if (!query || !el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY <= y) return;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y });
  }, [query]);

  const jump = (key: string) => {
    const el = document.getElementById(key);
    if (!el) return;
    // Над разделом — шапка сайта и липкая лента разделов.
    const target = el.getBoundingClientRect().top + window.scrollY - 140;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { duration: 0.9 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const openDish = (d: Dish) => {
    setSheet(d);
    trackEvent("restaurant_dish_view", { dish: d.id });
  };

  const hasMenu = dishes.length > 0;

  return (
    <section id="menu" aria-labelledby="menu-title" className="scroll-mt-20">
      <div ref={top} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="menu-title" className="font-serif text-5xl font-semibold italic leading-none text-[var(--sz-snow)] sm:text-6xl">
            {t.menu.title}
          </h2>
          <MountainLine className="mt-4 h-4 w-32 text-[var(--sz-lamp)]" />
        </div>
        <p className="max-w-sm text-[13.5px] leading-6 text-[var(--sz-stone)] sm:text-right">{t.look.prices(SAZANCHIK_SERVICE_PERCENT)}</p>
      </div>

      {!hasMenu ? (
        <div className="mt-8 rounded-3xl border border-white/10 px-6 py-16 text-center">
          <RestIcon name="cloche" className="mx-auto h-12 w-12 text-[var(--sz-stone)]" />
          <p className="mx-auto mt-4 max-w-sm text-lg font-semibold">{t.menu.empty}</p>
        </div>
      ) : (
        <>
          {/* Липкая лента разделов с поиском. */}
          <div className="rest-stick sticky z-30 -mx-4 mt-6 border-b border-white/10 bg-[var(--sz-walnut)]/92 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {showSearch ? (
              <div className="flex items-center gap-2">
                <label className="relative flex min-w-0 flex-1 items-center">
                  <RestIcon name="search" className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--sz-stone)]" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.menu.search}
                    aria-label={t.menu.search}
                    autoFocus
                    className="h-11 w-full rounded-full border border-white/15 bg-white/5 pl-10 pr-4 text-[15px] text-[var(--sz-snow)] outline-none transition placeholder:text-[var(--sz-stone)] focus:border-[var(--sz-lamp)] [&::-webkit-search-cancel-button]:hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  aria-label={t.menu.close}
                  className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-[var(--sz-snow)]"
                >
                  <RestIcon name="close" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t.menu.search}
                  className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-[var(--sz-snow)] transition-colors hover:border-[var(--sz-lamp)]"
                >
                  <RestIcon name="search" className="h-4 w-4" />
                </button>
                <nav
                  ref={chipsRef}
                  aria-label={t.sections}
                  onScroll={(e) => setChipsScrolled(e.currentTarget.scrollLeft > 4)}
                  className={`rest-chips flex min-w-0 flex-1 gap-1.5 overflow-x-auto ${
                    chipsScrolled
                      ? "[mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)]"
                      : "[mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)]"
                  }`}
                >
                  {sections.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      data-key={s.key}
                      onClick={() => jump(s.key)}
                      aria-current={active === s.key ? "true" : undefined}
                      className={`btn-press h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition-colors ${
                        active === s.key
                          ? "bg-[var(--sz-lamp)] text-[#2a1a08]"
                          : "text-[var(--sz-snow)]/80 hover:bg-white/5 hover:text-[var(--sz-snow)]"
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {sections.length === 0 ? (
            <p className="mt-12 text-center text-base text-[var(--sz-stone)]">{t.menu.nothingFound}</p>
          ) : (
            <div className="mt-10 gap-x-16 lg:columns-2">
              {sections.map((s) => (
                <section
                  key={s.key}
                  id={s.key}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(s.key, el);
                    else sectionRefs.current.delete(s.key);
                  }}
                  className="mb-12 break-inside-avoid scroll-mt-40"
                >
                  <h3 className="flex items-center gap-3 font-serif text-[1.9rem] font-semibold italic leading-tight text-[var(--sz-snow)]">
                    {s.title}
                    <MountainLine className="h-3 w-14 shrink-0 text-[var(--sz-red)]" />
                  </h3>
                  {s.preorder && <p className="mt-1 text-[13.5px] text-[var(--sz-lamp)]">{t.menu.preorderHint}</p>}
                  <ul className="mt-3">
                    {s.rows.map((r) => (
                      <MenuRow key={r.key} row={r} locale={locale} showPreorder={!s.preorder} onOpen={openDish} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {sheet && <DishSheet dish={sheet} locale={locale} onClose={() => setSheet(null)} />}
    </section>
  );
}

function MenuRow({
  row,
  locale,
  showPreorder,
  onOpen,
}: {
  row: Row;
  locale: Locale;
  showPreorder: boolean;
  onOpen: (d: Dish) => void;
}) {
  const t = restaurantText(locale);
  const first = row.dishes[0];
  const off = row.dishes.every((d) => d.availability === "unavailable");
  const rich = row.dishes.find((d) => d.image || pickText(d.description, locale));
  const portions = row.dishes.map((d) => localizePortion(d.portion, locale)).filter(Boolean);
  const prices = row.dishes.map((d) => money(d.price)).join(" / ");

  const label = (
    <>
      <span className={`text-[15.5px] leading-snug ${off ? "text-[var(--sz-stone)] line-through decoration-white/30" : "text-[var(--sz-snow)]"}`}>
        {row.title}
      </span>
      {portions.length > 0 && <span className="shrink-0 whitespace-nowrap text-[13px] text-[var(--sz-stone)]">{portions.join(" / ")}</span>}
      {off && <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11.5px] text-[var(--sz-snow)]/75">{t.menu.unavailable}</span>}
      {showPreorder && first.availability === "preorder" && (
        <span className="shrink-0 rounded-full border border-[var(--sz-lamp)]/40 px-2 py-0.5 text-[11.5px] text-[var(--sz-lamp)]">{t.menu.preorder}</span>
      )}
      {/* Точки и цена — одним куском: длинное название на телефоне переносит
          их на следующую строку вместе, и цена остаётся у правого края. */}
      <span className="flex min-w-[7rem] flex-1 items-baseline gap-2">
        <span aria-hidden className="sz-leader" />
        <span className={`shrink-0 whitespace-nowrap text-[15px] font-semibold tabular-nums ${off ? "text-[var(--sz-stone)]" : "text-[var(--sz-lamp)]"}`}>
          {prices}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {rich ? (
        <button
          type="button"
          onClick={() => onOpen(rich)}
          className="group flex w-full items-center gap-3 rounded-xl py-2.5 text-left transition-colors hover:bg-white/[0.03]"
        >
          {rich.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rich.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[var(--sz-lamp)]/50" />
          )}
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">{label}</span>
        </button>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5">{label}</div>
      )}
    </li>
  );
}
