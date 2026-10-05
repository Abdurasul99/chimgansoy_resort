import type { LocalizedString } from "./types";
import { lateCheckOutNote, poolPricing, stayRules, topchanPricing, tubingPricing } from "./pricing";
import { money } from "@/lib/venue-facts";
import { poolClosure } from "./pool-closure";
import { resolvePricing, type LivePricing } from "@/lib/pricing-resolve";

export type FaqItem = {
  question: LocalizedString;
  answer: LocalizedString;
};

/**
 * Homepage FAQ — also emitted as FAQPage JSON-LD, so these answers can end up
 * in Google's rich results. Keep them factually identical to
 * src/lib/venue-facts.ts, which is what both AI assistants answer from.
 *
 * Every entry here used to describe a day-only venue, opening with "we
 * currently run as a day-only venue" — which contradicted the rest of the site
 * and venue-facts.ts, and was the version Google had indexed. Stays lead now;
 * the day visit is the last entry, not the premise.
 */
/**
 * Built from the live tariff rather than declared as data.
 *
 * The answers quote prices, and they double as FAQPage JSON-LD — a figure that
 * lags behind the admin is wrong in Google's rich result too, which a guest
 * reads before the site.
 */
export function faqItems(live: LivePricing = resolvePricing()): FaqItem[] {
  const P = {
    poolAdultWeekday: money(live.pool.adult.weekday),
    poolAdultWeekend: money(live.pool.adult.weekend),
    poolChildWeekday: money(live.pool.child.weekday),
    poolChildWeekend: money(live.pool.child.weekend),
    towel: money(live.pool.extras.towel),
    bungalow4: money(live.pool.extras.bungalow4),
    bungalow10: money(live.pool.extras.bungalow10),
    topchanWeekday: money(live.topchan.weekday),
    topchanWeekend: money(live.topchan.weekend),
    parking: money(live.parking),
    ride2: money(live.tubing.packages.find((p) => p.rides === 2)?.price ?? 0),
    ride4: money(live.tubing.packages.find((p) => p.rides === 4)?.price ?? 0),
    deposit: money(live.deposit),
    taxResident: money(live.touristTax.resident),
    taxForeign: money(live.touristTax.nonResident),
    // Часы — не из тарифа: их правит не админка, а константа в pricing.ts.
    poolHours: poolPricing.hours,
    poolHoursGuests: poolPricing.hoursForStayingGuests,
    poolAfterCheckout: money(live.pool.afterCheckOut),
    topchanHours: topchanPricing.hours,
    tubingHours: tubingPricing.hours,
    prepay: stayRules.prepayWithin,
    breakfast: stayRules.breakfast,
    checkIn: stayRules.checkIn,
    checkOut: stayRules.checkOut,
    rides: tubingPricing.includedRidesPerGuest,
  };

  const poolClosed = poolClosure.closed;
  // Топчан сейчас одна цена всю неделю — тогда и пишем одну, а не «X в будни
  // и X в выходные».
  const topchanRu =
    P.topchanWeekday === P.topchanWeekend
      ? `${P.topchanWeekday} сум за топчан целиком в любой день`
      : `${P.topchanWeekday} сум в будни (Пн–Чт) и ${P.topchanWeekend} в выходные (Пт–Вс) за топчан целиком`;
  const topchanUz =
    P.topchanWeekday === P.topchanWeekend
      ? `istalgan kuni butun topchan uchun ${P.topchanWeekday} so'm`
      : `ish kunlari (Du–Pay) ${P.topchanWeekday} so'm, dam olish kunlari (Ju–Yak) ${P.topchanWeekend} so'm butun topchan uchun`;
  const topchanEn =
    P.topchanWeekday === P.topchanWeekend
      ? `${P.topchanWeekday} UZS for the whole platform on any day`
      : `${P.topchanWeekday} UZS Mon–Thu and ${P.topchanWeekend} Fri–Sun for the whole platform`;

  /**
   * Вопрос про бассейн — пока он закрыт, его место занимает «что входит в
   * проживание»: ответ «Да, бассейн включён» с ценами и часами обещал бы то,
   * чего сейчас нет (оператор, 30.09.2026: «проверить и обновить»). Вернётся
   * сам вместе с флагом closed: false.
   */
  const poolItem: FaqItem = poolClosed
    ? {
        question: {
          ru: "Что входит в стоимость проживания?",
          uz: "Yashash narxiga nimalar kiradi?",
          en: "What is included in the stay?",
        },
        answer: {
          ru: `Завтрак ${P.breakfast} — гостям и глэмпинга, и шале. Каждому проживающему — ${P.rides} бесплатный спуск на тюбинг-горке (при работающей горке), парковка у домика и Wi-Fi. Бассейн в летний сезон тоже входит в проживание, но сейчас он закрыт до начала летнего сезона — об открытии сообщим на сайте и в Instagram. Обед и ужин — в ресторане по меню или по тарифу «Всё включено».`,
          uz: `Nonushta ${P.breakfast} — glemping va shale mehmonlariga. Har bir yashovchiga tubing gorkasida ${P.rides} marta bepul tushish (gorka ishlayotgan bo'lsa), uycha yonida parkovka va Wi-Fi. Yozgi mavsumda basseyn ham yashash narxiga kiradi, ammo hozir u yozgi mavsum boshlanguncha yopiq — ochilishi haqida saytda va Instagram'da xabar beramiz. Tushlik va kechki ovqat — restoranda menyu bo'yicha yoki «Hammasi kiritilgan» tarifi bo'yicha.`,
          en: `Breakfast ${P.breakfast} for glamping and chalet guests alike. Every staying guest gets ${P.rides} free ride on the tubing hill (when the hill is running), parking by the cabin and Wi-Fi. In the summer season the pool is part of the stay too, but it is closed now until the summer season starts — we will announce the reopening on the site and on Instagram. Lunch and dinner are from the restaurant menu or on the All-Inclusive rate.`,
        },
      }
    : {
        question: {
          ru: "Бассейн входит в стоимость проживания?",
          uz: "Basseyn yashash narxiga kiradimi?",
          en: "Is the pool included in the room rate?",
        },
        answer: {
          ru: `Да. Гостям шале и глэмпинга бассейн включён в стоимость — отдельно бронировать не нужно. Без проживания — дневной билет: взрослые и дети от 15 лет ${P.poolAdultWeekday} сум в будни (Пн–Чт) и ${P.poolAdultWeekend} сум в выходные (Пт–Вс); дети 5–15 лет — ${P.poolChildWeekday} и ${P.poolChildWeekend} сум; до 5 лет бесплатно со взрослыми. Полотенце ${P.towel} сум, бунгало Standard до 4 чел. — ${P.bungalow4} сум (таких 8), бунгало Family до 10 чел. — ${P.bungalow10} сум (таких 4); входные билеты в аренду бунгало не входят. Бассейн работает ежедневно ${P.poolHours} для посетителей и с ${P.poolHoursGuests} для проживающих. В день заезда бассейном можно пользоваться, ожидая заселения, — бесплатно при подтверждённой броне; после выезда день бассейна стоит ${P.poolAfterCheckout} сум. Заявка — формой на странице бассейна.`,
          uz: `Ha. Shale va glemping mehmonlari uchun basseyn narxga kiritilgan — alohida bron qilish shart emas. Yashashsiz — kunlik chipta: kattalar va 15 yoshdan katta bolalar ish kunlari (Du–Pay) ${P.poolAdultWeekday} so'm, dam olish kunlari (Ju–Yak) ${P.poolAdultWeekend} so'm; 5–15 yoshli bolalar — ${P.poolChildWeekday} va ${P.poolChildWeekend} so'm; 5 yoshgacha kattalar bilan bepul. Sochiq ${P.towel} so'm, Standard bungalo 4 kishigacha — ${P.bungalow4} so'm (8 ta bor), Family bungalo 10 kishigacha — ${P.bungalow10} so'm (4 ta bor); kirish chiptalari bungalo ijarasiga kirmaydi. Basseyn tashrif buyuruvchilar uchun ${P.poolHours}, yashovchilar uchun ${P.poolHoursGuests}. Kirish kuni joylashuvni kutayotib basseyndan foydalanish mumkin — tasdiqlangan bron bilan bepul; chiqishdan keyin bir kun ${P.poolAfterCheckout} so'm. Ariza — basseyn sahifasidagi shakl orqali.`,
          en: `Yes. For chalet and glamping guests the pool is included in the rate — no separate booking needed. Without a stay — a day pass: adults and ages 15+ pay ${P.poolAdultWeekday} UZS Mon–Thu and ${P.poolAdultWeekend} UZS Fri–Sun; children 5–15 pay ${P.poolChildWeekday} and ${P.poolChildWeekend}; under-fives are free with an adult. Towel ${P.towel}, a Standard bungalow for up to 4 costs ${P.bungalow4} UZS (there are 8 of them), a Family bungalow for up to 10 costs ${P.bungalow10} UZS (there are 4); entry tickets are not included in a bungalow. The pool is open ${P.poolHours} for visitors and ${P.poolHoursGuests} for staying guests. On arrival day you may use it while waiting to check in — free with a confirmed booking; after check-out a pool day costs ${P.poolAfterCheckout} UZS. Requests go through the form on the pool page.`,
        },
      };

  const poolDayRu = poolClosed
    ? "Бассейн сейчас закрыт до начала летнего сезона."
    : `Бассейн — ${P.poolAdultWeekday} и ${P.poolAdultWeekend} сум с человека, дети 5–15 вдвое дешевле, до 5 лет бесплатно, ${P.poolHours}.`;
  const poolDayUz = poolClosed
    ? "Basseyn hozir yozgi mavsum boshlanguncha yopiq."
    : `Basseyn — bir kishidan ${P.poolAdultWeekday} va ${P.poolAdultWeekend} so'm, 5–15 yosh ikki barobar arzon, 5 yoshgacha bepul, ${P.poolHours}.`;
  const poolDayEn = poolClosed
    ? "The pool is closed now until the summer season."
    : `The pool is ${P.poolAdultWeekday} and ${P.poolAdultWeekend} UZS per person, half price for ages 5–15, free under five, ${P.poolHours}.`;

  return [
    {
      question: {
        ru: "Какие форматы проживания есть?",
        uz: "Qanday yashash formatlari bor?",
        en: "What stay formats do you have?",
      },
      answer: {
        ru: `Два формата. Глэмпинг A-frame — стандарт 2 гостя, максимум 3 (третье место за доплату), 32 м² плюс терраса 15 м², двуспальная кровать 180×200, собственный санузел с душем, кондиционер, тёплый пол, телевизор и Wi-Fi. Шале — стандарт 4 гостя, максимум 6 (пятое и шестое места за доплату), две спальни (двуспальная 180×200 и две односпальные 90×200), туалет и душ в каждой спальне, кухня-зал с диваном, тёплый пол и терраса 42 м². Ванн нет нигде — везде душ. Завтрак включён в стоимость проживания в обоих форматах и подаётся ${P.breakfast}. Заезд с ${P.checkIn}, выезд до ${P.checkOut}. ${lateCheckOutNote.ru}`,
        uz: `Ikki format. A-frame glemping — standart 2 mehmon, maksimum 3 (uchinchi joy qo'shimcha to'lov bilan), 32 m² va 15 m² terrasa, 180×200 ikki kishilik karavot, dushli xususiy sanuzel, konditsioner, issiq pol, televizor va Wi-Fi. Shale — standart 4 mehmon, maksimum 6 (beshinchi va oltinchi joylar qo'shimcha to'lov bilan), ikkita yotoqxona (180×200 ikki kishilik va ikkita 90×200 bir kishilik), har bir yotoqxonada hojatxona va dush, divanli oshxona-zal, issiq pol va 42 m² terrasa. Hech qayerda vanna yo'q — hamma joyda dush. Nonushta ikkala formatda ham yashash narxiga kiritilgan va ${P.breakfast} beriladi. Kirish ${P.checkIn} dan, chiqish ${P.checkOut} gacha. ${lateCheckOutNote.uz}`,
        en: `Two formats. A-frame glamping — the rate covers 2 guests, up to 3 in total (the third place is charged), 32 m² plus a 15 m² terrace, a 180×200 double bed, an ensuite shower room, air conditioning, a heated floor, a TV and Wi-Fi. The chalet — the rate covers 4 guests, up to 6 in total (the fifth and sixth places are charged), two bedrooms (one 180×200 double, one with two 90×200 singles), a toilet and shower in each bedroom, a kitchen-lounge with a sofa, heated floors and a 42 m² terrace. There are no baths anywhere — every unit has a shower. Breakfast is included with both formats and is served ${P.breakfast}. Check-in from ${P.checkIn}, check-out by ${P.checkOut}. ${lateCheckOutNote.en}`,
      },
    },
    poolItem,
    {
      question: {
        ru: "Как работает бронирование?",
        uz: "Bron qilish qanday ishlaydi?",
        en: "How does booking work?",
      },
      // Онлайн-движок на /bron оператор скрыл: бронь — через «Забронировать в
      // один клик» на странице домика, а подтверждает администратор.
      answer: {
        ru: `Выберите домик и нажмите «Забронировать в один клик» на его странице: даты, число гостей и телефон — администратор перезвонит и подтвердит бронь. Предоплата 100% стоимости вносится в течение ${P.prepay.ru} с момента оформления брони — неоплаченная в срок бронь автоматически аннулируется. Предоплата невозвратная. Туристский сбор платят только иностранные граждане и лица без гражданства — ${P.taxForeign} сум за ночь с человека по ставке, действующей на дату заезда. Он не входит в стоимость и вносится при заселении; с граждан и резидентов Узбекистана не взимается. Можно также написать в WhatsApp или Telegram.`,
        uz: `Uychani tanlang va uning sahifasida «Bir marta bosib bron qilish» tugmasini bosing: sanalar, mehmonlar soni va telefon — administrator qo'ng'iroq qilib bronni tasdiqlaydi. Narxning 100% oldindan to'lovi bron rasmiylashtirilgandan keyin ${P.prepay.uz} ichida amalga oshiriladi — muddatida to'lanmagan bron avtomatik bekor qilinadi. Oldindan to'lov qaytarilmaydi. Turistik yig'imni faqat chet el fuqarolari va fuqaroligi bo'lmagan shaxslar to'laydi — kirish sanasida amal qiluvchi stavka bo'yicha bir kecha uchun har bir mehmondan ${P.taxForeign} so'm. U narxga kirmaydi va joylashuvda to'lanadi; O'zbekiston fuqarolari va rezidentlaridan olinmaydi. WhatsApp yoki Telegram orqali ham yozishingiz mumkin.`,
        en: `Choose a cabin and press "Book in one click" on its page: dates, number of guests and a phone number — the administrator will call back and confirm. Payment in full is due within ${P.prepay.en} of making the booking — an unpaid booking is cancelled automatically. The prepayment is non-refundable. The tourist levy is paid only by foreign nationals and stateless persons — ${P.taxForeign} UZS per person per night at the rate in force on the arrival date. It is not part of the rate and is collected at check-in; Uzbek citizens and residents are not charged. You can also message us on WhatsApp or Telegram.`,
      },
    },
    {
      question: {
        ru: "Подходит для семей с детьми и компаний?",
        uz: "Bolali oilalar va do'stlar guruhi uchun mosmi?",
        en: "Is it suitable for families and groups?",
      },
      // Шале — 4 гостя по тарифу, до 6 с доплатой: «рассчитано на 6» читалось
      // как «шестеро без доплаты».
      answer: {
        ru: `Да. Шале — 4 гостя по тарифу, до 6 с доплатой: две отдельные спальни и кухня-зал — удобно с детьми или с друзьями. На 9 гектарах — детская площадка, прогулочные зоны, пикник-зона с топчанами, тюбинг-горка (детям — с 5 лет и от 110 см) и ресторан${poolClosed ? "" : ", бассейн с детской чашей"}. Для компании можно взять несколько домиков — напишите администратору, поможем собрать бронь. Питомцев, к сожалению, на территорию не допускаем.`,
        uz: `Ha. Shale — tarif bo'yicha 4 mehmon, qo'shimcha to'lov bilan 6 tagacha: ikkita alohida yotoqxona va oshxona-zal — bolalar yoki do'stlar bilan qulay. 9 gektar hududda bolalar maydonchasi, sayr zonalari, topchanli piknik zonasi, tubing gorkasi (bolalar — 5 yoshdan va 110 sm dan) va restoran${poolClosed ? "" : ", bolalar basseyni bilan basseyn"} bor. Katta guruh uchun bir nechta uycha olish mumkin — administratorga yozing, bronni yig'ishga yordam beramiz. Afsuski, hayvonlarni hududga kirita olmaymiz.`,
        en: `Yes. The chalet takes 4 guests on the rate and up to 6 with a surcharge: two separate bedrooms plus a kitchen-lounge — comfortable with kids or with friends. The nine hectares include a kids playground, walking areas, a picnic area with topchans, the tubing hill (children from age 5 and 110 cm) and the restaurant${poolClosed ? "" : ", plus a pool with a children's pool"}. For a larger group you can take several cabins — message the administrator and we'll put the booking together. Pets, unfortunately, are not allowed on the grounds.`,
      },
    },
    {
      question: {
        ru: "Что у вас зимой?",
        uz: "Qishda nimalar bor?",
        en: "What's it like in winter?",
      },
      answer: {
        ru: "Работаем круглый год. В шале тёплый пол, в глэмпинге кондиционер с обогревом, а из панорамного окна видны снежные вершины Чимгана. Ресторан работает, мангал и казан можно арендовать, тюбинг-горка открыта круглый год — не только по снегу. Точные условия зависят от погоды — лучше уточнить перед поездкой.",
        uz: "Yil davomida ishlaymiz. Shalede issiq pol, glempingda isitish rejimli konditsioner, panoramali derazadan esa Chimg'onning qorli cho'qqilari ko'rinadi. Restoran ishlaydi, mangal va qozonni ijaraga olish mumkin, tubing gorkasi yil davomida ochiq — faqat qorda emas. Aniq sharoitlar ob-havoga bog'liq — safardan oldin aniqlashtirish yaxshiroq.",
        en: "We're open year-round. The chalets have heated floors, the glamping cabins have air conditioning with heating, and the panoramic window looks out on the snowy Chimgan peaks. The restaurant is open, a BBQ grill or kazan can be rented, and the tubing hill runs all year — not only on snow. Exact conditions depend on the weather — best to confirm before you travel.",
      },
    },
    {
      question: {
        ru: "Можно приехать на день, без ночёвки?",
        uz: "Tunamasdan, bir kunga kelish mumkinmi?",
        en: "Can we come for the day, without staying over?",
      },
      answer: {
        ru: `Да. Ресторан открыт для всех — можно приехать просто пообедать или поужинать. Топчан в пикник-зоне — ${topchanRu}, до 8 гостей, работает ${P.topchanHours}. Тюбинг-горка — ${P.ride2} сум за 2 спуска и ${P.ride4} за 4, цена одна всю неделю, горка работает ${P.tubingHours}, кататься можно только с инструктором. ${poolDayRu} Вход на территорию бесплатный; парковка платная только для тюбинга — ${P.parking} сум за автомобиль. У топчана и тюбинга своя форма заявки на сайте — администратор перезвонит и подтвердит. Заявку лучше оставить заранее: топчан закрепляется только после подтверждения, и приехавшим без заявки свободный не гарантирован.`,
        uz: `Ha. Restoran hamma uchun ochiq — shunchaki tushlik yoki kechki ovqat uchun kelish mumkin. Piknik zonasidagi topchan — ${topchanUz}, 8 kishigacha, ${P.topchanHours} ishlaydi. Tubing gorkasi — 2 marta uchish ${P.ride2} so'm, 4 marta ${P.ride4} so'm, narx butun hafta bir xil, gorka ${P.tubingHours} ishlaydi, faqat instruktor bilan uchish mumkin. ${poolDayUz} Hududga kirish bepul; parkovka faqat tubing uchun to'lanadi — avtomobil uchun ${P.parking} so'm. Topchan va tubingning saytda o'z arizasi bor — administrator qo'ng'iroq qilib tasdiqlaydi. Arizani oldindan qoldirgan ma'qul: topchan faqat tasdiqlangandan keyin biriktiriladi, arizasiz kelganlarga bo'sh joy kafolatlanmaydi.`,
        en: `Yes. The restaurant is open to everyone — you can come just for lunch or dinner. A topchan in the picnic area is ${topchanEn}, seating up to 8, open ${P.topchanHours}. The tubing hill is ${P.ride2} UZS for 2 rides and ${P.ride4} for 4, one price all week, running ${P.tubingHours}, with riding only when an instructor is present. ${poolDayEn} Entry to the grounds is free; parking is charged for tubing only, at ${P.parking} UZS per car. The topchan and tubing each have their own request form on the site, and the administrator calls back to confirm. Send it ahead: a topchan is held only once confirmed, and arriving without a request does not guarantee a free one.`,
      },
    },
  ];
}
