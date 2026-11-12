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
  slug: "2plus1" | "chalet-october" | "birthday";
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
   * Срок ставить, только когда оператор его назвал. У «−20% на Chalet» он
   * есть (30.11.2026), у «2+1» — нет.
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
  /**
   * Стикер-наклейка на карточке (components/sections/PromoSticker.tsx):
   * главная цифра акции крупно. Золотой — акции проживания, розовый —
   * праздничные. Если бейдж начинается с той же цифры, на карточке она в
   * бейдже не повторяется.
   */
  sticker?: { label: string; tone: "gold" | "rose"; icon: "moon" | "house" | "gift" };
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
    sticker: { label: "2+1", tone: "gold", icon: "moon" },
    title: {
      ru: "«2+1» — третья ночь в подарок",
      uz: "«2+1» — uchinchi kecha sovg'a",
      en: "2+1 — third night free",
    },
    description: {
      ru: "Оплачиваете две ночи, третью получаете бесплатно. Заезд в воскресенье, понедельник или вторник — три ночи в горах без спешки.",
      uz: "Ikki kecha uchun to'laysiz, uchinchisi bepul. Kirish — yakshanba, dushanba yoki seshanba kuni: tog'larda shoshilmasdan uch kecha.",
      en: "Pay for two nights, get the third free. Arrive on Sunday, Monday or Tuesday — three unhurried nights in the mountains.",
    },
    savings: TWO_PLUS_ONE_SAVINGS,
    // Срока нет. 30.09.2026 акция дважды пропадала с сайта — сперва по
    // сентябрьскому сроку, потом по моему неверному прочтению «почему не
    // убрал его». Оператор перечислил, что идёт в октябре: «Всё включено»,
    // «2+1», «−20%», «Выходной без спешки» — все четыре. Дату ставить, только
    // если оператор назовёт её сам.
    terms: {
      ru: [
        "Заезд в воскресенье, понедельник или вторник — ровно 3 ночи",
        "Максимально поздний день выезда — пятница",
        "Заезд в воскресенье ➔ выезд в среду (3 ночи)",
        "Заезд в понедельник ➔ выезд в четверг (3 ночи)",
        "Заезд во вторник ➔ выезд в пятницу (3 ночи)",
        "Не суммируется с другими акциями и специальными предложениями",
        "Завтраки включены",
        `При полном размещении — от ${fmt(perPersonFrom)} сум с человека за ночь: глэмпинг на ${glampingGuests} гостей, шале на ${chaletGuests}`,
        "Дополнительное размещение оплачивается отдельно согласно тарифу за каждую ночь",
      ],
      uz: [
        "Kirish — yakshanba, dushanba yoki seshanba kunlari, aynan 3 kecha",
        "Chiqish mumkin bo'lgan eng so'nggi kun — juma",
        "Kirish yakshanba ➔ chiqish chorshanba (3 kecha)",
        "Kirish dushanba ➔ chiqish payshanba (3 kecha)",
        "Kirish seshanba ➔ chiqish juma (3 kecha)",
        "Boshqa aksiyalar va maxsus takliflar bilan birga qo'llanilmaydi",
        "Nonushta narxga kiradi",
        `Uycha to'liq band bo'lganda — kishi boshiga kechasiga ${fmt(perPersonFrom)} so'mdan: glemping ${glampingGuests} mehmonga, shale ${chaletGuests} mehmonga`,
        "Qo'shimcha o'rin har bir kecha uchun tarif bo'yicha alohida to'lanadi",
      ],
      en: [
        "Arrive on Sunday, Monday or Tuesday — exactly 3 nights",
        "The latest possible departure day is Friday",
        "Sunday arrival ➔ Wednesday departure (3 nights)",
        "Monday arrival ➔ Thursday departure (3 nights)",
        "Tuesday arrival ➔ Friday departure (3 nights)",
        "Does not combine with other offers or special deals",
        "Breakfast included",
        `At full occupancy — from ${fmt(perPersonFrom)} UZS per person per night: glamping for ${glampingGuests} guests, chalet for ${chaletGuests}`,
        "Extra beds are charged separately at the rate for each night",
      ],
    },
  },
  {
    // Оператор, 30.09.2026: «−20% на Chalet весь октябрь». Тексты — его, без
    // правок по смыслу. Базовая цена — будничная ночь шале из прайса (та же, что
    // в выгоде «2+1»). 30.10.2026 владелец продлил акцию на ноябрь: срок —
    // последний день ноября, дальше карточка гаснет сама. Slug остался
    // октябрьским — он уходит в метки заявок и визитки, смена разорвала бы счёт.
    // 11.11.2026 владелец: «слово октябрь убери, оставь только ноябрь» — в
    // названии, описании и условиях только ноябрь (октябрь прошёл).
    slug: "chalet-october",
    until: "2026-11-30",
    badge: { ru: "−20% · Ноябрь", uz: "−20% · Noyabr", en: "−20% · November" },
    sticker: { label: "−20%", tone: "gold", icon: "house" },
    title: {
      ru: "−20% на Chalet весь ноябрь",
      uz: "Noyabr davomida shalega −20%",
      en: "20% off the Chalet all November",
    },
    description: {
      ru: "Бронируйте Chalet в ноябре и получайте скидку 20% на проживание. Большой Chalet для отдыха семьёй или компанией: отдельные спальни, кухня, санузлы и просторная терраса с видом на горы.",
      uz: "Noyabrda shaleni bron qiling va yashash narxidan 20% chegirma oling. Oila yoki do'stlar davrasida dam olish uchun katta shale: alohida yotoqxonalar, oshxona, hammomlar va tog'larga qaragan keng terrasa.",
      en: "Book the Chalet in November and get 20% off your stay. A big Chalet for a family or a group of friends: separate bedrooms, a kitchen, bathrooms and a spacious terrace facing the mountains.",
    },
    discount: {
      label: { ru: "Базовая стоимость Chalet", uz: "Shalening asosiy narxi", en: "Chalet base rate" },
      base: 3_000_000,
      percent: 20,
      guests: cabinOccupancy.cottage.base,
    },
    terms: {
      ru: [
        "Акция действует весь ноябрь на проживание в Chalet",
        "Дополнительное размещение оплачивается отдельно согласно действующим тарифам",
        "Не суммируется с другими акциями и специальными предложениями",
      ],
      uz: [
        "Aksiya noyabr davomida shaleda yashash uchun amal qiladi",
        "Qo'shimcha o'rin amaldagi tariflar bo'yicha alohida to'lanadi",
        "Boshqa aksiyalar va maxsus takliflar bilan birga qo'llanilmaydi",
      ],
      en: [
        "Valid for Chalet stays throughout November",
        "Extra beds are charged separately at the current rates",
        "Does not combine with other offers or special deals",
      ],
    },
  },
  {
    // Владелец, 12.11.2026 — его текст: «Скидка 15% на День Рождения! Дарим 15%
    // на проживание имениннику. Действует за 3 дня до и 3 дня после Дня Рождения
    // (нужен паспорт/ID). Не действует на пакетные праздничные предложения. Не
    // суммируется с другими акциями». Срока нет. Расчёта «было → стало» нет
    // намеренно: скидка считается от цены выбранных дат и домика.
    slug: "birthday",
    badge: { ru: "−15% · День рождения", uz: "−15% · Tug'ilgan kun", en: "−15% · Birthday" },
    sticker: { label: "−15%", tone: "rose", icon: "gift" },
    title: {
      ru: "Скидка 15% на День Рождения",
      uz: "Tug'ilgan kunga 15% chegirma",
      en: "15% off for your birthday",
    },
    description: {
      ru: "Дарим 15% на проживание имениннику! Действует за 3 дня до и 3 дня после Дня Рождения.",
      uz: "Tug'ilgan kun egasiga yashash narxidan 15% chegirma sovg'a qilamiz! Tug'ilgan kundan 3 kun oldin va 3 kun keyin amal qiladi.",
      en: "A 15% gift off the stay for the birthday guest! Valid from 3 days before to 3 days after the birthday.",
    },
    terms: {
      ru: [
        "Действует за 3 дня до и 3 дня после Дня Рождения",
        "Нужен паспорт или ID именинника",
        "Не действует на пакетные праздничные предложения",
        "Не суммируется с другими акциями и специальными предложениями",
      ],
      uz: [
        "Tug'ilgan kundan 3 kun oldin va 3 kun keyin amal qiladi",
        "Tug'ilgan kun egasining pasporti yoki ID kartasi kerak",
        "Bayram paketlariga amal qilmaydi",
        "Boshqa aksiyalar va maxsus takliflar bilan birga qo'llanilmaydi",
      ],
      en: [
        "Valid from 3 days before to 3 days after the birthday",
        "The birthday guest's passport or ID is required",
        "Not valid for holiday package offers",
        "Does not combine with other offers or special deals",
      ],
    },
  },
  // «Всё включено» (Вс–Чт, питание по сет-меню) и «Выходной без спешки» (Сб→Вс,
  // поздний выезд) сняты владельцем 29.10.2026 — с сайта, из ответов ИИ и с
  // визитки, полностью. Возвращать только по новому слову оператора: ИИ
  // отвечает гостю, что этих акций сейчас нет (venue-facts.ts, promoBlock).
];
