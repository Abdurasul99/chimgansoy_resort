import type { Metadata } from "next";
import { partnersPage as P } from "@/content/partners";
import { PartnersPortal } from "@/components/partners/PartnersPortal";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Партнёрский раздел (B2B), общая страница — портал «B2B Media Valuation
 * Engine» по коду и скриншотам владельца (11.11.2026):
 * components/partners/PartnersPortal.tsx, данные — content/partners-portal.ts.
 *
 * Только по прямой ссылке: noindex здесь, X-Robots-Tag в next.config.ts, в
 * карте сайта и навигации её нет. Портал пока на русском на всех языках —
 * так он прислан; переводы — отдельным шагом.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, P.seo, "/partners", { noindex: true });
}

export default async function PartnersPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  return <PartnersPortal locale={locale} />;
}
