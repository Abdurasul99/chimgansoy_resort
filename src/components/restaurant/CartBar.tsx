"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { money } from "@/lib/tariff";
import { cartCount, setQty, useCart, type CartState } from "@/lib/restaurant/cart";
import type { Dish, RestaurantSettings } from "@/lib/restaurant/model";
import { dishProblem, modeFee, pickText } from "@/lib/restaurant/rules";
import { trackEvent } from "@/lib/analytics";
import { DishVisual } from "./DishVisual";
import { RestIcon } from "./RestIcon";

/**
 * Строки корзины против текущего меню. В сумму — только то, что уйдёт в
 * заказ: блюдо, которое этим способом не заказать, оформление всё равно
 * попросит убрать.
 */
function summarize(cart: CartState, dishes: Dish[]) {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const lines = cart.lines.map((l) => {
    const dish = byId.get(l.dishId);
    const bad = !dish || (cart.mode ? dishProblem(dish, cart.mode) !== null : dish.availability === "unavailable");
    return { ...l, dish, bad };
  });
  const total = lines.reduce((s, l) => (l.dish && !l.bad ? s + l.dish.price * l.qty : s), 0);
  return { lines, total, count: cartCount(cart) };
}

/**
 * Полоса корзины внизу экрана на телефоне — появляется с первым блюдом.
 *
 * Справа оставлено место под круглую кнопку «Вопросы» (FaqPanel): полоса
 * на всю ширину легла бы на неё, и гость попадал бы то в одно, то в другое.
 * С 1024 px её заменяет колонка корзины справа (CartPanel).
 */
export function CartBar({ locale, dishes }: { locale: Locale; dishes: Dish[] }) {
  const t = restaurantText(locale);
  const cart = useCart();
  const { count, total } = summarize(cart, dishes);
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-start px-3 pr-[4.75rem] sm:justify-center sm:pr-3 lg:hidden">
      <Link
        href={localizePath(locale, "/restaurant/checkout")}
        prefetch={false}
        onClick={() => trackEvent("restaurant_checkout_start", { items: count, total })}
        className="rest-rise pointer-events-auto flex h-14 w-full max-w-xl items-center gap-3 rounded-2xl bg-[#f4a52a] px-4 text-[#3b2a0a] shadow-[0_14px_36px_-12px_rgba(0,0,0,0.45)]"
      >
        <span key={count} className="rest-bump relative flex shrink-0">
          <RestIcon name="bag" className="h-6 w-6" />
          <span className="absolute -right-2 -top-1.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-[#1c1c1c] px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{t.menu.checkout}</span>
        <span className="shrink-0 text-[15px] font-bold tabular-nums">
          {money(total)} {priceLabels.currencyShort[locale]}
        </span>
      </Link>
    </div>
  );
}

/**
 * Корзина колонкой справа — как в приложениях доставки на компьютере: состав
 * всегда перед глазами, а не за отдельной кнопкой.
 */
export function CartPanel({
  locale,
  dishes,
  fees,
}: {
  locale: Locale;
  dishes: Dish[];
  fees: Pick<RestaurantSettings, "deliveryFee" | "roomFee">;
}) {
  const t = restaurantText(locale);
  const cart = useCart();
  const { lines, total, count } = summarize(cart, dishes);
  const currency = priceLabels.currencyShort[locale];
  const mode = cart.mode;
  const fee = mode === "delivery" || mode === "room" ? modeFee(fees, mode) : null;

  return (
    <div className="rounded-3xl border border-[#ececec] bg-white p-5">
      <p className="text-xl font-bold text-[#1c1c1c]">{t.menu.viewCart}</p>

      {count === 0 ? (
        <div className="py-8 text-center">
          <RestIcon name="bag" className="mx-auto h-10 w-10 text-[#cdc5b8]" />
          <p className="mt-3 font-semibold text-[#1c1c1c]">{t.cartEmpty}</p>
          <p className="mt-1 text-sm text-[#8c8c8c]">{t.cartEmptyHint}</p>
        </div>
      ) : (
        <>
          {mode && <p className="mt-1 text-[13px] text-[#8c8c8c]">{t.modes[mode].title}</p>}
          <ul data-lenis-prevent className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
            {lines.map((l) => {
              const title = l.dish ? pickText(l.dish.title, locale) : `#${l.dishId}`;
              return (
                <li key={l.dishId} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <DishVisual image={l.dish?.image ?? ""} title={title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] leading-4 text-[#1c1c1c]">{title}</p>
                    <p className={`mt-0.5 text-[13px] font-semibold tabular-nums ${l.bad ? "text-[#b42318]" : "text-[#1c1c1c]"}`}>
                      {l.bad ? t.menu.unavailable : `${money((l.dish?.price ?? 0) * l.qty)} ${currency}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center rounded-xl bg-[#f6f5f2]">
                    <button
                      type="button"
                      onClick={() => setQty(l.dishId, l.qty - 1)}
                      className="btn-press flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/5"
                      aria-label="−"
                    >
                      <RestIcon name="minus" className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-5 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(l.dishId, l.qty + 1)}
                      disabled={l.bad}
                      className="btn-press flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/5 disabled:opacity-30"
                      aria-label="+"
                    >
                      <RestIcon name="plus" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-1 border-t border-[#ececec] pt-4 text-sm">
            {fee && mode && (mode === "delivery" || mode === "room") && (
              <div className="flex justify-between text-[#8c8c8c]">
                <span>{t.checkout.fee[mode]}</span>
                <span className="tabular-nums">
                  {fee.pending ? t.checkout.feePending : fee.fee ? `${money(fee.fee)} ${currency}` : t.checkout.free}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between text-[#1c1c1c]">
              <span className="font-semibold">{t.checkout.total}</span>
              <span className="text-lg font-bold tabular-nums">
                {money(total + (fee?.fee ?? 0))} {currency}
              </span>
            </div>
          </div>

          <Link
            href={localizePath(locale, "/restaurant/checkout")}
            prefetch={false}
            onClick={() => trackEvent("restaurant_checkout_start", { items: count, total })}
            className="btn-press mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-[#f4a52a] font-bold text-[#3b2a0a] transition-colors hover:bg-[#eb9b1c]"
          >
            {t.menu.toCheckout}
          </Link>
        </>
      )}
      <p className="mt-3 text-center text-xs text-[#9a948a]">
        {t.noOnlinePay} · {t.confirmByPhone.toLowerCase()}
      </p>
    </div>
  );
}
