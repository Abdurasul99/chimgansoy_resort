"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { money } from "@/lib/tariff";
import { cartCount, useCart } from "@/lib/restaurant/cart";
import type { Dish } from "@/lib/restaurant/model";
import { dishProblem } from "@/lib/restaurant/rules";
import { trackEvent } from "@/lib/analytics";
import { RestIcon } from "./RestIcon";

/**
 * Полоса корзины внизу экрана — появляется с первым блюдом.
 *
 * Справа оставлено место под круглую кнопку «Вопросы» (FaqPanel): полоса
 * на всю ширину легла бы на неё, и гость попадал бы то в одно, то в другое.
 * Сумма — по текущему меню; блюда, которых в меню уже нет, в неё не входят.
 */
export function CartBar({ locale, dishes }: { locale: Locale; dishes: Dish[] }) {
  const t = restaurantText(locale);
  const cart = useCart();
  const count = cartCount(cart);
  if (count === 0) return null;
  // В сумму — только то, что уйдёт в заказ: блюдо, которое этим способом не
  // заказать, оформление всё равно попросит убрать.
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const total = cart.lines.reduce((s, l) => {
    const d = byId.get(l.dishId);
    if (!d) return s;
    const bad = cart.mode ? dishProblem(d, cart.mode) !== null : d.availability === "unavailable";
    return bad ? s : s + d.price * l.qty;
  }, 0);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-start px-3 pr-[4.75rem] sm:justify-center sm:pr-3">
      <Link
        href={localizePath(locale, "/restaurant/checkout")}
        prefetch={false}
        onClick={() => trackEvent("restaurant_checkout_start", { items: count, total })}
        className="rest-rise pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-full bg-[#1f1712] py-2 pl-2 pr-5 text-white shadow-[0_18px_50px_-12px_rgba(20,15,12,0.8)] ring-1 ring-white/10"
      >
        <span key={count} className="rest-bump relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffa53d] via-[#ff6a2b] to-[#d6352b]">
          <RestIcon name="bag" className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold text-[#d6352b]">
            {count}
          </span>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-white/60">{t.menu.count(count)}</span>
          <span className="block truncate font-serif text-xl font-bold">
            {money(total)} <span className="font-sans text-xs font-bold text-white/60">{priceLabels.currencyShort[locale]}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-extrabold text-[#ffb35c]">
          {t.menu.checkout}
          <RestIcon name="arrow" className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
