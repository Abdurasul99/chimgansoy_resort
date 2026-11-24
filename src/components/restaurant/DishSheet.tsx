"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { lock, unlock } from "@/lib/scroll-lock";
import { localizePortion } from "@/lib/restaurant/portion";
import { money } from "@/lib/tariff";
import type { Dish } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { RestIcon } from "./RestIcon";

/**
 * Блюдо крупно: фото, название, порция, описание, цена. Открывается у блюд, у
 * которых есть фото или описание, — остальным нечего показать сверх строки.
 * Заказа на сайте нет (с 12.10.2026).
 */
export function DishSheet({ dish, locale, onClose }: { dish: Dish; locale: Locale; onClose: () => void }) {
  const t = restaurantText(locale);
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = pickText(dish.title, locale);
  const description = pickText(dish.description, locale);
  const currency = priceLabels.currencyShort[locale];

  // Последний onClose — в ref: эффект с ним в зависимостях снимал бы и ставил
  // блокировку прокрутки при каждой перерисовке родителя.
  const closeLatest = useRef(onClose);
  useEffect(() => {
    closeLatest.current = onClose;
  });

  useEffect(() => {
    lock();
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLatest.current();
      // Единственная кнопка окна — «закрыть»: Tab не уводит фокус на страницу.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="sz fixed inset-0 z-[70] flex items-end justify-center bg-transparent sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="sz-fade absolute inset-0 bg-black/70" onClick={onClose} aria-label={t.menu.close} tabIndex={-1} />
      <div
        data-lenis-prevent
        className="sz-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-[var(--sz-walnut-2)] shadow-2xl ring-1 ring-white/10 sm:max-w-md sm:rounded-[1.75rem]"
      >
        {dish.image && (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dish.image} alt={title} className="h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--sz-walnut-2)] to-transparent" />
          </div>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="btn-press absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          aria-label={t.menu.close}
        >
          <RestIcon name="close" className="h-5 w-5" />
        </button>
        <div className={`px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${dish.image ? "-mt-10 relative" : "pt-8"}`}>
          <h3 className="pr-10 font-serif text-[2rem] font-semibold italic leading-tight text-[var(--sz-snow)]">{title}</h3>
          {dish.portion && <p className="mt-1 text-sm text-[var(--sz-stone)]">{localizePortion(dish.portion, locale)}</p>}
          {description && <p className="mt-3 text-[15px] leading-6 text-[var(--sz-snow)]/80">{description}</p>}
          {dish.availability !== "available" && (
            <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-[var(--sz-snow)]/80">
              {dish.availability === "unavailable" ? t.menu.unavailable : t.menu.preorderHint}
            </p>
          )}
          <p className="mt-5 text-2xl font-bold tabular-nums text-[var(--sz-lamp)]">
            {money(dish.price)} <span className="text-base font-semibold">{currency}</span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
