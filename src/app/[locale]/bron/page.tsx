import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ExelyBookingEngine } from "@/components/sections/ExelyBookingEngine";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { getPricing } from "@/lib/pricing-live";
import { buildMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n/config";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.booking, "/bron");
}

/**
 * Booking page — hosts the Exely Booking Engine. The head loader (see
 * [locale]/layout.tsx) embeds the engine into #be-booking-form. Kept clean per
 * Exely's checklist: no search form, no room/promo lists. The only extra is a
 * direct-contact fallback that appears ONLY if the engine fails to load (it
 * can't reach its Uzbekistan data host from some countries) — see
 * ExelyBookingEngine.
 */
export default async function BookingPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.booking.title}
        lead={dict.pages.booking.lead}
        image={resortImages.aframeLawnBanner}
        eyebrow="CHIMGAN DARBAZA"
      />

      <ExelyBookingEngine locale={locale} />

      <StayLevyNote locale={locale} />
    </>
  );
}

/**
 * Туристский сбор — под движком бронирования.
 *
 * Движок Exely показывает цену за проживание и берёт оплату онлайн; сбор в эту
 * сумму не входит и платится наличными на ресепшене. Гость, увидевший итог на
 * экране и заплативший его целиком, при заселении встречает ещё один платёж —
 * и узнаёт о нём от администратора, что читается как «досчитали на месте».
 * Поэтому цифры стоят ровно там, где человек смотрит на сумму.
 *
 * Числа живые: оператор правит их в /admin → Цены, ставка для иностранцев
 * установлена законодательством и меняется без нашего участия.
 */
async function StayLevyNote({ locale }: { locale: Locale }) {
  const live = await getPricing();
  const money = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");

  const copy = {
    ru: {
      title: "Туристский сбор оплачивается отдельно",
      body: `Сбор не входит в стоимость проживания и не оплачивается онлайн: его вносят при заселении, за каждую ночь с каждого гостя. Граждане и резиденты Узбекистана — ${money(live.touristTax.resident)} сум, иностранные граждане — ${money(live.touristTax.nonResident)} сум. Ставка установлена законодательством Республики Узбекистан.`,
    },
    uz: {
      title: "Turistik yig'im alohida to'lanadi",
      body: `Yig'im yashash narxiga kirmaydi va onlayn to'lanmaydi: u joylashuvda, har bir kecha uchun har bir mehmondan olinadi. O'zbekiston fuqarolari va rezidentlari — ${money(live.touristTax.resident)} so'm, chet el fuqarolari — ${money(live.touristTax.nonResident)} so'm. Stavka O'zbekiston Respublikasi qonunchiligi bilan belgilangan.`,
    },
    en: {
      title: "The tourist levy is paid separately",
      body: `The levy is not part of the room rate and is not charged online: it is paid at check-in, per person per night. Uzbek citizens and residents pay ${money(live.touristTax.resident)} UZS, foreign nationals ${money(live.touristTax.nonResident)} UZS. The rate is set by the law of the Republic of Uzbekistan.`,
    },
  }[locale];

  return (
    <section className="px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-5 sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy.body}</p>
      </div>
    </section>
  );
}
