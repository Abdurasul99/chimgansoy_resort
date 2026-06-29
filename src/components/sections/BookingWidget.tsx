import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { getFirstSearchParam, type SearchParams } from "@/lib/search-params";
import { Icon } from "@/components/ui/Icon";
import { DatePicker } from "@/components/ui/DatePicker";
import { GuestSelect } from "@/components/ui/GuestSelect";

type BookingWidgetProps = {
  locale: Locale;
  variant?: "compact" | "full" | "hero";
  searchParams?: SearchParams;
};

export function BookingWidget({ locale, variant = "compact", searchParams }: BookingWidgetProps) {
  const dict = dictionaries[locale];
  const isFull = variant === "full";
  const selectedGuests = getFirstSearchParam(searchParams, "guests") || "2";
  const checkin = getFirstSearchParam(searchParams, "checkin");
  const checkout = getFirstSearchParam(searchParams, "checkout");
  const promo = getFirstSearchParam(searchParams, "promo");

  // Hero variant — a compact search bar that sits ON the hero photo. No section
  // wrapper, no title column (the hero already has the big title); translucent
  // cream card so it reads over the photo. Submits a full GET nav to /bron.
  if (variant === "hero") {
    return (
      <div className="w-full rounded-2xl border border-white/25 bg-[var(--paper)]/92 p-3 shadow-[0_24px_70px_rgba(8,12,20,0.45)] backdrop-blur-md">
        {/* 2x2 grid, column-first flow: left column = dates (check-in / check-out),
            right column = guests / submit. Stacks to one column on phones. */}
        <form
          action={localizePath(locale, "/bron")}
          method="get"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:grid-rows-2 sm:grid-flow-col"
        >
          <DatePicker name="checkin" label={dict.checkIn} defaultValue={checkin} locale={locale} minToday />
          <DatePicker name="checkout" label={dict.checkOut} defaultValue={checkout} locale={locale} minToday />
          <GuestSelect name="guests" label={dict.guests} defaultValue={selectedGuests} locale={locale} />
          <button
            type="submit"
            className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-[6px] bg-[var(--sun)] px-4 py-3 text-sm font-bold text-[var(--on-accent)] transition duration-300 hover:bg-[var(--sun-dark)]"
          >
            <span>{dict.bookingWidget.submit}</span>
            <Icon name="arrow" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <section
      className={`relative z-10 ${isFull ? "py-10" : "-mt-8 px-4 pb-10"}`}
      aria-labelledby="booking-widget-title"
    >
      <div
        className={`mx-auto max-w-6xl rounded-2xl border border-[color:var(--line)] bg-[var(--paper)]/95 p-4 shadow-[0_24px_80px_rgba(20,61,45,0.14)] backdrop-blur ${
          isFull ? "p-5 sm:p-8" : "sm:p-5"
        }`}
      >
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.7fr] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[var(--accent-strong)]">{dict.chooseDates}</p>
            <h2 id="booking-widget-title" className="font-serif text-3xl font-semibold text-[var(--ink)]">
              {dict.bookingWidget.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{dict.bookingWidget.subtitle}</p>
          </div>

          <form
            action={localizePath(locale, "/bron")}
            method="get"
            className={`grid gap-3 sm:grid-cols-2 ${
              isFull ? "lg:grid-cols-[1fr_1fr_0.9fr_0.8fr_0.9fr]" : "lg:grid-cols-[1fr_1fr_0.9fr_0.9fr]"
            }`}
          >
            <DatePicker name="checkin" label={dict.checkIn} defaultValue={checkin} locale={locale} minToday />
            <DatePicker name="checkout" label={dict.checkOut} defaultValue={checkout} locale={locale} minToday />
            <GuestSelect name="guests" label={dict.guests} defaultValue={selectedGuests} locale={locale} />

            {isFull ? (
              <label className="flex min-h-14 flex-col justify-center gap-1 rounded-[6px] border border-[color:var(--line)] bg-[var(--surface)] px-3.5 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  {dict.promoCode}
                </span>
                <input
                  type="text"
                  name="promo"
                  aria-label={dict.promoCode}
                  defaultValue={promo}
                  className="min-w-0 border-0 bg-transparent text-sm font-bold text-[var(--ink)] outline-none placeholder:text-[var(--muted)]/50"
                />
              </label>
            ) : null}

            <button
              type="submit"
              className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--on-accent)] transition duration-300 hover:bg-[var(--accent-strong)]"
            >
              <span>{dict.bookingWidget.submit}</span>
              <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
