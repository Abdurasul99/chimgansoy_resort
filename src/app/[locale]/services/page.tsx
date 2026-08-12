import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { serviceCards } from "@/lib/service-cards";
import { buildMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.services, "/services");
}

// Каталог зависит от выключателей в /admin/uslugi. Без этой строки страница
// полностью статична: она печётся при сборке и живёт до следующего деплоя —
// оператор гасит услугу, карточка остаётся висеть, и никакое сохранение её не
// убирает. Минута — столько, сколько оператор готов ждать, проверяя себя.
export const revalidate = 60;


export default async function ServicesPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  /**
   * Каталог целиком приходит из данных: услуги из кода и услуги, созданные
   * оператором, в одном списке и в заданном им порядке. Выключенные сюда не
   * попадают, а их адреса уводят в этот же каталог.
   */
  const cards = await serviceCards(locale);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.services.title}
        lead={dict.pages.services.lead}
        // Was aframeLawnWide — a tower crane stands in the sky above the third
        // cabin's roofline, at the top of the page that lists what we offer.
        image={resortImages.poolWideChalets}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* Search widget — dates/guests -> Exely engine on /bron (Exely SEO tip) */}
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.thingsTitle} text={dict.home.thingsText} />
          <div className="mt-8">
            <ServicesGrid locale={locale} items={cards} />
          </div>
        </div>
      </section>

    </>
  );
}
