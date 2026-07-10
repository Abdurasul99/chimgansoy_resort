"use client";

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

  // Full navigation (not next/link) so the Exely engine embeds on /bron.
  return (
    <a
      href={localizePath(locale, "/bron")}
      className={`fixed left-3 right-[4.75rem] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold text-[var(--on-accent)] shadow-[0_16px_40px_rgba(181,99,64,0.35)] transition-all duration-300 hover:bg-[var(--accent-strong)] sm:inset-x-auto sm:left-6 sm:right-auto sm:bottom-6 sm:w-auto ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <span>{dict.bookNow}</span>
      <Icon name="calendar" className="h-4 w-4" />
    </a>
  );
}
