import { dictionaries } from "@/content/translations";
import { topchanPricing } from "@/content/pricing";
import { resolvePricing, type LivePricing } from "@/lib/pricing-resolve";
import { money } from "@/lib/venue-facts";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { HeroSlideshow } from "@/components/sections/HeroSlideshow";
import { BookingWidget } from "@/components/sections/BookingWidget";
import { HeroScrollCue } from "@/components/ui/HeroScrollCue";
import { Icon } from "@/components/ui/Icon";
import { poolClosure } from "@/content/pool-closure";
import { promotions } from "@/content/promotions";

type HeroProps = {
  locale: Locale;
  /** Live tariff; defaults to the code's constants for a standalone render. */
  pricing?: LivePricing;
};

/**
 * Second line of the pool CTA — the terms that make it worth a tap.
 *
 * A function of the tariff rather than a string. This is the most visible price
 * on the site, and it used to be prose: neither an admin edit nor a change to
 * pricing.ts could reach it, only a rewrite of this file.
 */
function poolHint(live: LivePricing, locale: Locale): string {
  const from = money(live.pool.adult.weekday);
  return {
    ru: `Тариф на целый день · от ${from} сум · заявка за минуту`,
    uz: `Kun bo'yi tarif · ${from} so'mdan · bir daqiqada ariza`,
    en: `Full-day pass · from ${from} UZS · a one-minute request`,
  }[locale];
}

/**
 * The two day products sold beside the pool.
 *
 * Smaller than the pool button and side by side, because the pool is what the
 * homepage leads on — but each has its own page and its own request form, so
 * each needs its own way out of the first screen rather than being buried in
 * the navigation.
 *
 * Prices come from the tariff: the topchan rate and the CHEAPEST tubing
 * package, so the "от" stays true whatever the operator sets in the admin.
 */
function dayCtas(
  live: LivePricing,
  locale: Locale,
): { href: string; icon: "topchan" | "snowflake"; label: string; hint: string }[] {
  const topchan = money(live.topchan.weekday);
  const ride = money(Math.min(...live.tubing.packages.map((p) => p.price)));
  const cap = topchanPricing.capacity;
  const rides = live.tubing.packages.map((p) => p.rides).join(" / ");

  return [
    {
      href: "/topchan#request",
      icon: "topchan",
      label: { ru: "Топчан", uz: "Topchan", en: "Topchan" }[locale],
      hint: {
        ru: `до ${cap} гостей · от ${topchan} сум`,
        uz: `${cap} kishigacha · ${topchan} so'mdan`,
        en: `up to ${cap} guests · from ${topchan} UZS`,
      }[locale],
    },
    {
      href: "/tubing#request",
      icon: "snowflake",
      label: { ru: "Тюбинг горка", uz: "Tubing gorkasi", en: "Tubing hill" }[locale],
      hint: {
        ru: `${rides} спуска · от ${ride} сум`,
        uz: `${rides} marta · ${ride} so'mdan`,
        en: `${rides} rides · from ${ride} UZS`,
      }[locale],
    },
  ];
}

