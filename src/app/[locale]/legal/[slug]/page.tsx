import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { policies } from "@/content/policies";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getPolicy } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const policy = getPolicy(slug);

  return buildMetadata(locale, {
    title: policy.title,
    description: policy.description,
  }, `/legal/${policy.slug}`);
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const policy = getPolicy(slug);
  const dict = dictionaries[locale];

  return (
    <>
      <PageHero
        locale={locale}
        title={text(policy.title, locale)}
        lead={text(policy.description, locale)}
        image={resortImages.nature}
        eyebrow="CHIMGANSOY"
      />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[8px] border border-[color:var(--line)] bg-white p-6 sm:p-8">
          {policy.sections.map((section, index) => (
            <section key={text(section.title, locale)} className={index === policy.sections.length - 1 ? "" : "mb-10"}>
              <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">{text(section.title, locale)}</h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {list(section.items, locale).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
          <div className="mt-10">
            <ButtonLink href={localizePath(locale, "/contact")} variant="primary">
              {dict.pages.contact.title}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
