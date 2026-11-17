import type { Locale } from "@/i18n/config";
import { BookingEngineSlot } from "@/components/ui/BookingEngineSlot";
import { localizePath } from "@/i18n/routing";

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

/*
 * «Такое бывает при заходе из-за пределов Узбекистана» стояло тут до 17.11.2026 —
 * а с 15.11 модуль не грузился ни у кого (у CDN Exely истёк сертификат), и
 * объяснение было неправдой. Текст теперь без причины: её мы честно не знаем.
 */
const COPY: Record<Locale, { call: string; loading: string; failedHeading: string; failedSub: string; glamping: string; chalet: string }> = {
  ru: {
    call: "Позвонить",
    loading: "Загружаем модуль бронирования…",
    failedHeading: "Модуль бронирования не загрузился",
    failedSub: "Онлайн-бронирование сейчас недоступно. Оставьте заявку на странице домика или свяжитесь с нами — ответим быстро:",
    glamping: "Заявка на глэмпинг",
    chalet: "Заявка на шале",
  },
  uz: {
    call: "Qo'ng'iroq qilish",
    loading: "Bron moduli yuklanmoqda…",
    failedHeading: "Bron moduli yuklanmadi",
    failedSub: "Onlayn bron hozircha ishlamayapti. Uycha sahifasida ariza qoldiring yoki biz bilan bog'laning — tez javob beramiz:",
    glamping: "Glempingga ariza",
    chalet: "Shalega ariza",
  },
  en: {
    call: "Call",
    loading: "Loading the booking module…",
    failedHeading: "The booking module didn't load",
    failedSub: "Online booking is unavailable right now. Leave a request on a cabin page or contact us — we reply fast:",
    glamping: "Request glamping",
    chalet: "Request the chalet",
  },
};

export function ExelyBookingEngine({ locale }: { locale: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  return (
    // Full-width, adaptive: fills the screen on phones/tablets and expands to a
    // comfortable max on large screens so Exely's 2-column layout has room.
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <BookingEngineSlot
          copy={{
            ...c,
            alternatives: [
              { href: localizePath(locale, "/nomera/glamping"), label: c.glamping },
              { href: localizePath(locale, "/nomera/cottage"), label: c.chalet },
            ],
          }}
        />
      </div>
    </section>
  );
}
