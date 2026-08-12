import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

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
 */
const COPY = {
  ru: {
    title: "Важно перед отправкой заявки",
    bookingTitle: "Важно перед бронированием",
    first: "Заявка через сайт — не бронирование и не подтверждение размещения.",
    firstBooking: "Бронирование через сайт закрепляет за вами домик только после оплаты.",
    lines: [
      "После заявки с вами свяжется наш сотрудник: уточнит детали и согласует способ оплаты.",
      "Бронь считается подтверждённой только после оплаты и подтверждения от сотрудника.",
      "До оплаты выбранный домик остаётся доступным для других гостей.",
    ],
    read: "Перед отправкой ознакомьтесь с",
    offer: "публичной офертой",
    and: "и",
    refund: "правилами отмены и возврата",
    agree: "Отправляя заявку, вы подтверждаете, что прочитали эти условия и согласны с ними.",
  },
  uz: {
    title: "Ariza yuborishdan oldin muhim",
    bookingTitle: "Bron qilishdan oldin muhim",
    first: "Sayt orqali ariza — bu bron ham, joylashuv tasdig'i ham emas.",
    firstBooking: "Sayt orqali bron uychani sizga faqat to'lovdan keyin biriktiradi.",
    lines: [
      "Arizadan so'ng xodimimiz siz bilan bog'lanadi: tafsilotlarni aniqlaydi va to'lov usulini kelishadi.",
      "Bron faqat to'lovdan va xodim tasdig'idan keyin tasdiqlangan hisoblanadi.",
      "To'lovgacha tanlangan uycha boshqa mehmonlar uchun ochiq qoladi.",
    ],
    read: "Yuborishdan oldin quyidagilar bilan tanishing:",
    offer: "ommaviy oferta",
    and: "va",
    refund: "bekor qilish va qaytarish qoidalari",
    agree: "Ariza yuborish orqali siz ushbu shartlarni o'qiganingizni va roziligingizni tasdiqlaysiz.",
  },
  en: {
    title: "Before you send a request",
    bookingTitle: "Before you book",
    first: "A request through the site is not a booking and not a confirmation of your stay.",
    firstBooking: "A booking through the site holds the cabin for you only once it is paid.",
    lines: [
      "Once it arrives, our staff will contact you to confirm the details and agree on payment.",
      "A booking is confirmed only after payment and confirmation from our staff.",
      "Until then the cabin you picked stays available to other guests.",
    ],
    read: "Before sending, please read the",
    offer: "public offer",
    and: "and the",
    refund: "cancellation and refund rules",
    agree: "By sending a request you confirm that you have read these terms and agree to them.",
  },
} as const;

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
  const title = variant === "booking" ? t.bookingTitle : t.title;
  const lines = [variant === "booking" ? t.firstBooking : t.first, ...t.lines];
  const link =
    "font-semibold text-[var(--accent-strong)] underline underline-offset-2 transition-colors hover:text-[var(--sun-dark)]";

  return (
    <div
      className={`rounded-2xl border border-[color:var(--sun)]/40 bg-[var(--surface-warm)] p-5 sm:p-6 ${className}`}
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sun-dark)]">
        {title}
      </p>

      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-6 text-[var(--ink)]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sun)]" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-[color:var(--line)] pt-3 text-sm leading-6 text-[var(--muted)]">
        {t.read}{" "}
        <Link href={localizePath(locale, "/legal/public-offer")} className={link}>
          {t.offer}
        </Link>{" "}
        {t.and}{" "}
        <Link href={localizePath(locale, "/legal/payment-refund")} className={link}>
          {t.refund}
        </Link>
        . {t.agree}
      </p>
    </div>
  );
}
