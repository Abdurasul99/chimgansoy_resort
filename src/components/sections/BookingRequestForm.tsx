"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact } from "@/app/actions/contact";
import { trackEvent } from "@/lib/analytics";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";
import { rooms } from "@/content/rooms";
import { text } from "@/lib/localize";

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

type State = { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

const initialState: State = { status: "idle" };

async function formAction(_prev: State, formData: FormData): Promise<State> {
  const result = await submitContact(formData);
  if (result.ok) return { status: "ok" };
  return { status: "error", message: result.error };
}

function SubmitButton({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--on-accent)] transition duration-300 hover:bg-[var(--accent-strong)] disabled:opacity-60"
    >
      {pending ? sending : label}
    </button>
  );
}

export function BookingRequestForm({
  dict,
  labels,
  locale,
  defaultCheckin = "",
  defaultCheckout = "",
  defaultGuests = "",
  defaultRoom = "",
}: Props) {
  const [state, action] = useActionState(formAction, initialState);

  // Room/stay selection — pre-fill from the card the guest came from (?room=…),
  // otherwise default to a day visit. The selected room is what gets booked.
  const initialSlug = STAY_OPTIONS.some((o) => o.slug === defaultRoom) ? defaultRoom : "day";
  const [staySlug, setStaySlug] = useState(initialSlug);
  const selectedStay = STAY_OPTIONS.find((o) => o.slug === staySlug) ?? STAY_OPTIONS[0];
  const stayLabel =
    locale === "ru" ? "Что бронируете" : locale === "uz" ? "Nima bron qilasiz" : "What are you booking";

  // Fire the booking conversion exactly once when the action succeeds.
  useEffect(() => {
    if (state.status === "ok") {
      trackEvent("booking_request_submitted", { room: staySlug });
    }
  }, [state.status, staySlug]);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.success}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-6 shadow-[0_8px_40px_rgba(21,29,24,0.07)] sm:p-8">
      <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">{dict.formTitle}</h3>

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="formType" value="booking" />
        <input type="hidden" name="locale" value={locale} />
        {/* The selected stay is always sent as a readable RU label for the admin */}
        <input type="hidden" name="room" value={text(selectedStay.title, "ru")} />

        {/* Honeypot — hidden from humans; bots that fill it are silently dropped */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

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
          <DatePicker
            name="checkin"
            label={labels.checkIn}
            defaultValue={defaultCheckin}
            locale={locale}
            minToday
          />
          <DatePicker
            name="checkout"
            label={labels.checkOut}
            defaultValue={defaultCheckout}
            locale={locale}
            minToday
          />
        </div>

        <GuestSelect
          name="guests"
          label={labels.guests}
          defaultValue={defaultGuests}
          locale={locale}
        />

        <div>
          <label htmlFor="bron-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.name}
          </label>
          <input
            type="text"
            id="bron-name"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        <div>
          <label htmlFor="bron-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.phone}
          </label>
          <input
            type="tel"
            id="bron-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="+998 90 000 00 00"
            className="w-full rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        <div>
          <label htmlFor="bron-message" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {dict.message}
          </label>
          <textarea
            id="bron-message"
            name="message"
            rows={3}
            className="w-full resize-none rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        {state.status === "error" && (
          <p role="alert" aria-live="assertive" className="text-sm font-medium text-red-600">{state.message || dict.errorRequired}</p>
        )}

        <SubmitButton label={dict.send} sending={dict.sending} />
      </form>
    </div>
  );
}
