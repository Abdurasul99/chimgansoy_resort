import type { Locale } from "@/i18n/config";
import { BookingEngineSlot } from "@/components/ui/BookingEngineSlot";

/**
 * Hosts the Exely Booking Engine (#be-booking-form, filled by the head loader).
 *
 * Per Exely's guidance the booking page stays clean — no social links or contact
 * widgets that pull users out of the flow (those are hidden site-wide on /bron).
 * BookingEngineSlot still shows a spinner while loading and, if the engine can't
 * reach its host (can happen from outside Uzbekistan), a graceful failure state
 * WITH direct-contact buttons — so a stranded visitor still has a path, but only
 * when the engine actually fails, not on every successful booking.
 */

const COPY: Record<Locale, { call: string; loading: string; failedHeading: string; failedSub: string }> = {
  ru: {
    call: "Позвонить",
    loading: "Загружаем модуль бронирования…",
    failedHeading: "Модуль бронирования не загрузился",
    failedSub: "Такое бывает при заходе из-за пределов Узбекистана. Забронируйте напрямую — ответим быстро:",
  },
  uz: {
    call: "Qo'ng'iroq qilish",
    loading: "Bron moduli yuklanmoqda…",
    failedHeading: "Bron moduli yuklanmadi",
    failedSub: "Bu O'zbekistondan tashqaridan kirishda bo'lishi mumkin. To'g'ridan-to'g'ri bron qiling — tez javob beramiz:",
  },
  en: {
    call: "Call",
    loading: "Loading the booking module…",
    failedHeading: "The booking module didn't load",
    failedSub: "This can happen when visiting from outside Uzbekistan. Book directly — we reply fast:",
  },
};

export function ExelyBookingEngine({ locale }: { locale: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  return (
    // Full-width, adaptive: fills the screen on phones/tablets and expands to a
    // comfortable max on large screens so Exely's 2-column layout has room.
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <BookingEngineSlot copy={c} />
      </div>
    </section>
  );
}
