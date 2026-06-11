import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { RoomCatalog } from "@/components/sections/RoomCatalog";
import { Faq } from "@/components/sections/Faq";
import { BookingRequestForm } from "@/components/sections/BookingRequestForm";
import { ExelyWidget } from "@/components/sections/ExelyWidget";
import { CurrencyWidget } from "@/components/sections/CurrencyWidget";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resortImages } from "@/content/images";
import { rooms } from "@/content/rooms";
import { contacts } from "@/content/contacts";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { getFirstSearchParam } from "@/lib/search-params";
import { text } from "@/lib/localize";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.booking, "/bron");
}

const channelIcons = {
  phone: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  whatsapp: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.523 5.854L0 24l6.336-1.5A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.384l-.36-.214-3.732.883.898-3.656-.234-.376A9.818 9.818 0 1112 21.818z" />
    </svg>
  ),
  telegram: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
    </svg>
  ),
  instagram: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  ),
};

export default async function BookingPage({ params, searchParams }: PageProps) {
  const locale = await getLocaleParam(params);
  const bookingSearchParams = await searchParams;
  const dict = dictionaries[locale];
  const bronDict = (dict as Record<string, unknown>).bron as typeof dictionaries.ru.bron;

  // If the guest arrived from a room card (?room=glamping|cottage), show which
  // room they're booking right above the form.
  const roomSlug = getFirstSearchParam(bookingSearchParams, "room");
  const selectedRoom = rooms.find((r) => r.slug === roomSlug);

  const channels = [
    {
      key: "phone",
      label: dict.call,
      href: `tel:${contacts.phone.replaceAll(" ", "")}`,
      value: contacts.phone,
      icon: channelIcons.phone,
      accent: "bg-[var(--surface)] border-[color:var(--line)] text-[var(--ink)] hover:border-[var(--accent)]/40",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: contacts.whatsapp,
      value: "WhatsApp",
      icon: channelIcons.whatsapp,
      accent: "bg-[#25D366]/8 border-[#25D366]/20 text-[#128C4B] hover:border-[#25D366]/50",
    },
    {
      key: "telegram",
      label: "Telegram",
      href: contacts.telegram,
      value: "Telegram",
      icon: channelIcons.telegram,
      accent: "bg-[#229ED9]/8 border-[#229ED9]/20 text-[#0088CC] hover:border-[#229ED9]/50",
    },
    {
      key: "instagram",
      label: "Instagram",
      href: contacts.instagram,
      value: "@chimgandarbaza",
      icon: channelIcons.instagram,
      accent: "bg-[#DD2A7B]/8 border-[#DD2A7B]/25 text-[#C13584] hover:border-[#DD2A7B]/55",
    },
  ];

  return (
    <>
      <PageHero
        locale={locale}
        title={dict.pages.booking.title}
        lead={dict.pages.booking.lead}
        image={resortImages.cottage}
        eyebrow="CHIMGAN DARBAZA"
      />

      {/* ── Exely online booking (renders once the PMS onboarding is done
            and NEXT_PUBLIC_EXELY_WIDGET_URL is set; until then — nothing,
            and the request form below stays the primary path) ─────────── */}
      <ExelyWidget locale={locale} />

      {/* ── Contact + Request form ─────────────────────── */}
      <section className="px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">

            {/* Left — contacts */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-[var(--ink)]">
                {bronDict.contactTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                {bronDict.contactLead}
              </p>

              <div className="mt-8 space-y-3">
                {channels.map((ch) => (
                  <Link
                    key={ch.key}
                    href={ch.href}
                    target={ch.key !== "phone" ? "_blank" : undefined}
                    rel={ch.key !== "phone" ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition duration-200 ${ch.accent}`}
                  >
                    <span className="shrink-0">{ch.icon}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide opacity-60">{ch.label}</p>
                      <p className="mt-0.5 font-semibold">{ch.value}</p>
                    </div>
                    <svg className="ml-auto h-4 w-4 shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>

              {/* Schedule */}
              <div className="mt-8 rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {locale === "ru" ? "Администрация отвечает" : locale === "uz" ? "Ish vaqti" : "We respond"}
                </p>
                <p className="mt-1 font-semibold text-[var(--ink)]">{text(contacts.schedule, locale)}</p>
              </div>
            </div>

            {/* Right — request form + currency */}
            <div className="space-y-6">
              {selectedRoom && (
                <div className="flex items-center gap-4 rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${resortImages[selectedRoom.image].localSrc ?? resortImages[selectedRoom.image].src})`,
                    }}
                    role="img"
                    aria-label={text(selectedRoom.title, locale)}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">
                      {locale === "ru" ? "Вы бронируете" : locale === "uz" ? "Siz bron qilyapsiz" : "You're booking"}
                    </p>
                    <p className="mt-0.5 font-serif text-xl font-semibold text-[var(--ink)]">
                      {text(selectedRoom.title, locale)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{text(selectedRoom.capacity, locale)}</p>
                  </div>
                </div>
              )}
              <BookingRequestForm
                dict={bronDict}
                labels={{ checkIn: dict.checkIn, checkOut: dict.checkOut, guests: dict.guests }}
                locale={locale}
                defaultCheckin={getFirstSearchParam(bookingSearchParams, "checkin")}
                defaultCheckout={getFirstSearchParam(bookingSearchParams, "checkout")}
                defaultGuests={getFirstSearchParam(bookingSearchParams, "guests")}
                defaultRoom={getFirstSearchParam(bookingSearchParams, "room")}
              />
              <CurrencyWidget locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Rooms ─────────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title={dict.home.roomsTitle} text={dict.home.roomsText} />
          <div className="mt-8">
            <RoomCatalog locale={locale} />
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <SectionHeader title={dict.home.faqTitle} />
          <Faq locale={locale} />
        </div>
      </section>
    </>
  );
}
