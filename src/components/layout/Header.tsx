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
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { SeasonToggle } from "@/components/ui/SeasonToggle";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isWinter, setIsWinter] = useState(false);
  const dict = dictionaries[locale];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const read = () => setIsWinter(document.documentElement.getAttribute("data-season") === "winter");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
    return () => obs.disconnect();
  }, []);

  const isHeroPage = pathname.split("/").length <= 2;
  const isHeaderOnHero = isHeroPage && !scrolled;
  const languageOptions = [locale, ...locales.filter((item) => item !== locale)];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isHeaderOnHero ? "bg-transparent" : "glass-nav"
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={localizePath(locale)}
            className="group min-w-0 shrink-0"
            onClick={() => setIsOpen(false)}
            prefetch={false}
          >
            <div className="px-2 py-1 transition-all duration-500">
              <div className="relative overflow-hidden" style={{ width: "118px", height: "46px" }}>
                {isWinter ? (
                  <ChristmasLogo />
                ) : (
                  <img
                    src="/images/resort/chimgansoy.svg"
                    alt="CHIMGANSOY Resort logo"
                    className="logo-img"
                    style={{ position: "absolute", top: "-7px", left: "0", width: "108px", height: "auto" }}
                  />
                )}
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
                        : "text-white/70 hover:text-white"
                      : isActive
                        ? "text-[var(--sun-dark)] active"
                        : "text-[var(--ink)] hover:text-[var(--sun)]"
                  }`}
                >
                  {text(item.label, locale)}
                </Link>
              );
            })}
          </nav>

          {/* Desktop controls */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* Season toggle */}
            <SeasonToggle onDark={isHeaderOnHero} />

            {/* Currency selector */}
            <CurrencySelector onDark={isHeaderOnHero} />

            {/* Language switcher */}
            <div className="flex items-center gap-1" aria-label="Language switcher">
              {languageOptions.map((item, i) => (
                <span key={item} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className={`text-[10px] ${isHeaderOnHero ? "text-white/20" : "text-[var(--muted)]/40"}`}>{"\u00B7"}</span>
                  )}
                  <Link
                    href={switchLocalePath(pathname, item)}
                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                      item === locale
                        ? isHeaderOnHero ? "text-white" : "text-[var(--ink)]"
                        : isHeaderOnHero ? "text-white/40 hover:text-white/80" : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.toUpperCase()}
                  </Link>
                </span>
              ))}
            </div>

            {/* Book CTA */}
            <Link
              href={localizePath(locale, "/bron")}
              className="btn-press btn-glow-primary inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-bold text-white"
            >
              {dict.bookNow}
            </Link>
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
          <div className="relative overflow-hidden" style={{ width: "118px", height: "46px" }}>
            {isWinter ? (
              <ChristmasLogo />
            ) : (
              <img
                src="/images/resort/chimgansoy.svg"
                alt="CHIMGANSOY Resort"
                className="logo-img"
                style={{ position: "absolute", top: "-7px", left: "0", width: "108px", height: "auto" }}
              />
            )}
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
          <Link
            href={localizePath(locale, "/bron")}
            className="btn-press flex items-center justify-center rounded-full bg-[var(--sun)] py-4 text-base font-bold text-white transition-all duration-300 hover:bg-[var(--sun-dark)]"
            onClick={() => setIsOpen(false)}
          >
            {dict.bookNow}
          </Link>
          <div className="flex items-center justify-between">
            <a
              href={`tel:${contacts.phone.replaceAll(" ", "")}`}
              className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              {contacts.phone}
            </a>
            <div className="flex items-center gap-3">
              {languageOptions.map((item) => (
                <Link
                  key={item}
                  href={switchLocalePath(pathname, item)}
                  className={`text-sm font-bold uppercase transition-colors ${
                    item === locale ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ChristmasLogo() {
  return (
    <svg
      viewBox="0 0 354 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CHIMGANSOY Resort"
      style={{ width: "118px", height: "auto", overflow: "visible" }}
    >
      {/* Christmas tree */}
      <g transform="translate(4,6)">
        {/* Star */}
        <polygon points="22,0 24.5,8 33,8 26.5,13 29,21 22,16.5 15,21 17.5,13 11,8 19.5,8" fill="#f0c26a"/>
        {/* Top layer */}
        <polygon points="22,7 12,26 32,26" fill="#1a6b35"/>
        {/* Mid layer */}
        <polygon points="22,17 8,40 36,40" fill="#1a6b35"/>
        {/* Bottom layer */}
        <polygon points="22,28 5,54 39,54" fill="#1a6b35"/>
        {/* Trunk */}
        <rect x="18" y="54" width="8" height="10" rx="2" fill="#7a4f2a"/>
        {/* Ornaments */}
        <circle cx="14" cy="34" r="3.5" fill="#e74c3c"/>
        <circle cx="30" cy="42" r="3" fill="#f0c26a"/>
        <circle cx="12" cy="46" r="2.5" fill="#00d4aa"/>
        <circle cx="32" cy="50" r="2.5" fill="#e74c3c"/>
        <circle cx="21" cy="48" r="2" fill="#c8deff" opacity="0.9"/>
        {/* Snow caps */}
        <path d="M22,7 L12,26 L32,26 Z" fill="rgba(232,244,255,0.25)"/>
      </g>

      {/* CHIMGANSOY */}
      <text
        x="52" y="46"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="29"
        fontWeight="700"
        fill="#e8f4ff"
        letterSpacing="0.8"
      >CHIMGANSOY</text>

      {/* RESORT subtitle */}
      <text
        x="58" y="64"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill="#8baec8"
        letterSpacing="3.5"
      >MOUNTAIN RESORT</text>

      {/* Snowflakes */}
      <g stroke="#c8deff" strokeWidth="1.2" opacity="0.7">
        <line x1="46" y1="20" x2="46" y2="30"/>
        <line x1="41" y1="25" x2="51" y2="25"/>
        <line x1="42.9" y1="21.9" x2="49.1" y2="28.1"/>
        <line x1="49.1" y1="21.9" x2="42.9" y2="28.1"/>
      </g>
      <g stroke="#c8deff" strokeWidth="1" opacity="0.5">
        <line x1="334" y1="18" x2="334" y2="26"/>
        <line x1="330" y1="22" x2="338" y2="22"/>
        <line x1="331.3" y1="19.3" x2="336.7" y2="24.7"/>
        <line x1="336.7" y1="19.3" x2="331.3" y2="24.7"/>
      </g>
      <g stroke="#c8deff" strokeWidth="0.8" opacity="0.4">
        <line x1="346" y1="56" x2="346" y2="62"/>
        <line x1="343" y1="59" x2="349" y2="59"/>
        <line x1="344.1" y1="56.9" x2="347.9" y2="60.1"/>
        <line x1="347.9" y1="56.9" x2="344.1" y2="60.1"/>
      </g>

      {/* Snow dots */}
      <g fill="rgba(200,222,255,0.45)">
        <circle cx="58" cy="14" r="1.5"/>
        <circle cx="110" cy="8" r="1.8"/>
        <circle cx="170" cy="5" r="2"/>
        <circle cx="230" cy="9" r="1.5"/>
        <circle cx="280" cy="7" r="1.8"/>
        <circle cx="315" cy="14" r="1.5"/>
      </g>
    </svg>
  );
}
