import type { Metadata } from "next";
import { NewYearScene } from "@/components/new-year/NewYearScene";
import { StayCards, type StayCard } from "@/components/new-year/StayCards";
import { WishSky } from "@/components/new-year/WishSky";
import { NEW_YEAR_PATH, newYearCopy, newYearSeo } from "@/content/new-year";
import { resortImages } from "@/content/images";
import { SAZANCHIK_DELIVERY_PHONE } from "@/content/restaurant-media";
import { localizePath } from "@/i18n/routing";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { responsiveImg } from "@/lib/images";
import { text } from "@/lib/localize";

/**
 * Новогодний экран (владелец, 27.11.2026): вход — кнопкой «Новый год» в шапке.
 * Снежный шар, гирлянда, отсчёт до полуночи по Ташкенту, где встретить
 * праздник и салют по нажатию. Цен нет: праздничные ночи считает Exely.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, newYearSeo, NEW_YEAR_PATH, { image: resortImages.newYearGlobe.src });
}

const CARD_SIZES = "(min-width: 640px) 33vw, 100vw";

export default async function NewYearPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const bookHref = localizePath(locale, "/nomera");

  const cards: StayCard[] = [
    {
      href: localizePath(locale, "/nomera/cottage"),
      img: responsiveImg(resortImages.chaletHallBeams.src, CARD_SIZES),
      position: "center",
      name: text(newYearCopy.stays.chalet.name, locale),
      text: text(newYearCopy.stays.chalet.text, locale),
    },
    {
      href: localizePath(locale, "/nomera/glamping"),
      img: responsiveImg(resortImages.aframeBulbs.src, CARD_SIZES),
      position: "center 40%",
      name: text(newYearCopy.stays.glamping.name, locale),
      text: text(newYearCopy.stays.glamping.text, locale),
    },
    {
      href: localizePath(locale, "/tubing"),
      // Вертикаль 9:16 с логотипом в небе: низ кадра — сама трасса в огнях.
      img: responsiveImg(resortImages.tubingDuskTrack.src, CARD_SIZES),
      position: "center 72%",
      name: text(newYearCopy.stays.tubing.name, locale),
      text: text(newYearCopy.stays.tubing.text, locale),
    },
  ];

  return (
    <div className="bg-[#0b1424]">
      {/* Без JavaScript framer-motion не снимет начальную прозрачность — текст
          остался бы невидимым. */}
      <noscript>
        <style>{".ny-reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <NewYearScene
        locale={locale}
        globeSrc={resortImages.newYearGlobe.src}
        bookHref={bookHref}
        // Номер ресторана «Сазанчик», как на демо: так попросил владелец (25.11.2026).
        phone={SAZANCHIK_DELIVERY_PHONE}
      />
      <StayCards
        title={text(newYearCopy.staysTitle, locale)}
        lead={text(newYearCopy.staysLead, locale)}
        more={text(newYearCopy.more, locale)}
        cards={cards}
      />
      <WishSky locale={locale} bookHref={bookHref} />
    </div>
  );
}
