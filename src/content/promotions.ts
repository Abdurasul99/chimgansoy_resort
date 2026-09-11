import type { LocalizedList, LocalizedString } from "./types";

/**
 * Действующие акции курорта.
 *
 * До 05.09.2026 здесь лежали три выдуманных «сезонных предложения» —
 * «раннее бронирование», «шале + активности», «тихая ночь»: у них не было ни
 * условий, ни цифр, ни срока, и продать по ним было нечего. Оператор запустил
 * настоящие, с датами и выгодой, — они и лежат тут.
 *
 * `slug` уходит в метку ссылки (utm_content), поэтому в заявке видно, какая
 * акция привела гостя. Совпадает с метками на визитке из шапки Instagram.
 */
export type Promotion = {
  slug: "2plus1" | "all-inclusive" | "slow-weekend";
  badge: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  /** Строки выгоды: подпись и сумма. Пусто, если выгода не в деньгах. */
  savings?: { label: LocalizedString; amount: number }[];
  /** Условия — то, из-за чего на ресепшене спорят, если о них умолчать. */
  terms: LocalizedList;
  /**
   * «Как это работает» — по шагам, словами оператора. Гость читает условия и
   * не может представить, что именно получит; расписание по дням отвечает
   * на это раньше, чем он возьмёт телефон.
   */
  howItWorks?: { title: LocalizedString; lines: LocalizedList };
  /**
   * Последний день действия, включительно (ISO). Без него акция висела бы
   * на сайте и первого октября — и гость приехал бы за скидкой, которой уже
   * нет. Проверку делает src/lib/promo-nights.ts, она же гасит подсказку в
   * форме заявки и карточку на первом экране.
   */
  until?: string;
};

export const promotions: Promotion[] = [
  {
    slug: "2plus1",
    badge: { ru: "Будни · −33%", uz: "Ish kunlari · −33%", en: "Weekdays · −33%" },
    title: {
      ru: "«2+1» — третья ночь в подарок",
      uz: "«2+1» — uchinchi kecha sovg'a",
      en: "2+1 — third night free",
    },
    description: {
      ru: "Оплачиваете две ночи, третью получаете бесплатно. Больше времени в горах без спешки.",
      uz: "Ikki kecha uchun to'laysiz, uchinchisi bepul. Tog'larda shoshilmasdan ko'proq vaqt.",
      en: "Pay for two nights, get the third free. More time in the mountains, unhurried.",
    },
    savings: [
      { label: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" }, amount: 1_500_000 },
      { label: { ru: "Шале", uz: "Shale", en: "Chalet" }, amount: 3_000_000 },
    ],
    until: "2026-09-30",
    terms: {
      ru: [
        "Заезд с понедельника по четверг, выезд не позже пятницы",
        "Действует до 30 сентября 2026 года",
        "Завтраки включены",
        "Не суммируется с тарифом «Всё включено»",
      ],
      uz: [
        "Kirish dushanbadan payshanbagacha, chiqish jumadan kechikmay",
        "2026-yil 30-sentabrgacha amal qiladi",
        "Nonushta kiritilgan",
        "«Hammasi kiritilgan» tarifi bilan qo'shilmaydi",
      ],
      en: [
        "Arrive Monday to Thursday, depart no later than Friday",
        "Valid through 30 September 2026",
        "Breakfast included",
        "Not combinable with the All-Inclusive rate",
      ],
    },
  },
  {
    slug: "all-inclusive",
    badge: { ru: "Пн–Пт", uz: "Du–Ju", en: "Mon–Fri" },
    title: {
      ru: "Тариф «Всё включено»",
      uz: "«Hammasi kiritilgan» tarifi",
      en: "The All-Inclusive rate",
    },
    description: {
      ru: "Трёхразовое питание по сет-меню на каждый полный день проживания: завтрак, обед и ужин. Не нужно думать, что приготовить и где поесть.",
      uz: "Har bir to'liq yashash kuni uchun set-menyu bo'yicha uch mahal ovqat: nonushta, tushlik va kechki ovqat. Nima pishirish va qayerda ovqatlanishni o'ylash shart emas.",
      en: "Three meals from our set menu for every full day of your stay: breakfast, lunch and dinner. No need to think about cooking or where to eat.",
    },
    howItWorks: {
      title: { ru: "Как это работает", uz: "Qanday ishlaydi", en: "How it works" },
      lines: {
        ru: [
          "1 ночь: в день заезда — ужин, утром — завтрак",
          "2 ночи и больше: в день заезда — ужин",
          "каждый полный день — завтрак, обед и ужин",
          "в день выезда — завтрак",
        ],
        uz: [
          "1 kecha: kelgan kuni — kechki ovqat, ertalab — nonushta",
          "2 kecha va undan ko'p: kelgan kuni — kechki ovqat",
          "har bir to'liq kun — nonushta, tushlik va kechki ovqat",
          "ketish kuni — nonushta",
        ],
        en: [
          "1 night: dinner on arrival, breakfast the next morning",
          "2 nights or more: dinner on arrival",
          "every full day — breakfast, lunch and dinner",
          "on the day you leave — breakfast",
        ],
      },
    },
    terms: {
      ru: [
        "Блюда по расписанию в ресторане или с доставкой в домик",
        "Только будни, с понедельника по пятницу",
        "Не суммируется с акцией «2+1»",
      ],
      uz: [
        "Taomlar jadval bo'yicha restoranda yoki uyga yetkazib beriladi",
        "Faqat ish kunlari, dushanbadan jumagacha",
        "«2+1» aksiyasi bilan qo'shilmaydi",
      ],
      en: [
        "Meals on schedule in the restaurant or delivered to your cabin",
        "Weekdays only, Monday to Friday",
        "Not combinable with the 2+1 offer",
      ],
    },
  },
  {
    slug: "slow-weekend",
    badge: { ru: "Сб–Вс", uz: "Sha–Ya", en: "Sat–Sun" },
    title: {
      ru: "Выходной без спешки",
      uz: "Shoshilmasdan dam olish",
      en: "An unhurried weekend",
    },
    description: {
      ru: "Поздний выезд в воскресенье и завтрак на всех проживающих. Никакой утренней суеты со сбором вещей к полудню.",
      uz: "Yakshanba kuni kech chiqish va barcha mehmonlarga nonushta. Tushga qadar shoshilib yig'ilish shart emas.",
      en: "Late check-out on Sunday and breakfast for every guest. No rushing to pack by noon.",
    },
    terms: {
      ru: [
        "Только при бронировании на одни сутки: с субботы на воскресенье",
        "Точное время позднего выезда подтверждает администратор при брони",
      ],
      uz: [
        "Faqat bir kecha-kunduzga bron qilinganda: shanbadan yakshanbaga",
        "Kech chiqishning aniq vaqtini bron paytida administrator tasdiqlaydi",
      ],
      en: [
        "Saturday-to-Sunday bookings only",
        "The exact late check-out time is confirmed by the administrator",
      ],
    },
  },
];
