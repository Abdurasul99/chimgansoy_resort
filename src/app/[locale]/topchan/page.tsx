import type { Metadata } from "next";
import { DayProductPage } from "@/components/sections/DayProductPage";
import { getDayProduct } from "@/content/day-products";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

const product = getDayProduct("topchan")!;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(
    locale,
    {
      title: {
        ru: "Аренда топчана — CHIMGAN DARBAZA",
        uz: "Topchan ijarasi — CHIMGAN DARBAZA",
        en: "Topchan rental — CHIMGAN DARBAZA",
      },
      description: product.lead,
    },
    "/topchan",
  );
}

export default async function TopchanPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  return <DayProductPage locale={locale} slug="topchan" />;
}
