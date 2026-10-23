import { accommodationCancellation, stayRules } from "./pricing";

/**
 * Условия брони и возврата — так, как их читает гость перед оплатой.
 *
 * Отдельный модуль, потому что этот текст читают двое: гость — в блоке
 * «Важно перед бронированием» (BookingTermsNotice), и ИИ-консьерж — в своей
 * сводке (venue-facts.ts). Пока текст жил внутри компонента, консьерж его не
 * знал и на «правила возврата» отвечал своим пересказом, а гость на соседнем
 * экране читал другое. Теперь правка здесь доходит до обоих.
 *
 * До 23.10.2026 в блоке не было ни срока оплаты, ни самих правил отмены — только
 * ссылка на них. Гость на странице бронирования не узнавал, что у него час на
 * оплату и что отмена за 5 суток возвращает всё. Числа — из pricing.ts, тех же
 * констант, что стоят за юридическими страницами: Политика возврата, раздел 2,
 * и распоряжение оператора о часе на оплату от 17.08.2026.
 *
 * request — под формой заявки: заявка бронью не является вовсе.
 * booking — на странице бронирования: движок бронь оформляет, но держится она
 * всё равно на оплате. Писать там «это не бронирование» было бы неправдой.
 */
const days = accommodationCancellation.fullRefundDays;
const hours = accommodationCancellation.halfRefundHours;
const pct = Math.round(accommodationCancellation.halfRefundShare * 100);
const checkIn = stayRules.checkIn;
const prepay = stayRules.prepayWithin;

export const bookingTermsCopy = {
  ru: {
    title: "Важно перед отправкой заявки",
    bookingTitle: "Важно перед бронированием",
    first: "Заявка через сайт — не бронирование и не подтверждение размещения.",
    firstBooking: "Бронирование через сайт закрепляет за вами домик только после оплаты.",
    contact: "После заявки с вами свяжется наш сотрудник: уточнит детали и согласует способ оплаты.",
    contactBooking: "После бронирования с вами свяжется наш сотрудник: уточнит детали и согласует способ оплаты.",
    lines: [
      `Предоплата — 100 % стоимости в течение ${prepay.ru} с момента оформления брони. Если оплата не поступила в срок, бронь аннулируется автоматически.`,
      "Бронь считается подтверждённой только после оплаты и подтверждения от сотрудника.",
      "До оплаты выбранный домик остаётся доступным для других гостей.",
    ],
    refundTitle: "Отмена и возврат",
    refundLines: [
      `Отмена не позднее чем за ${days} суток до заезда (отсчёт от ${checkIn} дня заезда) — предоплата возвращается полностью.`,
      `Менее чем за ${days} суток, но не позднее чем за ${hours} часов — удерживается ${pct} %, остальное возвращается.`,
      `Менее чем за ${hours} часов до заезда или неявка — предоплата не возвращается.`,
      "Отмена и перенос дат — только письменно: в Telegram, WhatsApp или через форму на сайте. По телефону не принимаются.",
    ],
    read: "Перед отправкой ознакомьтесь с",
    readBooking: "Перед бронированием ознакомьтесь с",
    offer: "публичной офертой",
    and: "и",
    refund: "правилами отмены и возврата",
    agree: "Отправляя заявку, вы подтверждаете, что прочитали эти условия и согласны с ними.",
    agreeBooking: "Оформляя бронь, вы подтверждаете, что прочитали эти условия и согласны с ними.",
  },
  uz: {
    title: "Ariza yuborishdan oldin muhim",
    bookingTitle: "Bron qilishdan oldin muhim",
    first: "Sayt orqali ariza — bu bron ham, joylashuv tasdig'i ham emas.",
    firstBooking: "Sayt orqali bron uychani sizga faqat to'lovdan keyin biriktiradi.",
    contact: "Arizadan so'ng xodimimiz siz bilan bog'lanadi: tafsilotlarni aniqlaydi va to'lov usulini kelishadi.",
    contactBooking: "Bron qilganingizdan so'ng xodimimiz siz bilan bog'lanadi: tafsilotlarni aniqlaydi va to'lov usulini kelishadi.",
    lines: [
      `Oldindan to'lov — narxning 100 %, bron rasmiylashtirilgandan keyin ${prepay.uz} ichida. To'lov muddatida tushmasa, bron avtomatik bekor qilinadi.`,
      "Bron faqat to'lovdan va xodim tasdig'idan keyin tasdiqlangan hisoblanadi.",
      "To'lovgacha tanlangan uycha boshqa mehmonlar uchun ochiq qoladi.",
    ],
    refundTitle: "Bekor qilish va qaytarish",
    refundLines: [
      `Kirishdan kamida ${days} kun oldin bekor qilinsa (kirish kuni soat ${checkIn} dan hisoblanadi) — oldindan to'lov to'liq qaytariladi.`,
      `${days} kundan kam, lekin kamida ${hours} soat oldin — ${pct} % ushlab qolinadi, qolgani qaytariladi.`,
      `Kirishga ${hours} soatdan kam qolganda yoki kelinmaganda — oldindan to'lov qaytarilmaydi.`,
      "Bekor qilish va sanani ko'chirish — faqat yozma ravishda: Telegram, WhatsApp yoki saytdagi forma orqali. Telefon orqali qabul qilinmaydi.",
    ],
    read: "Yuborishdan oldin quyidagilar bilan tanishing:",
    readBooking: "Bron qilishdan oldin quyidagilar bilan tanishing:",
    offer: "ommaviy oferta",
    and: "va",
    refund: "bekor qilish va qaytarish qoidalari",
    agree: "Ariza yuborish orqali siz ushbu shartlarni o'qiganingizni va roziligingizni tasdiqlaysiz.",
    agreeBooking: "Bronni rasmiylashtirish orqali siz ushbu shartlarni o'qiganingizni va roziligingizni tasdiqlaysiz.",
  },
  en: {
    title: "Before you send a request",
    bookingTitle: "Before you book",
    first: "A request through the site is not a booking and not a confirmation of your stay.",
    firstBooking: "A booking through the site holds the cabin for you only once it is paid.",
    contact: "Once it arrives, our staff will contact you to confirm the details and agree on payment.",
    contactBooking: "Once you book, our staff will contact you to confirm the details and agree on payment.",
    lines: [
      `Prepayment is 100% of the cost, due within ${prepay.en} of making the booking. If it does not arrive in time, the booking is cancelled automatically.`,
      "A booking is confirmed only after payment and confirmation from our staff.",
      "Until then the cabin you picked stays available to other guests.",
    ],
    refundTitle: "Cancellation and refunds",
    refundLines: [
      `Cancel at least ${days} days before arrival (counted from ${checkIn} on the arrival day) — the prepayment is refunded in full.`,
      `Less than ${days} days but at least ${hours} hours before — ${pct}% is withheld, the rest is refunded.`,
      `Less than ${hours} hours before arrival, or a no-show — the prepayment is not refunded.`,
      "Cancellations and date changes are accepted in writing only — Telegram, WhatsApp or the form on the site. Not by phone.",
    ],
    read: "Before sending, please read the",
    readBooking: "Before booking, please read the",
    offer: "public offer",
    and: "and the",
    refund: "cancellation and refund rules",
    agree: "By sending a request you confirm that you have read these terms and agree to them.",
    agreeBooking: "By making a booking you confirm that you have read these terms and agree to them.",
  },
} as const;
