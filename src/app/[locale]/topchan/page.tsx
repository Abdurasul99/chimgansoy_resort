import type { Metadata } from "next";
import { DayProductPage } from "@/components/sections/DayProductPage";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getDayProduct } from "@/content/day-products";
import { openInstead, topchanClosure } from "@/content/topchan-closure";
import { localizePath } from "@/i18n/routing";
import { getLocaleParam } from "@/lib/content";
import { text } from "@/lib/localize";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

const product = getDayProduct("topchan")!;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(
    locale,
    {
      title: topchanClosure.closed
        ? {
            ru: "Топчаны закрыты до нового сезона — CHIMGAN DARBAZA",
            uz: "Topchanlar yangi mavsumgacha yopiq — CHIMGAN DARBAZA",
            en: "Topchans closed until the new season — CHIMGAN DARBAZA",
          }
        : {
            ru: "Аренда топчана — CHIMGAN DARBAZA",
            uz: "Topchan ijarasi — CHIMGAN DARBAZA",
            en: "Topchan rental — CHIMGAN DARBAZA",
          },
      description: topchanClosure.closed ? topchanClosure.text : product.lead,
    },
    "/topchan",
    // Закрытая страница объясняет закрытие, а не продаёт — в выдаче ей делать нечего.
    topchanClosure.closed ? { noindex: true } : undefined,
  );
}

/**
 * Пока топчаны закрыты (topchan-closure.ts), страница не продаёт: ни формы, ни
 * цен. На неё ещё ведут старые ссылки — из сторис, закладок, рекламы, — поэтому
 * не 404, а объяснение и то, что работает вместо.
 */
export default async function TopchanPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  if (!topchanClosure.closed) return <DayProductPage locale={locale} slug="topchan" />;

  return (
    <section className="bg-[var(--surface)] px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-8 text-center sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{topchanClosure.since}</p>
        <h1 className="mt-3 text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">{text(topchanClosure.title, locale)}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">{text(topchanClosure.text, locale)}</p>
        <p className="mt-3 text-sm font-semibold leading-7 text-[var(--ink)]">{text(openInstead, locale)}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={localizePath(locale, "/tubing")} variant="primary">
            {text({ ru: "Тюбинг-горка", uz: "Tyubing gorkasi", en: "Tubing hill" }, locale)}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/restaurant")} variant="ghost">
            {text({ ru: "Ресторан", uz: "Restoran", en: "Restaurant" }, locale)}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
