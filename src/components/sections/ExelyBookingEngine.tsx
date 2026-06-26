import { contacts } from "@/content/contacts";
import type { Locale } from "@/i18n/config";

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

const COPY: Record<Locale, { heading: string; sub: string; call: string }> = {
  ru: {
    heading: "Нужна помощь с бронированием?",
    sub: "Если модуль бронирования выше не открывается (такое бывает при заходе из-за пределов Узбекистана) или остались вопросы — забронируйте напрямую. Ответим быстро и подтвердим даты.",
    call: "Позвонить",
  },
  uz: {
    heading: "Bron qilishda yordam kerakmi?",
    sub: "Agar yuqoridagi bron moduli ochilmasa (O'zbekistondan tashqaridan kirishda shunday bo'lishi mumkin) yoki savollaringiz bo'lsa — to'g'ridan-to'g'ri bron qiling. Tez javob beramiz va sanalarni tasdiqlaymiz.",
    call: "Qo'ng'iroq qilish",
  },
  en: {
    heading: "Need help booking?",
    sub: "If the booking module above doesn't open (this can happen when visiting from outside Uzbekistan) or you have questions — book directly. We reply fast and confirm your dates.",
    call: "Call",
  },
};

const baseBtn =
  "btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition";
const ghostBtn = `${baseBtn} border border-[color:var(--line-strong)] text-[var(--ink)] hover:border-[var(--sun)] hover:text-[var(--sun-dark)]`;

export function ExelyBookingEngine({ locale }: { locale: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  return (
    <>
      {/* Exely booking engine is injected here by the head loader. */}
      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div id="be-booking-form" suppressHydrationWarning />
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
