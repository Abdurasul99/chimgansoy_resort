import Link from "next/link";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { Icon } from "@/components/ui/Icon";

type StickyBookingCtaProps = {
  locale: Locale;
};

export function StickyBookingCta({ locale }: StickyBookingCtaProps) {
  const dict = dictionaries[locale];

  return (
    <Link
      href={localizePath(locale, "/bron")}
      className="fixed inset-x-4 bottom-4 z-40 flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(181,99,64,0.35)] transition hover:bg-[var(--accent-strong)] sm:left-auto sm:right-6 sm:w-auto lg:bottom-6"
    >
      <span>{dict.bookNow}</span>
      <Icon name="calendar" className="h-4 w-4" />
    </Link>
  );
}
