import { dictionaries } from "@/content/translations";
import { EXELY_ROOM_TYPE } from "@/content/rooms";
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
    locale === "ru" ? "Ответим в ближайшее время" : locale === "uz" ? "Tez orada javob beramiz" : "We'll reply shortly",
    locale === "ru" ? "Завтрак по запросу" : locale === "uz" ? "So'rov bo'yicha nonushta" : "Breakfast on request",
    locale === "ru" ? "Подбор подходящих дат" : locale === "uz" ? "Mos sanalarni tanlaymiz" : "We help pick the dates",
  ];

  /**
   * The rate arrives as one string — "от 1 500 000 сум / ночь", or the fallback
   * sentence "Цена при бронировании" when the booking engine gave nothing.
   *
   * Split on the last " / " so the figure can carry the weight and the period
   * can sit under it in caption size. The fallback has no separator and simply
   * renders whole, which is why this is a split rather than a required pair of
   * props: one of the two possible values is not a price at all.
   */
  const sep = priceFrom.lastIndexOf(" / ");
  const amount = sep === -1 ? priceFrom : priceFrom.slice(0, sep);
  const period = sep === -1 ? null : priceFrom.slice(sep + 3);

  // Exely reads room-type=<id> to open on the right room (not a slug).
  const roomType = EXELY_ROOM_TYPE[roomSlug];
  const requestHref = roomType
    ? `${localizePath(locale, "/bron")}?room-type=${roomType}`
    : localizePath(locale, "/bron");

  return (
    <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
      <h3 className="mt-2 font-serif text-2xl font-semibold text-[var(--ink)]">{roomTitle}</h3>

      {/* The price, as the second thing read after the room's name.
          It sat here as small muted text under the title — the same weight as a
          caption, on the panel where a guest decides. A rate is not a footnote
          to the room's name; on this card it is the question being answered. */}
      <div className="mt-4 rounded-2xl bg-[var(--sun)]/12 px-4 py-3">
        <p className="font-serif text-2xl font-bold leading-tight tabular-nums text-[var(--ink)] sm:text-[1.75rem]">
          {amount}
        </p>
        {period && (
          <p className="mt-0.5 text-xs font-semibold text-[var(--muted)]">{period}</p>
        )}
      </div>

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
        {/* Full navigation (plain <a>) so the Exely engine embeds on /bron — it
            only initialises on a fresh page load, not on client-side routing. */}
        <a
          href={requestHref}
          className="btn-press flex w-full items-center justify-center rounded-full bg-[var(--accent)] py-4 text-sm font-bold text-[var(--on-accent)] transition-all duration-300 hover:bg-[var(--accent-strong)] hover:shadow-[var(--shadow-glow)]"
        >
          {dict.bookNow}
        </a>
      </div>
    </div>
  );
}
