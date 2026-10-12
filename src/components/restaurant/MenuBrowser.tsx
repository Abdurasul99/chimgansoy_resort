"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import type { Category, Dish } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { DishCard } from "./DishCard";
import { RestIcon } from "./RestIcon";

const OTHER: Record<Locale, string> = { ru: "Ещё", uz: "Yana", en: "More" };

/**
 * Меню ресторана — по привычной схеме приложений доставки (Яндекс Еда, Wolt,
 * Uzum Tezkor): разделы слева, блюда сеткой. На телефоне разделы — липкая
 * лента. Гость знает эту раскладку и ничему не учится. Корзины нет: с
 * 12.10.2026 сайт показывает меню, а не принимает заказы.
 */
export function MenuBrowser({
  locale,
  categories,
  dishes,
}: {
  locale: Locale;
  categories: Category[];
  dishes: Dish[];
}) {
  const t = restaurantText(locale);
  const [query, setQuery] = useState("");
  // На телефоне поиск — лупа в ленте разделов: поле рядом с разделами
  // не помещалось и обрезало подсказку до «Найти бл».
  const [searchOpen, setSearchOpen] = useState(false);
  const showSearch = searchOpen || query !== "";
  const [active, setActive] = useState<string>("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const menuTop = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (d: Dish) =>
      !q ||
      pickText(d.title, locale).toLowerCase().includes(q) ||
      pickText(d.description, locale).toLowerCase().includes(q);
    const visible = dishes.filter((d) => d.state === "published" && match(d));
    const known = new Set(categories.map((c) => c.id));
    const out = categories
      .map((c) => ({ key: `c${c.id}`, title: pickText(c.title, locale), items: visible.filter((d) => d.categoryId === c.id) }))
      .filter((s) => s.items.length > 0);
    const rest = visible.filter((d) => d.categoryId === null || !known.has(d.categoryId));
    if (rest.length) out.push({ key: "other", title: OTHER[locale], items: rest });
    return out;
  }, [categories, dishes, query, locale]);

  // Подсветка раздела по мере прокрутки.
  useEffect(() => {
    const els = [...sectionRefs.current.values()];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Поиск сжимает список: если гость ищет, прокрутив меню вниз, липкая лента
  // уехала бы вместе с коротким списком — возвращаем к началу меню.
  useEffect(() => {
    const el = menuTop.current;
    if (!query || !el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY <= top) return;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top });
  }, [query]);

  const jump = (key: string) => {
    const el = document.getElementById(key);
    if (!el) return;
    // На телефоне над разделом — шапка и липкая лента, на компьютере — только шапка.
    const offset = window.innerWidth >= 1024 ? 96 : 136;
    const target = el.getBoundingClientRect().top + window.scrollY - offset;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { duration: 0.9 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const hasMenu = dishes.length > 0;
  // Колонка разделов на компьютере — только когда есть меню.
  const cols = hasMenu ? "lg:grid-cols-[12.5rem_minmax(0,1fr)]" : "";

  const searchField = (autoFocus: boolean) => (
    <label className="relative flex min-w-0 items-center">
      <RestIcon name="search" className="pointer-events-none absolute left-3 h-4 w-4 text-[#8c8c8c]" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.menu.search}
        aria-label={t.menu.search}
        autoFocus={autoFocus}
        className={`h-10 w-full rounded-xl bg-[#f6f5f2] pl-9 pr-3 text-sm text-[#1c1c1c] outline-none ring-[#1c1c1c]/10 transition placeholder:text-[#8c8c8c] focus:bg-white focus:ring-2 ${autoFocus ? "[&::-webkit-search-cancel-button]:hidden" : ""}`}
      />
    </label>
  );

  return (
    <div className={`lg:grid lg:items-start lg:gap-8 ${cols}`}>
      {/* Слева — поиск и разделы (только на компьютере). */}
      {hasMenu && (
        <aside className="rest-side sticky hidden lg:block">
          {searchField(false)}
          <p className="mb-2 mt-5 px-3 text-[12px] font-semibold text-[#8c8c8c]">{t.sections}</p>
          <nav data-lenis-prevent className="max-h-[calc(100vh-12rem)] space-y-0.5 overflow-y-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => jump(s.key)}
                className={`block w-full truncate rounded-xl px-3 py-2 text-left text-[15px] transition-colors ${
                  active === s.key ? "bg-[#f6f5f2] font-semibold text-[#1c1c1c]" : "text-[#4a4a4a] hover:bg-[#f6f5f2]"
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>
      )}

      <div ref={menuTop} className="min-w-0">
        {!hasMenu ? (
          <div className="rounded-3xl bg-[#f6f5f2] px-6 py-16 text-center">
            <RestIcon name="cloche" className="mx-auto h-12 w-12 text-[#cdc5b8]" />
            <p className="mx-auto mt-4 max-w-sm text-lg font-semibold text-[#1c1c1c]">{t.menu.empty}</p>
          </div>
        ) : (
          <>
            {/* Телефон и планшет: поиск и лента разделов — липкие. */}
            <div className="rest-stick sticky z-30 -mx-4 mt-3 border-b border-[#efefef] bg-white/95 px-4 py-2 backdrop-blur-md sm:mx-0 sm:px-0 lg:hidden">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">{searchField(true)}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSearchOpen(false);
                    }}
                    aria-label={t.menu.close}
                    className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f5f2] text-[#1c1c1c]"
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
                  className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f5f2] text-[#1c1c1c]"
                >
                  <RestIcon name="search" className="h-4 w-4" />
                </button>
                <nav className="rest-chips flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                  {sections.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => jump(s.key)}
                      className={`btn-press h-10 shrink-0 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                        active === s.key ? "bg-[#1c1c1c] text-white" : "bg-[#f6f5f2] text-[#1c1c1c]"
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
              <p className="mt-10 text-center text-base text-[#8c8c8c]">{t.menu.nothingFound}</p>
            ) : (
              sections.map((s, i) => (
                <section
                  key={s.key}
                  id={s.key}
                  ref={(el) => {
                    if (el) sectionRefs.current.set(s.key, el);
                    else sectionRefs.current.delete(s.key);
                  }}
                  className={`scroll-mt-40 ${i === 0 ? "pt-5" : "pt-9"}`}
                >
                  <h2 className="text-xl font-bold text-[#1c1c1c] sm:text-2xl">{s.title}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {s.items.map((d) => (
                      <DishCard key={d.id} dish={d} locale={locale} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
