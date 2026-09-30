import type { LocalizedList, LocalizedString } from "./types";
import { cabinOccupancy } from "./pricing";

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
  slug: "2plus1" | "chalet-october" | "all-inclusive" | "slow-weekend";
  badge: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  /**
   * Строки выгоды: подпись, сумма и сколько гостей входит в цену домика.
   * Пусто, если выгода не в деньгах. По гостям считается цена «с человека».
   */
  savings?: { label: LocalizedString; amount: number; guests: number }[];
  /**
   * Скидка в процентах на ночь домика — расчёт «было → стало, экономия, с
   * человека» строится из этих чисел (lib/promo-nights.ts, discountMath), а не
   * из текста: цена, вписанная словами, не поменялась бы вместе с тарифом.
   */
  discount?: { label: LocalizedString; base: number; percent: number; guests: number };
  /** Условия — то, из-за чего на ресепшене спорят, если о них умолчать. */
  terms: LocalizedList;
  /**
   * «Как это работает» — по шагам, словами оператора. Гость читает условия и
   * не может представить, что именно получит; расписание по дням отвечает
   * на это раньше, чем он возьмёт телефон.
   */
  howItWorks?: { title: LocalizedString; lines: LocalizedList };
  /**
   * Последний день действия, включительно (ISO). Нет поля — акция действует,
   * пока оператор её не снимет. Есть — карточки, подсказка в форме заявки и
   * брифинг ИИ гаснут сами: src/lib/promo-nights.ts.
   *
   * Срок ставить, только когда оператор его назвал. У «2+1» он есть (конец
   * сентября 2026), у «Всё включено» — нет.
   */
  until?: string;
  /**
   * Не показывать карточку в блоке акций на сайте.
   *
   * Условие при этом продолжает действовать: оператор подтверждает его на
   * ресепшене, а ИИ-консьерж отвечает о нём по брифингу из venue-facts.ts.
   * Убрать запись целиком значило бы, что консьерж начнёт отрицать то, что
   * отель даёт, — а это хуже лишней карточки.
   */
  hiddenOnSite?: boolean;
};

/**
 * Выгода «2+1» по домикам: будничная ночь и сколько гостей входит в цену.
 * Отдельной константой — из неё же считается строка «от … с человека» в
 * условиях: цена, вписанная текстом, не поменялась бы вместе с тарифом.
 */
