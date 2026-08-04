"use client";

import { useMemo, useState } from "react";
import { resortImages } from "@/content/images";
import { roomCategories, rooms, EXELY_ROOM_TYPE, INCLUDED_LABEL, type RoomCategory } from "@/content/rooms";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { list, text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { Lightbox } from "@/components/ui/Lightbox";

type RoomCatalogProps = {
  locale: Locale;
  limit?: number;
};

type Filter = "all" | RoomCategory;

/** Card image first, then the rest of the shoot — no duplicates. */
function roomGalleryOf(room: (typeof rooms)[number]) {
  const keys = [room.image, ...room.gallery];
  return [...new Set(keys)].map((k) => resortImages[k]);
}

export function RoomCatalog({ locale, limit }: RoomCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  // Which room the viewer is showing, by slug — null when closed.
  const [gallery, setGallery] = useState<string | null>(null);
  const dict = dictionaries[locale];
  // Only truly-built rooms are bookable here; `available: false` hides the rest.
  const bookableRooms = useMemo(() => rooms.filter((room) => room.available !== false), []);
  const availableCategories = useMemo(
    () => roomCategories.filter((c) => c.id === "all" || bookableRooms.some((room) => room.category === c.id)),
    [bookableRooms],
  );
  // No filter on a truncated list (the homepage passes `limit`): filtering a
  // grid that is already cut to two cards reads as broken — "Все" shows fewer
  // rooms than there are, and one filter shows one card. /nomera keeps them.
  const showFilter = limit === undefined && new Set(bookableRooms.map((room) => room.category)).size > 1;
  const visibleRooms = useMemo(() => {
    const filtered = filter === "all" ? bookableRooms : bookableRooms.filter((room) => room.category === filter);
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [filter, limit, bookableRooms]);

  return (
    <div>
      {/* Filter pills — hidden when only one category is bookable */}
      {showFilter && (
        <div className="mb-5 sm:mb-8 flex flex-wrap gap-1.5 sm:gap-2">
          {availableCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`btn-press relative rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                filter === category.id
                  ? "border-[var(--mountain)] bg-[var(--mountain)] text-white"
                  : "border-[color:var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--mountain)]/40 hover:text-[var(--ink)]"
              }`}
              onClick={() => setFilter(category.id as Filter)}
            >
              {text(category.label, locale)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
        {visibleRooms.map((room) => {
          const image = resortImages[room.image];

          return (
            <article
              key={room.slug}
              className="editorial-card group relative overflow-hidden rounded-3xl bg-[var(--ink)] shadow-[var(--shadow-card)]"
            >
              {/* Full-bleed image — now a button that opens the room's whole
                  shoot. It used to be inert, so the only way to see more than
                  one photo of a room was to open its page. */}
              <button
                type="button"
                onClick={() => setGallery(room.slug)}
                aria-label={`${text(room.title, locale)} — ${roomGalleryOf(room).length} фото`}
                className="img-reveal-wrapper relative block h-[65vw] max-h-[500px] min-h-[260px] w-full cursor-zoom-in bg-cover bg-center text-left transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04] sm:min-h-[320px]"
                style={imageStyle(image)}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,1.0)_0%,rgba(12,18,14,0.55)_45%,rgba(12,18,14,0.08)_100%)]" />

                {/* Floating price badge */}
                <div className="glass-badge absolute right-5 top-5 rounded-full px-4 py-1.5 backdrop-blur-sm">
                  <p className="text-xs font-bold text-white/80">{text(room.priceFrom, locale)}</p>
                </div>

                {/* Photo count — tells the guest there is something behind the click */}
                <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur-sm transition-colors group-hover:bg-black/65">
                  <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="14" height="14" rx="2" />
                    <path d="M21 7v10a2 2 0 0 1-2 2M7 13l2.5-2.5 3 3L15 11" />
                  </svg>
                  {roomGalleryOf(room).length}
                </span>

                {/* Room title overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{text(room.eyebrow, locale)}</p>
                  <h3 className="mt-2 font-serif text-4xl font-bold leading-tight sm:text-5xl">{text(room.title, locale)}</h3>
                </div>
              </button>

              {/* Info block */}
              <div className="room-info-block bg-[var(--paper)] px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                <p className="text-sm leading-7 text-[var(--muted)]">{text(room.shortDescription, locale)}</p>

                {/* Capacity + size pills */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
                    {text(room.capacity, locale)}
                  </span>
                  <span className="rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
                    {text(room.size, locale)}
                  </span>
                </div>

                {/* Amenities */}
                <ul className="mt-5 grid gap-1.5 text-sm text-[var(--muted)] sm:grid-cols-2">
                  {list(room.amenities, locale).slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-[var(--green)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* What the rate covers. The pool chip is gold and carries a
                    slow shine because it is the non-obvious one: guests have no
                    reason to assume a separately-sold day product is free with
                    a stay unless the page says so. */}
                {room.included && room.included.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {text(INCLUDED_LABEL, locale)}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {room.included.map((perk, i) => (
                        <li
                          key={text(perk.label, locale)}
                          className={`perk-chip${perk.highlight ? " perk-chip--hero" : ""}`}
                          style={{ animationDelay: `${i * 70}ms` }}
                        >
                          {perk.highlight ? (
                            <Icon name="pool" className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Icon name="check" className="h-3 w-3 shrink-0 text-[var(--green)]" />
                          )}
                          {text(perk.label, locale)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={localizePath(locale, `/nomera/${room.slug}`)} variant="secondary" className="btn-press">
                    {dict.details}
                  </ButtonLink>
                  {/* The pool isn't in the booking engine — its request form
                      lives on its own page, so send the guest there instead of
                      to /bron with an empty room-type. */}
                  <ButtonLink
                    href={
                      room.slug === "pool"
                        ? localizePath(locale, "/nomera/pool#pool-request")
                        : localizePath(locale, `/bron?room-type=${EXELY_ROOM_TYPE[room.slug] ?? ""}`)
                    }
                    variant="ghost"
                    reload={room.slug !== "pool"}
                    className="btn-press"
                  >
                    {dict.book}
                  </ButtonLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* One viewer for the whole grid — mounted once, fed by whichever
          card was clicked. */}
      {gallery && (
        <Lightbox
          key={gallery}
          images={roomGalleryOf(bookableRooms.find((r) => r.slug === gallery)!)}
          locale={locale}
          open
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
}
