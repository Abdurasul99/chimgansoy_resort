"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { setCartMode, useCart } from "@/lib/restaurant/cart";
import type { Category, Dish, OrderMode, RestaurantSettings } from "@/lib/restaurant/model";
import { dishVisibleIn, pickText } from "@/lib/restaurant/rules";
import { CartBar, CartPanel } from "./CartBar";
import { DishCard } from "./DishCard";
import { RestIcon, type RestIconName } from "./RestIcon";

const MODE_ICON: Record<OrderMode, RestIconName> = {
  takeaway: "takeaway",
  delivery: "delivery",
  room: "room",
  preorder: "table",
};

const OTHER: Record<Locale, string> = { ru: "Ещё", uz: "Yana", en: "More" };

/**
 * Витрина ресторана — по привычной схеме приложений доставки (Яндекс Еда,
 * Wolt, Uzum Tezkor): способ получения сверху, разделы слева, блюда сеткой
 * в центре, корзина справа. На телефоне разделы — липкая лента, корзина —
 * полоса внизу. Гость знает эту раскладку и ничему не учится.
 *
 * Способ получения фильтрует меню (ТЗ, п. 3: «фильтры должны исключать
 * неподходящие блюда») — в режиме «В номер» гость не увидит блюд, которые в
 * домик не носят, и не узнает о запрете только на оформлении. Выбор
 * запоминается в корзине и переносится в оформление.
 */
export function MenuBrowser({
  locale,
  categories,
  dishes,
  openModes,
  initialMode,
  fees,
}: {
  locale: Locale;
  categories: Category[];
  dishes: Dish[];
  openModes: OrderMode[];
  initialMode: OrderMode | null;
  fees: Pick<RestaurantSettings, "deliveryFee" | "roomFee">;
}) {
  const t = restaurantText(locale);
  const cart = useCart();
  const orderable = openModes.length > 0;
  const [query, setQuery] = useState("");
  // На телефоне поиск — лупа в ленте разделов: поле рядом с разделами
  // не помещалось и обрезало подсказку до «Найти бл».
  const [searchOpen, setSearchOpen] = useState(false);
  const showSearch = searchOpen || query !== "";
  const [active, setActive] = useState<string>("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const menuTop = useRef<HTMLDivElement>(null);

  // Способ из ссылки (?mode=room) важнее запомненного: гость только что
  // сказал, чего хочет.
  useEffect(() => {
    if (initialMode && openModes.includes(initialMode)) setCartMode(initialMode);
  }, [initialMode, openModes]);

  const mode = cart.mode && openModes.includes(cart.mode) ? cart.mode : null;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (d: Dish) =>
      !q ||
      pickText(d.title, locale).toLowerCase().includes(q) ||
      pickText(d.description, locale).toLowerCase().includes(q);
    const visible = dishes.filter((d) => dishVisibleIn(d, mode) && match(d));
    const known = new Set(categories.map((c) => c.id));
    const out = categories
      .map((c) => ({ key: `c${c.id}`, title: pickText(c.title, locale), items: visible.filter((d) => d.categoryId === c.id) }))
      .filter((s) => s.items.length > 0);
    const rest = visible.filter((d) => d.categoryId === null || !known.has(d.categoryId));
    if (rest.length) out.push({ key: "other", title: OTHER[locale], items: rest });
    return out;
  }, [categories, dishes, mode, query, locale]);

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

  const preorderOpen = openModes.includes("preorder");
  const hasMenu = dishes.length > 0;
  // Колонки на компьютере: разделы — если есть меню, корзина — если заказы
  // открыты. Пока заказы закрыты, об этом говорит плашка над витриной.
  const cols = hasMenu
    ? orderable
      ? "lg:grid-cols-[12.5rem_minmax(0,1fr)_20rem] xl:grid-cols-[13.5rem_minmax(0,1fr)_21.5rem]"
      : "lg:grid-cols-[12.5rem_minmax(0,1fr)]"
    : orderable
      ? "lg:grid-cols-[minmax(0,1fr)_20rem]"
      : "";

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
        {/* Способ получения — как «Доставка / Самовывоз» в приложениях. */}
        {orderable && hasMenu && openModes.length > 1 && (
          <div className="rest-chips -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ModeChip on={!mode} onClick={() => setCartMode(null)} label={t.menu.all} icon="menu" />
            {openModes.map((m) => (
              <ModeChip key={m} on={mode === m} onClick={() => setCartMode(m)} label={t.modes[m].title} icon={MODE_ICON[m]} />
            ))}
          </div>
        )}
        {mode && hasMenu && <p className="mt-2 text-[13px] text-[#8c8c8c]">{t.modes[mode].hint}</p>}

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
              <p className="mt-10 text-center text-base text-[#8c8c8c]">{query.trim() ? t.menu.nothingFound : t.menu.emptyFiltered}</p>
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
                      <DishCard key={d.id} dish={d} locale={locale} orderable={orderable} preorderOpen={preorderOpen} mode={mode} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>

      {/* Справа — корзина. */}
      {orderable && (
        <aside className="rest-side sticky hidden lg:block">
          <CartPanel locale={locale} dishes={dishes} fees={fees} />
        </aside>
      )}

      {orderable && <CartBar locale={locale} dishes={dishes} />}
    </div>
  );
}

function ModeChip({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: RestIconName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`btn-press inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
        on ? "bg-[#1c1c1c] text-white" : "bg-[#f6f5f2] text-[#1c1c1c] hover:bg-[#ecebe7]"
      }`}
    >
      <RestIcon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}
