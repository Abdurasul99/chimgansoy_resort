import type { Metadata } from "next";
import { restaurantText } from "@/content/restaurant";
import { getLocaleParam } from "@/lib/content";
import { getRestaurantMenu } from "@/lib/restaurant/live";
import { restaurantPage } from "@/lib/restaurant/page";
import { pickText } from "@/lib/restaurant/rules";
import { CheckoutForm } from "@/components/restaurant/CheckoutForm";
import { PreviewBanner, RestaurantPageHead } from "@/components/restaurant/RestaurantSections";

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
    <div className="rest bg-[#fcf4e6]">
      <RestaurantPageHead
        notice={preview ? <PreviewBanner locale={locale} /> : null}
        eyebrow={t.checkout.eyebrow}
        title={t.checkout.title}
        lead={openModes.length ? t.checkout.lead : t.closedBanner}
        name={pickText(settings.name, locale)}
      />
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {openModes.length === 0 ? (
            <p className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center font-serif text-2xl font-bold text-[#1f1712]">
              {t.errors.closed}
            </p>
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
      </section>
    </div>
  );
}
