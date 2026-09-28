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
 * Карточка блюда и окно с подробностями — по образцу приложений доставки:
 * фото, крупная цена, название, порция и кнопка «+ Добавить» во всю ширину,
 * которая после первого нажатия становится счётчиком. Гость узнаёт этот
 * порядок с первого взгляда и не ищет, куда нажать.
 *
 * `orderable` решает страница: пока заказы закрыты, карточка показывает цену
 * без кнопки. «Временно нет» видно, но не добавляется — гость должен знать,
 * что блюдо бывает, а не думать, что его убрали.
 */
export function DishCard({
  dish,
  locale,
  orderable,
  preorderOpen,
  mode = null,
}: {
  dish: Dish;
  locale: Locale;
  orderable: boolean;
  preorderOpen: boolean;
  /** Выбранный способ получения: при нём кнопка добавляет только то, что им можно заказать. */
  mode?: OrderMode | null;
}) {
  const t = restaurantText(locale);
  const cart = useCart();
  const qty = qtyOf(cart, dish.id);
  const [open, setOpen] = useState(false);
  const title = pickText(dish.title, locale);
  const description = pickText(dish.description, locale);
  const currency = priceLabels.currencyShort[locale];

  const blocked = mode
    ? dishProblem(dish, mode) !== null
    : dish.availability === "unavailable" || (dish.availability === "preorder" && !preorderOpen);
  const canAdd = orderable && !blocked && dish.price > 0;
  // Почему нельзя: на выключенной кнопке — причина, а не немое «+».
  const why =
    dish.availability === "unavailable" ? t.menu.unavailable : dish.availability === "preorder" && blocked ? t.menu.preorder : t.menu.notHere;

  const add = () => {
    addDish(dish.id);
    trackEvent("restaurant_add_to_cart", { dish: dish.id, price: dish.price });
  };

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

        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
          <p className="text-[1.05rem] font-bold leading-tight tabular-nums text-[#1c1c1c] sm:text-lg">
            {money(dish.price)} <span className="text-[0.8em] font-semibold">{currency}</span>
          </p>
          <button type="button" onClick={openSheet} className="mt-1 text-left">
            <h3 className="line-clamp-2 text-sm leading-5 text-[#1c1c1c]">{title}</h3>
          </button>
          {dish.portion && <p className="mt-0.5 text-[13px] text-[#8c8c8c]">{dish.portion}</p>}
          {orderable && (
            <div className="mt-auto pt-3">
              <QtyControl
                qty={qty}
                canAdd={canAdd}
                onAdd={add}
                onSet={(n) => setQty(dish.id, n)}
                label={canAdd || qty > 0 ? t.menu.add : why}
                aria={ARIA[locale](title)}
              />
            </div>
          )}
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
          why={why}
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

/** «+ Добавить» во всю ширину; после первого нажатия — «− 2 +» на золотом. */
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
  const h = big ? "h-13" : "h-10";
  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={!canAdd}
        onClick={onAdd}
        aria-label={canAdd ? aria.add : label}
        className={`btn-press flex w-full items-center justify-center gap-1.5 rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed ${h} ${
          big
            ? "bg-[#f4a52a] px-6 text-base text-[#3b2a0a] hover:bg-[#eb9b1c] disabled:bg-[#efece6] disabled:text-[#9a948a]"
            : "bg-white text-sm text-[#1c1c1c] hover:bg-[#ecebe7] disabled:bg-transparent disabled:text-[#9a948a]"
        }`}
      >
        {canAdd && <RestIcon name="plus" className="h-4 w-4" />}
        {label}
      </button>
    );
  }
  return (
    <div className={`rest-pop flex w-full items-center justify-between rounded-2xl bg-[#f4a52a] p-1 text-[#3b2a0a] ${h}`}>
      <button
        type="button"
        onClick={() => onSet(qty - 1)}
        className="btn-press flex aspect-square h-full items-center justify-center rounded-xl hover:bg-black/5"
        aria-label={aria.less}
      >
        <RestIcon name="minus" className="h-4 w-4" />
      </button>
      <span className="text-base font-bold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="btn-press flex aspect-square h-full items-center justify-center rounded-xl hover:bg-black/5 disabled:opacity-40"
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
  why,
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
  why: string;
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
      // Tab ходит по кнопкам окна по кругу: за ним — страница, до которой
      // с клавиатуры, пока окно открыто, добираться незачем.
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
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label={t.menu.close} />
      <div
        ref={sheetRef}
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

          {dish.availability === "preorder" && (
            <p className="mt-4 rounded-2xl bg-[#f6f5f2] px-4 py-3 text-sm text-[#4a4a4a]">{t.menu.preorderHint}</p>
          )}

          <p className="mt-4 text-[13px] text-[#8c8c8c]">
            {t.menu.channels}:{" "}
            <span className="text-[#4a4a4a]">
              {CHANNELS.filter((c) => dish.channels.includes(c))
                .map((c) => t.channelNames[c])
                .join(" · ")}
            </span>
          </p>

          <div className="mt-5 flex items-center gap-3">
            <p className="shrink-0 text-2xl font-bold tabular-nums text-[#1c1c1c]">
              {money(dish.price)} <span className="text-base font-semibold">{currency}</span>
            </p>
            {orderable && (
              <div className="min-w-0 flex-1">
                <QtyControl
                  qty={qty}
                  canAdd={canAdd}
                  onAdd={onAdd}
                  onSet={(n) => setQty(dish.id, n)}
                  label={canAdd || qty > 0 ? t.menu.add : why}
                  aria={ARIA[locale](title)}
                  big
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
