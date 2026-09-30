"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { resortImages } from "@/content/images";
import { roomCategories, rooms, EXELY_ROOM_TYPE, INCLUDED_LABEL, includedPerks, type RoomCategory } from "@/content/rooms";
import type { ImageAsset } from "@/content/types";
import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { list, text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { Lightbox } from "@/components/ui/Lightbox";
import { clock } from "@/components/ui/Clock";
import { poolClosure } from "@/content/pool-closure";

type RoomCatalogProps = {
  locale: Locale;
  limit?: number;
  /**
   * Ready-made "от … / ночь" strings by room slug, or an empty object.
   *
   * Passed in rather than fetched here: this is a client component (it owns the
   * filter pills and the gallery lightbox), and the price comes from the Exely
   * engine, which is a server-only call. See lib/room-price.ts.
   */
  priceChips?: Record<string, string | null>;
};

type Filter = "all" | RoomCategory;

/** Card image first, then the rest of the shoot — no duplicates. */
function roomGalleryOf(room: (typeof rooms)[number]) {
  const keys = [room.image, ...room.gallery];
  return [...new Set(keys)].map((k) => resortImages[k]);
}

/** «Забронировать в один клик» — обещание короткой формы, а не движка. */
const ONE_CLICK: Record<string, string> = {
  ru: "Забронировать в один клик",
  uz: "Bir marta bosib bron qilish",
  en: "Book in one click",
};

export function RoomCatalog({ locale, limit, priceChips = {} }: RoomCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  // Which room the viewer is showing, by slug, and from which frame — null when closed.
  const [gallery, setGallery] = useState<{ slug: string; index: number } | null>(null);
  const dict = dictionaries[locale];
  // Only truly-built rooms are bookable here; `available: false` hides the rest.
  // Закрытый бассейн уходит из каталога, но остаётся страницей: карточка
  // ведёт к форме, которой сейчас нет, а страница объясняет, что случилось.
  const bookableRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.available !== false && !(room.slug === "pool" && poolClosure.closed),
      ),
    [],
  );
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
              className={`btn-press relative inline-flex min-h-10 items-center rounded-full border px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ${
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
          const photos = roomGalleryOf(room);
          const perks = includedPerks(room);

          return (
            <article
              key={room.slug}
              className="editorial-card group relative overflow-hidden rounded-3xl bg-[var(--ink)] shadow-[var(--shadow-card)]"
            >
              {/* Вся съёмка домика — лентой, листается свайпом влево-вправо
                  (оператор, 30.09.2026: «чтобы через свайп лево-право галерея
                  номера»). Раньше здесь был один кадр, а остальные прятались
                  за нажатием. Нажатие на кадр по-прежнему открывает его во
                  весь экран. */}
              <SwipeGallery
                photos={photos}
                title={text(room.title, locale)}
                locale={locale}
                onOpen={(index) => setGallery({ slug: room.slug, index })}
              >

                {/* Floating price badge */}
                {/* There WAS a price badge here. It is gone on purpose.
                    It carried the placeholder "Цена при бронировании" for as
                    long as no real rate existed. When the live rate arrived it
                    was pointed at the same source as the chip below the
                    description — and the card then printed the same price
                    twice, once over the photograph and once under it. One price
                    per card; the chip is the one that stays, because it sits
                    with the two other facts a guest is comparing (capacity and
                    area) instead of floating over the roofline. */}

                {/* Room title overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{text(room.eyebrow, locale)}</p>
                  <h3 className="mt-2 font-serif text-4xl font-bold leading-tight sm:text-5xl">{text(room.title, locale)}</h3>
                </div>
              </SwipeGallery>

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
                  {/* The price the operator asked for, beside the two facts a
                      guest is already reading. Gold rather than grey: it is the
                      one chip here that answers "how much", and it should not
                      look like a footnote to the floor area.

                      Absent, not blank, when the engine gave nothing — an empty
                      chip is worse than no chip. */}
                  {priceChips[room.slug] && (
                    <span className="rounded-full bg-[var(--sun)]/15 px-4 py-2 text-sm font-bold text-[var(--sun-dark)]">
                      {priceChips[room.slug]}
                    </span>
                  )}
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
                {perks.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] px-4 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {text(INCLUDED_LABEL, locale)}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {perks.map((perk, i) => (
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
                          {clock(text(perk.label, locale))}
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
                  {/* Ведёт к форме заявки на самой странице домика, а не в движок
                      Exely: гость попадал в чужой интерфейс, где нужно разобраться
                      с тарифами и заполнить длинную форму. Бассейн всегда так и
                      работал — теперь так работают все. */}
                  <ButtonLink
                    href={localizePath(
                      locale,
                      room.slug === "pool" ? "/nomera/pool#pool-request" : `/nomera/${room.slug}#zayavka`,
                    )}
                    variant="ghost"
                    className="btn-press"
                  >
                    {ONE_CLICK[locale]}
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
          key={`${gallery.slug}-${gallery.index}`}
          images={roomGalleryOf(bookableRooms.find((r) => r.slug === gallery.slug)!)}
          locale={locale}
          startIndex={gallery.index}
          open
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
}

const PREV: Record<string, string> = { ru: "Предыдущее фото", uz: "Oldingi surat", en: "Previous photo" };
const NEXT: Record<string, string> = { ru: "Следующее фото", uz: "Keyingi surat", en: "Next photo" };

/**
 * Лента фотографий домика: свайп пальцем на телефоне, стрелки на компьютере,
 * счётчик «3 / 14» в углу. Нативная прокрутка со scroll-snap, а не своя
 * анимация: палец ведёт кадр сам, инерция и доводка — от браузера.
 *
 * Кадры — <img> с lazy: съёмка домика — полтора десятка тяжёлых фото, и
 * фоном через CSS браузер скачал бы их все сразу при открытии главной.
 */
function SwipeGallery({
  photos,
  title,
  locale,
  onOpen,
  children,
}: {
  photos: ImageAsset[];
  title: string;
  locale: Locale;
  onOpen: (index: number) => void;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const onScroll = () => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };
  const go = (to: number) => {
    const el = track.current;
    if (!el) return;
    const i = (to + count) % count;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative h-[65vw] max-h-[500px] min-h-[260px] overflow-hidden sm:min-h-[320px]">
      <div
        ref={track}
        onScroll={onScroll}
        className="rest-chips flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {photos.map((photo, i) => (
          <button
            key={`${photo.localSrc ?? photo.src}-${i}`}
            type="button"
            onClick={() => onOpen(i)}
            className="relative h-full w-full shrink-0 snap-center snap-always cursor-zoom-in"
            aria-label={`${title} — ${i + 1} / ${count}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.localSrc ?? photo.src}
              alt={text(photo.alt, locale)}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{ objectPosition: photo.position ?? "center" }}
            />
          </button>
        ))}
      </div>

      {/* Затемнение снизу — под заголовок; клики проходят сквозь него. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,1.0)_0%,rgba(12,18,14,0.55)_45%,rgba(12,18,14,0.08)_100%)]" />

      {/* Счётчик — видно, что кадров много и их можно листать. */}
      <span className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-bold tabular-nums text-white/90 backdrop-blur-sm">
        <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="M21 7v10a2 2 0 0 1-2 2M7 13l2.5-2.5 3 3L15 11" />
        </svg>
        {index + 1} / {count}
      </span>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={PREV[locale]}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:h-11 sm:w-11"
          >
            <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={NEXT[locale]}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:h-11 sm:w-11"
          >
            <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {children}
    </div>
  );
}
