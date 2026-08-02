import type { Metadata } from "next";
import { DayProductPage } from "@/components/sections/DayProductPage";
import { getDayProduct } from "@/content/day-products";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

const product = getDayProduct("tubing")!;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(
    locale,
    {
      title: {
        ru: "Тюбинг-горка — CHIMGAN DARBAZA",
        uz: "Tubing gorkasi — CHIMGAN DARBAZA",
        en: "Tubing hill — CHIMGAN DARBAZA",
      },
      description: product.lead,
    },
    "/tubing",
  );
}

export default async function TubingPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  return <DayProductPage locale={locale} slug="tubing" />;
}
