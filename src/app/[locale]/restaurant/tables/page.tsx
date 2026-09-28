import type { Metadata } from "next";
import { contacts } from "@/content/contacts";
import { restaurantText } from "@/content/restaurant";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { heroImage, restaurantPage, restaurantSeo } from "@/lib/restaurant/page";
import { TableForm } from "@/components/restaurant/TableForm";
import { PageTitle, PreviewBanner } from "@/components/restaurant/RestaurantSections";
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
    <div className="rest bg-white">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        {preview && (
          <div className="mb-5">
            <PreviewBanner locale={locale} />
          </div>
        )}
        <PageTitle locale={locale} title={t.tables.title} lead={t.tables.lead} />
        <div className="mt-6">
          {tablesOpen ? (
            <TableForm locale={locale} hours={{ hoursOpen: settings.hoursOpen, hoursClose: settings.hoursClose }} />
          ) : (
            <div className="rounded-3xl bg-[#f6f5f2] px-6 py-12 text-center">
              <RestIcon name="table" className="mx-auto h-10 w-10 text-[#cdc5b8]" />
              <p className="mx-auto mt-4 max-w-md font-semibold text-[#1c1c1c]">{t.tables.closed}</p>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="btn-press mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#f4a52a] px-6 font-bold text-[#3b2a0a]"
              >
                <RestIcon name="phone" className="h-5 w-5" />
                {phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
