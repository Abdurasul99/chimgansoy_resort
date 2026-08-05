import type { Metadata } from "next";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { BookingDrawer } from "@/components/sections/BookingDrawer";
import { PoolRequestForm } from "@/components/sections/PoolRequestForm";
import { MediaArchive } from "@/components/sections/MediaArchive";
import { VideoReel } from "@/components/sections/VideoReel";
import { chaletVideos, glampingVideos } from "@/content/videos";
import { getRoomPrices, priceChip } from "@/lib/room-price";
import { Icon } from "@/components/ui/Icon";
import { rooms, EXELY_ROOM_TYPE, INCLUDED_LABEL } from "@/content/rooms";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getRoom } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { imageStyle } from "@/lib/images";
import { localizePath } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const poolCta: Record<string, string> = {
  ru: "Забронировать бассейн",
  uz: "Basseynni bron qilish",
  en: "Book the pool",
};

/** rooms.ts still says "цена при бронировании" for the pool, which was true
 *  while the engine priced it. It has a fixed tariff now, so the hero chip
 *  shows the real number. */
const poolPriceChip: Record<string, string> = {
  ru: "от 100 000 сум с человека",
  uz: "100 000 so'mdan bir kishidan",
  en: "from 100 000 UZS per person",
};

/**
 * The pool photo archive under the request form.
 *
 * Deliberately wider than `room.gallery`, which the page already renders lower
 * down as a two-up grid — this is the "show me the place" set a guest wants
 * right after seeing the price. It now carries the whole August-2026 pool
 * shoot: eleven photographs where there used to be four renderings.
 */
const POOL_ARCHIVE = [
  "poolPanorama",
  "poolLogoTall",
  "poolCabanasValley",
  "poolWideChalets",
  "poolStepsTall",
  "poolLoungers",
  "poolCabanasSky",
  "poolWater",
  "poolCurveTall",
  "poolCabanas",
  "poolDeckChalets",
  "galTerritoryPanorama",
] as const;

// Only built, bookable rooms get a detail page. Anything marked
// `available: false` in content/rooms.ts is skipped here, so its /nomera/<slug>
// URL 404s rather than advertising something a guest cannot book.
export const dynamicParams = false;

