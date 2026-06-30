import { resortImages } from "@/content/images";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

/**
 * Dedicated, bookable Pool feature. Separate from the generic leisure cards so it
 * stands out, with the pool render and a "Book online" CTA that opens the Exely
 * engine on /bron. Once the operator publishes the pool as a bookable item in
 * Exely and shares its room-type id, change the CTA href to
 * `/bron?room-type=<id>` so the guest lands straight on it.
 */

const COPY: Record<
  Locale,
  { eyebrow: string; title: string; subtitle: string; cta: string; highlights: string[] }
> = {
  ru: {
    eyebrow: "Бассейн на территории",
    title: "Бассейн-лагуна",
    subtitle:
      "Большой бассейн-лагуна с баром у воды, шезлонгами и приватными кабанами — отдельная зона отдыха с панорамой Чимгана. Забронируйте место онлайн заранее.",
    cta: "Забронировать онлайн",
    highlights: ["Бар у воды", "Шезлонги и кабаны", "Деревянная зона отдыха", "Вид на горы Чимгана"],
  },
  uz: {
    eyebrow: "Hududdagi basseyn",
    title: "Laguna-basseyn",
    subtitle:
      "Suv ichidagi bar, shezlonglar va xususiy kabanalar bilan katta laguna-basseyn — Chimgon panoramasi bilan alohida dam olish zonasi. Joyni oldindan onlayn bron qiling.",
    cta: "Onlayn bron qilish",
    highlights: ["Suv yonida bar", "Shezlong va kabanalar", "Yog'och dam olish zonasi", "Chimgon tog' manzarasi"],
  },
  en: {
    eyebrow: "Pool on the grounds",
    title: "Lagoon pool",
    subtitle:
      "A large lagoon-style pool with a swim-up bar, loungers, and private cabanas — a dedicated relaxation zone with Chimgan views. Book your spot online in advance.",
    cta: "Book online",
    highlights: ["Swim-up bar", "Loungers & cabanas", "Wooden lounge deck", "Chimgan mountain views"],
  },
};

export function PoolBooking({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const img = resortImages.pool;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="pool-title">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[var(--ink)] shadow-[var(--shadow-card)]">
        <div className="grid lg:grid-cols-2">
          {/* Pool render */}
          <div
            className="relative min-h-[260px] bg-cover bg-center sm:min-h-[340px] lg:min-h-[480px]"
            style={imageStyle(img)}
            role="img"
            aria-label={text(img.alt, locale)}
          />

          {/* Content */}
          <div className="flex flex-col justify-center gap-5 p-7 text-white sm:p-10 lg:p-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{t.eyebrow}</p>
            <h2 id="pool-title" className="font-serif text-4xl font-bold leading-[1.05] sm:text-5xl">
              {t.title}
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/75">{t.subtitle}</p>

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-sm text-white/85">
                  <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sun)]" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-2">
              <ButtonLink href={localizePath(locale, "/bron")} variant="primary" reload className="btn-press">
                {t.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
