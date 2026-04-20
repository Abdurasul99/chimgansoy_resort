import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

type HeroProps = {
  locale: Locale;
};

export function Hero({ locale }: HeroProps) {
  const dict = dictionaries[locale];
  const image = resortImages.hero;

  return (
    <section className="hero-shell relative isolate flex min-h-[calc(100svh-88px)] items-end overflow-hidden bg-[var(--ink)] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div
        className="absolute inset-0 -z-20 bg-cover motion-hero-image"
        style={imageStyle(image)}
        role="img"
        aria-label={text(image.alt, locale)}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,18,14,0.88),rgba(12,18,14,0.52),rgba(12,18,14,0.16))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-52 bg-[linear-gradient(0deg,rgba(12,18,14,0.88),rgba(12,18,14,0))]" />

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
          <div className="max-w-4xl motion-rise">
            <p className="mb-5 inline-flex rounded-[6px] border border-white/18 bg-white/12 px-3 py-2 text-xs font-bold uppercase text-white/78 backdrop-blur">
              {dict.home.eyebrow}
            </p>
            <h1 className="font-serif text-5xl font-bold leading-none text-white sm:text-7xl lg:text-8xl">
            {dict.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/84 sm:text-xl">{dict.home.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/bron")} variant="light">
                {dict.bookNow}
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/nomera")} variant="primary">
                {dict.details}
              </ButtonLink>
            </div>
          </div>

          <div className="hidden rounded-[8px] border border-white/18 bg-white/12 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:block">
            <p className="text-xs font-bold uppercase text-white/60">{dict.chooseDates}</p>
            <p className="mt-3 font-serif text-3xl font-semibold leading-tight">{dict.home.heroOffer}</p>
            <div className="mt-5 grid gap-2">
              {dict.home.territoryPills.slice(0, 3).map((item) => (
                <span key={item} className="rounded-[6px] border border-white/14 bg-white/10 px-3 py-2 text-sm font-semibold text-white/82">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
