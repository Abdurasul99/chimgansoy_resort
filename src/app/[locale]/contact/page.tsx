import type { Metadata } from "next";
import { MapBlock } from "@/components/sections/MapBlock";
import { BookingRequestForm } from "@/components/sections/BookingRequestForm";
import { contacts } from "@/content/contacts";
import { resortImages } from "@/content/images";
import { dictionaries } from "@/content/translations";
import { pageSeo } from "@/content/seo";
import { getLocaleParam } from "@/lib/content";
import { buildMetadata } from "@/lib/metadata";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  return buildMetadata(locale, pageSeo.contact, "/contact");
}

export default async function ContactPage({ params }: PageProps) {
  const locale = await getLocaleParam(params);
  const dict = dictionaries[locale];
  const bronDict = (dict as Record<string, unknown>).bron as typeof dictionaries.ru.bron;

  return (
    <>
      {/* ── Cinematic hero ────────────────────────────── */}
      <section
        className="relative isolate flex min-h-[55vh] items-end overflow-hidden bg-[var(--ink)] -mt-[4.5rem]"
        aria-label={dict.pages.contact.title}
      >
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={imageStyle(resortImages.entranceDay)}
          role="img"
          aria-label={text(resortImages.entranceDay.alt, locale)}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(12,18,14,0.97)_0%,rgba(12,18,14,0.55)_55%,rgba(12,18,14,0.14)_100%)]" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-28 sm:pb-14 sm:pt-40 sm:px-6 lg:pb-20 lg:px-8">
          <div className="motion-rise">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">CHIMGAN DARBAZA</p>
            <h1 className="display-md mt-3 font-serif font-bold text-white">{dict.pages.contact.title}</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/60">{dict.pages.contact.lead}</p>
          </div>
        </div>
      </section>

      {/* ── Contact editorial split ───────────────────── */}
      <section className="px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-start">

            {/* Left — contact channels */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-strong)]">CHIMGAN DARBAZA</p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-[var(--ink)]">
                {bronDict.contactTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">{bronDict.contactLead}</p>

              {/* Phone — hero link */}
              <a
                href={`tel:${contacts.phone.replaceAll(" ", "")}`}
                className="mt-10 block group"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  {locale === "ru" ? "Телефон" : locale === "uz" ? "Telefon" : "Phone"}
                </p>
                <p className="mt-1 font-serif text-3xl font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent-strong)]">
                  {contacts.phone}
                </p>
              </a>

              {/* Messenger buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={contacts.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press flex items-center justify-center gap-2.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 px-6 py-3.5 text-sm font-bold text-[#128C4B] transition-all duration-300 hover:bg-[#25D366]/18"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.523 5.854L0 24l6.336-1.5A11.937 11.937 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.384l-.36-.214-3.732.883.898-3.656-.234-.376A9.818 9.818 0 1112 21.818z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={contacts.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press flex items-center justify-center gap-2.5 rounded-full bg-[#229ED9]/10 border border-[#229ED9]/20 px-6 py-3.5 text-sm font-bold text-[#0088CC] transition-all duration-300 hover:bg-[#229ED9]/18"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                  </svg>
                  Telegram
                </a>
                <a
                  href={contacts.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press flex items-center justify-center gap-2.5 rounded-full border px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:opacity-90"
                  style={{ background: "linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 75%, #515BD4 100%)", borderColor: "rgba(221,42,123,0.25)" }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                  Instagram
                </a>
              </div>

              {/* Address + schedule */}
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    {locale === "ru" ? "Адрес" : locale === "uz" ? "Manzil" : "Address"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{text(contacts.address, locale)}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    {locale === "ru" ? "Администрация отвечает" : locale === "uz" ? "Ish vaqti" : "We respond"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{text(contacts.schedule, locale)}</p>
                </div>
              </div>
            </div>

            {/* Right — request form */}
            <div>
              <BookingRequestForm dict={bronDict} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Map — full-width ──────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <MapBlock locale={locale} />
        </div>
      </section>
    </>
  );
}
