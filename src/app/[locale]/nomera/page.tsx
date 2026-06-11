import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  // Rooms are live and bookable — fully indexable.
  return buildMetadata(locale, pageSeo.rooms, "/nomera");
}

const copy = {
  ru: {
    perksTitle: "В каждом размещении",
    perks: [
      "Панорама Чимгана из окна",
      "Парковка рядом с номером",
      "Доступ ко всей территории и топчанам",
      "Ресторан и готовое меню",
    ],
  },
  uz: {
    perksTitle: "Har bir turar joyda",
    perks: [
      "Derazadan Chimg'on panoramasi",
      "Xona yonida parking",
      "Butun hudud va topchanlardan foydalanish",
      "Restoran va tayyor menyu",
    ],
  },
  en: {
    perksTitle: "Every stay includes",
    perks: [
      "Chimgan views from the window",
      "Parking next to your room",
      "Full access to the grounds and topchans",
      "Restaurant and ready-made menu",
    ],
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
        image={resortImages.glampingDay}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* Date/guest picker that carries through to /bron */}
      <BookingWidget locale={locale} />

      {/* Room catalog — glamping + cottage, both bookable */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
          <div className="mt-10">
            <RoomCatalog locale={locale} />
          </div>

          {/* What every stay includes */}
          <div className="mt-14 rounded-[4px] bg-[var(--mountain)] p-7 text-white sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">
              {t.perksTitle}
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                  <span aria-hidden className="mt-2 inline-block h-1 w-3 shrink-0 bg-[var(--sun)]" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
