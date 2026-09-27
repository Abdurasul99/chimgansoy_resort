"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { trackEvent } from "@/lib/analytics";
import { lock, unlock } from "@/lib/scroll-lock";
import { money } from "@/lib/tariff";
import { addDish, qtyOf, setQty, useCart } from "@/lib/restaurant/cart";
import { CHANNELS, type Dish, type OrderMode } from "@/lib/restaurant/model";
import { dishProblem, pickText } from "@/lib/restaurant/rules";
import { DishVisual } from "./DishVisual";
import { RestIcon } from "./RestIcon";

/**
 * Карточка блюда и лист с подробностями.
 *
 * `orderable` решает страница: в режиме анонса заказы закрыты, и карточка
 * показывает цену без кнопки. «Временно нет» видно, но не добавляется —
 * гость должен знать, что блюдо бывает, а не думать, что его убрали.
 */
export function DishCard({
  dish,
  locale,
  orderable,
  preorderOpen,
  category,
  mode = null,
}: {
  dish: Dish;
  locale: Locale;
  orderable: boolean;
  preorderOpen: boolean;
  category?: string;
  /** Выбранный способ получения: при нём кнопка добавляет только то, что им можно заказать. */
  mode?: OrderMode | null;
}) {
  const t = restaurantText(locale);
  const cart = useCart();
  const qty = qtyOf(cart, dish.id);
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(0);
  const title = pickText(dish.title, locale);
  const description = pickText(dish.description, locale);
  const currency = priceLabels.currencyShort[locale];

  const blocked = mode
    ? dishProblem(dish, mode) !== null
    : dish.availability === "unavailable" || (dish.availability === "preorder" && !preorderOpen);
  const canAdd = orderable && !blocked && dish.price > 0;
  const aria = ARIA[locale];

  const add = () => {
    addDish(dish.id);
    setPop((n) => n + 1);
    trackEvent("restaurant_add_to_cart", { dish: dish.id, price: dish.price });
  };

  const openSheet = () => {
    setOpen(true);
    trackEvent("restaurant_dish_view", { dish: dish.id });
  };

  return (
    <>
      <article className="rest-dish group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e8d6b8] bg-white shadow-[0_10px_30px_-18px_rgba(90,40,10,0.35)]">
        <button
          type="button"
          onClick={openSheet}
          className="relative block aspect-[4/3] w-full overflow-hidden text-left"
          aria-label={title}
        >
          <DishVisual image={dish.image} title={title} seed={dish.id} className="rest-dish__img" />
          {dish.availability !== "available" && (
            <span
              className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow ${
                dish.availability === "unavailable" ? "bg-[#140f0c]/80 text-white" : "bg-[#17a3b0] text-white"
              }`}
            >
              {dish.availability === "unavailable" ? t.menu.unavailable : t.menu.preorder}
            </span>
          )}
          {qty > 0 && (
            <span key={pop} className="rest-pop absolute right-2.5 top-2.5 flex h-8 min-w-8 items-center justify-center rounded-full bg-[#ff6a2b] px-2 text-sm font-extrabold text-white shadow-lg">
              ×{qty}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          {category && (
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c2410c]/80">{category}</p>
          )}
          <button type="button" onClick={openSheet} className="mt-0.5 text-left">
            <h3 className="line-clamp-2 font-serif text-lg font-bold leading-tight text-[#1f1712] sm:text-xl">{title}</h3>
          </button>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6b5a4c] sm:text-[13px]">{description}</p>
          )}
          {/* Цена и кнопка переносятся друг под друга, когда не помещаются: в
              двух колонках на телефоне счётчик «− 1 +» рядом с ценой обрезал её. */}
          <div className="mt-auto pt-3">
            {dish.portion && <p className="whitespace-nowrap text-[11px] font-semibold text-[#8a7867]">{dish.portion}</p>}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              <p className="whitespace-nowrap font-serif text-xl font-bold text-[#1f1712] sm:text-2xl">
                {money(dish.price)} <span className="font-sans text-xs font-bold text-[#8a7867]">{currency}</span>
              </p>
              {orderable && (
                <div className="ml-auto">
                  <QtyControl qty={qty} canAdd={canAdd} onAdd={add} onSet={(n) => setQty(dish.id, n)} label={t.menu.add} aria={aria(title)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {open && (
        <DishSheet
          dish={dish}
          locale={locale}
          title={title}
          description={description}
          qty={qty}
          canAdd={canAdd}
          orderable={orderable}
          onAdd={add}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

const ARIA: Record<Locale, (title: string) => { add: string; less: string; more: string }> = {
  ru: (d) => ({ add: `Добавить «${d}» в корзину`, less: `Убрать одну порцию «${d}»`, more: `Добавить ещё «${d}»` }),
  uz: (d) => ({ add: `«${d}» ni savatga qo'shish`, less: `«${d}» dan bittasini olib tashlash`, more: `Yana «${d}» qo'shish` }),
  en: (d) => ({ add: `Add “${d}” to cart`, less: `Remove one “${d}”`, more: `Add another “${d}”` }),
};

function QtyControl({
  qty,
  canAdd,
  onAdd,
  onSet,
  label,
  aria,
  big = false,
}: {
  qty: number;
  canAdd: boolean;
  onAdd: () => void;
  onSet: (n: number) => void;
  label: string;
  aria: { add: string; less: string; more: string };
  big?: boolean;
}) {
  const size = big ? "h-12 w-12" : "h-10 w-10";
  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={!canAdd}
        onClick={onAdd}
        aria-label={aria.add}
        className={`btn-press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#ffa53d] via-[#ff6a2b] to-[#d6352b] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(214,53,43,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-[#d9cfc3] disabled:via-[#d9cfc3] disabled:to-[#d9cfc3] disabled:shadow-none ${
          big ? "h-12 px-6 text-base" : "h-10 w-10 sm:w-auto sm:px-4 sm:text-sm"
        }`}
      >
        <RestIcon name="plus" className="h-5 w-5" />
        <span className={big ? "" : "hidden sm:inline"}>{label}</span>
      </button>
    );
  }
  return (
    <div className="inline-flex shrink-0 items-center rounded-full bg-[#1f1712] p-1 text-white shadow-lg">
      <button type="button" onClick={() => onSet(qty - 1)} className={`btn-press flex ${size} items-center justify-center rounded-full hover:bg-white/10`} aria-label={aria.less}>
        <RestIcon name="minus" className="h-4 w-4" />
      </button>
      <span className="min-w-7 text-center text-base font-extrabold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className={`btn-press flex ${size} items-center justify-center rounded-full bg-[#ff6a2b] hover:brightness-110 disabled:opacity-40`}
        aria-label={aria.more}
      >
        <RestIcon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}

function DishSheet({
  dish,
  locale,
  title,
  description,
  qty,
  canAdd,
  orderable,
  onAdd,
  onClose,
}: {
  dish: Dish;
  locale: Locale;
  title: string;
  description: string;
  qty: number;
  canAdd: boolean;
  orderable: boolean;
  onAdd: () => void;
  onClose: () => void;
}) {
  const t = restaurantText(locale);
  const closeRef = useRef<HTMLButtonElement>(null);
  const currency = priceLabels.currencyShort[locale];

  // Последний onClose — в ref: родитель перерисовывается при каждом «+», и
  // эффект с onClose в зависимостях снимал бы и ставил блокировку прокрутки
  // и фокус на каждое нажатие.
  const closeLatest = useRef(onClose);
  useEffect(() => {
    closeLatest.current = onClose;
  });

  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lock();
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLatest.current();
      // Tab ходит по кнопкам листа по кругу: за ним — страница, до которой
      // с клавиатуры, пока лист открыт, добираться незачем.
      if (e.key === "Tab" && sheetRef.current) {
        const items = [...sheetRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
      <button type="button" className="absolute inset-0 bg-[#140f0c]/70 backdrop-blur-sm" onClick={onClose} aria-label={t.menu.close} />
      <div
        ref={sheetRef}
        data-lenis-prevent
        className="rest-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#fcf4e6] shadow-2xl sm:max-w-lg sm:rounded-[2rem]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <DishVisual image={dish.image} title={title} seed={dish.id} big />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-press absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#140f0c]/60 text-white backdrop-blur"
            aria-label={t.menu.close}
          >
            <RestIcon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <h3 className="font-serif text-3xl font-bold leading-tight text-[#1f1712]">{title}</h3>
          {dish.portion && <p className="mt-1 text-sm font-semibold text-[#8a7867]">{dish.portion}</p>}
          {description && <p className="mt-3 text-[15px] leading-7 text-[#5b4a3d]">{description}</p>}

          {dish.availability === "preorder" && (
            <p className="mt-4 rounded-2xl bg-[#17a3b0]/10 px-4 py-3 text-sm font-semibold text-[#0e6f78]">{t.menu.preorderHint}</p>
          )}
          {dish.availability === "unavailable" && (
            <p className="mt-4 rounded-2xl bg-[#140f0c]/5 px-4 py-3 text-sm font-semibold text-[#5b4a3d]">{t.menu.unavailable}</p>
          )}

          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7867]">{t.menu.channels}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHANNELS.filter((c) => dish.channels.includes(c)).map((c) => (
                <span key={c} className="rounded-full bg-[#1f1712] px-3 py-1 text-xs font-bold text-[#ffd9a0]">
                  {t.channelNames[c]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#e8d6b8] pt-5">
            <p className="font-serif text-3xl font-bold text-[#1f1712]">
              {money(dish.price)} <span className="font-sans text-sm font-bold text-[#8a7867]">{currency}</span>
            </p>
            {orderable && (
              <QtyControl qty={qty} canAdd={canAdd} onAdd={onAdd} onSet={(n) => setQty(dish.id, n)} label={t.menu.add} aria={ARIA[locale](title)} big />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
