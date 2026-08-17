import type { LocalizedString } from "./types";
import { poolPricing, stayRules, topchanPricing } from "./pricing";
import { money } from "@/lib/venue-facts";
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
    prepay: stayRules.prepayWithin,
  };

  return [
  {
    question: {
      ru: "Какие форматы проживания есть?",
      uz: "Qanday yashash formatlari bor?",
      en: "What stay formats do you have?",
    },
    answer: {
      ru: "Два формата. Глэмпинг A-frame — стандарт 2 гостя, максимум 3 (третье место за доплату), 28 м² плюс терраса 15 м², двуспальная кровать 180×200, собственный санузел с душем, кондиционер, тёплый пол, телевизор и Wi-Fi. Шале — стандарт 4 гостя, максимум 6 (пятое и шестое места за доплату), две спальни (двуспальная 180×200 и две односпальные 90×200), туалет и душ в каждой спальне, кухня-зал с диваном, тёплый пол и терраса 35 м². Ванн нет нигде — везде душ. Завтрак включён в стоимость проживания в обоих форматах и подаётся с 08:00 до 11:00. Заезд с 15:00, выезд до 12:00.",
      uz: "Ikki format. A-frame glemping — standart 2 mehmon, maksimum 3 (uchinchi joy qo'shimcha to'lov bilan), 28 m² va 15 m² terrasa, 180×200 ikki kishilik karavot, dushli xususiy sanuzel, konditsioner, issiq pol, televizor va Wi-Fi. Shale — standart 4 mehmon, maksimum 6 (beshinchi va oltinchi joylar qo'shimcha to'lov bilan), ikkita yotoqxona (180×200 ikki kishilik va ikkita 90×200 bir kishilik), har bir yotoqxonada hojatxona va dush, divanli oshxona-zal, issiq pol va 35 m² terrasa. Hech qayerda vanna yo'q — hamma joyda dush. Nonushta ikkala formatda ham yashash narxiga kiritilgan va 08:00 dan 11:00 gacha beriladi. Kirish 15:00 dan, chiqish 12:00 gacha.",
      en: "Two formats. A-frame glamping — the rate covers 2 guests, up to 3 in total (the third place is charged), 28 m² plus a 15 m² terrace, a 180×200 double bed, an ensuite shower room, air conditioning, a heated floor, a TV and Wi-Fi. The chalet — the rate covers 4 guests, up to 6 in total (the fifth and sixth places are charged), two bedrooms (one 180×200 double, one with two 90×200 singles), a toilet and shower in each bedroom, a kitchen-lounge with a sofa, heated floors and a 35 m² terrace. There are no baths anywhere — every unit has a shower. Breakfast is included with both formats and is served from 08:00 to 11:00. Check-in from 15:00, check-out by 12:00.",
    },
  },
  {
    question: {
      ru: "Бассейн входит в стоимость проживания?",
      uz: "Basseyn yashash narxiga kiradimi?",
      en: "Is the pool included in the room rate?",
    },
    answer: {
      ru: `Да. Гостям шале и глэмпинга бассейн включён в стоимость — отдельно бронировать не нужно. Без проживания — дневной билет: взрослые и дети от 15 лет ${P.poolAdultWeekday} сум в будни (Пн–Чт) и ${P.poolAdultWeekend} сум в выходные (Пт–Вс); дети 5–15 лет — 50 000 и ${P.poolAdultWeekday} сум; до 5 лет бесплатно со взрослыми. Полотенце ${P.towel} сум, бунгало Standard до 4 чел. — ${P.bungalow4} сум (таких 8), бунгало Family до 10 чел. — ${P.bungalow10} сум (таких 4); входные билеты в аренду бунгало не входят. Бассейн работает ежедневно ${P.poolHours} для посетителей и с ${P.poolHoursGuests} для проживающих. В день заезда бассейном можно пользоваться, ожидая заселения, — бесплатно при подтверждённой броне; после выезда день бассейна стоит ${P.poolAfterCheckout} сум. Заявка — формой на странице бассейна.`,
      uz: `Ha. Shale va glemping mehmonlari uchun basseyn narxga kiritilgan — alohida bron qilish shart emas. Yashashsiz — kunlik chipta: kattalar va 15 yoshdan katta bolalar ish kunlari (Du–Pay) ${P.poolAdultWeekday} so'm, dam olish kunlari (Ju–Yak) ${P.poolAdultWeekend} so'm; 5–15 yoshli bolalar — 50 000 va ${P.poolAdultWeekday} so'm; 5 yoshgacha kattalar bilan bepul. Sochiq ${P.towel} so'm, Standard bungalo 4 kishigacha — ${P.bungalow4} so'm (8 ta bor), Family bungalo 10 kishigacha — ${P.bungalow10} so'm (4 ta bor); kirish chiptalari bungalo ijarasiga kirmaydi. Basseyn tashrif buyuruvchilar uchun ${P.poolHours}, yashovchilar uchun ${P.poolHoursGuests}. Kirish kuni joylashuvni kutayotib basseyndan foydalanish mumkin — tasdiqlangan bron bilan bepul; chiqishdan keyin bir kun ${P.poolAfterCheckout} so'm. Ariza — basseyn sahifasidagi shakl orqali.`,
      en: `Yes. For chalet and glamping guests the pool is included in the rate — no separate booking needed. Without a stay — a day pass: adults and ages 15+ pay ${P.poolAdultWeekday} UZS Mon–Thu and ${P.poolAdultWeekend} UZS Fri–Sun; children 5–15 pay 50 000 and 100 000; under-fives are free with an adult. Towel ${P.towel}, a Standard bungalow for up to 4 costs ${P.bungalow4} UZS (there are 8 of them), a Family bungalow for up to 10 costs ${P.bungalow10} UZS (there are 4); entry tickets are not included in a bungalow. The pool is open ${P.poolHours} for visitors and ${P.poolHoursGuests} for staying guests. On arrival day you may use it while waiting to check in — free with a confirmed booking; after check-out a pool day costs ${P.poolAfterCheckout} UZS. Requests go through the form on the pool page.`,
    },
  },
  {
    question: {
      ru: "Как работает бронирование?",
      uz: "Bron qilish qanday ishlaydi?",
      en: "How does booking work?",
    },
    answer: {
      ru: `Выберите даты и забронируйте онлайн на странице «Бронирование» или оставьте заявку — администратор подтвердит бронь в ближайшее время. Предоплата 100% стоимости вносится в течение ${P.prepay.ru} с момента оформления брони — неоплаченная в срок бронь автоматически аннулируется. Предоплата невозвратная. Туристский сбор платят только иностранные граждане и лица без гражданства — ${P.taxForeign} сум за ночь с человека по ставке, действующей на дату заезда. Он не входит в стоимость и вносится при заселении; с граждан и резидентов Узбекистана не взимается. Можно также написать в WhatsApp или Telegram.`,
      uz: `Sanalarni tanlab, «Bron qilish» sahifasida onlayn bron qiling yoki so'rov qoldiring — administrator bronni tez orada tasdiqlaydi. Narxning 100% oldindan to'lovi bron rasmiylashtirilgandan keyin ${P.prepay.uz} ichida amalga oshiriladi — muddatida to'lanmagan bron avtomatik bekor qilinadi. Oldindan to'lov qaytarilmaydi. Turistik yig'imni faqat chet el fuqarolari va fuqaroligi bo'lmagan shaxslar to'laydi — kirish sanasida amal qiluvchi stavka bo'yicha bir kecha uchun har bir mehmondan ${P.taxForeign} so'm. U narxga kirmaydi va joylashuvda to'lanadi; O'zbekiston fuqarolari va rezidentlaridan olinmaydi. WhatsApp yoki Telegram orqali ham yozishingiz mumkin.`,
      en: `Pick your dates and book online on the Booking page, or send a request — the administrator will confirm shortly. Payment in full is due within ${P.prepay.en} of making the booking — an unpaid booking is cancelled automatically. The prepayment is non-refundable. The tourist levy is paid only by foreign nationals and stateless persons — ${P.taxForeign} UZS per person per night at the rate in force on the arrival date. It is not part of the rate and is collected at check-in; Uzbek citizens and residents are not charged. You can also message us on WhatsApp or Telegram.`,
    },
  },
  {
    question: {
      ru: "Подходит для семей с детьми и компаний?",
      uz: "Bolali oilalar va do'stlar guruhi uchun mosmi?",
      en: "Is it suitable for families and groups?",
    },
    answer: {
      ru: "Да. Шале рассчитано на 6 гостей: две отдельные спальни и кухня-зал — удобно с детьми или с друзьями. На 9 гектарах есть детская площадка, прогулочные зоны, бассейн с детской чашей и кухня с готовым меню. Для компании можно взять несколько домиков — напишите администратору, поможем собрать бронь. Питомцев, к сожалению, на территорию не допускаем.",
      uz: "Ha. Shale standart 4 mehmonga mo'ljallangan, maksimum 6 tagacha: ikkita alohida yotoqxona va oshxona-zal — bolalar yoki do'stlar bilan qulay. 9 gektar hududda bolalar maydonchasi, sayr zonalari, bolalar basseyni bilan basseyn va tayyor menyuli oshxona bor. Katta guruh uchun bir nechta uycha olish mumkin — administratorga yozing, bronni yig'ishga yordam beramiz. Afsuski, hayvonlarni hududga kirita olmaymiz.",
      en: "Yes. The chalet sleeps six in two separate bedrooms plus a kitchen-lounge — comfortable with kids or with friends. The nine hectares include a kids playground, walking areas, a pool with a children's pool, and a kitchen with a ready-made menu. For a larger group you can take several cabins — message the administrator and we'll put the booking together. Pets, unfortunately, are not allowed on the grounds.",
    },
  },
  {
    question: {
      ru: "Что у вас зимой?",
      uz: "Qishda nimalar bor?",
      en: "What's it like in winter?",
    },
    answer: {
      ru: "Работаем круглый год. В шале тёплый пол, в глэмпинге кондиционер с обогревом, а из панорамного окна видны снежные вершины Чимгана. Кухня работает, мангал и казан можно арендовать. Точные условия зависят от погоды — лучше уточнить перед поездкой.",
      uz: "Yil davomida ishlaymiz. Shalede issiq pol, glempingda isitish rejimli konditsioner, panoramali derazadan esa Chimg'onning qorli cho'qqilari ko'rinadi. Oshxona ishlaydi, mangal va qozonni ijaraga olish mumkin. Aniq sharoitlar ob-havoga bog'liq — safardan oldin aniqlashtirish yaxshiroq.",
      en: "We're open year-round. The chalets have heated floors, the glamping cabins have air conditioning with heating, and the panoramic window looks out on the snowy Chimgan peaks. The kitchen runs as usual, and a BBQ grill or kazan can be rented. Exact conditions depend on the weather — best to confirm before you travel.",
    },
  },
  {
    question: {
      ru: "Можно приехать на день, без ночёвки?",
      uz: "Tunamasdan, bir kunga kelish mumkinmi?",
      en: "Can we come for the day, without staying over?",
    },
    answer: {
      ru: `Да, на день можно приехать тремя способами. Топчан — ${P.topchanWeekday} сум в будни (Пн–Чт) и 300 000 в выходные (Пт–Вс) за топчан целиком, до 8 гостей. Бассейн — 100 000 и ${P.poolAdultWeekend} сум с человека, дети 5–15 вдвое дешевле, до 5 лет бесплатно. Тюбинг-горка — ${P.ride2} сум за 2 спуска и 100 000 за 4, цена одна всю неделю. Топчан работает ${P.topchanHours}, бассейн — ${P.poolHours}: у них разное время, планируйте приезд по нужному. Вход на территорию бесплатный; парковка платная только для тюбинга — 50 000 и ${P.poolAdultWeekday} сум за автомобиль. У каждого формата своя форма заявки на сайте — администратор перезвонит и подтвердит. Заявку лучше оставить заранее: топчан и место у бассейна закрепляются только после подтверждения, и приехавшим без заявки свободное место не гарантировано.`,
      uz: `Ha, bir kunga uch xil kelish mumkin. Topchan — ish kunlari (Du–Pay) ${P.topchanWeekday} so'm, dam olish kunlari (Ju–Yak) ${P.topchanWeekend} so'm butun topchan uchun, 8 kishigacha. Basseyn — bir kishidan 100 000 va ${P.poolAdultWeekend} so'm, 5–15 yosh ikki barobar arzon, 5 yoshgacha bepul. Tubing gorkasi — 2 marta uchish ${P.ride2} so'm, 4 marta ${P.poolAdultWeekday} so'm, narx butun hafta bir xil. Topchan ${P.topchanHours}, basseyn ${P.poolHours} ishlaydi — vaqtlari har xil. Hududga kirish bepul; parkovka faqat tubing uchun to'lanadi — avtomobil uchun 50 000 va ${P.poolAdultWeekday} so'm. Har bir formatning saytda o'z arizasi bor — administrator qo'ng'iroq qilib tasdiqlaydi. Arizani oldindan qoldirgan ma'qul: topchan va basseyndagi joy faqat tasdiqlangandan keyin biriktiriladi, arizasiz kelganlarga bo'sh joy kafolatlanmaydi.`,
      en: `Yes, in three ways. A topchan costs ${P.topchanWeekday} UZS Mon–Thu and 300 000 Fri–Sun for the whole platform, seating up to 8. The pool is 100 000 and ${P.poolAdultWeekend} UZS per person, half price for ages 5–15 and free under five. The tubing hill is ${P.ride2} UZS for 2 rides and 100 000 for 4, at one price all week. The topchan runs ${P.topchanHours} and the pool ${P.poolHours} — different windows, so plan around the one you want. Entry to the grounds is free; parking is charged for tubing only, at 50 000 and ${P.poolAdultWeekday} UZS per car. Each has its own request form on the site, and the administrator calls back to confirm. Send it ahead: a topchan and a place at the pool are held only once confirmed, and arriving without a request does not guarantee a free one.`,
    },
  },
  ];
}
