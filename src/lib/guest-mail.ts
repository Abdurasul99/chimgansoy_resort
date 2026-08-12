import { contacts } from "@/content/contacts";
import { rooms } from "@/content/rooms";
import { text } from "@/lib/localize";
import { stayRules } from "@/content/pricing";
import type { BookingRow } from "@/lib/pms";

/**
 * Подтверждение гостю — единственное письмо, которое сайт шлёт НЕ оператору.
 *
 * Уходит один раз, на переводе брони в «оплачена», и только если гость оставил
 * почту. По услугам его нет намеренно: оператор сказал, что там подтверждают
 * звонком, и письмо «вы оплатили бассейн» никому не нужно.
 *
 * Никогда не бросает: провалившееся письмо не должно откатывать смену статуса —
 * деньги получены, и статус обязан это отражать. Вернёт false, а панель скажет
 * оператору, что подтвердить нужно звонком.
 */
const COPY = {
  ru: {
    subject: (room: string) => `Бронирование подтверждено — ${room}, CHIMGAN DARBAZA`,
    hi: (name: string) => `Здравствуйте, ${name}!`,
    body: "Ваше бронирование подтверждено, оплата получена. Ждём вас.",
    room: "Размещение",
    unit: "Номер",
    dates: "Даты",
    guests: "Гости",
    paid: "Оплачено",
    rules: `Заезд с ${stayRules.checkIn}, выезд до ${stayRules.checkOut}. При заселении нужны паспорта всех проживающих.`,
    tax: "Туристский сбор платят только иностранные граждане и лица без гражданства — он вносится при заселении, отдельно от стоимости проживания.",
    bye: "Если планы изменятся, позвоните нам заранее.",
  },
  uz: {
    subject: (room: string) => `Bron tasdiqlandi — ${room}, CHIMGAN DARBAZA`,
    hi: (name: string) => `Assalomu alaykum, ${name}!`,
    body: "Bronigiz tasdiqlandi, to'lov qabul qilindi. Sizni kutamiz.",
    room: "Joylashuv",
    unit: "Xona",
    dates: "Sanalar",
    guests: "Mehmonlar",
    paid: "To'landi",
    rules: `Kirish ${stayRules.checkIn} dan, chiqish ${stayRules.checkOut} gacha. Joylashuvda barcha yashovchilarning pasporti kerak.`,
    tax: "Turistik yig'imni faqat chet el fuqarolari va fuqaroligi bo'lmagan shaxslar to'laydi — u joylashuvda, yashash narxidan alohida to'lanadi.",
    bye: "Rejalaringiz o'zgarsa, oldindan qo'ng'iroq qiling.",
  },
  en: {
    subject: (room: string) => `Booking confirmed — ${room}, CHIMGAN DARBAZA`,
    hi: (name: string) => `Hello, ${name}!`,
    body: "Your booking is confirmed and the payment has been received. We look forward to seeing you.",
    room: "Accommodation",
    unit: "Unit",
    dates: "Dates",
    guests: "Guests",
    paid: "Paid",
    rules: `Check-in from ${stayRules.checkIn}, check-out by ${stayRules.checkOut}. Passports of every guest are required at check-in.`,
    tax: "The tourist levy is paid only by foreign nationals and stateless persons, at check-in and separately from the room rate.",
    bye: "If your plans change, please call us in advance.",
  },
} as const;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n: number) => n.toLocaleString("ru-RU").replaceAll(",", " ");

export async function sendGuestConfirmation(b: BookingRow): Promise<boolean> {
  if (!b.email) return false;

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.BOOKING_EMAIL_FROM?.trim();
  if (!key || !from) {
    console.error("[guest-mail] нет RESEND_API_KEY или BOOKING_EMAIL_FROM — письмо не отправлено");
    return false;
  }

  const locale = (["ru", "uz", "en"] as const).find((l) => l === b.locale) ?? "ru";
  const t = COPY[locale];
  const room = rooms.find((r) => r.slug === b.room_slug);
  const roomName = room ? text(room.title, locale) : b.room_slug;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b7280">${esc(label)}</td><td style="padding:6px 0;font-weight:600">${esc(value)}</td></tr>`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#1f2a33">
      <p style="font-size:16px">${esc(t.hi(b.guest_name))}</p>
      <p style="font-size:16px;line-height:1.6">${esc(t.body)}</p>
      <table style="margin:20px 0;font-size:15px">
        ${row(t.room, roomName)}
        ${b.unit_id ? row(t.unit, b.unit_id) : ""}
        ${row(t.dates, b.checkout ? `${b.checkin} — ${b.checkout}` : b.checkin)}
        ${row(t.guests, `${b.adults} + ${b.kids}`)}
        ${b.paid > 0 ? row(t.paid, `${money(b.paid)} UZS`) : ""}
      </table>
      <p style="font-size:14px;line-height:1.6;color:#4b5563">${esc(t.rules)}</p>
      <p style="font-size:14px;line-height:1.6;color:#4b5563">${esc(t.tax)}</p>
      <p style="font-size:14px;line-height:1.6">${esc(t.bye)}<br>${esc(contacts.phone)}</p>
      <p style="font-size:13px;color:#9ca3af">CHIMGAN DARBAZA · chimgandarbaza.uz</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [b.email], subject: t.subject(roomName), html }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error("[guest-mail] Resend ответил", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[guest-mail] письмо не ушло:", e);
    return false;
  }
}
