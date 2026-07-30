import { ButtonLink } from "@/components/ui/ButtonLink";
import { priceList, dayUseInfo, includedPerks, whatToBring } from "@/content/pricing";
import { EXELY_ROOM_TYPE } from "@/content/rooms";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";

type PriceListProps = {
  locale: Locale;
};

function formatPrice(value: number): string {
  return value.toLocaleString("ru-RU").replaceAll(",", " ");
}

/**
 * Positioned as the alternative to a stay, not as the headline offer — this
 * section used to sit second on the homepage and open with "Дневной отдых в
 * горах" in hero type. The prices are unchanged and still real; only the frame
 * around them moved.
 */
const copy = {
  ru: {
    eyebrow: "Без ночёвки",
    titleA: "Приехать",
    titleB: "на день",
    lead: "Не готовы остаться на ночь — приезжайте на день. Топчан с курпачами, мангал, казан и готовое меню от кухни. Фиксированный прайс, без брони проживания.",
    legend: "будни → выходные",
    altNote: "Будни: Пн–Чт · Выходные: Пт–Вс · Цены в сумах · Дневной визит 08:00–18:00",
    includedTitle: "Что входит",
    bringTitle: "Что взять с собой",
    cta: "Забронировать день",
    stayLink: "Хотите остаться на ночь? Шале и глэмпинг",
    photoNote: "Топчан № 12 — июнь 2026",
  },
  uz: {
    eyebrow: "Tunamasdan",
    titleA: "Bir kunga",
    titleB: "kelish",
    lead: "Tunab qolishga tayyor bo'lmasangiz — bir kunga keling. Kurpachali topchan, mangal, qozon va oshxonadan tayyor menyu. Narx fiksirlangan, yashash broni shart emas.",
    legend: "hafta kunlari → dam olish",
    altNote: "Hafta kunlari: Du–Pay · Dam olish: Ju–Yak · Narxlar so'mda · Kunlik tashrif 08:00–18:00",
    includedTitle: "Nima kiradi",
    bringTitle: "O'zingiz bilan oling",
    cta: "Kunni bron qilish",
    stayLink: "Tunab qolmoqchimisiz? Shale va glemping",
    photoNote: "12-topchan — iyun 2026",
  },
  en: {
    eyebrow: "No overnight stay",
    titleA: "Come for",
    titleB: "the day",
    lead: "Not ready to stay the night? Come for the day instead. A topchan with cushions, BBQ grill, kazan, and a ready-made kitchen menu — fixed prices, no room booking needed.",
    legend: "weekdays → weekends",
    altNote: "Weekdays: Mon–Thu · Weekends: Fri–Sun · Prices in UZS · Day visits 08:00–18:00",
    includedTitle: "What's included",
    bringTitle: "What to bring",
    cta: "Book a day visit",
    stayLink: "Want to stay the night? Chalets and glamping",
    photoNote: "Topchan no. 12 — June 2026",
  },
} as const;

