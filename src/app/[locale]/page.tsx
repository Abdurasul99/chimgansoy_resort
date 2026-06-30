import type { Metadata } from "next";
import { WeatherPanel } from "@/components/sections/WeatherPanel";
import { Hero } from "@/components/sections/Hero";
import { LeisureShowcase } from "@/components/sections/LeisureShowcase";
import { PoolBooking } from "@/components/sections/PoolBooking";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { Faq } from "@/components/sections/Faq";
import { Gallery } from "@/components/sections/Gallery";
import { MapBlock } from "@/components/sections/MapBlock";
import { PromoBand } from "@/components/sections/PromoBand";
import { TestimonialsCarousel } from "@/components/sections/TestimonialsCarousel";
import { PhotoMarquee } from "@/components/sections/PhotoMarquee";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { BentoGallery } from "@/components/sections/BentoGallery";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { AnimatedStat } from "@/components/ui/AnimatedStat";
import { PriceList } from "@/components/sections/PriceList";
import { resortImages } from "@/content/images";
import { homeShowcase } from "@/content/home-showcase";
import { promotions } from "@/content/promotions";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.home, "/");
}

const stats = [
  { value: "1700", label: { ru: "м над уровнем моря", uz: "m balandlikda", en: "m above sea level" } },
  { value: "8", label: { ru: "гостей на топчан", uz: "kishi topchan uchun", en: "guests per topchan" } },
  { value: "10", label: { ru: "часов открыты", uz: "soat ochiq", en: "hours open" } },
  { value: "45", label: { ru: "мин от Ташкента", uz: "min Toshkentdan", en: "min from Tashkent" } },
] as const;

