import type { Metadata } from "next";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { BookingDrawer } from "@/components/sections/BookingDrawer";
import { Icon } from "@/components/ui/Icon";
import { rooms } from "@/content/rooms";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { getLocaleParam, getRoom } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { list, text } from "@/lib/localize";
import { imageStyle } from "@/lib/images";
import { localizePath } from "@/i18n/routing";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);

  return buildMetadata(
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
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocaleParam(params);
  const room = getRoom(slug);
  const dict = dictionaries[locale];

  return (
    <>
      {/* ── Cinematic full-viewport hero ──────────────── */}
      <section
        className="relative isolate flex min-h-[65vh] items-end overflow-hidden bg-[var(--ink)] -mt-[4.5rem] sm:min-h-[75vh] lg:min-h-[80vh]"
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
              <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/12 px-4 py-2 text-sm font-semibold text-[var(--accent)] backdrop-blur-sm">
                {text(room.priceFrom, locale)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content + sticky booking panel ──────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_380px] lg:items-start">

            {/* Left — content */}
            <div>
              {/* Description */}
              <div className="motion-reveal">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">
                  {locale === "ru" ? "Об апартаментах" : locale === "uz" ? "Xona haqida" : "About the room"}
                </p>
                <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{text(room.description, locale)}</p>
              </div>

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

              {/* Mobile CTA */}
              <div className="mt-10 lg:hidden">
                <Link
                  href={localizePath(locale, "/bron")}
                  className="btn-press flex items-center justify-center rounded-full bg-[var(--accent)] py-4 text-base font-bold text-white transition-all duration-300 hover:bg-[var(--accent-strong)]"
                >
                  {dict.bookNow}
                </Link>
              </div>
            </div>

            {/* Right — sticky booking panel (desktop) */}
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
          </div>
        </div>
      </section>

      {/* ── Related services ──────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
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
