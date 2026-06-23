import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { formatNewsDate, news } from "@/content/news";
import { resortImages } from "@/content/images";
import { mainNavigation } from "@/content/navigation";
import { getLocaleParam, getNewsItem } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const item = getNewsItem(slug);
  return buildMetadata(locale, { title: item.title, description: item.excerpt }, `/news/${item.slug}`);
}

const backLabel = { ru: "Все новости", uz: "Barcha yangiliklar", en: "All news" } as const;
const newsLabel = { ru: "Новости", uz: "Yangiliklar", en: "News" } as const;

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const item = getNewsItem(slug);

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: text(mainNavigation[0].label, locale), path: "/" },
          { name: newsLabel[locale], path: "/news" },
          { name: text(item.title, locale), path: `/news/${item.slug}` },
        ]}
      />
      <PageHero
        locale={locale}
        title={text(item.title, locale)}
        lead={text(item.excerpt, locale)}
        image={resortImages[item.image]}
        eyebrow={`${text(item.category, locale)} · ${formatNewsDate(item.date, locale)}`}
      />

      <article className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-5 text-[1.05rem] leading-8 text-[var(--muted)]">
            {item.body[locale].map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 border-t border-[color:var(--line)] pt-6">
            <Link
              href={localizePath(locale, "/news")}
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              {backLabel[locale]}
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
