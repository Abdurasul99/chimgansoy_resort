import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";

/**
 * Плашки страницы ресторана. Шапка заведения (StoreHeader) с 24.11.2026 —
 * первый экран RestaurantHero: страница стала тёмной, в стиле Instagram
 * ресторана. Светлая витрина «как в приложении доставки» (28.09.2026) была
 * сеткой из 125 серых заглушек — фото блюд у ресторана не было.
 */

/** Плашка над витриной — предпросмотр владельца. */
export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-[#e7f5f6] px-4 py-3 text-sm text-[#0e5f67]">{children}</p>;
}

/** Предпросмотр — только владельцу, пока раздел скрыт или закрыт. */
export function PreviewBanner({ locale }: { locale: Locale }) {
  const t = restaurantText(locale);
  return (
    <Notice>
      {t.hiddenPreview}{" "}
      <a href={`/api/restaurant/preview?off=1&l=${locale}`} className="font-semibold underline underline-offset-2">
        {t.previewExit}
      </a>
    </Notice>
  );
}
