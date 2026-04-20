import { dictionaries } from "@/content/translations";
import type { Locale } from "@/i18n/config";
import { Icon } from "@/components/ui/Icon";

type BookingWidgetProps = {
  locale: Locale;
  variant?: "compact" | "full";
};

export function BookingWidget({ locale, variant = "compact" }: BookingWidgetProps) {
  const dict = dictionaries[locale];
  const isFull = variant === "full";

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

          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_0.9fr]">
            <label className="booking-field">
              <span><Icon name="calendar" className="h-4 w-4" /> {dict.checkIn}</span>
              <input type="date" aria-label={dict.checkIn} />
            </label>
            <label className="booking-field">
              <span><Icon name="calendar" className="h-4 w-4" /> {dict.checkOut}</span>
              <input type="date" aria-label={dict.checkOut} />
            </label>
            <label className="booking-field">
              <span><Icon name="user" className="h-4 w-4" /> {dict.guests}</span>
              <select aria-label={dict.guests} defaultValue="2">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </label>
            <button type="button" className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-[6px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[var(--accent-strong)]">
              <span>{dict.bookingWidget.submit}</span>
              <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>

        {isFull ? (
          <div
            id="bnovo-widget"
            data-bnovo-placeholder="replace-with-bnovo-embed-script-or-iframe"
            className="mt-6 rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm font-bold uppercase text-[var(--accent-strong)]">{dict.bookingWidget.integrationTitle}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{dict.bookingWidget.integrationCopy}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
