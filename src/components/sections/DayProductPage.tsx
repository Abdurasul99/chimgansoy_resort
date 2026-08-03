import { PageHero } from "@/components/sections/PageHero";
import { MediaArchive } from "@/components/sections/MediaArchive";
import { TopchanRequestForm } from "@/components/sections/TopchanRequestForm";
import { TubingRequestForm } from "@/components/sections/TubingRequestForm";
import { Icon } from "@/components/ui/Icon";
import { VideoReel } from "@/components/sections/VideoReel";
import { getDayProduct } from "@/content/day-products";
import { resortImages } from "@/content/images";
import { tubingVideos } from "@/content/videos";
import { list, text } from "@/lib/localize";
import type { Locale } from "@/i18n/config";

const ABOUT: Record<Locale, string> = {
  ru: "Об услуге",
  uz: "Xizmat haqida",
  en: "About",
};

/**
 * Shared page body for the topchan and tubing day products.
 *
 * The two pages differ only in their content module and which request form
 * they mount, so the layout lives here rather than being copied twice — the
 * pool page's own layout is entangled with the rooms route and could not be
 * reused without dragging the room catalogue along with it.
 *
 * Order is deliberate: hero, then the form, then the description and the
 * archive. A guest arriving from the homepage button already knows what they
 * came for, so the booking action sits in the first screen and the reading
 * material is the reward for scrolling — the same call the pool page makes.
 */
export function DayProductPage({ locale, slug }: { locale: Locale; slug: "topchan" | "tubing" }) {
  const product = getDayProduct(slug);
  if (!product) return null;

  return (
    <>
      <PageHero
        locale={locale}
        eyebrow={text(product.eyebrow, locale)}
        title={text(product.title, locale)}
        lead={text(product.lead, locale)}
        image={resortImages[product.image]}
      />

      <section id="request" className="scroll-mt-24 bg-[var(--surface)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {slug === "topchan" ? (
            <TopchanRequestForm locale={locale} />
          ) : (
            <TubingRequestForm locale={locale} />
          )}
        </div>
      </section>

      {/* Straight under the form: a guest who has just read the tariff is the
          one most worth showing the run to. Photography of the track never
          existed — this footage is the first real look at it. */}
      {slug === "tubing" && <VideoReel locale={locale} clips={tubingVideos} />}

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="motion-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">
              {ABOUT[locale] ?? ABOUT.ru}
            </p>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{text(product.description, locale)}</p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 motion-reveal" data-delay="50">
            {list(product.highlights, locale).map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[var(--muted)]">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]" />
                {item}
              </li>
            ))}
          </ul>

          {/* The operator's own leaflet headings, kept as separate blocks. */}
          {product.sections?.map((section, i) => (
            <div key={text(section.title, locale)} className="mt-10 motion-reveal" data-delay={`${60 + i * 40}`}>
              <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">
                {text(section.title, locale)}
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text(section.body, locale)}</p>
            </div>
          ))}

          <div className="mt-14 motion-reveal" data-delay="100">
            <MediaArchive locale={locale} images={product.gallery} videos={product.videos} />
          </div>
        </div>
      </section>
    </>
  );
}
