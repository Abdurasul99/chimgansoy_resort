"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";
import { rooms } from "@/content/rooms";
import { localizePath } from "@/i18n/routing";
import { text } from "@/lib/localize";

// Exely Suite room-type ids — carried to the booking engine on /bron so it opens
// straight on the chosen item. (Topchan / day visit, glamping, cottage.)
const EXELY_ROOM_ID: Record<string, string> = {
  day: "5075762",
  glamping: "5075760",
  cottage: "5075761",
};

// What the guest can book: a day visit (topchan) + the two room types.
const STAY_OPTIONS = [
  {
    slug: "day",
    title: { ru: "Дневной отдых", uz: "Kunlik dam", en: "Day visit" },
    meta: { ru: "Топчан · до 8 гостей", uz: "Topchan · 8 gacha", en: "Topchan · up to 8" },
  },
  ...rooms.map((r) => ({ slug: r.slug, title: r.title, meta: r.capacity })),
];

type Locale = "ru" | "uz" | "en";

type BronDict = {
  formTitle: string;
  name: string;
  phone: string;
  message: string;
  send: string;
  sending: string;
  success: string;
  errorRequired: string;
};

type FieldLabels = {
  checkIn: string;
  checkOut: string;
  guests: string;
};

type Props = {
  dict: BronDict;
  labels: FieldLabels;
  locale: Locale;
  defaultCheckin?: string;
  defaultCheckout?: string;
  defaultGuests?: string;
  defaultRoom?: string;
};

const SUBTITLE: Record<Locale, string> = {
  ru: "Выберите что и когда — откроется онлайн-бронирование, там подтвердите даты и оформите бронь.",
  uz: "Nimani va qachon — tanlang, onlayn bron oynasi ochiladi, u yerda sanalarni tasdiqlab bron qilasiz.",
  en: "Pick what and when — the online booking opens where you confirm the dates and complete the reservation.",
};

export function BookingRequestForm({
  dict,
  labels,
  locale,
  defaultCheckin = "",
  defaultCheckout = "",
  defaultGuests = "",
  defaultRoom = "",
}: Props) {
  // Room/stay selection — pre-fill from the card the guest came from (?room=…),
  // otherwise default to a day visit. The selected stay maps to an Exely room-type.
  const initialSlug = STAY_OPTIONS.some((o) => o.slug === defaultRoom) ? defaultRoom : "day";
  const [staySlug, setStaySlug] = useState(initialSlug);

  const stayLabel =
    locale === "ru" ? "Что бронируете" : locale === "uz" ? "Nima bron qilasiz" : "What are you booking";

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[0_8px_40px_rgba(21,29,24,0.07)] sm:p-8">
      <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.formTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{SUBTITLE[locale]}</p>

      {/* GET submit = full navigation to /bron, so the Exely engine embeds and
          opens on the selected room-type. Exely collects the guest's details and
          payment — no name/phone needed here. */}
      <form action={localizePath(locale, "/bron")} method="get" className="mt-6 space-y-4">
        {/* The selected stay -> Exely room-type id, read by the engine on /bron */}
        <input type="hidden" name="room-type" value={EXELY_ROOM_ID[staySlug] ?? ""} />

        {/* Stay-type selector — pick a day visit, glamping, or the cottage */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {stayLabel}
          </span>
          <div className="grid gap-2 sm:grid-cols-3">
            {STAY_OPTIONS.map((o) => {
              const active = o.slug === staySlug;
              return (
                <button
                  type="button"
                  key={o.slug}
                  onClick={() => setStaySlug(o.slug)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3.5 py-3 text-left transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/8 ring-2 ring-[var(--accent)]/15"
                      : "border-[color:var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <span className="block text-sm font-bold text-[var(--ink)]">{text(o.title, locale)}</span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">{text(o.meta, locale)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker name="checkin" label={labels.checkIn} defaultValue={defaultCheckin} locale={locale} minToday />
          <DatePicker name="checkout" label={labels.checkOut} defaultValue={defaultCheckout} locale={locale} minToday />
        </div>

        <GuestSelect name="guests" label={labels.guests} defaultValue={defaultGuests || "2"} locale={locale} />

        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--on-accent)] transition duration-300 hover:bg-[var(--accent-strong)]"
        >
          {dict.send}
        </button>
      </form>
    </div>
  );
}
