import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { bookingTermsCopy as COPY } from "@/content/booking-terms";
import { clock } from "@/components/ui/Clock";

/**
 * Что заявка значит, а чего не значит.
 *
 * Отдельным блоком, а не строкой в списке условий: гость читает список, чтобы
 * прикинуть стоимость, и «заявка — ещё не бронь» там теряется. А теряться ей
 * нельзя — иначе человек уезжает в горы, уверенный, что домик за ним, и узнаёт
 * обратное на ресепшене.
 *
 * Ссылки ведут на оферту и на правила отмены: сказать «ознакомьтесь с
 * условиями» и не дать их — то же самое, что не сказать ничего.
 *
 * Текст — в content/booking-terms.ts: его же пересказывает ИИ-консьерж.
 */

export function BookingTermsNotice({
  locale,
  variant = "request",
  className = "",
}: {
  locale: Locale;
  /**
   * request — под формой заявки: заявка бронью не является вовсе.
   * booking — на странице бронирования: движок бронь оформляет, но держится
   * она всё равно на оплате. Писать там «это не бронирование» было бы неправдой.
   */
  variant?: "request" | "booking";
  className?: string;
}) {
  const t = COPY[locale];
  const booking = variant === "booking";
  const title = booking ? t.bookingTitle : t.title;
  const lines = [booking ? t.firstBooking : t.first, booking ? t.contactBooking : t.contact, ...t.lines];
  const link =
    "font-semibold text-[var(--accent-strong)] underline underline-offset-2 transition-colors hover:text-[var(--sun-dark)]";

  const list = (items: readonly string[]) => (
    <ul className="mt-3 space-y-2">
      {items.map((line) => (
        <li key={line} className="flex gap-2.5 text-sm leading-6 text-[var(--ink)]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sun)]" />
          <span>{clock(line)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`rounded-2xl border border-[color:var(--sun)]/40 bg-[var(--surface-warm)] p-5 sm:p-6 ${className}`}
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sun-dark)]">
        {title}
      </p>

      {list(lines)}

      {/* Сами правила, а не только ссылка на них: гость решает здесь, и узнать
          про 5 суток и 48 часов после оплаты — значит узнать слишком поздно. */}
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sun-dark)]">
        {t.refundTitle}
      </p>
      {list(t.refundLines)}

      <p className="mt-4 border-t border-[color:var(--line)] pt-3 text-sm leading-6 text-[var(--muted)]">
        {booking ? t.readBooking : t.read}{" "}
        <Link href={localizePath(locale, "/legal/public-offer")} className={link}>
          {t.offer}
        </Link>{" "}
        {t.and}{" "}
        <Link href={localizePath(locale, "/legal/payment-refund")} className={link}>
          {t.refund}
        </Link>
        . {booking ? t.agreeBooking : t.agree}
      </p>
    </div>
  );
}
