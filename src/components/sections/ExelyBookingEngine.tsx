import { contacts } from "@/content/contacts";
import type { Locale } from "@/i18n/config";
import { BookingEngineSlot } from "@/components/ui/BookingEngineSlot";

/**
 * Hosts the Exely Booking Engine (#be-booking-form, filled by the head loader)
 * plus an always-present direct-contact card.
 *
 * Why the card is always shown: Exely serves this hotel's data only from its
 * Uzbekistan region (uz-ibe.hopenapi.com). Inside Uzbekistan the engine loads
 * normally; from some countries that host is unreachable and the engine shows
 * an empty "nothing here yet" state. That failed state renders inside
 * cross-origin iframes, so it can't be told apart from a working engine in the
 * DOM — auto-detecting it is unreliable. So instead of guessing, we always
 * offer a direct-contact path: in Uzbekistan it reads as a normal "need help?"
 * note; abroad it's the booking lifeline. (Remove once Exely serves the hotel
 * from a globally-reachable endpoint.)
 */

const COPY: Record<
  Locale,
  {
    heading: string;
    sub: string;
    call: string;
    loading: string;
    failedHeading: string;
    failedSub: string;
  }
> = {
  ru: {
    heading: "Нужна помощь с бронированием?",
    sub: "Если модуль бронирования выше не открывается (такое бывает при заходе из-за пределов Узбекистана) или остались вопросы — забронируйте напрямую. Ответим быстро и подтвердим даты.",
    call: "Позвонить",
    loading: "Загружаем модуль бронирования…",
    failedHeading: "Модуль бронирования не загрузился",
    failedSub: "Это бывает при заходе из-за пределов Узбекистана. Забронируйте напрямую — контакты ниже, ответим быстро.",
  },
  uz: {
    heading: "Bron qilishda yordam kerakmi?",
    sub: "Agar yuqoridagi bron moduli ochilmasa (O'zbekistondan tashqaridan kirishda shunday bo'lishi mumkin) yoki savollaringiz bo'lsa — to'g'ridan-to'g'ri bron qiling. Tez javob beramiz va sanalarni tasdiqlaymiz.",
    call: "Qo'ng'iroq qilish",
    loading: "Bron moduli yuklanmoqda…",
    failedHeading: "Bron moduli yuklanmadi",
    failedSub: "Bu O'zbekistondan tashqaridan kirishda bo'lishi mumkin. To'g'ridan-to'g'ri bron qiling — quyida kontaktlar, tez javob beramiz.",
  },
  en: {
    heading: "Need help booking?",
    sub: "If the booking module above doesn't open (this can happen when visiting from outside Uzbekistan) or you have questions — book directly. We reply fast and confirm your dates.",
    call: "Call",
    loading: "Loading the booking module…",
    failedHeading: "The booking module didn't load",
    failedSub: "This can happen when visiting from outside Uzbekistan. Book directly — contacts are below, we reply fast.",
  },
};

const baseBtn =
  "btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition";
const ghostBtn = `${baseBtn} border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)] hover:text-[var(--sun-dark)]`;

export function ExelyBookingEngine({ locale }: { locale: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  return (
    <>
      {/* Exely booking engine is injected here by the head loader.
          BookingEngineSlot adds loading + graceful-failure states so this area
          is never just an empty void when the engine can't reach its host. */}
      {/* Full-width, adaptive: fills the screen on phones/tablets and expands to a
          comfortable max on large screens (a booking form spanning an ultra-wide
          monitor reads badly), so Exely's 2-column layout has room to breathe. */}
      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <BookingEngineSlot
            copy={{ loading: c.loading, failedHeading: c.failedHeading, failedSub: c.failedSub }}
          />
        </div>
      </section>

      {/* Direct-contact fallback — always available (see file header). */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold text-[var(--ink)] sm:text-2xl">{c.heading}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{c.sub}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`tel:${contacts.phone.replaceAll(" ", "")}`}
              className={`${baseBtn} bg-[var(--sun)] text-[var(--on-accent)] hover:bg-[var(--sun-dark)]`}
            >
              {c.call} {contacts.phone}
            </a>
            <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              Telegram
            </a>
            <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              WhatsApp
            </a>
            <a href={`mailto:${contacts.email}`} className={ghostBtn}>
              {contacts.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
