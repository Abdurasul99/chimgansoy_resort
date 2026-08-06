"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { contacts } from "@/content/contacts";
import { mainNavigation } from "@/content/navigation";
import { dictionaries } from "@/content/translations";
import { locales, type Locale } from "@/i18n/config";
import { localizePath, switchLocalePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { SeasonToggle } from "@/components/ui/SeasonToggle";
import { lock, unlock } from "@/lib/scroll-lock";
import { onScrollFrame } from "@/lib/scroll-engine";

type HeaderProps = {
  locale: Locale;
};

/**
 * Day products are sold by request form on their own page, not through the
 * rooms engine — a topchan has no check-in date and tubing has no nights.
 *
 * The header CTA used to send every visitor to /bron regardless. A guest
 * reading about the tubing hill pressed the one gold button on the screen and
 * landed in an Exely availability search asking which cabin they wanted
 * (operator, 2026-08-06: «он бронит по системе номеров, а нужно чтобы по
 * системе тюбинга или бассейна»). On these pages the button now scrolls to the
 * form that actually sells the thing being read about.
 */
const DAY_PRODUCT_PATHS = ["/topchan", "/tubing", "/nomera/pool"] as const;

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dict = dictionaries[locale];

  // The request form on every day-product page is anchored #request.
  const dayProduct = DAY_PRODUCT_PATHS.find((p) => pathname.endsWith(localizePath(locale, p)));
  const bookHref = dayProduct ? `${localizePath(locale, dayProduct)}#request` : localizePath(locale, "/bron");
  // Only the rooms engine needs a full page load; an in-page anchor must not
  // reload, or the jump is lost to the navigation.
  const bookReload = !dayProduct;

  // Scrolling down past the hero tucks the bar away; any upward move brings it
  // straight back. Reads from the shared scroll loop rather than adding a second
  // scroll listener, and never hides while the mobile drawer is open.
  useEffect(() => {
    let lastY = window.scrollY;
    return onScrollFrame(({ y }) => {
      setScrolled(y > 48);
      const delta = y - lastY;
      // 6px of slack absorbs sub-pixel jitter from the inertial easing.
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 320);
        lastY = y;
      } else if (y <= 320) {
        setHidden(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    lock();
    return () => unlock();
  }, [isOpen]);

  const isHeroPage = pathname.split("/").length <= 2;
  const isHeaderOnHero = isHeroPage && !scrolled;
  // The burger lives in the bar, so the bar has to stay put while the drawer is
  // open. Derived rather than pushed into state via an effect.
  const isHidden = hidden && !isOpen;
  const languageOptions = [locale, ...locales.filter((item) => item !== locale)];
  // Soft text shadow for header text sitting on the hero photo — extra legibility
  // insurance on top of the scrim, on the brightest parts of the image.
  const heroShadow = isHeaderOnHero ? " [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]" : "";

  return (
    <>
      <header
        className={`sticky top-0 z-50 ${isHeaderOnHero ? "bg-transparent" : "glass-nav"}`}
        style={{
          // `translate` rather than a transform utility, so the slide is a cheap
          // composited move that can't be clobbered by Tailwind transforms.
          translate: isHidden ? "0 -100%" : "0 0",
          transition:
            "translate 420ms var(--ease-premium), background 500ms ease, box-shadow 500ms ease",
        }}
      >
        {/* Legibility scrim — a soft top-down shade behind the header so the white
            nav/lang text stays readable over bright hero photos (sky/snow).
            Only over the hero; pointer-events-none so it never blocks clicks. */}
        {isHeaderOnHero && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/30 to-transparent"
            aria-hidden="true"
          />
        )}
        <div className="relative z-10 mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={localizePath(locale)}
            className="group min-w-0 shrink-0"
            onClick={() => setIsOpen(false)}
            prefetch={false}
          >
            <div className="px-2 py-1 transition-all duration-500">
              <div className="relative" style={{ width: "100px", height: "62px" }}>
                <img
                  src="/images/resort/chimgan_darbaza.svg"
                  alt="CHIMGAN DARBAZA Resort"
                  className="logo-img"
                  style={{ display: "block", width: "100px", height: "auto" }}
                />
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {mainNavigation.map((item) => {
              const href = localizePath(locale, item.href);
              const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={item.href}
                  href={href}
                  prefetch={false}
                  className={`nav-link text-[13px] font-semibold tracking-wide transition-colors duration-300 ${
                    isHeaderOnHero
                      ? isActive
                        ? "text-white active"
                        : "text-white/85 hover:text-white"
                      : isActive
                        ? "text-[var(--sun-dark)] active"
                        : "text-[var(--ink)] hover:text-[var(--sun)]"
                  }${heroShadow}`}
                >
                  {text(item.label, locale)}
                </Link>
              );
            })}
          </nav>

          {/* Desktop controls */}
          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            {/* Season toggle.
                Hidden between 1024 and 1279px. At exactly 1024 — iPad
                landscape — this cluster came to 390px against a 1024px
                viewport and pushed the page 18px wide, in Russian only, where
                «Забронировать» is the longest of the three labels. The toggle
                is the one decorative item here; the language switcher and the
                booking button both have to stay. */}
            <div className="hidden xl:block">
              <SeasonToggle onDark={isHeaderOnHero} locale={locale} />
            </div>

            {/* Language switcher */}
            <div className="flex items-center gap-1" aria-label="Language switcher">
              {languageOptions.map((item, i) => (
                <span key={item} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className={`text-[10px] ${isHeaderOnHero ? "text-white/50" : "text-[var(--muted)]/40"}`}>{"\u00B7"}</span>
                  )}
                  {/* Full navigation — the Exely widget must reload in the new language */}
                  {/* min-h-11 + px: the label is 19×20 px of text, which is
                      well under the ~44 px a thumb needs. Padding grows the tap
                      target without moving the type, so RU/UZ/EN stop being a
                      three-way coin toss on a phone. */}
                  <a
                    href={switchLocalePath(pathname, item)}
                    aria-current={item === locale ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center px-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                      item === locale
                        ? isHeaderOnHero ? "text-white" : "text-[var(--ink)]"
                        : isHeaderOnHero ? "text-white/75 hover:text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }${heroShadow}`}
                  >
                    {item.toUpperCase()}
                  </a>
                </span>
              ))}
            </div>

            {/* Book CTA — full navigation so the Exely engine embeds on /bron;
                on a day-product page it points at that page own request form. */}
            <a
              href={bookHref}
              {...(bookReload ? {} : { "data-anchor": "request" })}
              className="btn-press btn-glow-primary inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-bold"
            >
              {dict.bookNow}
            </a>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 lg:hidden ${
              isHeaderOnHero ? "text-white" : "text-[var(--ink)]"
            }`}
            aria-expanded={isOpen}
            aria-label={isOpen ? dict.close : dict.menu}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span className="sr-only">{isOpen ? dict.close : dict.menu}</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Full-screen mobile overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-[var(--paper)] transition-all duration-500 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-[4.5rem] items-center justify-between px-4 sm:px-6 border-b border-[var(--line)]">
          <div className="relative" style={{ width: "100px", height: "62px" }}>
            <img
              src="/images/resort/chimgan_darbaza.svg"
              alt="CHIMGAN DARBAZA Resort"
              className="logo-img"
              style={{ display: "block", width: "100px", height: "auto" }}
            />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label={dict.close}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center px-6" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {mainNavigation.map((item, i) => {
              const href = localizePath(locale, item.href);
              const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(href));
              return (
                <li
                  key={item.href}
                  className={`transition-all duration-500 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  style={{ transitionDelay: isOpen ? `${i * 60 + 80}ms` : "0ms" }}
                >
                  <Link
                    href={href}
                    className={`block py-3 font-serif text-4xl font-semibold leading-none tracking-tight transition-colors ${
                      isActive ? "text-[var(--sun)]" : "text-[var(--ink)] hover:text-[var(--sun)]"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {text(item.label, locale)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 pb-10 space-y-4">
          <a
            href={bookHref}
            className="btn-press flex items-center justify-center rounded-full bg-[var(--sun)] py-4 text-base font-bold text-[var(--on-accent)] transition-all duration-300 hover:bg-[var(--sun-dark)]"
            onClick={() => setIsOpen(false)}
          >
            {dict.bookNow}
          </a>
          <div className="flex items-center justify-between">
            <a
              href={`tel:${contacts.phone.replaceAll(" ", "")}`}
              className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              {contacts.phone}
            </a>
            <div className="flex items-center gap-3">
              {languageOptions.map((item) => (
                <a
                  key={item}
                  href={switchLocalePath(pathname, item)}
                  aria-current={item === locale ? "true" : undefined}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-bold uppercase transition-colors ${
                    item === locale ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

