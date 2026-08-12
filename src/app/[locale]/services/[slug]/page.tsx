import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { MenuBoard } from "@/components/sections/MenuBoard";
import { PageHero } from "@/components/sections/PageHero";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { services } from "@/content/services";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getService } from "@/lib/content";
import { getService as getLiveService } from "@/lib/services-live";
import { serviceCard } from "@/lib/service-cards";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";
import { getRoomPrices, priceChip } from "@/lib/room-price";

/**
 * Страница услуги рисуется на каждый запрос.
 *
 * Раньше здесь стоял ISR: страницы пеклись при сборке и до правок оператора не
 * доходили — проверено на проде, услуга из панели появлялась только после
 * следующего деплоя, сколько бы времени ни прошло. У услуги, созданной
 * оператором, предрендеривать вообще нечего: её нет в коде.
 *
 * Живая цена «от …» из движка по-прежнему берётся из шестичасового кеша в
 * lib/room-price.ts, так что запрос наружу это не добавляет.
 */
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);

  // У услуги оператора нет записи в коде: getService() на ней вызвал бы
  // notFound() прямо из метаданных, до того как страница успеет отрисоваться.
  const card = await serviceCard(slug, locale);
  if (card && !services.some((s) => s.slug === slug)) {
    const one = { ru: card.title, uz: card.title, en: card.title };
    const lead = { ru: card.shortDescription, uz: card.shortDescription, en: card.shortDescription };
    return buildMetadata(locale, { title: one, description: lead }, `/services/${slug}`);
  }

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

  // Live "от …" prices from the booking engine, resolved on the server because
  // RoomCatalog is a client component. Six-hour cache, and an unreachable
  // engine simply yields no chip — see lib/room-price.ts.
  const prices = await getRoomPrices();
  const priceChips = Object.fromEntries(
    Object.entries(prices).map(([slug, value]) => [slug, priceChip(value, locale)]),
  );
  // A service the operator switched off must not keep answering on its own URL.
  //
  // Не notFound(): страница предрендерена, и Next отдаёт такой «не найдено»
  // с кодом 200 — мягкая 404, худшее из двух состояний. Отправляем в каталог:
  // гость по старой ссылке из поиска попадает к тому, что работает, а услуга
  // вернётся одной галочкой и адрес снова оживёт. Сюда же приходит выдуманный
  // адрес: услуги с таким слагом нет ни в коде, ни у оператора.
  const live = await getLiveService(slug);
  if (!live) redirect(localizePath(locale, "/services"));
  const dict = dictionaries[locale];

  /**
   * Услуга, созданная оператором в панели.
   *
   * Своя вёрстка, а не общая: у неё нет ни второго кадра, ни списка тезисов, ни
   * фразы «кому подойдёт» — оператор пишет заголовок, описание и, если хочет,
   * строку цены. Делать вид, что поля есть, значило бы рисовать пустые блоки.
   */
  if (live.isCustom) {
    const card = (await serviceCard(slug, locale))!;
    return (
      <>
        <PageHero
          locale={locale}
          title={card.title}
          lead={card.shortDescription}
          frame={card.frame}
          frameAlt={card.alt}
          eyebrow="CHIMGAN DARBAZA"
        />
        <BookingWidget locale={locale} />

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <SectionHeader title={card.title} text={live.custom!.description} />
            {card.priceNote ? (
              <p className="mt-6 text-lg font-bold text-[var(--sun-dark)]">{card.priceNote}</p>
            ) : null}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload>
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/services")} variant="ghost">
                {dict.pages.services.title}
              </ButtonLink>
            </div>
          </div>
        </section>
      </>
    );
  }

  const service = getService(slug);

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

      {/* The kitchen page is the one place a full menu belongs. */}
      {service.slug === "restaurant" && <MenuBoard locale={locale} />}

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* A DIFFERENT photograph from the hero. Both frames used service.image, so
              every service page printed the same picture twice on one scroll. */}
          <ImageFrame image={resortImages[service.secondImage]} locale={locale} className="aspect-[4/5] lg:sticky lg:top-28" priority />
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
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload>
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
            <RoomCatalog locale={locale} priceChips={priceChips} />
          </div>
        </div>
      </section>
    </>
  );
}
