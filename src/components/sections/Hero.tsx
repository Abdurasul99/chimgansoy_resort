import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { WeatherWidget } from "@/components/sections/WeatherWidget";
import { EmotionCycle } from "@/components/ui/EmotionCycle";

type HeroProps = {
  locale: Locale;
};

export function Hero({ locale }: HeroProps) {
  const dict = dictionaries[locale];
  const image = resortImages.nightHero;

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden -mt-[4.5rem]"
      aria-label="Hero"
    >
      <div
        className="absolute inset-0 -z-20 scale-[1.04] bg-cover bg-center motion-hero-image"
        style={imageStyle(image)}
        role="img"
        aria-label={text(image.alt, locale)}
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(15,25,40,0.62)_68%,rgba(15,25,40,0.88)_100%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-36 sm:px-6 lg:pb-24 lg:px-8">

        <div className="motion-rise mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sun)]" aria-hidden="true" />
            {dict.home.eyebrow}
          </span>
        </div>

        <h1
          className="display-hero motion-rise font-serif font-bold text-white"
          style={{ animationDelay: "80ms" }}
        >
          {dict.home.title}
        </h1>

        <div className="motion-rise mt-5" style={{ animationDelay: "140ms" }}>
          <EmotionCycle locale={locale} />
        </div>

        <p
          className="motion-rise mt-4 max-w-lg text-[1.1rem] leading-[1.75] text-white/75"
          style={{ animationDelay: "200ms" }}
        >
          {dict.home.lead}
        </p>

        <div
          className="motion-rise mt-10 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <ButtonLink href={localizePath(locale, "/bron")} variant="primary" className="btn-press">
            {dict.bookNow}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/nomera")} variant="light" className="btn-press">
            {dict.details}
          </ButtonLink>
        </div>

        <div
          className="motion-rise mt-12 flex flex-wrap gap-2"
          style={{ animationDelay: "320ms" }}
        >
          {dict.home.territoryPills.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/25 bg-white/12 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="motion-rise mt-6" style={{ animationDelay: "400ms" }}>
          <WeatherWidget locale={locale} />
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 motion-rise"
        style={{ animationDelay: "600ms" }}
        aria-hidden="true"
      >
        <svg
          className="h-8 w-8 text-white/50"
          style={{ animation: "bounce-y 2s ease-in-out infinite" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.4}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
