import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { restaurantText } from "@/content/restaurant";
import { getRestaurantSettings } from "@/lib/restaurant/live";
import { pickText } from "@/lib/restaurant/rules";
import { Embers, IkatBand } from "./Ornaments";
import { RestIcon } from "./RestIcon";

/**
 * Врезка «Ресторан» на страницах сайта комплекса — там, где гость ищет еду
 * (страница «Кухня и меню»). Показывается, только когда раздел открыт или в
 * анонсе: скрытый ресторан ссылкой не выдаём.
 */
export async function RestaurantTeaser({ locale }: { locale: Locale }) {
  const settings = await getRestaurantSettings();
  const t = restaurantText(locale);
  const name = pickText(settings.name, locale);
  return (
    <section className="rest px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={localizePath(locale, "/restaurant")}
        prefetch={false}
        className="group relative mx-auto block max-w-7xl overflow-hidden rounded-[2rem] bg-[#140f0c] text-white shadow-[0_30px_70px_-35px_rgba(214,53,43,0.8)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_85%_100%,rgba(255,106,43,0.5),transparent_65%)]" />
        <Embers count={12} />
        <div className="relative flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#ffc46b]">{t.eyebrow}</p>
            <p className="mt-2 font-serif text-5xl font-bold italic leading-none">
              <span className="rest-flame-text">{name}</span>
            </p>
            <p className="mt-3 max-w-xl text-white/75">{t.actions.menu.text}</p>
          </div>
          <span className="inline-flex h-14 shrink-0 items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#ffa53d] via-[#ff6a2b] to-[#d6352b] px-7 font-extrabold sm:self-auto">
            {t.actions.menu.title}
            <RestIcon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        <IkatBand height={14} animated />
      </Link>
    </section>
  );
}
