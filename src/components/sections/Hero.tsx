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

      {/* Santa Claus — flies across upper hero, winter only */}
      <div
        className="hero-santa top-[12%] right-0 z-[3] sm:top-[10%]"
        aria-hidden="true"
      >
        <div className="hero-santa__inner">
          <svg
            viewBox="0 0 290 95"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "clamp(180px, 26vw, 340px)", height: "auto", display: "block" }}
          >
            {/* ── Reindeer 1 — Rudolph (front) ── */}
            <ellipse cx="46" cy="63" rx="23" ry="9" fill="#8B4513" transform="rotate(-10 46 63)"/>
            <polygon points="26,57 33,48 40,59" fill="#8B4513"/>
            <circle cx="20" cy="46" r="9" fill="#7a3c10"/>
            <path d="M16,38 L11,23 L7,15 M11,23 L15,17" stroke="#5a2e0a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M22,37 L24,22 L27,14 M24,22 L20,15" stroke="#5a2e0a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="13" cy="44" r="1.8" fill="#0f0600"/>
            <circle cx="11" cy="50" r="5" fill="#e74c3c" opacity="0.28"/>
            <circle cx="11" cy="50" r="3" fill="#e74c3c"/>
            <line x1="34" y1="71" x2="25" y2="87" stroke="#7a3c10" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="42" y1="72" x2="37" y2="89" stroke="#7a3c10" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="53" y1="71" x2="62" y2="87" stroke="#7a3c10" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="59" y1="70" x2="69" y2="85" stroke="#7a3c10" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="24" cy="88" rx="4" ry="2" fill="#1a0a00"/>
            <ellipse cx="61" cy="88" rx="4" ry="2" fill="#1a0a00"/>

            {/* ── Reindeer 2 (behind) ── */}
            <g transform="translate(68,-7)" opacity="0.88">
              <ellipse cx="46" cy="63" rx="23" ry="9" fill="#6B3410" transform="rotate(-10 46 63)"/>
              <polygon points="26,57 33,48 40,59" fill="#6B3410"/>
              <circle cx="20" cy="46" r="9" fill="#5a2e0a"/>
              <path d="M16,38 L11,23 L7,15 M11,23 L15,17" stroke="#3a1e06" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M22,37 L24,22 L27,14 M24,22 L20,15" stroke="#3a1e06" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="13" cy="44" r="1.8" fill="#0f0600"/>
              <ellipse cx="11" cy="50" rx="3" ry="2" fill="#5a2e0a"/>
              <line x1="34" y1="71" x2="25" y2="87" stroke="#5a2e0a" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="42" y1="72" x2="37" y2="89" stroke="#5a2e0a" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="53" y1="71" x2="62" y2="87" stroke="#5a2e0a" strokeWidth="2.5" strokeLinecap="round"/>
              <ellipse cx="24" cy="88" rx="4" ry="2" fill="#0f0600"/>
            </g>

            {/* ── Harness & bells ── */}
            <path d="M30,52 Q100,47 156,56" stroke="#4a2a0a" strokeWidth="1.5" fill="none"/>
            <path d="M86,46 Q120,47 156,56" stroke="#4a2a0a" strokeWidth="1.5" fill="none"/>
            <circle cx="118" cy="50" r="3.5" fill="#f0c26a"/>
            <path d="M116,52 L116,56 M118,52 L118,56 M120,52 L120,56" stroke="#c8962a" strokeWidth="0.8" fill="none"/>
            <circle cx="100" cy="51" r="2.8" fill="#f0c26a"/>

            {/* ── Sleigh ── */}
            <path d="M150,33 Q158,17 187,21 L225,23 Q242,25 240,47 Q238,63 222,66 L168,66 Q149,66 148,51 Z" fill="#c0392b"/>
            <path d="M159,39 Q183,22 220,27" stroke="#f0c26a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
            <path d="M152,66 Q188,76 238,72" stroke="#7a4010" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M152,66 Q143,70 146,77 Q150,83 160,79" stroke="#7a4010" strokeWidth="3" fill="none" strokeLinecap="round"/>

            {/* ── Gift sack ── */}
            <ellipse cx="170" cy="52" rx="13" ry="11" fill="#7a4010"/>
            <ellipse cx="170" cy="42" rx="5" ry="3.5" fill="#7a4010"/>
            <path d="M165,41 Q170,36 175,41" stroke="#f0c26a" strokeWidth="1.5" fill="none"/>
            <circle cx="170" cy="38" r="3" fill="#f0c26a"/>

            {/* ── Santa ── */}
            {/* Body */}
            <ellipse cx="200" cy="51" rx="18" ry="14" fill="#c0392b"/>
            <path d="M183,58 Q200,65 217,58" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M183,51 Q200,54 217,51" stroke="#111" strokeWidth="3" fill="none"/>
            <rect x="195" y="48" width="9" height="7" rx="1.5" fill="#f0c26a"/>
            {/* Head */}
            <circle cx="198" cy="31" r="12" fill="#ffcba4"/>
            {/* Hat */}
            <path d="M188,26 L197,4 L207,26" fill="#c0392b"/>
            <path d="M185,26 Q198,22 210,26" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <circle cx="197" cy="5" r="4.5" fill="white"/>
            {/* Beard */}
            <path d="M186,36 Q192,46 198,48 Q204,46 210,36" fill="white"/>
            <path d="M188,36 Q193,40 198,38 Q203,40 208,36" fill="white"/>
            {/* Eyes (happy arcs) */}
            <path d="M191,28 Q193,26 195,28" stroke="#3a2010" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M201,28 Q203,26 205,28" stroke="#3a2010" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            {/* Cheeks */}
            <circle cx="189" cy="35" r="4" fill="#e8845a" opacity="0.42"/>
            <circle cx="207" cy="35" r="4" fill="#e8845a" opacity="0.42"/>
            {/* Waving arm */}
            <path d="M184,44 Q173,34 163,25" stroke="#c0392b" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
            <circle cx="162" cy="24" r="7.5" fill="#c0392b"/>
            <path d="M157,30 Q163,32 170,28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Christmas tree — right side, raised above assistant btn, CSS-hidden in summer */}
      <div
        className="hero-xmas-tree absolute bottom-20 right-[2%] z-[3] sm:bottom-24 lg:right-[5%]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 110 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "clamp(110px, 13vw, 175px)", height: "auto", display: "block" }}
        >
          {/* Star — opacity animation only, NO SVG filter (feGaussianBlur kills GPU compositing) */}
          <g className="xmas-star">
            <polygon points="55,4 58,15 70,15 61,22 64,33 55,26 46,33 49,22 40,15 52,15" fill="#f0c26a"/>
            <polygon points="55,4 58,15 70,15 61,22 64,33 55,26 46,33 49,22 40,15 52,15" fill="rgba(255,220,100,0.4)" transform="scale(1.25) translate(-11,-3)"/>
          </g>

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

        {/* Heading — split display: last word in italic gold, oversized */}
        <h1
          className="display-xl motion-rise font-serif font-bold text-white"
          style={{ animationDelay: "80ms" }}
        >
          {dict.home.title.split(" ").slice(0, -1).join(" ")}
          <br />
          <em className="text-[var(--sun)]">{dict.home.title.split(" ").at(-1)}</em>
        </h1>

        {/* Altitude stamp — art-direction mark, desktop only */}
        <div
          className="motion-rise pointer-events-none absolute right-6 top-40 hidden rotate-12 lg:block"
          style={{ animationDelay: "500ms" }}
          aria-hidden="true"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-white/35 text-center">
            <div>
              <p className="font-serif text-2xl font-bold leading-none text-white/90">1700</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
                {locale === "ru" ? "метров" : locale === "uz" ? "metr" : "meters"}
              </p>
            </div>
          </div>
        </div>

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
            className="btn-press btn-glow-primary btn-pulse group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition duration-300"
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
