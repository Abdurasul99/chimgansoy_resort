import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { getRestaurantSettings } from "@/lib/restaurant/live";
import { heroImage } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { RestIcon } from "./RestIcon";

/**
 * Врезка «Ресторан» на страницах сайта комплекса — там, где гость ищет еду
 * (страница «Кухня и меню»). Показывается, только когда раздел открыт или в
 * анонсе: скрытый ресторан ссылкой не выдаём. Вид — карточка заведения из
 * приложения доставки: фото, название, одна кнопка.
 */
export async function RestaurantTeaser({ locale }: { locale: Locale }) {
  const settings = await getRestaurantSettings();
  const t = restaurantText(locale);
  const name = pickText(settings.name, locale);
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={localizePath(locale, "/restaurant")}
        prefetch={false}
        className="group mx-auto flex max-w-7xl items-center gap-4 rounded-3xl bg-[#f6f5f2] p-3 pr-5 transition-colors hover:bg-[#efede9] sm:gap-6"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage(settings)} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-32 sm:w-48" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#8c8c8c]">{t.eyebrow}</p>
          <p className="mt-0.5 truncate text-2xl font-bold text-[#1c1c1c]">{name}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[#6b6b6b]">{t.actions.menu.text}</p>
        </div>
        <span className="hidden h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#f4a52a] px-5 text-sm font-bold text-[#3b2a0a] sm:inline-flex">
          {t.actions.menu.title}
          <RestIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </section>
  );
}