export function generateStaticParams() {
  return rooms.filter((room) => room.available !== false).map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);

  const meta = buildMetadata(
    locale,
    {
      title: {
        ru: `${text(room.title, "ru")} CHIMGAN DARBAZA`,
        uz: `${text(room.title, "uz")} CHIMGAN DARBAZA`,
        en: `${text(room.title, "en")} at CHIMGAN DARBAZA`,
      },
      description: room.shortDescription,
    },
    `/nomera/${room.slug}`,
  );
  // Rooms are live and bookable — indexable.
  return meta;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);
  const dict = dictionaries[locale];
  // The pool is booked by request form, not through the booking engine.
  const isPool = room.slug === "pool";
  // Live rate for this room, or null when the engine gave nothing.
  const livePrice = priceChip((await getRoomPrices())[room.slug], locale);
  // Each room shows its own footage; the pool has none yet.
  const roomVideos = room.slug === "cottage" ? chaletVideos : room.slug === "glamping" ? glampingVideos : [];

  return (
    <>
      {/* ── Cinematic full-viewport hero ──────────────── */}
      {/* Shorter on the pool page: its request form sits in the next section
          and an 80vh hero pushed the form a full screen below the fold, so a
          guest opening the page saw a photo and nothing to act on. */}
      <section
        className={`relative isolate flex items-end overflow-hidden bg-[var(--ink)] -mt-[4.5rem] ${
          isPool
            ? "min-h-[52vh] sm:min-h-[54vh] lg:min-h-[56vh]"
            : "min-h-[65vh] sm:min-h-[75vh] lg:min-h-[80vh]"
        }`}
        aria-label={text(room.title, locale)}
      >
        <div
          className="absolute inset-0 -z-20 scale-[1.02] bg-cover bg-center"
          style={imageStyle(resortImages[room.image])}
          role="img"
          aria-label={text(resortImages[room.image].alt, locale)}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.97)_0%,rgba(12,18,14,0.55)_50%,rgba(12,18,14,0.12)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,18,14,0.60)_0%,transparent_65%)]" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:pb-14 sm:pt-32 sm:px-6 lg:pb-20 lg:pt-40 lg:px-8">
          <div className="motion-rise">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">CHIMGAN DARBAZA</p>
            <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{text(room.eyebrow, locale)}</p>
            <h1 className="display-lg mt-2 font-serif font-bold text-white">
              {text(room.title, locale)}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
              {text(room.shortDescription, locale)}
            </p>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur-sm">
                {text(room.capacity, locale)}
              </span>
              <span className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur-sm">
                {text(room.size, locale)}
              </span>
              {/* The live "от …" rate from the booking engine, the same source
                  as the cards on the homepage. room.priceFrom ("Цена при
                  бронировании") is the fallback for an unreachable engine — a
                  guest who has opened the room page and still cannot see a
                  number is being asked to enquire about the price of a cabin,
                  which is not how anyone books a weekend. */}
              <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/12 px-4 py-2 text-sm font-semibold text-[var(--accent)] backdrop-blur-sm">
                {isPool ? poolPriceChip[locale] : livePrice ?? text(room.priceFrom, locale)}
              </span>
            </div>

            {/* The pool's form sits in the next section, which is just past the
                fold on a laptop. This puts the action itself in the first
                screen and scrolls to the form. */}
            {isPool && (
              <a
                href="#pool-request"
                className="btn-press mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-8 py-5 text-lg font-extrabold text-[var(--on-accent)] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:brightness-[1.04] sm:text-xl"
              >
                <svg aria-hidden className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 16c1.5 0 1.5 1.2 3 1.2S6.5 16 8 16s1.5 1.2 3 1.2S12.5 16 14 16s1.5 1.2 3 1.2S18.5 16 20 16M2 20c1.5 0 1.5 1.2 3 1.2S6.5 20 8 20s1.5 1.2 3 1.2S12.5 20 14 20s1.5 1.2 3 1.2S18.5 20 20 20M8 14V5a2 2 0 1 1 4 0M16 14V5a2 2 0 1 1 4 0" />
                </svg>
                {poolCta[locale]}
                <span aria-hidden className="text-2xl leading-none">↓</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Pool request form ─────────────────────────────
          Straight under the hero, full width, so it is the first thing on the
          page after the photo — and wide enough for the tariff to sit as two
          cards and the fields as a comfortable two-column grid. ── */}
      {isPool && (
        <section id="pool-request" className="scroll-mt-24 bg-[var(--surface)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <PoolRequestForm locale={locale} />
            {/* Under the form, not above it: a guest who has just read a price
                wants to see what they are paying for. */}
            <div className="mt-12">
              <MediaArchive locale={locale} images={POOL_ARCHIVE} />
            </div>
          </div>
        </section>
      )}

      {/* ── Main content + sticky booking panel ──────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className={`grid gap-16 lg:items-start ${isPool ? "" : "lg:grid-cols-[1fr_380px]"}`}>

            {/* Left — content */}
            <div>
              {/* Description */}
              <div className="motion-reveal">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">
                  {locale === "ru" ? "Об апартаментах" : locale === "uz" ? "Xona haqida" : "About the room"}
                </p>
                <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{text(room.description, locale)}</p>
              </div>

              {/* What the rate covers — same chips as the catalogue card, so a
                  guest who noticed the pool inclusion there sees it confirmed. */}
              {room.included && room.included.length > 0 && (
                <div className="mt-10 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] px-5 py-4 motion-reveal" data-delay="50">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {text(INCLUDED_LABEL, locale)}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
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

              {/* Amenities + Features */}
              <div className="mt-12 grid gap-10 sm:grid-cols-2 motion-reveal" data-delay="100">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.detailLabels.amenities}</h2>
                  <ul className="mt-5 space-y-3">
                    {list(room.amenities, locale).map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-[var(--muted)]">
                        <Icon name="check" className="h-4 w-4 shrink-0 text-[var(--green)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.detailLabels.features}</h2>
                  <ul className="mt-5 space-y-3">
                    {list(room.features, locale).map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[var(--muted)]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Gallery */}
              <div className="mt-14 motion-reveal" data-delay="150">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {locale === "ru" ? "Фотографии" : locale === "uz" ? "Fotosuratlar" : "Gallery"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {room.gallery.map((imageKey, i) => (
                    <div
                      key={imageKey}
                      className={`overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-700 hover:scale-[1.02] ${
                        i === 0 ? "aspect-[4/3] sm:col-span-2" : "aspect-[4/3]"
                      }`}
                      style={imageStyle(resortImages[imageKey])}
                      role="img"
                      aria-label={text(resortImages[imageKey].alt, locale)}
                    />
                  ))}
                </div>
              </div>

              {/* The chalet walkthrough, under its photographs.
                  Same rail the tubing page uses, so it inherits the work that
                  made those load: each card plays a 400px silent preview and
                  only fetches the full clip when it is opened. */}
              {roomVideos.length > 0 && (
                <div className="mt-14 motion-reveal" data-delay="180">
                  <VideoReel locale={locale} clips={roomVideos} />
                </div>
              )}

              {/* Mobile CTA. Stays go to the Exely engine; the pool jumps to
                  its own request form further down this page. */}
              <div className="mt-10 lg:hidden">
                <a
                  href={
                    isPool
                      ? "#pool-request"
                      : localizePath(locale, `/bron?room-type=${EXELY_ROOM_TYPE[room.slug] ?? ""}`)
                  }
                  className="btn-press flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-5 text-lg font-bold text-[var(--on-accent)] shadow-[0_10px_30px_-8px_rgba(220,140,0,0.7)] transition-all duration-300 hover:bg-[var(--accent-strong)]"
                >
                  {isPool ? poolCta[locale] : dict.bookNow}
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            {/* Right column — the sticky booking panel, stays only. The pool's
                form used to live here and was strangled by the 380px track:
                truncated placeholders, tariff labels wrapping onto two lines.
                It has its own full-width section above now. */}
            {!isPool && (
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <BookingDrawer
                    locale={locale}
                    roomTitle={text(room.title, locale)}
                    roomSlug={room.slug}
                    priceFrom={text(room.priceFrom, locale)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* ── Related services ──────────────────────────── */}
      <section className="bg-[var(--paper)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 motion-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[var(--ink)]">{dict.detailLabels.relatedServices}</h2>
          </div>
          <ServicesGrid
            locale={locale}
            slugs={room.relatedServices}
            showFilters={false}
          />
        </div>
      </section>
    </>
  );
}
