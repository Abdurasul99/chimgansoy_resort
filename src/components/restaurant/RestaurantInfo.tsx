import type { Locale } from "@/i18n/config";
import { restaurantText } from "@/content/restaurant";
import {
  SAZANCHIK_DELIVERY_PHONE,
  SAZANCHIK_EXTENSION,
  SAZANCHIK_INSTAGRAM,
  SAZANCHIK_INSTAGRAM_HANDLE,
  TAKEAWAY_FRAMES,
  storyAlt,
} from "@/content/restaurant-media";
import { MountainLine } from "./MountainLine";
import { RestIcon } from "./RestIcon";

function tel(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Еда с собой и как связаться — после меню, где гость уже выбрал.
 *
 * Слова — из Instagram ресторана («приготовим, аккуратно упакуем и передадим
 * через окно выдачи»), номера — из его меню. Заказа на сайте нет: только
 * телефон.
 */
export function RestaurantInfo({ locale, about, instagram }: { locale: Locale; about: string; instagram: string }) {
  const t = restaurantText(locale);
  const ig = instagram || SAZANCHIK_INSTAGRAM;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-[var(--sz-walnut-2)] ring-1 ring-white/10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid h-full grid-cols-2 gap-1.5">
          {TAKEAWAY_FRAMES.map((fr) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={fr.src} src={fr.src} alt={storyAlt(fr, locale)} loading="lazy" className="h-full min-h-[18rem] w-full object-cover" />
          ))}
        </div>

        <div className="px-6 pb-8 md:py-10 md:pr-10">
          <h2 className="font-serif text-4xl font-semibold italic leading-tight text-[var(--sz-snow)] sm:text-5xl">{t.look.takeawayTitle}</h2>
          <MountainLine className="mt-4 h-4 w-32 text-[var(--sz-lamp)]" />
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[var(--sz-snow)]/80">{t.look.takeawayText}</p>

          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-[13px] text-[var(--sz-stone)]">{t.look.delivery}</dt>
              <dd className="mt-1">
                <a href={tel(SAZANCHIK_DELIVERY_PHONE)} className="inline-flex items-center gap-2 text-xl font-semibold tabular-nums text-[var(--sz-lamp)] hover:underline hover:underline-offset-4">
                  <RestIcon name="phone" className="h-4 w-4" />
                  {SAZANCHIK_DELIVERY_PHONE}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--sz-stone)]">{t.look.extension}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--sz-snow)]">
                {SAZANCHIK_EXTENSION}
                <span className="ml-2 text-[13px] font-normal text-[var(--sz-stone)]">{t.look.extensionHint}</span>
              </dd>
            </div>
          </dl>

          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 py-2 pl-2 pr-5 transition-colors hover:border-[var(--sz-lamp)]"
          >
            <span className="sz-ring flex h-10 w-10 items-center justify-center rounded-full">
              <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[var(--sz-walnut-2)] text-[var(--sz-snow)]">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span className="text-left">
              <span className="block text-[13px] text-[var(--sz-stone)]">{t.look.follow}</span>
              <span className="block text-[15px] font-semibold text-[var(--sz-snow)]">{SAZANCHIK_INSTAGRAM_HANDLE}</span>
            </span>
          </a>

          {about && <p className="mt-8 border-t border-white/10 pt-6 text-[14px] leading-6 text-[var(--sz-stone)]">{about}</p>}
        </div>
      </div>
    </section>
  );
}
