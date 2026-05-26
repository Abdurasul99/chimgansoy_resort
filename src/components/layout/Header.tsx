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

