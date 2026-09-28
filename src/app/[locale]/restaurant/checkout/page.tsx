import type { Metadata } from "next";
import { restaurantText } from "@/content/restaurant";
import { getLocaleParam } from "@/lib/content";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { restaurantPage } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { CheckoutForm } from "@/components/restaurant/CheckoutForm";
import { PageTitle, PreviewBanner } from "@/components/restaurant/RestaurantSections";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

// Оформление — служебная страница: в поиске ей нечего делать.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function RestaurantCheckoutPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const page = await restaurantPage();
  const { settings, preview, openModes } = page;
  const t = restaurantText(locale);
  const menu = await getRestaurantMenu();

  return (
    <div className="rest bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {preview && (
          <div className="mb-5">
            <PreviewBanner locale={locale} />
          </div>
        )}
        <PageTitle locale={locale} title={t.checkout.title} lead={openModes.length ? t.checkout.lead : undefined} />
        <div className="mt-6">
          {openModes.length === 0 ? (
            <p className="rounded-3xl bg-[#f6f5f2] px-6 py-12 text-center text-lg font-semibold text-[#1c1c1c]">{t.errors.closed}</p>
          ) : (
            <CheckoutForm
              locale={locale}
              dishes={menu.dishes}
              openModes={openModes}
              preview={preview}
              settings={{
                hoursOpen: settings.hoursOpen,
                hoursClose: settings.hoursClose,
                deliveryFee: settings.deliveryFee,
                roomFee: settings.roomFee,
                deliveryNote: pickText(settings.deliveryNote, locale),
                preorderLeadHours: settings.preorderLeadHours,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
