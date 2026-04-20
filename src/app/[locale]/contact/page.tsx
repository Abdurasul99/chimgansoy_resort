import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { MapBlock } from "@/components/sections/MapBlock";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ContactActions } from "@/components/ui/ContactActions";
import { Icon } from "@/components/ui/Icon";
import { contacts } from "@/content/contacts";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const contactLabels = {
  phone: { ru: "Телефон", uz: "Telefon", en: "Phone" },
  email: { ru: "Email", uz: "Email", en: "Email" },
  address: { ru: "Адрес", uz: "Manzil", en: "Address" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.contact, "/contact");
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.contact.title}
        lead={dict.pages.contact.lead}
        image={resortImages.entranceDay}
        eyebrow="CHIMGANSOY"
      />
      <BookingWidget locale={locale} />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeader title={dict.pages.contact.title} text={dict.pages.contact.lead} />
            <div className="mt-8">
              <ContactActions locale={locale} />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[8px] border border-[color:var(--line)] bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--accent-strong)]">
                <Icon name="phone" className="h-4 w-4" /> {text(contactLabels.phone, locale)}
              </p>
              <p className="mt-3 text-xl font-bold text-[var(--ink)]">{contacts.phone}</p>
            </div>
            <div className="rounded-[8px] border border-[color:var(--line)] bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--accent-strong)]">
                <Icon name="mail" className="h-4 w-4" /> {text(contactLabels.email, locale)}
              </p>
              <p className="mt-3 text-xl font-bold text-[var(--ink)]">{contacts.email}</p>
            </div>
            <div className="rounded-[8px] border border-[color:var(--line)] bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--accent-strong)]">
                <Icon name="map" className="h-4 w-4" /> {text(contactLabels.address, locale)}
              </p>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text(contacts.address, locale)}</p>
            </div>
          </div>
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
