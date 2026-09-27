"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { setCartMode, useCart } from "@/lib/restaurant/cart";
import type { Category, Dish, OrderMode } from "@/lib/restaurant/model";
import { dishVisibleIn, pickText } from "@/lib/restaurant/rules";
import { CartBar } from "./CartBar";
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
 * Меню: способ получения, поиск, лента разделов и сетка блюд.
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
}: {
  locale: Locale;
  categories: Category[];
  dishes: Dish[];
  openModes: OrderMode[];
  initialMode: OrderMode | null;
}) {
  const t = restaurantText(locale);
  const cart = useCart();
  const orderable = openModes.length > 0;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Способ из ссылки («Заказать в номер» на главной ресторана) важнее
  // запомненного: гость только что сказал, чего хочет.
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

  // Подсветка раздела в ленте по мере прокрутки.
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

  const jump = (key: string) => {
    const el = document.getElementById(key);
    if (!el) return;
    const target = el.getBoundingClientRect().top + window.scrollY - 130;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { duration: 0.9 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const preorderOpen = openModes.includes("preorder");

  if (dishes.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-dashed border-[#e0c9a4] bg-white/70 px-6 py-14 text-center">
        <RestIcon name="cloche" className="mx-auto h-12 w-12 text-[#ff6a2b]" />
        <p className="mt-4 font-serif text-2xl font-bold text-[#1f1712]">{t.menu.empty}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Способ получения */}
      {orderable && (
        <div className="rest-chips -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <ModeChip on={!mode} onClick={() => setCartMode(null)} label={t.menu.all} icon="menu" />
          {openModes.map((m) => (
            <ModeChip key={m} on={mode === m} onClick={() => setCartMode(m)} label={t.modes[m].title} icon={MODE_ICON[m]} />
          ))}
        </div>
      )}
      {mode && <p className="mt-2 text-sm text-[#6b5a4c]">{t.modes[mode].hint}</p>}

      {/* Лента разделов + поиск — липкие, под рукой при прокрутке длинного меню. */}
      <div className="rest-stick sticky z-30 -mx-4 mt-5 border-y border-[#ecdcc0] bg-[#fcf4e6]/92 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex items-center gap-2">
          <label className="relative flex min-w-0 shrink-0 items-center">
            <RestIcon name="search" className="pointer-events-none absolute left-3 h-4 w-4 text-[#8a7867]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.menu.search}
              className="h-10 w-36 rounded-full border border-[#e8d6b8] bg-white pl-9 pr-3 text-sm text-[#1f1712] outline-none transition-[width,border-color] focus:w-52 focus:border-[#ff6a2b] sm:w-48 sm:focus:w-64"
            />
          </label>
          <nav className="rest-chips flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => jump(s.key)}
                className={`btn-press shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                  active === s.key ? "bg-[#1f1712] text-[#ffc46b]" : "text-[#5b4a3d] hover:bg-[#f3e2c4]"
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mt-10 text-center text-base text-[#6b5a4c]">{query.trim() ? t.menu.nothingFound : t.menu.emptyFiltered}</p>
      ) : (
        sections.map((s) => (
          <section
            key={s.key}
            id={s.key}
            ref={(el) => {
              if (el) sectionRefs.current.set(s.key, el);
              else sectionRefs.current.delete(s.key);
            }}
            className="scroll-mt-40 pt-10"
          >
            <div className="flex items-end gap-4">
              <h2 className="font-serif text-3xl font-bold leading-none text-[#1f1712] sm:text-4xl">{s.title}</h2>
              <span className="mb-1 h-px flex-1 bg-gradient-to-r from-[#ff6a2b]/50 via-[#f4a52a]/40 to-transparent" />
              <span className="mb-1 text-sm font-bold text-[#c2410c]">{s.items.length}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {s.items.map((d) => (
                <DishCard key={d.id} dish={d} locale={locale} orderable={orderable} preorderOpen={preorderOpen} mode={mode} />
              ))}
            </div>
          </section>
        ))
      )}

      {orderable && <CartBar locale={locale} dishes={dishes} />}
      {/* Место под полосу корзины, чтобы она не закрывала последнюю строку. */}
      <div className="h-24" aria-hidden="true" />
    </div>
  );
}

function ModeChip({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: RestIconName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`btn-press inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-extrabold transition-all ${
        on
          ? "border-transparent bg-gradient-to-r from-[#ff6a2b] to-[#d6352b] text-white shadow-[0_10px_24px_-12px_rgba(214,53,43,0.9)]"
          : "border-[#e8d6b8] bg-white text-[#3b2d23] hover:border-[#ff6a2b]/60"
      }`}
    >
      <RestIcon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}
