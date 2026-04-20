import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Faq } from "@/components/sections/Faq";
import { Gallery } from "@/components/sections/Gallery";
import { MapBlock } from "@/components/sections/MapBlock";
import { PromoBand } from "@/components/sections/PromoBand";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { resortImages } from "@/content/images";
import { promotions } from "@/content/promotions";
import { testimonials } from "@/content/testimonials";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.home, "/");
}

export default async function HomePage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <Hero locale={locale} />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.newsTitle} text={dict.pageIntro} />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {promotions.map((promo) => (
              <article key={text(promo.title, locale)} className="rounded-[8px] border border-[color:var(--line)] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)]">
                <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{text(promo.badge, locale)}</p>
                <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--ink)]">{text(promo.title, locale)}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text(promo.description, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader title={dict.home.aboutTitle} text={dict.home.aboutText} />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/about")} variant="secondary">
                {dict.details}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/place")} variant="ghost">
                {dict.viewAll}
              </ButtonLink>
            </div>
          </div>
          <ImageFrame image={resortImages.nature} locale={locale} className="aspect-[5/4]" />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
            <ButtonLink href={localizePath(locale, "/nomera")} variant="ghost" className="lg:mb-1">
              {dict.viewAll}
            </ButtonLink>
          </div>
          <RoomCatalog locale={locale} />
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader title={dict.home.thingsTitle} text={dict.home.thingsText} />
            <ButtonLink href={localizePath(locale, "/services")} variant="ghost" className="lg:mb-1">
              {dict.viewAll}
            </ButtonLink>
          </div>
          <ServicesGrid locale={locale} limit={6} showFilters={false} />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <ImageFrame image={resortImages.mountains} locale={locale} className="aspect-[16/11]" />
          <div>
            <SectionHeader title={dict.home.territoryTitle} text={dict.home.territoryText} />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {dict.home.territoryPills.map((item) => (
                <div key={item} className="rounded-[6px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--green)] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-white/56">CHIMGANSOY</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{dict.home.yearRoundTitle}</h2>
            <p className="mt-4 text-base leading-7 text-white/74">{dict.home.yearRoundText}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {promotions.slice(0, 2).map((promo) => (
              <div key={text(promo.badge, locale)} className="rounded-[8px] border border-white/12 bg-white/9 p-5">
                <p className="text-xs font-bold uppercase text-white/56">{text(promo.badge, locale)}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold">{text(promo.title, locale)}</h3>
                <p className="mt-2 text-sm leading-6 text-white/68">{text(promo.description, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.reviewsTitle} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-[8px] border border-[color:var(--line)] bg-white p-6">
                <p className="text-sm leading-7 text-[var(--muted)]">&ldquo;{text(testimonial.quote, locale)}&rdquo;</p>
                <div className="mt-5">
                  <p className="font-bold text-[var(--ink)]">{testimonial.name}</p>
                  <p className="text-xs font-bold uppercase text-[var(--accent-strong)]">{text(testimonial.meta, locale)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.galleryTitle} text={dict.pageIntro} />
          <div className="mt-8">
            <Gallery locale={locale} />
          </div>
        </div>
      </section>

      <PromoBand locale={locale} />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <SectionHeader title={dict.home.faqTitle} />
          <Faq locale={locale} />
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <MapBlock locale={locale} />
        </div>
      </section>
    </>
  );
}