export default async function HomePage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      {/* Preload the first hero photo at high priority so it paints fast (LCP)
          and the dark hero base shows for as little time as possible.
          (React 19 hoists this <link> into <head>.) */}
      <link
        rel="preload"
        as="image"
        href="/images/resort/gallery/gal-territory-panorama.jpg"
        fetchPriority="high"
      />

      {/* FAQ rich-result markup (the FAQ section renders lower on the page) */}
      <FaqJsonLd locale={locale} />

      {/* ── Hero ──────────────────────────────────────── */}
      <Hero locale={locale} />

      {/* ── Living photo strip — real June 2026 shots ─── */}
      <PhotoMarquee locale={locale} />

      {/* ── Price list (day-use) — primary value prop ─── */}
      <PriceList locale={locale} />

      {/* ── Numbers band — editorial oversized numerals ── */}
      <section className="bg-[var(--surface-warm)] border-y border-[var(--line)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid divide-y divide-[color:var(--line)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {stats.map((stat, i) => (
              <div
                key={stat.value}
                className="motion-reveal flex flex-col gap-2 py-6 sm:py-2 lg:px-8 lg:first:pl-0 lg:last:pr-0"
                data-delay={String(i * 80)}
              >
                <span className="font-serif text-sm italic text-[var(--muted)]/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-serif text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-none tracking-tight text-[var(--ink)]">
                  <AnimatedStat value={parseInt(stat.value)} />
                </p>
                <p className="max-w-[12rem] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {stat.label[locale as keyof typeof stat.label] ?? stat.label.ru}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial showcase ────────────────────────── */}
      <section className="overflow-hidden bg-[var(--ink)]" aria-label="Showcase">
        {homeShowcase.map((item, index) => {
          const image = resortImages[item.image];
          const isEven = index % 2 === 0;
          return (
            <article
              key={item.image}
              className={`group relative flex items-end overflow-hidden ${
                index === 0 ? "min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh]" : "min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh]"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                style={imageStyle(image)}
                role="img"
                aria-label={text(image.alt, locale)}
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.92)_0%,rgba(12,18,14,0.40)_50%,rgba(12,18,14,0.08)_100%)]" />
              {index > 0 && (
                <div className={`absolute inset-0 ${isEven ? "bg-[linear-gradient(90deg,rgba(12,18,14,0.70)_0%,transparent_60%)]" : "bg-[linear-gradient(270deg,rgba(12,18,14,0.70)_0%,transparent_60%)]"}`} />
              )}

              <div className={`relative mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:pb-20 lg:px-8 ${!isEven && index > 0 ? "text-right" : ""}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">CHIMGAN DARBAZA</p>
                <h2
                  className={`mt-3 font-serif font-bold text-white motion-reveal ${
                    index === 0 ? "display-lg max-w-4xl" : "text-2xl max-w-2xl sm:text-4xl lg:text-5xl"
                  } ${!isEven && index > 0 ? "ml-auto" : ""}`}
                >
                  {text(item.title, locale)}
                </h2>
                {index === 0 && (
                  <p className="mt-4 max-w-lg text-base leading-7 text-white/60 motion-reveal" data-delay="100">
                    {text(item.copy, locale)}
                  </p>
                )}
                {index === 0 && (
                  <div className="mt-8 motion-reveal" data-delay="200">
                    <ButtonLink href={localizePath(locale, "/place")} variant="primary" className="btn-press">
                      {dict.viewAll}
                    </ButtonLink>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* ── About — editorial split ───────────────────── */}
      <section className="overflow-hidden bg-[var(--paper)] px-4 py-14 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">

            <div className="motion-reveal">
              <p className="mb-4 font-serif text-[clamp(5rem,12vw,9rem)] font-bold leading-none text-[var(--surface)]" aria-hidden="true">01</p>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
              <h2 className="display-md font-serif font-semibold text-[var(--ink)]">
                {dict.home.aboutTitle}
              </h2>
              <p className="mt-6 text-base leading-8 text-[var(--muted)]">{dict.home.aboutText}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={localizePath(locale, "/about")} variant="secondary" className="btn-press">
                  {dict.details}
                </ButtonLink>
                <ButtonLink href={localizePath(locale, "/place")} variant="ghost" className="btn-press">
                  {dict.viewAll}
                </ButtonLink>
              </div>
            </div>

            <div className="relative motion-reveal" data-delay="150">
              <div className="img-reveal-wrapper aspect-[4/5] overflow-hidden rounded-3xl shadow-[var(--shadow-card-hover)]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-[1500ms] ease-out hover:scale-110"
                  style={imageStyle(resortImages.glampingDay)}
                  role="img"
                  aria-label={text(resortImages.glampingDay.alt, locale)}
                />
              </div>
              {/* Top-right floating badge — cream surface, brand text (Stitch style) */}
              <div className="editorial-badge absolute -right-6 -top-6 hidden lg:block">
                <p className="font-serif text-4xl font-bold leading-none text-[var(--forest-dark)]">45</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {locale === "ru" ? "мин от Ташкента" : locale === "uz" ? "min Toshkentdan" : "min from Tashkent"}
                </p>
              </div>
              {/* Bottom-left floating badge — forest green, white text (Stitch style) */}
              <div className="editorial-badge editorial-badge--accent absolute -bottom-6 -left-6 hidden lg:block">
                <p className="font-serif text-4xl font-bold leading-none">08–18</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {locale === "ru" ? "часы работы" : locale === "uz" ? "ish vaqti" : "open hours"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Weather panel ─────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <WeatherPanel locale={locale} />
      </section>


      {/* ── Rooms — glamping + cottage, bookable ──────── */}
      <section className="bg-[var(--surface)] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="motion-reveal">
              <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
            </div>
            <ButtonLink href={localizePath(locale, "/nomera")} variant="ghost" className="lg:mb-1 btn-press motion-reveal" data-delay="100">
              {dict.viewAll}
            </ButtonLink>
          </div>
          <RoomCatalog locale={locale} limit={2} />
        </div>
      </section>

      {/* ── Pool — dedicated bookable amenity (Exely) ─── */}
      <PoolBooking locale={locale} />

      {/* ── Развлечения и отдых — brand-styled leisure showcase ── */}
      <LeisureShowcase locale={locale} />

      {/* ── Year-round ────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--surface)] px-4 py-24 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-8"
          style={imageStyle(resortImages.territoryAerial)}
          role="presentation"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="motion-reveal">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">CHIMGAN DARBAZA</p>
              <h2 className="display-md mt-4 font-serif font-semibold leading-tight text-[var(--ink)]">{dict.home.yearRoundTitle}</h2>
              <p className="mt-6 text-base leading-8 text-[var(--muted)]">{dict.home.yearRoundText}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {promotions.slice(0, 4).map((promo, i) => (
                <div
                  key={text(promo.badge, locale)}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)] transition-all duration-500 hover:shadow-[var(--shadow-card-hover)] motion-reveal"
                  data-delay={String(i * 80)}
                >
                  <span className="inline-block rounded-full bg-[var(--sun)]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--sun-dark)]">
                    {text(promo.badge, locale)}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-[var(--ink)]">{text(promo.title, locale)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text(promo.description, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews — cinematic carousel ──────────────── */}
      <TestimonialsCarousel locale={locale} />

      {/* ── Gallery ───────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-14 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="motion-reveal">
            <SectionHeader title={dict.home.galleryTitle} align="center" italic />
          </div>
          {/* Bento mosaic — curated real photos with hover captions */}
          <div className="mt-10 motion-reveal" data-delay="100">
            <BentoGallery locale={locale} />
          </div>
          <div className="mt-10">
            <Gallery locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Emotion photo strip ───────────────────────── */}
      <section className="overflow-hidden bg-[var(--surface)] py-2">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none lg:grid lg:grid-cols-5 lg:overflow-visible">
          {([
            { image: "galKidsSwing", caption: locale === "uz" ? "Bolalar balandroq kuladi" : locale === "en" ? "Kids laugh louder here" : "Дети смеются\nгромче" },
            { image: "galMangalFire", caption: locale === "uz" ? "Mangal oldida kecha" : locale === "en" ? "Evening by the grill" : "Вечер\nу мангала" },
            { image: "glampingDay", caption: locale === "uz" ? "Uycha oldidagi ilk foto" : locale === "en" ? "First photo by the cabin" : "Первое фото\nу домика" },
            { image: "cottage", caption: locale === "uz" ? "Ikkalamiz uchun sunset" : locale === "en" ? "A sunset for two" : "Закат\nна двоих" },
            { image: "entranceNight", caption: locale === "uz" ? "Kompaniya bilan keldik" : locale === "en" ? "Arrived with friends" : "Приехали\nкомпанией" },
          ] as const).map(({ image, caption }) => {
            const img = resortImages[image];
            return (
              <div
                key={image}
                className="relative aspect-[3/4] w-[72vw] flex-none snap-center overflow-hidden lg:w-auto"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.04]"
                  style={imageStyle(img)}
                  role="img"
                  aria-label={text(img.alt, locale)}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.88)_0%,rgba(12,18,14,0.15)_55%,transparent_100%)]" />
                <p className="absolute bottom-5 left-5 right-3 font-serif text-base font-semibold italic leading-snug text-white/90 whitespace-pre-line">
                  {caption}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Promo band ────────────────────────────────── */}
      <PromoBand locale={locale} />

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div className="motion-reveal">
              <SectionHeader title={dict.home.faqTitle} />
            </div>
            <Faq locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Map ───────────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <MapBlock locale={locale} />
        </div>
      </section>
    </>
  );
}