/** Subtle topographic contour lines — the brand's mountain motif. */
function TopoLines() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 top-0 h-full w-[55%] opacity-[0.55]"
      viewBox="0 0 600 800"
      fill="none"
      preserveAspectRatio="xMaxYMid slice"
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M ${80 + i * 56} 0
              C ${40 + i * 56} 160, ${150 + i * 56} 240, ${110 + i * 56} 400
              S ${30 + i * 56} 620, ${90 + i * 56} 800`}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function PriceList({ locale }: PriceListProps) {
  const dict = dictionaries[locale];
  const t = copy[locale];
  const currency = text(dayUseInfo.currencyShort, locale);

  return (
    <section id="day-visit" className="relative overflow-hidden bg-[var(--paper)] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <TopoLines />

      <div className="relative mx-auto max-w-6xl">
        {/* Header — one size down from the stay section's headline, and the
            title sits on one line rather than stacked, so this reads as the
            secondary offer it is. */}
        <div className="mb-12 motion-reveal">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            <span>{t.eyebrow}</span>
            <span className="h-px w-10 bg-[var(--accent-strong)]/40" />
            <span className="text-[var(--muted)]">
              {dayUseInfo.altitude} · {dayUseInfo.hours}
            </span>
          </div>
          <h2 className="motion-reveal-mask mt-4 font-serif text-[clamp(1.9rem,4.2vw,3rem)] font-semibold leading-[1.05] text-[var(--ink)]">
            {t.titleA} <em className="text-[var(--ink)]/75">{t.titleB}</em>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">{t.lead}</p>
          {/* Way back up to the primary product for anyone who landed here first */}
          <a
            href="#stay"
            className="group mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--forest-dark)] transition-colors hover:text-[var(--accent-strong)]"
          >
            {t.stayLink}
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Split: sticky photo + menu */}
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Photo column */}
          <div className="motion-reveal" data-delay="100">
            <div className="lg:sticky lg:top-28">
              <figure className="img-reveal-wrapper relative overflow-hidden rounded-[4px]">
                <div
                  className="aspect-[4/5] bg-cover bg-center transition-transform duration-[1.6s] ease-out hover:scale-[1.05]"
                  style={imageStyle(resortImages.galTopchanInside)}
                  role="img"
                  aria-label={text(resortImages.galTopchanInside.alt, locale)}
                />
                {/* Altitude stamp */}
                <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/25 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  {text(dayUseInfo.altitudeShort, locale)}
                </div>
                <figcaption className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {t.photoNote}
                </figcaption>
              </figure>

              {/* Included perks under the photo */}
              <div className="mt-8 border-t-2 border-[var(--ink)] pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  {t.includedTitle}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {includedPerks.map((perk) => (
                    <li key={text(perk, "ru")} className="flex items-start gap-3 text-sm leading-6 text-[var(--ink)]">
                      <span aria-hidden className="mt-2 inline-block h-1 w-3 shrink-0 bg-[var(--green)]" />
                      <span>{text(perk, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Menu column — dotted leaders, lodge-menu typography */}
          <div className="motion-reveal" data-delay="150">
            <div className="flex items-baseline justify-between border-b-2 border-[var(--ink)] pb-3">
              <span className="font-serif text-lg font-semibold italic text-[var(--ink)]">Menu</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {t.legend}
              </span>
            </div>

            <ul>
              {priceList.map((item, i) => {
                const sameBothDays = item.weekend === item.weekday;
                return (
                  <li
                    key={item.key}
                    // Rows arrive one after another as the menu scrolls in.
                    // Inline delay because the shared CSS ladder only covers a
                    // handful of fixed steps and this list is price-driven.
                    // No `transition-colors` here: .motion-reveal owns
                    // transition-property on this element, so the utility would
                    // be overridden anyway and only muddy the intent.
                    className="motion-reveal group border-b border-dashed border-[color:var(--line-strong)] py-5 hover:bg-[var(--surface)]/60"
                    style={{ transitionDelay: `${Math.min(i, 8) * 70}ms` }}
                  >
                    <div className="flex items-baseline gap-2">
                      {/* Index */}
                      <span className="w-7 shrink-0 font-serif text-sm italic text-[var(--muted)]/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {/* Title */}
                      <div className="min-w-0">
                        <p className="font-serif text-xl font-semibold leading-snug text-[var(--ink)] sm:text-2xl">
                          {text(item.title, locale)}
                        </p>
                        {item.subtitle && (
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{text(item.subtitle, locale)}</p>
                        )}
                      </div>
                      {/* Dotted leader */}
                      <span
                        aria-hidden
                        className="mx-2 flex-1 self-center border-b-2 border-dotted border-[color:var(--line-strong)] opacity-70"
                      />
                      {/* Prices */}
                      <div className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
                        <span className="font-serif text-lg font-semibold tabular-nums text-[var(--ink)] sm:text-xl">
                          {formatPrice(item.weekday)}
                        </span>
                        {!sameBothDays && (
                          <>
                            <span aria-hidden className="text-[var(--muted)]/50">→</span>
                            <span className="font-serif text-lg font-semibold italic tabular-nums text-[var(--accent-strong)] sm:text-xl">
                              {formatPrice(item.weekend)}
                            </span>
                          </>
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                          {currency}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-xs leading-6 text-[var(--muted)]">* {t.altNote}</p>

            {/* What to bring — dark slab, ALWAYS dark via --mountain */}
            <div className="mt-10 rounded-[4px] bg-[var(--mountain)] p-7 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">
                {t.bringTitle}
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {whatToBring.map((item) => (
                  <li key={text(item, "ru")} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                    <span aria-hidden className="mt-2 inline-block h-1 w-3 shrink-0 bg-[var(--sun)]" />
                    <span>{text(item, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {/* Opens the booking engine straight on the day-visit room type
                  instead of the default (a stay), which is what /bron shows. */}
              <ButtonLink
                href={localizePath(locale, `/bron?room-type=${EXELY_ROOM_TYPE.day}`)}
                variant="primary"
                reload
                className="btn-press"
              >
                {t.cta}
              </ButtonLink>
              <p className="text-sm text-[var(--muted)]">
                {locale === "ru"
                  ? "Перезвоним и подтвердим бронь топчана в ближайшее время"
                  : locale === "uz"
                    ? "Tez orada qayta qo'ng'iroq qilamiz va topchan bronini tasdiqlaymiz"
                    : "We'll call back and confirm your topchan reservation shortly"}
              </p>
              <span className="ml-auto font-serif text-sm italic text-[var(--muted)]">
                {dict.from} 30 000 {currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
