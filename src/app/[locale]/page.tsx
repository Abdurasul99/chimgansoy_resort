import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { LeisureShowcase } from "@/components/sections/LeisureShowcase";
import { MasterPlan } from "@/components/sections/MasterPlan";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { Faq } from "@/components/sections/Faq";
import { MapBlock } from "@/components/sections/MapBlock";
import { PromoBand } from "@/components/sections/PromoBand";
import { TestimonialsCarousel } from "@/components/sections/TestimonialsCarousel";
import { PhotoMarquee } from "@/components/sections/PhotoMarquee";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { BentoGallery } from "@/components/sections/BentoGallery";
import { WeatherPanel } from "@/components/sections/WeatherPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { AnimatedStat } from "@/components/ui/AnimatedStat";
import { resortImages } from "@/content/images";
import { poolPricing } from "@/content/pricing";
import { homeShowcase } from "@/content/home-showcase";
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

// Resort numbers, not day-use numbers. "8 guests per topchan" and "10 hours
// open" used to sit here — both describe a venue you leave before dinner.
// Unit count comes from venueFacts(): 10 A-frames + 10 chalets.
const stats = [
  { value: "1700", label: { ru: "м над уровнем моря", uz: "m balandlikda", en: "m above sea level" } },
  { value: "20", label: { ru: "домиков на территории", uz: "hududdagi uychalar", en: "cabins on the grounds" } },
  { value: "6", label: { ru: "гектаров территории", uz: "gektar hudud", en: "hectares of grounds" } },
  { value: "45", label: { ru: "мин от Ташкента", uz: "min Toshkentdan", en: "min from Tashkent" } },
] as const;

/** Tariff line under the pool CTA, built from the single source in pricing.ts. */
const fmt = (n: number) => n.toLocaleString("ru-RU").replaceAll(",", " ");
const poolPriceLine: Record<string, string> = {
  ru: `Пн–Чт ${fmt(poolPricing.adult.weekday)} · Пт–Вс ${fmt(poolPricing.adult.weekend)} сум со взрослого · дети 5–15 вдвое дешевле`,
  uz: `Du–Pay ${fmt(poolPricing.adult.weekday)} · Ju–Yak ${fmt(poolPricing.adult.weekend)} so'm kattalar uchun · 5–15 yosh ikki barobar arzon`,
  en: `Mon–Thu ${fmt(poolPricing.adult.weekday)} · Fri–Sun ${fmt(poolPricing.adult.weekend)} UZS per adult · ages 5–15 half price`,
};

/** Band under the two stay cards. It ran photo-free at first because the pool
 *  frames were assumed to be a render of something unbuilt; they are in fact
 *  the operator's own visualisations of the pool that is sold today, so the
 *  band leads with one. Every pool image in the repo is CGI; the operator asked for the visible mark to come off. */
