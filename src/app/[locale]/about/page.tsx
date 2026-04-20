import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const values = [
  {
    title: { ru: "Природа как главный сценарий", uz: "Tabiat asosiy ssenariy", en: "Nature as the main scenario" },
    copy: {
      ru: "Сайт оставляет визуальное пространство для реальных видов, маршрутов, сезонного света и территории.",
      uz: "Sayt real manzaralar, marshrutlar, mavsumiy yorug'lik va hudud uchun vizual joy qoldiradi.",
      en: "The site leaves visual space for real views, routes, seasonal light, and the territory.",
    },
  },
  {
    title: { ru: "Бронирование без трения", uz: "Qulay bron qilish", en: "Low-friction booking" },
    copy: {
      ru: "Каждая ключевая страница ведет к заявке, мессенджеру или будущему Bnovo-модулю.",
      uz: "Har bir asosiy sahifa so'rov, messenjer yoki kelajakdagi Bnovo moduliga olib boradi.",
      en: "Every key page leads to a request, messenger, or future Bnovo module.",
    },
  },
  {
    title: { ru: "День собирается из модулей", uz: "Kun modullardan tuziladi", en: "A modular resort day" },
    copy: {
      ru: "Проживание, ресторан, топчаны, бассейн, спорт и активности работают как единый funnel.",
      uz: "Yashash, restoran, topchan, basseyn, sport va faoliyatlar yagona funnel sifatida ishlaydi.",
      en: "Stay, restaurant, tapchan zones, pool, sport, and activities work as one funnel.",
    },
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.about, "/about");
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.about.title}
        lead={dict.pages.about.lead}
        image={resortImages.nature}
        eyebrow="CHIMGANSOY"
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader title={dict.home.aboutTitle} text={dict.home.aboutText} />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary">
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/contact")} variant="ghost">
                {dict.pages.contact.title}
              </ButtonLink>
            </div>
          </div>
          <ImageFrame image={resortImages.mountains} locale={locale} className="aspect-[16/11]" />
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.yearRoundTitle} text={dict.home.yearRoundText} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {values.map((value) => (
              <article key={text(value.title, locale)} className="rounded-[8px] border border-[color:var(--line)] bg-[var(--paper)] p-6">
                <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">{text(value.title, locale)}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text(value.copy, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
