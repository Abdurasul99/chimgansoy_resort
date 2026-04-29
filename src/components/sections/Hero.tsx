import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { WeatherWidget } from "@/components/sections/WeatherWidget";
import { EmotionCycle } from "@/components/ui/EmotionCycle";
import { HeroSlideshow } from "@/components/sections/HeroSlideshow";

type HeroProps = {
  locale: Locale;
};

export function Hero({ locale }: HeroProps) {
  const dict = dictionaries[locale];

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden -mt-[4.5rem]"
      aria-label="Hero"
    >
      {/* Dynamic photo slideshow — rotates summer photos, switches to winter in Dec–Mar */}
      <HeroSlideshow />

      {/* Cinematic gradient: clear top, darkened bottom for text */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0)_32%,rgba(15,25,40,0.50)_64%,rgba(15,25,40,0.88)_100%)]" />

      {/* Star layers — CSS-controlled, visible only in winter */}
      <div className="hero-stars absolute inset-0 -z-[5]" aria-hidden="true" />
      <div className="hero-stars absolute inset-0 -z-[5]" aria-hidden="true" style={{ animationDelay: "2.1s", filter: "blur(0.3px)" }} />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-36 sm:px-6 lg:pb-24 lg:px-8">

        {/* Heading */}
        <h1
          className="display-hero motion-rise font-serif font-bold text-white"
          style={{ animationDelay: "80ms" }}
        >
          {dict.home.title}
        </h1>

        {/* Cycling emotion phrase */}
        <div className="motion-rise mt-5" style={{ animationDelay: "140ms" }}>
          <EmotionCycle locale={locale} />
        </div>

        {/* Lead text */}
        <p
          className="motion-rise mt-4 max-w-lg text-[1.1rem] leading-[1.75] text-white/80"
          style={{ animationDelay: "200ms" }}
        >
          {dict.home.lead}
        </p>

        {/* CTAs */}
        <div
          className="motion-rise mt-10 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href={localizePath(locale, "/bron")}
            className="btn-press btn-glow-primary group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition duration-300"
          >
            <span>{dict.bookNow}</span>
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href={localizePath(locale, "/nomera")}
            className="btn-press glass-btn group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition duration-300"
          >
            <span>{dict.details}</span>
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Feature pills */}
        <div
          className="motion-rise mt-12 flex flex-wrap gap-2"
          style={{ animationDelay: "320ms" }}
        >
          {dict.home.territoryPills.slice(0, 4).map((item) => (
            <span
              key={item}
              className="glass-badge rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Live weather */}
        <div className="motion-rise mt-6" style={{ animationDelay: "400ms" }}>
          <WeatherWidget locale={locale} />
        </div>
      </div>

      {/* Scroll indicator */}
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