export function Hero({ locale, pricing }: HeroProps) {
  const live = pricing ?? resolvePricing();
  const ctas = dayCtas(live, locale);
  /**
   * Ведущая акция для первого экрана. Заголовок берётся из promotions.ts —
   * оттуда же, откуда его читает секция ниже: две копии одного обещания
   * разойдутся в первый же месяц.
   */
  const lead = promotions[0];
  const heroPromo = {
    title: { ru: "Третья ночь в подарок", uz: "Uchinchi kecha sovg'a", en: "Third night free" }[locale],
    hint: {
      ru: "Оплачиваете 2 ночи · только будни",
      uz: "2 kecha uchun to'laysiz · faqat ish kunlari",
      en: "Pay for 2 nights · weekdays only",
    }[locale],
    slug: lead.slug,
  };
  const dict = dictionaries[locale];

  return (
    <section
      // bg-[#0f1928]: solid dark base (matches the gradient navy, season-proof —
      // not --ink, which flips to light in winter) so the white title is always
      // legible while the hero photo is still downloading. No more blank/cream flash.
      // items-center, not items-end: the whole composition sits in the middle of
      // the screen. Safe with min-h (not h): when the stack is taller than the
      // viewport the section grows instead of centring and clipping the top.
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden -mt-[4.5rem] bg-[#0f1928]"
      aria-label="Hero"
      // Marks this section for the scroll engine: it publishes --hero-shift /
      // --hero-fade / --hero-media here as the hero leaves the viewport.
      data-hero-fx
    >
      {/* Dynamic photo slideshow — rotates summer photos, switches to winter in Dec–Mar */}
      <HeroSlideshow />

      {/* Cinematic scrim — stronger through the title band so the white
          headline stays legible on any slide (bright sky included) */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,17,28,0.42)_0%,rgba(10,17,28,0.22)_20%,rgba(10,17,28,0.42)_48%,rgba(10,17,28,0.68)_72%,rgba(10,17,28,0.92)_100%)]" />

      {/* pb-36 on phones. The concierge launcher is fixed at bottom-[4.5rem]
          (72px) and stands ~56px tall, so it occupies the last ~128px of the
          viewport; anything less than that here leaves it sitting on top of the
          widget's submit button.

          From sm up the padding is symmetric, which is what actually centres the
          block: -mt-[4.5rem] only cancels the 4.5rem the header occupies in
          flow, so the section already starts at the top of the screen and needs
          no correction. (An earlier attempt added 4.5rem to the top for a header
          offset that does not exist — and because a centred box splits a padding
          difference in half, it landed the block 36px low and pushed the hero
          13px past the fold at 1280x720.) */}
      <div className="hero-content relative z-[4] mx-auto w-full max-w-7xl px-4 pb-36 pt-28 sm:px-6 sm:pb-24 sm:pt-24 lg:pb-24 lg:pt-24 lg:px-8">

        {/* Title, chips and lead form ONE column beside the booking stack.
            The title used to span the full width above this grid, so the hero
            was h1 + max(lead, booking) tall — 1095px against a 770px laptop
            viewport, with a 455px void between the title and the lead because
            the short lead was bottom-aligned to the tall booking column. Beside
            it instead, the hero is max(left, right) and the title sits with the
            text it belongs to. */}
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-12">
          {/* min-w-0 on both columns: a grid item defaults to min-width:auto and
              refuses to shrink below its content, so on a 390px phone the
              booking card was rendering 389px wide inside a 358px track and its
              right edge was being clipped by the hero's overflow-hidden. The
              desktop template guards this with minmax(0,…); the mobile
              single-column fallback did not. */}
          <div className="hero-title-col min-w-0">
            {/* Heading — split display: last word in italic gold, oversized */}
            <h1
              className="hero-title motion-rise font-serif font-bold text-white"
              style={{ animationDelay: "80ms", textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
            >
              {dict.home.title.split(" ").slice(0, -1).join(" ")}
              <br />
              <em className="text-[var(--sun)]">{dict.home.title.split(" ").at(-1)}</em>
            </h1>

            {/* What you actually book here, in three words each. The hero used
                to say "day visit, topchans" — this is the stay-led replacement,
                and it sits above the lead so the format registers before the
                prose does. */}
            <ul
              className="motion-rise mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4"
              style={{ animationDelay: "160ms" }}
            >
              {/* Пока бассейн закрыт, первый экран о нём молчит: обещание в
                  тексте хуже фотографии — его читают все и запоминают. Вернётся
                  вместе с флагом poolClosure. */}
              {(poolClosure.closed ? dict.home.heroChips : dict.home.heroChipsPool).map((chip, i) => (
                <li key={chip} className="flex items-center gap-3 sm:gap-4">
                  {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--sun)]/70" />}
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75 sm:text-xs">
                    {chip}
                  </span>
                </li>
              ))}
            </ul>

            <p
              className="motion-rise mt-7 min-w-0 max-w-md text-[1.1rem] leading-[1.7] text-white/85"
              style={{ animationDelay: "200ms" }}
            >
              {dict.home.lead}
            </p>
          </div>

          {/* RIGHT — booking search box, plus a way past it. The widget searches
              stays; the pool is the one thing sold without a night, and it had
              no route out of the first screen. Plain <a>, not the router link,
              so /bron loads fresh and Exely's embed script runs. */}
          <div className="motion-rise w-full min-w-0 max-w-xl lg:max-w-none" style={{ animationDelay: "240ms" }}>
            {/* Above the date picker, not below it. The widget searches stays;
                the pool is what the homepage leads on now, so it takes the
                first position and the larger footprint. Solid gold, because a
                translucent card over a photograph of water is the one
                treatment guaranteed to go unnoticed. */}
            {/*
                Золотая кнопка бассейна снята: бассейн закрыт оператором
                27.08.2026 (src/content/pool-closure.ts). Она вела прямо к форме
                заявки, которой теперь нет, — а это первый экран сайта.

                Возвращается вместе с флагом: closed: false.
            */}
            {!poolClosure.closed && (
              <a
                href={localizePath(locale, "/nomera/pool#pool-request")}
                className="btn-press group mb-3 flex w-full items-center gap-4 rounded-2xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-5 py-5 text-[var(--on-accent)] shadow-[0_18px_44px_-12px_rgba(220,140,0,0.9)] transition-all duration-300 hover:brightness-[1.05] sm:px-6 sm:py-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--on-accent)]/12 sm:h-14 sm:w-14">
                  <Icon name="pool" className="h-7 w-7 sm:h-8 sm:w-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.2rem] font-extrabold leading-tight sm:text-[1.4rem]">
                    {dict.home.heroPoolCta}
                  </span>
                  <span className="mt-1 block text-[0.8rem] font-semibold leading-snug opacity-75 sm:text-[0.88rem]">
                    {poolHint(live, locale)}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-2xl font-bold transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            )}

            {/*
                Акция на первом экране — в той позиции, где стояла золотая
                кнопка бассейна. Пока бассейн закрыт, это место пустует, а
                предложение, ради которого гость и приходит из сторис, лежало
                на пять экранов ниже: до него доскроллили единицы.

                Ведёт не сразу в бронирование, а к секции акций экраном ниже:
                у «2+1» есть условия (только будни, выезд не позже пятницы), и
                гость должен увидеть их до того, как выберет выходные.
            */}
            <a
              data-hero-promo
              href="#offers"
              className="btn-press group mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-4 py-3.5 text-[var(--ink)] shadow-[0_10px_30px_rgba(0,0,0,.28)] transition-shadow duration-300 hover:shadow-[0_14px_38px_rgba(0,0,0,.36)] sm:px-5 sm:py-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/12 text-[0.82rem] font-black leading-none sm:h-12 sm:w-12 sm:text-[0.92rem]">
                −33%
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-extrabold leading-tight sm:text-[1.1rem]">
                  {heroPromo.title}
                </span>
                <span className="mt-0.5 block text-[0.72rem] font-semibold leading-snug opacity-75 sm:text-[0.82rem]">
                  {heroPromo.hint}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-2xl font-bold transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>

            {/* Topchan and tubing, side by side under the pool. Glass over the
                photograph rather than gold: three solid gold blocks would fight
                each other and the pool would stop reading as the lead. */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3">
              {ctas.map((cta) => (
                <a
                  key={cta.href}
                  href={localizePath(locale, cta.href)}
                  className="btn-press group flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/12 px-3.5 py-3.5 text-white backdrop-blur-md transition-all duration-300 hover:border-white/35 hover:bg-white/20 sm:gap-3 sm:px-5 sm:py-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 sm:h-11 sm:w-11">
                    <Icon name={cta.icon} className="h-[1.15rem] w-[1.15rem] sm:h-6 sm:w-6" />
                  </span>
                  {/* Wrapping, not truncating. At 360px "Тюбинг горка" and
                      "2 или 4 спуска" both hit the ellipsis, and a CTA that
                      ends in "Тюбин…" tells a guest nothing. */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9rem] font-extrabold leading-tight sm:text-[1.05rem]">
                      {cta.label}
                    </span>
                    <span className="mt-0.5 block text-[0.7rem] font-semibold leading-snug text-white/70 sm:text-[0.78rem]">
                      {cta.hint}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="hidden shrink-0 text-lg font-bold transition-transform duration-300 group-hover:translate-x-1 sm:block"
                  >
                    →
                  </span>
                </a>
              ))}
            </div>

            <BookingWidget locale={locale} variant="hero" />
          </div>
        </div>
      </div>

      {/* Scroll cue — hairline with a light running down it, and a real
          control: clicking hands off to the smooth-scroll engine. */}
      {/* Centred with flexbox, not -translate-x-1/2. The scroll-out rule that
          used to override the -50% is gone now, but flex centring needs no
          transform at all — it cannot be overridden by one either. */}
      <div
        className="absolute inset-x-0 bottom-7 flex justify-center motion-rise"
        style={{ animationDelay: "600ms" }}
      >
        <HeroScrollCue locale={locale} />
      </div>
    </section>
  );
}
