import type { Metadata } from "next";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { resortImages } from "@/content/images";
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

const values = [
  {
    num: "01",
    title: { ru: "Природа как главный сценарий", uz: "Tabiat — asosiy sahna", en: "Nature as the main stage" },
    copy: {
      ru: "Курорт окружён горами Чимган. Здесь маршруты, виды и сезонный свет формируют атмосферу отдыха.",
      uz: "Kurort Chimgan tog'lari bilan o'ralgan. Marshrutlar, manzaralar va mavsumiy yorug'lik dam olish muhitini shakllantiradi.",
      en: "The resort is surrounded by the Chimgan mountains. Routes, views, and seasonal light define the experience.",
    },
  },
  {
    num: "02",
    title: { ru: "Приватный топчан для компании", uz: "Do'stlar uchun xususiy topchan", en: "A private topchan for your group" },
    copy: {
      ru: "Каждый топчан — отдельное приватное пространство до 8 человек: курпача, тень, место под мангал и казан рядом. Удобно для семьи или компании.",
      uz: "Har bir topchan — 8 kishigacha alohida xususiy joy: kurpacha, soya, yonida mangal va qozon joyi. Oila yoki do'stlar uchun qulay.",
      en: "Each topchan is a private space for up to 8 guests — kurpacha cushions, shade, and a BBQ / kazan spot at hand. Built for families and groups.",
    },
  },
  {
    num: "03",
    title: { ru: "Круглый год, каждый день", uz: "Yil davomida, har kuni", en: "Year-round, every day" },
    copy: {
      ru: "Работаем ежедневно с 08:00 до 18:00 в любой сезон. Летом — топчаны в тени и мангал на свежем воздухе. Осенью и зимой — горный воздух, костёр и горячий чай.",
      uz: "Har kuni 08:00 dan 18:00 gacha, har qanday mavsumda ishlaymiz. Yozda — soyadagi topchanlar va ochiq havodagi mangal. Kuz va qishda — tog' havosi, gulxan va issiq choy.",
      en: "Open daily 08:00–18:00, every season. In summer — shaded topchans and open-air BBQ. In autumn and winter — mountain air, a fire, and hot tea.",
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
      {/* ── Cinematic hero ────────────────────────────── */}
      <section
        className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-[var(--ink)] -mt-[4.5rem]"
        aria-label={dict.pages.about.title}
      >
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={imageStyle(resortImages.galTerritoryPanorama)}
          role="img"
          aria-label={text(resortImages.galTerritoryPanorama.alt, locale)}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.97)_0%,rgba(12,18,14,0.52)_55%,rgba(12,18,14,0.12)_100%)]" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-28 sm:pb-16 sm:pt-44 sm:px-6 lg:pb-24 lg:px-8">
          <div className="motion-rise">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">CHIMGAN DARBAZA</p>
            <h1 className="display-lg mt-3 font-serif font-bold text-white">{dict.pages.about.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">{dict.pages.about.lead}</p>
          </div>
        </div>
      </section>

      {/* Search widget — dates/guests -> Exely engine on /bron (Exely SEO tip) */}
      <BookingWidget locale={locale} />

      {/* ── About editorial split ─────────────────────── */}
      <section className="px-4 py-14 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="motion-reveal">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
              <h2 className="display-md mt-3 font-serif font-semibold text-[var(--ink)]">{dict.home.aboutTitle}</h2>
              <p className="mt-6 text-base leading-8 text-[var(--muted)]">{dict.home.aboutText}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload className="btn-press">
                  {dict.bookNow}
                </ButtonLink>
                <ButtonLink href={localizePath(locale, "/contact")} variant="ghost" className="btn-press">
                  {dict.pages.contact.title}
                </ButtonLink>
              </div>
            </div>
            <div className="relative motion-reveal" data-delay="150">
              <div
                className="aspect-[4/5] overflow-hidden rounded-3xl bg-cover bg-center shadow-[var(--shadow-card-hover)]"
                style={imageStyle(resortImages.galAframeTrio)}
                role="img"
                aria-label={text(resortImages.galAframeTrio.alt, locale)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Values — editorial list ───────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-14 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 motion-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
            <h2 className="display-md mt-3 font-serif font-semibold text-[var(--ink)]">{dict.home.yearRoundTitle}</h2>
          </div>
          <div className="space-y-0 divide-y divide-[color:var(--line)]">
            {values.map((value, i) => (
              <div
                key={value.num}
                className="grid gap-6 py-10 lg:grid-cols-[120px_1fr_1fr] lg:items-start motion-reveal"
                data-delay={String(i * 100)}
              >
                <p className="font-serif text-5xl font-bold text-[var(--mist)]">{value.num}</p>
                <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">{text(value.title, locale)}</h3>
                <p className="text-base leading-7 text-[var(--muted)]">{text(value.copy, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width image scene ─────────────────────── */}
      <section className="relative isolate overflow-hidden min-h-[50vh] flex items-end">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={imageStyle(resortImages.galGreenHills)}
          role="img"
          aria-label={text(resortImages.galGreenHills.alt, locale)}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.90)_0%,rgba(12,18,14,0.30)_60%,rgba(12,18,14,0.05)_100%)]" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:pb-20 lg:px-8">
          <div className="motion-reveal">
            <h2 className="display-md font-serif font-bold text-white">{dict.home.yearRoundTitle}</h2>
            <p className="mt-5 text-base text-white/60 max-w-md">{dict.home.yearRoundText}</p>
            <div className="mt-8">
              <ButtonLink href={localizePath(locale, "/bron")} variant="light" reload className="btn-press">
                {dict.bookNow}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
