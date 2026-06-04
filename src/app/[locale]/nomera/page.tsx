import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const meta = buildMetadata(locale, pageSeo.rooms, "/nomera");
  return { ...meta, robots: { index: false, follow: true } };
}

const copy = {
  ru: {
    eyebrow: "В подготовке",
    title: "Глэмпинг и шале — скоро",
    lead: "Готовим формат проживания: A-frame глэмпинг и шале с панорамой Чимгана. Пока приглашаем на дневной отдых — топчан с курпача, мангал, казан и горный воздух.",
    cta: "Забронировать день в горах",
    secondaryCta: "Связаться с нами",
    bullet1: "1700 м, тишина и сосны",
    bullet2: "Топчаны до 8 человек",
    bullet3: "Готовое меню или своё",
  },
  uz: {
    eyebrow: "Tayyorlanmoqda",
    title: "Glemping va shale — tez orada",
    lead: "Yashash formatini tayyorlamoqdamiz: Chimgon panoramali A-frame glemping va shale. Hozircha kunlik dam olishga taklif qilamiz — kurpachali topchan, mangal, qozon va tog' havosi.",
    cta: "Tog'larda kunni bron qilish",
    secondaryCta: "Biz bilan bog'lanish",
    bullet1: "1700 m, sokinlik va qarag'aylar",
    bullet2: "8 kishigacha topchanlar",
    bullet3: "Tayyor menyu yoki o'zingiznikini",
  },
  en: {
    eyebrow: "In preparation",
    title: "Glamping & chalets — coming soon",
    lead: "We're preparing our overnight format: A-frame glamping and chalets with Chimgan views. For now, we welcome day visitors — kurpacha-covered topchans, BBQ grill, kazan, and fresh mountain air.",
    cta: "Book a day in the mountains",
    secondaryCta: "Contact us",
    bullet1: "1,700 m, quiet and pines",
    bullet2: "Topchans for up to 8 guests",
    bullet3: "Order from menu or bring your own",
  },
} as const;

export default async function RoomsPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];
  const t = copy[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.rooms.title}
        lead={dict.pages.rooms.lead}
        image={resortImages.cottageDay}
        eyebrow="CHIMGAN DARBAZA"
      />

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
              {t.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)]">{t.lead}</p>

            <ul className="mt-8 space-y-3 text-sm leading-6 text-[var(--ink)]">
              {[t.bullet1, t.bullet2, t.bullet3].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" className="btn-press">
                {t.cta}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/contact")} variant="ghost" className="btn-press">
                {t.secondaryCta}
              </ButtonLink>
            </div>
          </div>

          {/* Visual */}
          <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-[var(--shadow-card-hover)]">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${resortImages.glamping.localSrc ?? resortImages.glamping.src})`,
              }}
              role="img"
              aria-label="A-frame glamping coming soon"
            />
          </div>
        </div>
      </section>
    </>
  );
}
