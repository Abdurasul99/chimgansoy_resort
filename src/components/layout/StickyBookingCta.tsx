"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { Icon } from "@/components/ui/Icon";

type StickyBookingCtaProps = {
  locale: Locale;
};

export function StickyBookingCta({ locale }: StickyBookingCtaProps) {
  const dict = dictionaries[locale];
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > Math.min(window.innerHeight * 0.72, 620));
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (pathname.endsWith(localizePath(locale, "/bron"))) {
    return null;
  }

  return (
    <Link
      href={localizePath(locale, "/bron")}
      className={`fixed inset-x-4 bottom-4 z-40 flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(181,99,64,0.35)] transition duration-300 hover:bg-[var(--accent-strong)] sm:left-auto sm:right-6 sm:w-auto lg:bottom-6 ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span>{dict.bookNow}</span>
      <Icon name="calendar" className="h-4 w-4" />
    </Link>
  );
}
