import { ButtonLink } from "@/components/ui/ButtonLink";
import { priceList, dayUseInfo, includedPerks, whatToBring } from "@/content/pricing";
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

const copy = {
  ru: {
    eyebrow: "Прайс-лист",
    titleA: "Дневной отдых",
    titleB: "в горах",
    lead: "Топчан с курпачами, мангал, казан и место у костра — выбирайте формат и проводите день в горах. Можно с готовым меню от кухни или со своими продуктами.",
    legend: "будни → выходные",
    altNote: "Будни: Пн–Чт · Выходные: Пт–Вс · Цены в сумах",
    includedTitle: "Что входит",
    bringTitle: "Что взять с собой",
    cta: "Забронировать дату",
    photoNote: "Топчан № 12 — июнь 2026",
  },
  uz: {
    eyebrow: "Narxlar",
    titleA: "Tog'larda",
    titleB: "kunlik dam",
    lead: "Kurpachali topchan, mangal, qozon va gulxan joyi — formatni tanlang va kunni tog'larda o'tkazing. Oshxonadan tayyor menyu yoki o'z mahsulotlaringiz bilan.",
    legend: "hafta kunlari → dam olish",
    altNote: "Hafta kunlari: Du–Pay · Dam olish: Ju–Yak · Narxlar so'mda",
    includedTitle: "Nima kiradi",
    bringTitle: "O'zingiz bilan oling",
    cta: "Sanani bron qilish",
    photoNote: "12-topchan — iyun 2026",
  },
  en: {
    eyebrow: "Price list",
    titleA: "A day out",
    titleB: "in the mountains",
    lead: "Topchan with cushions, BBQ grill, kazan, and a fire spot — pick your setup and spend the day in the mountains. Order from our menu or bring your own.",
    legend: "weekdays → weekends",
    altNote: "Weekdays: Mon–Thu · Weekends: Fri–Sun · Prices in UZS",
    includedTitle: "What's included",
    bringTitle: "What to bring",
    cta: "Book your date",
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
    <section className="relative overflow-hidden bg-[var(--paper)] px-4 py-20 sm:py-28 sm:px-6 lg:px-8">
      <TopoLines />

      <div className="relative mx-auto max-w-6xl">
        {/* Header — editorial, two-tone title */}
        <div className="mb-14 motion-reveal">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            <span>{t.eyebrow}</span>
            <span className="h-px w-10 bg-[var(--accent-strong)]/40" />
            <span className="text-[var(--muted)]">
              {dayUseInfo.altitude} · {dayUseInfo.hours}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1.02] text-[var(--ink)]">
            {t.titleA}
            <br />
            <em className="text-[var(--accent-strong)]">{t.titleB}</em>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{t.lead}</p>
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
                    className="group border-b border-dashed border-[color:var(--line-strong)] py-5 transition-colors hover:bg-[var(--surface)]/60"
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
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload className="btn-press">
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
