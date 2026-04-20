import type { Metadata } from "next";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { PageHero } from "@/components/sections/PageHero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { rooms } from "@/content/rooms";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getRoom } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);

  return buildMetadata(
    locale,
    {
      title: {
        ru: `${text(room.title, "ru")} CHIMGANSOY`,
        uz: `${text(room.title, "uz")} CHIMGANSOY`,
        en: `${text(room.title, "en")} at CHIMGANSOY`,
      },
      description: room.shortDescription,
    },
    `/nomera/${room.slug}`,
  );
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={text(room.title, locale)}
        lead={text(room.shortDescription, locale)}
        image={resortImages[room.image]}
        eyebrow={text(room.eyebrow, locale)}
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader title={text(room.title, locale)} text={text(room.description, locale)} />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-[8px] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">{dict.detailLabels.capacity}</p>
                <p className="mt-2 font-bold text-[var(--ink)]">{text(room.capacity, locale)}</p>
              </div>
              <div className="rounded-[8px] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">{dict.detailLabels.size}</p>
                <p className="mt-2 font-bold text-[var(--ink)]">{text(room.size, locale)}</p>
              </div>
              <div className="rounded-[8px] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">{dict.detailLabels.price}</p>
                <p className="mt-2 font-bold text-[var(--accent-strong)]">{text(room.priceFrom, locale)}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">{dict.detailLabels.amenities}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {list(room.amenities, locale).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">{dict.detailLabels.features}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {list(room.features, locale).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary">
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/services")} variant="ghost">
                {dict.home.thingsTitle}
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            {room.gallery.map((imageKey, index) => (
              <ImageFrame
                key={imageKey}
                image={resortImages[imageKey]}
                locale={locale}
                className={index === 0 ? "aspect-[4/3]" : "aspect-[16/10]"}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.detailLabels.relatedServices} text={dict.home.thingsText} />
          <div className="mt-8">
            <ServicesGrid
              locale={locale}
              slugs={room.relatedServices}
              showFilters={false}
            />
          </div>
        </div>
      </section>
    </>
  );
}
