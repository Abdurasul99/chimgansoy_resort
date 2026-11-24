import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import { priceLabels } from "@/content/pricing";
import { localizePortion } from "@/lib/restaurant/portion";
import { money } from "@/lib/tariff";
import type { Dish } from "@/lib/restaurant/model";
import { pickText } from "@/lib/restaurant/rules";

/**
 * «С нашей кухни» — блюда, у которых в меню есть фото. Набор не задан в коде:
 * ресторан добавляет фото блюду в админке — и оно появляется здесь. Нет ни
 * одного фото — блока нет.
 */
export function SignatureDishes({ dishes, locale }: { dishes: Dish[]; locale: Locale }) {
  const t = restaurantText(locale);
  const currency = priceLabels.currencyShort[locale];
  const withPhoto = dishes.filter((d) => d.state === "published" && d.image).slice(0, 8);
  if (withPhoto.length === 0) return null;

  return (
    <section aria-labelledby="signature-title" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <h2 id="signature-title" className="font-serif text-4xl font-semibold italic text-[var(--sz-snow)] sm:text-5xl">
        {t.look.signature}
      </h2>
      <ul className="rest-chips -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {withPhoto.map((d) => {
          const title = pickText(d.title, locale);
          return (
            <li key={d.id} className="w-[72vw] max-w-[19rem] shrink-0 snap-start lg:w-auto lg:max-w-none">
              <figure className="group relative overflow-hidden rounded-[1.6rem] bg-[var(--sz-walnut-2)] ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt={title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-16">
                  <p className="font-serif text-[1.75rem] font-semibold italic leading-tight text-white">{title}</p>
                  <p className="mt-1 text-[15px] font-semibold tabular-nums text-[var(--sz-lamp)]">
                    {money(d.price)} {currency}
                    {d.portion && <span className="ml-2 font-normal text-white/70">{localizePortion(d.portion, locale)}</span>}
                  </p>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
