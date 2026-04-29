import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { WeatherWidget } from "@/components/sections/WeatherWidget";
import { EmotionCycle } from "@/components/ui/EmotionCycle";
import { HeroSlideshow } from "@/components/sections/HeroSlideshow";
import { SnowParticles } from "@/components/effects/SnowParticles";

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

      {/* Snow — absolute inside hero section (overflow:hidden clips it to hero only) */}
      <SnowParticles />

      {/* Christmas tree — right side, CSS-hidden in summer */}
      <div
        className="hero-xmas-tree absolute bottom-0 right-[3%] z-[3] lg:right-[6%]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 110 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "clamp(70px, 9vw, 130px)", height: "auto", display: "block" }}
        >
          {/* Glowing star */}
          <g className="xmas-star">
            <polygon
              points="55,4 58,15 70,15 61,22 64,33 55,26 46,33 49,22 40,15 52,15"
              fill="#f0c26a"
              filter="url(#star-glow)"
            />
          </g>
          <defs>
            <filter id="star-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Tree layers — darker on left (shadow), lighter on right */}
          <polygon points="55,12 40,38 70,38" fill="#145a2e"/>
          <polygon points="55,12 40,38 70,38" fill="#1a7038" opacity="0.6"/>
          <polygon points="55,26 34,58 76,58" fill="#145a2e"/>
          <polygon points="55,42 26,80 84,80" fill="#145a2e"/>
          <polygon points="55,58 18,106 92,106" fill="#145a2e"/>

          {/* Snow on branches */}
          <path d="M40,38 Q55,33 70,38" fill="none" stroke="rgba(230,245,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M34,58 Q55,52 76,58" fill="none" stroke="rgba(230,245,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M26,80 Q55,73 84,80" fill="none" stroke="rgba(230,245,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M18,106 Q55,98 92,106" fill="none" stroke="rgba(230,245,255,0.75)" strokeWidth="2.5" strokeLinecap="round"/>

          {/* Trunk */}
          <rect x="48" y="106" width="14" height="22" rx="3" fill="#6b3f1e"/>

          {/* Ornaments with twinkling classes */}
          <circle className="xlight-a"  cx="44" cy="34" r="4"   fill="#e74c3c"/>
          <circle className="xlight-b"  cx="66" cy="34" r="3.5" fill="#f0c26a"/>
          <circle className="xlight-c"  cx="36" cy="54" r="3.5" fill="#00d4aa"/>
          <circle className="xlight-a2" cx="74" cy="54" r="3"   fill="#e74c3c"/>
          <circle className="xlight-b2" cx="30" cy="76" r="3.5" fill="#f0c26a"/>
          <circle className="xlight-c2" cx="80" cy="76" r="3"   fill="#00d4aa"/>
          <circle className="xlight-a3" cx="55" cy="62" r="3"   fill="#e8f4ff"/>
          <circle className="xlight-b3" cx="22" cy="100" r="3.5" fill="#e74c3c"/>
          <circle className="xlight-c"  cx="88" cy="98" r="3"   fill="#f0c26a"/>
          <circle className="xlight-a2" cx="48" cy="90" r="2.5" fill="#e8f4ff"/>
          <circle className="xlight-b3" cx="62" cy="96" r="2.5" fill="#00d4aa"/>

          {/* Subtle light glow dots */}
          <circle className="xlight-a"  cx="44" cy="34" r="7" fill="#e74c3c" opacity="0.18"/>
          <circle className="xlight-b"  cx="66" cy="34" r="6" fill="#f0c26a" opacity="0.18"/>
          <circle className="xlight-c"  cx="36" cy="54" r="6" fill="#00d4aa" opacity="0.18"/>
        </svg>
      </div>

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
