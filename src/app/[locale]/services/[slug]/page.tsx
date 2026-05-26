import type { Metadata } from "next";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { PageHero } from "@/components/sections/PageHero";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { services } from "@/content/services";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getService } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const service = getService(slug);

  return buildMetadata(
    locale,
    {
      title: {
        ru: `${text(service.title, "ru")} CHIMGAN DARBAZA`,
        uz: `${text(service.title, "uz")} CHIMGAN DARBAZA`,
        en: `${text(service.title, "en")} at CHIMGAN DARBAZA`,
      },
      description: service.shortDescription,
    },
    `/services/${service.slug}`,
  );
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const service = getService(slug);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={text(service.title, locale)}
        lead={text(service.shortDescription, locale)}
        image={resortImages[service.image]}
        eyebrow={text(service.bestFor, locale)}
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <ImageFrame image={resortImages[service.image]} locale={locale} className="aspect-[4/5] lg:sticky lg:top-28" priority />
          <div>
            <SectionHeader title={text(service.title, locale)} text={text(service.description, locale)} />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {list(service.highlights, locale).map((item) => (
                <div key={item} className="rounded-xl border border-[color:var(--line)] bg-[var(--paper)] p-4 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-card)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary">
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/nomera")} variant="ghost">
                {dict.pages.rooms.title}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
          <div className="mt-8">
            <RoomCatalog locale={locale} />
          </div>
        </div>
      </section>
    </>
  );
}
