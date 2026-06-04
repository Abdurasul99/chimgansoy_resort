import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { getFirstSearchParam, type SearchParams } from "@/lib/search-params";
import { Icon } from "@/components/ui/Icon";

type BookingWidgetProps = {
  locale: Locale;
  variant?: "compact" | "full";
  searchParams?: SearchParams;
};

export function BookingWidget({ locale, variant = "compact", searchParams }: BookingWidgetProps) {
  const dict = dictionaries[locale];
  const isFull = variant === "full";
  const selectedGuests = getFirstSearchParam(searchParams, "guests") || "2";

  return (
    <section className={`relative z-10 ${isFull ? "py-10" : "-mt-8 px-4 pb-10"}`} aria-labelledby="booking-widget-title">
      <div className={`mx-auto max-w-6xl rounded-[8px] border border-white/70 bg-white/96 p-4 shadow-[0_24px_80px_rgba(20,61,45,0.14)] backdrop-blur ${isFull ? "p-5 sm:p-8" : "sm:p-5"}`}>
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
            className={`grid gap-3 sm:grid-cols-2 ${isFull ? "lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.9fr]" : "lg:grid-cols-[1fr_1fr_0.8fr_0.9fr]"}`}
          >
            <label className="booking-field">
              <span><Icon name="calendar" className="h-4 w-4" /> {dict.checkIn}</span>
              <input type="date" name="checkin" aria-label={dict.checkIn} defaultValue={getFirstSearchParam(searchParams, "checkin")} />
            </label>
            <label className="booking-field">
              <span><Icon name="calendar" className="h-4 w-4" /> {dict.checkOut}</span>
              <input type="date" name="checkout" aria-label={dict.checkOut} defaultValue={getFirstSearchParam(searchParams, "checkout")} />
            </label>
            <label className="booking-field">
              <span><Icon name="user" className="h-4 w-4" /> {dict.guests}</span>
              <select name="guests" aria-label={dict.guests} defaultValue={selectedGuests}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </label>
            {isFull ? (
              <label className="booking-field">
                <span>{dict.promoCode}</span>
                <input type="text" name="promo" aria-label={dict.promoCode} defaultValue={getFirstSearchParam(searchParams, "promo")} />
              </label>
            ) : null}
            <button type="submit" className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[var(--accent-strong)]">
              <span>{dict.bookingWidget.submit}</span>
              <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
