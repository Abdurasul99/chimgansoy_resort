import Link from "next/link";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

type BookingDrawerProps = {
  locale: Locale;
  roomTitle: string;
  roomSlug: string;
  priceFrom: string;
};

export function BookingDrawer({ locale, roomTitle, roomSlug, priceFrom }: BookingDrawerProps) {
  const dict = dictionaries[locale];

  const perks = [
    locale === "ru" ? "Ответим в течение 15 минут" : locale === "uz" ? "15 daqiqada javob beramiz" : "We reply within 15 minutes",
    locale === "ru" ? "Завтрак по запросу" : locale === "uz" ? "So'rov bo'yicha nonushta" : "Breakfast on request",
    locale === "ru" ? "Подбор подходящих дат" : locale === "uz" ? "Mos sanalarni tanlaymiz" : "We help pick the dates",
  ];

  const requestHref = `${localizePath(locale, "/bron")}?room=${encodeURIComponent(roomSlug)}`;

  return (
    <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
      <h3 className="mt-2 font-serif text-2xl font-semibold text-[var(--ink)]">{roomTitle}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{priceFrom}</p>

      <div className="mt-6 h-px bg-[color:var(--line)]" />

      <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
        {perks.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link
          href={requestHref}
          className="btn-press flex w-full items-center justify-center rounded-full bg-[var(--accent)] py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-[var(--accent-strong)] hover:shadow-[var(--shadow-glow)]"
        >
          {dict.bookNow}
        </Link>
      </div>
    </div>
  );
}