const TWO_PLUS_ONE_SAVINGS = [
  { label: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" }, amount: 1_500_000, guests: cabinOccupancy.glamping.base },
  { label: { ru: "Шале", uz: "Shale", en: "Chalet" }, amount: 3_000_000, guests: cabinOccupancy.cottage.base },
];

/**
 * Ночь с человека при полном размещении: две оплаченные ночи из трёх,
 * поделённые на гостей домика. Тот же расчёт, что promoBreakdown в
 * lib/promo-nights.ts; совпадение держит тест.
 */
const perPersonFrom = Math.min(
  ...TWO_PLUS_ONE_SAVINGS.map((s) => Math.round((s.amount * 2) / 3 / s.guests / 1000) * 1000),
);
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const [glampingGuests, chaletGuests] = TWO_PLUS_ONE_SAVINGS.map((s) => s.guests);

export const promotions: Promotion[] = [
  {
    slug: "2plus1",
    // «Будни» — слово оператора. С 24.09 по 30.09.2026 здесь стояло «Вс–Чт»:
    // с воскресным заездом «будни» казались неточными. Оператор 30.09 вернул
    // «Будни» своим текстом («сохранить как было ранее») — дни заезда названы
    // рядом, в условиях, и «Вс→Ср» там стоит первым.
    badge: { ru: "Будни · −33%", uz: "Ish kunlari · −33%", en: "Weekdays · −33%" },
    title: {
      ru: "«2+1» — третья ночь в подарок",
      uz: "«2+1» — uchinchi kecha sovg'a",
      en: "2+1 — third night free",
    },
    description: {
      ru: "Оплачиваете две ночи, третью получаете бесплатно. Заезд в воскресенье, понедельник или вторник — три ночи в горах без спешки.",
      uz: "Ikki kecha uchun to'laysiz, uchinchisi bepul. Kirish yakshanba, dushanba yoki seshanba — tog'larda shoshilmasdan uch kecha.",
      en: "Pay for two nights, get the third free. Arrive on Sunday, Monday or Tuesday — three unhurried nights in the mountains.",
    },
    savings: TWO_PLUS_ONE_SAVINGS,
    // Сентябрьская акция: последняя ночь 30.09, последний заезд 28.09. Срок
    // на полдня снимали (30.09.2026), но оператор подтвердил: в октябре «2+1»
    // нет — вместо неё «−20% на Chalet». Карточки, подсказка в форме и
    // брифинг ИИ гаснут сами по этой дате.
    until: "2026-09-30",
    terms: {
      ru: [
        "Заезд в воскресенье, понедельник или вторник — ровно 3 ночи",
        "Максимально поздний день выезда — пятница",
        "Заезд в воскресенье ➔ выезд в среду (3 ночи)",
        "Заезд в понедельник ➔ выезд в четверг (3 ночи)",
        "Заезд во вторник ➔ выезд в пятницу (3 ночи)",
        "Не суммируется с тарифом «Всё включено»",
        "Завтраки включены",
        `При полном размещении — от ${fmt(perPersonFrom)} сум с человека за ночь: глэмпинг на ${glampingGuests} гостей, шале на ${chaletGuests}`,
        "Дополнительное размещение оплачивается отдельно согласно тарифу за каждую ночь",
      ],
      uz: [
        "Kirish yakshanba, dushanba yoki seshanba — aynan 3 kecha",
        "Chiqish mumkin bo'lgan eng so'nggi kun — juma",
        "Kirish yakshanba ➔ chiqish chorshanba (3 kecha)",
        "Kirish dushanba ➔ chiqish payshanba (3 kecha)",
        "Kirish seshanba ➔ chiqish juma (3 kecha)",
        "«Hammasi kiritilgan» tarifi bilan jamlanmaydi",
        "Nonushta kiritilgan",
        `To'liq joylashganda — kishi boshiga kechasiga ${fmt(perPersonFrom)} so'mdan: glemping ${glampingGuests} mehmonga, shale ${chaletGuests} mehmonga`,
        "Qo'shimcha joylashtirish har bir kecha uchun tarif bo'yicha alohida to'lanadi",
      ],
      en: [
        "Arrive on Sunday, Monday or Tuesday — exactly 3 nights",
        "The latest possible departure day is Friday",
        "Sunday arrival ➔ Wednesday departure (3 nights)",
        "Monday arrival ➔ Thursday departure (3 nights)",
        "Tuesday arrival ➔ Friday departure (3 nights)",
        "Does not combine with the All-Inclusive rate",
        "Breakfast included",
        `At full occupancy — from ${fmt(perPersonFrom)} UZS per person per night: glamping for ${glampingGuests} guests, chalet for ${chaletGuests}`,
        "Extra beds are charged separately at the rate for each night",
      ],
    },
  },
  {
    // Оператор, 30.09.2026: «−20% на Chalet весь октябрь». Тексты — его, без
    // правок по смыслу. Базовая цена — будничная ночь шале из прайса (та же, что
    // в выгоде «2+1»); срок — последний день октября, дальше карточка гаснет сама.
    slug: "chalet-october",
    until: "2026-10-31",
    badge: { ru: "−20% · Октябрь", uz: "−20% · Oktabr", en: "−20% · October" },
    title: {
      ru: "−20% на Chalet весь октябрь",
      uz: "Butun oktabr Chalet'ga −20%",
      en: "20% off the Chalet all October",
    },
    description: {
      ru: "Бронируйте Chalet в октябре и получайте скидку 20% на проживание. Большой Chalet для отдыха семьёй или компанией: отдельные спальни, кухня, санузлы и просторная терраса с видом на горы.",
      uz: "Oktabrda Chalet'ni bron qiling va yashashga 20% chegirma oling. Oila yoki do'stlar davrasida dam olish uchun katta Chalet: alohida yotoqxonalar, oshxona, sanuzellar va tog'larga qaragan keng terrasa.",
      en: "Book the Chalet in October and get 20% off your stay. A big Chalet for a family or a group of friends: separate bedrooms, a kitchen, bathrooms and a spacious terrace facing the mountains.",
    },
    discount: {
      label: { ru: "Базовая стоимость Chalet", uz: "Chalet'ning asosiy narxi", en: "Chalet base rate" },
      base: 3_000_000,
      percent: 20,
      guests: cabinOccupancy.cottage.base,
    },
    terms: {
      ru: [
        "Акция действует весь октябрь на проживание в Chalet",
        "Дополнительное размещение оплачивается отдельно согласно действующим тарифам",
        "Не суммируется с другими акциями и специальными предложениями",
      ],
      uz: [
        "Aksiya butun oktabr davomida Chalet'da yashash uchun amal qiladi",
        "Qo'shimcha joylashtirish amaldagi tariflar bo'yicha alohida to'lanadi",
        "Boshqa aksiyalar va maxsus takliflar bilan jamlanmaydi",
      ],
      en: [
        "Valid for Chalet stays throughout October",
        "Extra beds are charged separately at the current rates",
        "Does not combine with other offers or special deals",
      ],
    },
  },
  {
    slug: "all-inclusive",
    // Условие оператора от 24.09.2026: тариф действует с воскресенья по четверг
    // включительно (до этого — с понедельника). Формулировка оператора — «тариф
    // действует», а не «заезд», и она сохранена дословно: «заезд по четверг»
    // гость прочёл бы как питание и в пятницу с субботой.
    //
    // Срока нет с 30.09.2026 — оператор повторил условия без даты окончания.
    badge: { ru: "Вс–Чт", uz: "Ya–Pay", en: "Sun–Thu" },
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
        "Тариф действует с воскресенья по четверг включительно",
        "Не суммируется с акцией «2+1»",
      ],
      uz: [
        "Taomlar jadval bo'yicha restoranda yoki uyga yetkazib beriladi",
        "Tarif yakshanbadan payshanbagacha (payshanba ham) amal qiladi",
        "«2+1» aksiyasi bilan jamlanmaydi",
      ],
      en: [
        "Meals on schedule in the restaurant or delivered to your cabin",
        "Valid Sunday through Thursday inclusive",
        "Does not combine with the 2+1 offer",
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
