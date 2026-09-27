import type { Metadata } from "next";
import { contacts } from "@/content/contacts";
import { restaurantText } from "@/content/restaurant";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { TableForm } from "@/components/restaurant/TableForm";
import { PreviewBanner, RestaurantPageHead } from "@/components/restaurant/RestaurantSections";
import { Rosette } from "@/components/restaurant/Ornaments";
import { RestIcon } from "@/components/restaurant/RestIcon";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const { settings } = await restaurantPage();
  return buildMetadata(locale, restaurantSeo(settings, "tables"), "/restaurant/tables", {
    image: heroImage(settings),
    noindex: settings.state === "hidden",
  });
}

export default async function RestaurantTablesPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const page = await restaurantPage();
  const { settings, preview, tablesOpen } = page;
  const t = restaurantText(locale);
  const phone = settings.phones[0] || contacts.phone;

  return (
    <div className="rest bg-[#fcf4e6]">
      {preview && <PreviewBanner locale={locale} />}
      <RestaurantPageHead eyebrow={t.tables.eyebrow} title={t.tables.title} lead={t.tables.lead} name={pickText(settings.name, locale)} />
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <Rosette size={480} className="rest-spin pointer-events-none absolute -left-52 top-10 opacity-[0.07]" colors={["#17a3b0", "#2c9a5b", "#f4a52a"]} />
        <div className="relative mx-auto max-w-3xl">
          {tablesOpen ? (
            <TableForm locale={locale} hours={{ hoursOpen: settings.hoursOpen, hoursClose: settings.hoursClose }} />
          ) : (
            <div className="rounded-[2rem] bg-[#1f1712] p-8 text-center text-white">
              <RestIcon name="table" className="mx-auto h-12 w-12 text-[#17a3b0]" />
              <p className="mt-4 font-serif text-2xl font-bold">{t.tables.closed}</p>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#17a3b0] to-[#2c9a5b] px-7 font-extrabold">
                <RestIcon name="phone" className="h-5 w-5" />
                {phone}
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