const poolBand = {
  ru: {
    label: "Бассейн",
    title: "Включён в проживание",
    copy: "Гостям шале и глэмпинга бассейн входит в стоимость. Можно забронировать и отдельно — на день, без ночёвки, до 4 гостей.",
    book: "Забронировать бассейн",
    cta: "Подробнее",
  },
  uz: {
    label: "Basseyn",
    title: "Yashash narxiga kiritilgan",
    copy: "Shale va glemping mehmonlari uchun basseyn narxga kiritilgan. Alohida ham bron qilish mumkin — bir kunga, tunamasdan, 4 mehmongacha.",
    book: "Basseynni bron qilish",
    cta: "Basseyn haqida",
  },
  en: {
    label: "The pool",
    title: "Included with every stay",
    copy: "Chalet and glamping guests get the pool as part of the rate. It can also be booked on its own — for the day, no overnight stay, up to 4 guests.",
    book: "Book the pool",
    cta: "About the pool",
  },
} as const;

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
        href="/images/resort/16-pool-day-lifestyle.jpg"
        fetchPriority="high"
      />

      {/* FAQ rich-result markup (the FAQ section renders lower on the page) */}
      <FaqJsonLd locale={locale} />

      {/* ── Hero ──────────────────────────────────────── */}
      <Hero locale={locale} />

      {/* ── Living photo strip — real 2026 shots ──────── */}
      <PhotoMarquee locale={locale} />

      {/* ── Stays — the primary product, first thing under the strip ──
          This slot used to hold the day-use price list. The site sells nights
          now: two stay formats, then the pool that comes with both. ── */}
      <section id="stay" className="bg-[var(--paper)] px-4 py-20 sm:py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="motion-reveal max-w-2xl">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                <span>{dict.home.stayEyebrow}</span>
                <span className="h-px w-10 bg-[var(--accent-strong)]/40" />
                <span className="text-[var(--muted)]">
                  {locale === "ru"
                    ? "заезд 14:00 · выезд 12:00"
                    : locale === "uz"
                      ? "kirish 14:00 · chiqish 12:00"
                      : "check-in 14:00 · check-out 12:00"}
                </span>
              </div>
              <h2 className="motion-reveal-mask mt-4 font-serif text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1.02] text-[var(--ink)]">
                {dict.home.roomsTitle}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--muted)]">{dict.home.roomsText}</p>
            </div>
            <ButtonLink
              href={localizePath(locale, "/nomera")}
              variant="ghost"
              className="lg:mb-1 btn-press motion-reveal"
              data-delay="100"
            >
              {dict.viewAll}
            </ButtonLink>
          </div>

          <RoomCatalog locale={locale} limit={2} />

          {/* Pool — the non-obvious inclusion, now with the frame to sell it */}
          <div
            className="motion-reveal mt-6 grid overflow-hidden rounded-3xl bg-[var(--mountain)] text-white lg:grid-cols-[1.05fr_1fr]"
            data-delay="120"
          >
            <figure className="relative order-first min-h-[240px] sm:min-h-[320px] lg:order-last lg:min-h-[380px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={imageStyle(resortImages.poolAerial)}
                role="img"
                aria-label={text(resortImages.poolAerial.alt, locale)}
              />
            </figure>

            <div className="p-7 sm:p-9 lg:self-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">
                {poolBand[locale].label}
              </p>
              <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                {poolBand[locale].title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">{poolBand[locale].copy}</p>
              {/* The band only linked to the pool's description page, so the
                  one thing bookable without an overnight stay had no way to be
                  booked from the homepage. `reload` forces a full navigation so
                  Exely's loader mounts on /bron and reads room-type from the
                  query — that is where the guest enters their details and gets
                  the confirmation e-mail. */}
              {/* Oversized on purpose. The pool is the only thing on this page
                  a guest can buy without booking a night, and it was previously
                  represented by a button the same size as everything else. */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={localizePath(locale, "/nomera/pool#pool-request")}
                  className="btn-press inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-8 py-5 text-lg font-extrabold text-[var(--on-accent)] shadow-[0_14px_34px_-10px_rgba(220,140,0,0.75)] transition-all duration-300 hover:brightness-[1.04] sm:text-xl"
                >
                  <svg aria-hidden className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 16c1.5 0 1.5 1.2 3 1.2S6.5 16 8 16s1.5 1.2 3 1.2S12.5 16 14 16s1.5 1.2 3 1.2S18.5 16 20 16M2 20c1.5 0 1.5 1.2 3 1.2S6.5 20 8 20s1.5 1.2 3 1.2S12.5 20 14 20s1.5 1.2 3 1.2S18.5 20 20 20M8 14V5a2 2 0 1 1 4 0M16 14V5a2 2 0 1 1 4 0" />
                  </svg>
                  {poolBand[locale].book}
                  <span aria-hidden className="text-2xl leading-none">→</span>
                </a>
                <a
                  href={localizePath(locale, "/nomera/pool")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {poolBand[locale].cta}
                </a>
              </div>

              {/* The tariff, so the button isn't a leap of faith */}
              <p className="mt-4 text-sm font-semibold text-white/60">
                {poolPriceLine[locale]}
              </p>
            </div>
          </div>
        </div>
      </section>

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
                <p className="motion-reveal-mask font-serif text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-none tracking-tight text-[var(--ink)]">
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
        {homeShowcase.slice(0, 2).map((item, index) => {
          const image = resortImages[item.image];
          const isEven = index % 2 === 0;
          return (
            <article
              key={item.image}
              className={`group relative flex items-end overflow-hidden ${
                index === 0 ? "min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh]" : "min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh]"
              }`}
            >
              {/* Bled 15% past the article on both edges so the parallax drift
                  never exposes a seam at the top or bottom of the frame. */}
              <div
                data-parallax="0.08"
                className="absolute -inset-y-[15%] inset-x-0 bg-cover bg-center transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
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
                  className={`mt-3 font-serif font-bold text-white motion-reveal-mask ${
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
                    {/* Went to /place (nearby attractions) while the copy above
                        it talks about the cabins — sends people to the rooms now. */}
                    <ButtonLink href={localizePath(locale, "/nomera")} variant="primary" className="btn-press">
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
              <h2 className="motion-reveal-mask display-md font-serif font-semibold text-[var(--ink)]">
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
              {/* The framed photo drifts; the two badges stay put — that speed
                  difference is what reads as depth. */}
              <div
                data-parallax="0.06"
                className="img-reveal-wrapper aspect-[4/5] overflow-hidden rounded-3xl shadow-[var(--shadow-card-hover)]"
              >
                {/* The grounds as they are today. This used to be the June
                    A-frame shot, which had the cabins as open shells — wrong
                    story for a section saying the place is 45 minutes away and
                    ready for you. That photo is gone from the repo now. */}
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-[1500ms] ease-out hover:scale-110"
                  style={imageStyle(resortImages.aframeLawn)}
                  role="img"
                  aria-label={text(resortImages.aframeLawn.alt, locale)}
                />
              </div>
              {/* Top-right floating badge — cream surface, brand text (Stitch style) */}
              <div className="editorial-badge absolute -right-6 -top-6 hidden lg:block">
                <p className="font-serif text-4xl font-bold leading-none text-[var(--forest-dark)]">45</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {locale === "ru" ? "мин от Ташкента" : locale === "uz" ? "min Toshkentdan" : "min from Tashkent"}
                </p>
              </div>
              {/* Bottom-left floating badge — forest green, white text (Stitch style).
                  Was "08–18 open hours", which is the day-visit window and read
                  as "we close before dinner" next to a stay-led headline. */}
              <div className="editorial-badge editorial-badge--accent absolute -bottom-6 -left-6 hidden lg:block">
                <p className="font-serif text-4xl font-bold leading-none">14:00</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {locale === "ru" ? "заезд · выезд 12:00" : locale === "uz" ? "kirish · chiqish 12:00" : "check-in · out 12:00"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Weather panel — live mountain conditions ──── */}
      <section className="py-10 sm:py-14">
        <WeatherPanel locale={locale} />
      </section>

      {/* ── На территории — three cards; the BBQ one is last in services[] and
             is deliberately cut here, staying on /services ── */}
      <LeisureShowcase locale={locale} limit={3} />

      {/* ── Master plan — honest renders of what's being built (not bookable) ─── */}
      <MasterPlan locale={locale} />

      {/* The day-use price list used to sit here (and before that, second on the
          page). Day visits are closed now, so the section and its component are
          gone; the retired topchan/entry prices are parked in
          content/pricing.ts as `retiredDayUse` if the format ever comes back. */}

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
        </div>
      </section>

      {/* ── Emotion photo strip ───────────────────────── */}
      <section className="overflow-hidden bg-[var(--surface)] py-2">
        <div
          data-lenis-prevent-touch
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none lg:grid lg:grid-cols-5 lg:overflow-visible"
        >
          {/* An overnight in five frames: arrive, wake up, morning on the
              terrace, evening at the grill, kids. Two topchan/serving shots
              used to open this strip — they told a day-trip story. */}
          {([
            { image: "aframeLawnTall", caption: locale === "uz" ? "Uycha oldidagi ilk foto" : locale === "en" ? "First photo by the cabin" : "Первое фото\nу домика" },
            { image: "chaletBedroomDouble", caption: locale === "uz" ? "Tog'larda uyg'onish" : locale === "en" ? "Waking up in the mountains" : "Просыпаться\nв горах" },
            { image: "aframeTerraceView", caption: locale === "uz" ? "Terrasadagi tong" : locale === "en" ? "Morning on the terrace" : "Утро\nна террасе" },
            { image: "chaletLounge", caption: locale === "uz" ? "Shaledagi kecha" : locale === "en" ? "An evening in the chalet" : "Вечер\nв шале" },
            // Was galKidsSwing — a stranger sitting on a swing looking at his
            // phone, which is not a picture of anything we sell.
            { image: "chaletBedroomTwin", caption: locale === "uz" ? "Bolalarga —\no'z xonasi" : locale === "en" ? "A room of\ntheir own" : "Детям —\nсвоя комната" },
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
