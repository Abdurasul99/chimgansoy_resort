"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { trackEvent } from "@/lib/analytics";
import { lock, unlock } from "@/lib/scroll-lock";
import { money } from "@/lib/tariff";
import type { Dish } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";
import { DishVisual } from "./DishVisual";
import { RestIcon } from "./RestIcon";

/**
 * Карточка блюда и окно с подробностями: фото, крупная цена, название,
 * порция. Заказа на сайте нет (с 12.10.2026) — карточка только показывает.
 * «Временно нет» видно с пометкой: гость должен знать, что блюдо бывает.
 */
export function DishCard({ dish, locale }: { dish: Dish; locale: Locale }) {
  const t = restaurantText(locale);
  const [open, setOpen] = useState(false);
  const title = pickText(dish.title, locale);
  const description = pickText(dish.description, locale);
  const currency = priceLabels.currencyShort[locale];

  const openSheet = () => {
    setOpen(true);
    trackEvent("restaurant_dish_view", { dish: dish.id });
  };

  return (
    <>
      <article className="flex h-full flex-col rounded-3xl bg-[#f6f5f2] p-2">
        <button
          type="button"
          onClick={openSheet}
          className="relative block aspect-square w-full overflow-hidden rounded-[1.1rem] bg-white text-left"
          aria-label={title}
        >
          <DishVisual image={dish.image} title={title} className={dish.availability === "unavailable" ? "opacity-50" : ""} />
          {dish.availability !== "available" && (
            <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1c1c1c] shadow-sm">
              {dish.availability === "unavailable" ? t.menu.unavailable : t.menu.preorder}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-2.5">
          <p className="text-[1.05rem] font-bold leading-tight tabular-nums text-[#1c1c1c] sm:text-lg">
            {money(dish.price)} <span className="text-[0.8em] font-semibold">{currency}</span>
          </p>
          <button type="button" onClick={openSheet} className="mt-1 text-left">
            <h3 className="line-clamp-2 text-sm leading-5 text-[#1c1c1c]">{title}</h3>
          </button>
          {dish.portion && <p className="mt-0.5 text-[13px] text-[#8c8c8c]">{dish.portion}</p>}
        </div>
      </article>

      {open && <DishSheet dish={dish} locale={locale} title={title} description={description} onClose={() => setOpen(false)} />}
    </>
  );
}

function DishSheet({
  dish,
  locale,
  title,
  description,
  onClose,
}: {
  dish: Dish;
  locale: Locale;
  title: string;
  description: string;
  onClose: () => void;
}) {
  const t = restaurantText(locale);
  const closeRef = useRef<HTMLButtonElement>(null);
  const currency = priceLabels.currencyShort[locale];

  // Последний onClose — в ref: эффект с onClose в зависимостях снимал бы и
  // ставил блокировку прокрутки и фокус при каждой перерисовке родителя.
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
      // Единственная кнопка окна — «закрыть»: Tab не уводит фокус на страницу под окном.
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
    <div className="rest fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label={t.menu.close} tabIndex={-1} />
      <div
        data-lenis-prevent
        className="rest-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white shadow-2xl sm:max-w-md sm:rounded-[1.75rem]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#efece6]">
          <DishVisual image={dish.image} title={title} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-press absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1c1c1c] shadow-md"
            aria-label={t.menu.close}
          >
            <RestIcon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <h3 className="text-2xl font-bold leading-tight text-[#1c1c1c]">{title}</h3>
          {dish.portion && <p className="mt-1 text-sm text-[#8c8c8c]">{dish.portion}</p>}
          {description && <p className="mt-3 text-[15px] leading-6 text-[#4a4a4a]">{description}</p>}

          {dish.availability !== "available" && (
            <p className="mt-4 rounded-2xl bg-[#f6f5f2] px-4 py-3 text-sm text-[#4a4a4a]">
              {dish.availability === "unavailable" ? t.menu.unavailable : t.menu.preorderHint}
            </p>
          )}

          <p className="mt-5 text-2xl font-bold tabular-nums text-[#1c1c1c]">
            {money(dish.price)} <span className="text-base font-semibold">{currency}</span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
