import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

type HeroProps = {
  locale: Locale;
};

export function Hero({ locale }: HeroProps) {
  const dict = dictionaries[locale];
  const image = resortImages.hero;

  return (
    <section className="hero-shell relative isolate flex min-h-[calc(100svh-112px)] items-end overflow-hidden bg-[var(--ink)] px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center motion-hero-image"
        style={{ backgroundImage: `url(${image.src})` }}
        role="img"
        aria-label={text(image.alt, locale)}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,24,19,0.82),rgba(15,24,19,0.38),rgba(15,24,19,0.18))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-[linear-gradient(0deg,rgba(15,24,19,0.68),rgba(15,24,19,0))]" />

      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl motion-rise">
          <p className="mb-5 text-xs font-bold uppercase text-white/74">{dict.home.eyebrow}</p>
          <h1 className="font-serif text-6xl font-bold leading-none text-white sm:text-7xl lg:text-8xl">
            {dict.home.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">{dict.home.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={localizePath(locale, "/bron")} variant="light">
              {dict.bookNow}
            </ButtonLink>
            <ButtonLink href={localizePath(locale, "/nomera")} variant="primary">
              {dict.details}
            </ButtonLink>
          </div>
          <div className="mt-8 inline-flex max-w-full rounded-[6px] border border-white/24 bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
            {dict.home.heroOffer}
          </div>
        </div>
      </div>
    </section>
  );
}
