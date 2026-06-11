import { ButtonLink } from "@/components/ui/ButtonLink";
import { priceList, dayUseInfo, includedPerks, whatToBring } from "@/content/pricing";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
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
    title: "Дневной отдых в горах",
    lead: "Топчан с курпачами, мангал, казан и место у костра — выбирайте формат и проводите день в горах. Можно с готовым меню от кухни или со своими продуктами.",
    item: "Услуга",
    altNote: "Цены указаны в сумах. Будни: Пн–Чт. Выходные: Пт–Вс.",
    includedTitle: "Что входит",
    bringTitle: "Что взять с собой",
    cta: "Оставить заявку на дату",
  },
  uz: {
    eyebrow: "Narxlar",
    title: "Tog'larda kunlik dam",
    lead: "Kurpachali topchan, mangal, qozon va gulxan joyi — formatni tanlang va kunni tog'larda o'tkazing. Oshxonadan tayyor menyu yoki o'z mahsulotlaringiz bilan.",
    item: "Xizmat",
    altNote: "Narxlar so'mda. Hafta kunlari: Dushanba–Payshanba. Dam olish kunlari: Juma–Yakshanba.",
    includedTitle: "Nima kiradi",
    bringTitle: "O'zingiz bilan oling",
    cta: "Sanaga so'rov qoldirish",
  },
  en: {
    eyebrow: "Price list",
    title: "A day out in the mountains",
    lead: "Topchan with cushions, BBQ grill, kazan, and a fire spot — pick your setup and spend the day in the mountains. Order from our menu or bring your own.",
    item: "Service",
    altNote: "Prices in UZS. Weekdays: Mon–Thu. Weekends: Fri–Sun.",
    includedTitle: "What's included",
    bringTitle: "What to bring",
    cta: "Request your date",
  },
} as const;

export function PriceList({ locale }: PriceListProps) {
  const dict = dictionaries[locale];
  const t = copy[locale];
  const currency = text(dayUseInfo.currencyShort, locale);
  const weekdaysLabel = text(dayUseInfo.weekdaysLabel, locale);
  const weekendLabel = text(dayUseInfo.weekendLabel, locale);

  return (
    <section className="relative overflow-hidden bg-[var(--paper)] px-4 py-20 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Eyebrow */}
        <div className="mb-12 flex flex-col items-start gap-4 motion-reveal">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            <span>{t.eyebrow}</span>
            <span className="h-px w-8 bg-[var(--accent-strong)]/40" />
            <span className="text-[var(--muted)]">
              {dayUseInfo.altitude} · {dayUseInfo.hours}
            </span>
          </div>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {t.title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">{t.lead}</p>
        </div>

        {/* Price table card */}
        <div className="overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] motion-reveal" data-delay="100">
          {/* Header row */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-b border-[color:var(--line)] bg-[var(--paper)] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:px-8">
            <span>{t.item}</span>
            <span className="text-right">{weekdaysLabel}</span>
            <span className="text-right">{weekendLabel}</span>
          </div>

          {/* Rows */}
          <ul className="divide-y divide-[color:var(--line)]">
            {priceList.map((item) => (
              <li
                key={item.key}
                className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 px-5 py-4 transition-colors hover:bg-[var(--paper)] sm:px-8 sm:py-5"
              >
                <div>
                  <p className="font-serif text-lg font-semibold text-[var(--ink)] sm:text-xl">
                    {text(item.title, locale)}
                  </p>
                  {item.subtitle && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{text(item.subtitle, locale)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-serif text-base font-semibold tabular-nums text-[var(--ink)] sm:text-lg">
                    {formatPrice(item.weekday)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{currency}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-serif text-base font-semibold tabular-nums sm:text-lg ${
                      item.weekend > item.weekday ? "text-[var(--accent-strong)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {formatPrice(item.weekend)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{currency}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Footnote */}
          <p className="border-t border-[color:var(--line)] bg-[var(--paper)] px-5 py-4 text-xs text-[var(--muted)] sm:px-8">
            * {t.altNote}
          </p>
        </div>

        {/* Two-column extras */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* What's included */}
          <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-card)] motion-reveal" data-delay="120">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              {t.includedTitle}
            </p>
            <ul className="mt-5 space-y-3">
              {includedPerks.map((perk) => (
                <li key={text(perk, "ru")} className="flex items-start gap-3 text-sm leading-6 text-[var(--ink)]">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]"
                  />
                  <span>{text(perk, locale)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What to bring — bg uses --mountain (dark in BOTH seasons; --ink
              flips light in winter and made white text invisible) */}
          <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--mountain)] p-7 text-white shadow-[var(--shadow-card)] motion-reveal" data-delay="160">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">
              {t.bringTitle}
            </p>
            <ul className="mt-5 space-y-3">
              {whatToBring.map((item) => (
                <li key={text(item, "ru")} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sun)]"
                  />
                  <span>{text(item, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap items-center gap-4 motion-reveal" data-delay="200">
          <ButtonLink href={localizePath(locale, "/bron")} variant="primary" className="btn-press">
            {t.cta}
          </ButtonLink>
          <p className="text-sm text-[var(--muted)]">
            {locale === "ru"
              ? "Перезвоним и подтвердим бронь топчана в ближайшее время"
              : locale === "uz"
                ? "Tez orada qayta qo'ng'iroq qilamiz va topchan bronini tasdiqlaymiz"
                : "We'll call back and confirm your topchan reservation shortly"}
          </p>
          <span className="ml-auto text-xs text-[var(--muted)]">
            {dict.from} 30 000 {currency}
          </span>
        </div>
      </div>
    </section>
  );
}
