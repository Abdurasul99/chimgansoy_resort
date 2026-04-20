"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { contacts } from "@/content/contacts";
import { mainNavigation } from "@/content/navigation";
import { dictionaries } from "@/content/translations";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import { localizePath, switchLocalePath } from "@/i18n/routing";
import { text } from "@/lib/localize";
import { Icon } from "@/components/ui/Icon";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dict = dictionaries[locale];

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[var(--paper)]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={localizePath(locale)} className="group min-w-0">
          <span className="block font-serif text-2xl font-bold leading-none text-[var(--ink)]">CHIMGANSOY</span>
          <span className="mt-1 block truncate text-[11px] font-bold uppercase text-[var(--muted)]">
            {dict.brandLine}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {mainNavigation.map((item) => {
            const href = localizePath(locale, item.href);
            const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={item.href}
                href={href}
                className={`text-sm font-semibold transition duration-300 ${
                  isActive ? "text-[var(--accent-strong)]" : "text-[var(--ink)] hover:text-[var(--accent-strong)]"
                }`}
              >
                {text(item.label, locale)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex rounded-[6px] border border-[color:var(--line)] p-1" aria-label="Language switcher">
            {locales.map((item) => (
              <Link
                key={item}
                href={switchLocalePath(pathname, item)}
                className={`rounded-[4px] px-2.5 py-1.5 text-xs font-bold transition ${
                  item === locale ? "bg-[var(--green)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {localeLabels[item]}
              </Link>
            ))}
          </div>
          <a
            href={`tel:${contacts.phone.replaceAll(" ", "")}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[var(--ink)] px-4 text-sm font-semibold text-white transition duration-300 hover:bg-[var(--green)]"
          >
            <Icon name="phone" className="h-4 w-4" />
            <span>{dict.book}</span>
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[6px] border border-[color:var(--line)] text-[var(--ink)] lg:hidden"
          aria-expanded={isOpen}
          aria-label={isOpen ? dict.close : dict.menu}
          onClick={() => setIsOpen((value) => !value)}
        >
          <Icon name={isOpen ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      <div className={`mobile-menu lg:hidden ${isOpen ? "mobile-menu-open" : ""}`}>
        <div className="space-y-1 px-4 pb-5">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={localizePath(locale, item.href)}
              className="block rounded-[6px] px-3 py-3 text-base font-semibold text-[var(--ink)] hover:bg-[var(--surface)]"
              onClick={() => setIsOpen(false)}
            >
              {text(item.label, locale)}
            </Link>
          ))}
          <div className="flex gap-2 px-3 pt-3">
            {locales.map((item) => (
              <Link
                key={item}
                href={switchLocalePath(pathname, item)}
                className={`rounded-[6px] px-3 py-2 text-sm font-bold ${
                  item === locale ? "bg-[var(--green)] text-white" : "bg-[var(--surface)] text-[var(--muted)]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {localeLabels[item]}
              </Link>
            ))}
          </div>
          <Link
            href={localizePath(locale, "/bron")}
            className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            onClick={() => setIsOpen(false)}
          >
            <span>{dict.bookNow}</span>
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
