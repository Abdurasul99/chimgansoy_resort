import type { LocalizedString } from "./types";

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
export const faqItems: FaqItem[] = [
  {
    question: {
      ru: "Какие форматы проживания есть?",
      uz: "Qanday yashash formatlari bor?",
      en: "What stay formats do you have?",
    },
    answer: {
      ru: "Два формата. Глэмпинг A-frame — до 3 гостей, 28 м² плюс терраса 15 м², двуспальная кровать 180×200, собственный санузел с душем, кондиционер, тёплый пол, телевизор и Wi-Fi. Шале — до 6 гостей, две спальни (двуспальная 180×200 и две односпальные 90×200), туалет и душ в каждой спальне, кухня-зал с диваном, тёплый пол и терраса 35 м². Ванн нет нигде — везде душ. Завтрак включён в стоимость проживания в обоих форматах. Заезд с 15:00, выезд до 12:00.",
      uz: "Ikki format. A-frame glemping — 3 mehmongacha, 28 m² va 15 m² terrasa, 180×200 ikki kishilik karavot, dushli xususiy sanuzel, konditsioner, issiq pol, televizor va Wi-Fi. Shale — 6 mehmongacha, ikkita yotoqxona (180×200 ikki kishilik va ikkita 90×200 bir kishilik), har bir yotoqxonada hojatxona va dush, divanli oshxona-zal, issiq pol va 35 m² terrasa. Hech qayerda vanna yo'q — hamma joyda dush. Nonushta ikkala formatda ham yashash narxiga kiritilgan. Kirish 15:00 dan, chiqish 12:00 gacha.",
      en: "Two formats. A-frame glamping — up to 3 guests, 28 m² plus a 15 m² terrace, a 180×200 double bed, an ensuite shower room, air conditioning, a heated floor, a TV and Wi-Fi. The chalet — up to 6 guests, two bedrooms (one 180×200 double, one with two 90×200 singles), a toilet and shower in each bedroom, a kitchen-lounge with a sofa, heated floors and a 35 m² terrace. There are no baths anywhere — every unit has a shower. Breakfast is included with both formats. Check-in from 15:00, check-out by 12:00.",
    },
  },
  {
    question: {
      ru: "Бассейн входит в стоимость проживания?",
      uz: "Basseyn yashash narxiga kiradimi?",
      en: "Is the pool included in the room rate?",
    },
    answer: {
      ru: "Да. Гостям шале и глэмпинга бассейн включён в стоимость — отдельно бронировать не нужно. Без проживания — дневной билет: взрослые и дети от 15 лет 100 000 сум в будни (Пн–Чт) и 200 000 сум в выходные (Пт–Вс); дети 5–15 лет — 50 000 и 100 000 сум; до 5 лет бесплатно со взрослыми. Полотенце 30 000 сум, бунгало 300 000 (до 4 чел.) или 500 000 сум (до 10 чел.) — входные билеты в аренду бунгало не входят. Бассейн работает ежедневно 08:00–20:00, заявка — формой на странице бассейна.",
      uz: "Ha. Shale va glemping mehmonlari uchun basseyn narxga kiritilgan — alohida bron qilish shart emas. Yashashsiz — kunlik chipta: kattalar va 15 yoshdan katta bolalar ish kunlari (Du–Pay) 100 000 so'm, dam olish kunlari (Ju–Yak) 200 000 so'm; 5–15 yoshli bolalar — 50 000 va 100 000 so'm; 5 yoshgacha kattalar bilan bepul. Sochiq 30 000 so'm, bungalo 300 000 (4 kishigacha) yoki 500 000 so'm (10 kishigacha) — kirish chiptalari bungalo ijarasiga kirmaydi. Basseyn har kuni 08:00–20:00, ariza — basseyn sahifasidagi shakl orqali.",
      en: "Yes. For chalet and glamping guests the pool is included in the rate — no separate booking needed. Without a stay — a day pass: adults and ages 15+ pay 100 000 UZS Mon–Thu and 200 000 UZS Fri–Sun; children 5–15 pay 50 000 and 100 000; under-fives are free with an adult. Towel 30 000, bungalow 300 000 (up to 4) or 500 000 UZS (up to 10) — entry tickets are not included in a bungalow. The pool is open daily 08:00–20:00; requests go through the form on the pool page.",
    },
  },
  {
    question: {
      ru: "Как работает бронирование?",
      uz: "Bron qilish qanday ishlaydi?",
      en: "How does booking work?",
    },
    answer: {
      ru: "Выберите даты и забронируйте онлайн на странице «Бронирование» или оставьте заявку — администратор подтвердит бронь в ближайшее время. После подтверждения в течение 24 часов вносится предоплата 50% (при брони менее чем за сутки — сразу). Можно также написать в WhatsApp или Telegram.",
      uz: "Sanalarni tanlab, «Bron qilish» sahifasida onlayn bron qiling yoki so'rov qoldiring — administrator bronni tez orada tasdiqlaydi. Tasdiqlangandan keyin 24 soat ichida 50% oldindan to'lov amalga oshiriladi (bir kundan kam qolganda — darhol). WhatsApp yoki Telegram orqali ham yozishingiz mumkin.",
      en: "Pick your dates and book online on the Booking page, or send a request — the administrator will confirm shortly. A 50% deposit is due within 24 hours of confirmation (immediately for bookings made less than a day ahead). You can also message us on WhatsApp or Telegram.",
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
      uz: "Ha. Shale 6 mehmonga mo'ljallangan: ikkita alohida yotoqxona va oshxona-zal — bolalar yoki do'stlar bilan qulay. 9 gektar hududda bolalar maydonchasi, sayr zonalari, bolalar basseyni bilan basseyn va tayyor menyuli oshxona bor. Katta guruh uchun bir nechta uycha olish mumkin — administratorga yozing, bronni yig'ishga yordam beramiz. Afsuski, hayvonlarni hududga kirita olmaymiz.",
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
      ru: "Да, на день можно приехать тремя способами. Топчан — 150 000 сум в будни (Пн–Чт) и 300 000 в выходные (Пт–Вс) за топчан целиком, до 8 гостей. Бассейн — 100 000 и 200 000 сум с человека, дети 5–15 вдвое дешевле, до 5 лет бесплатно. Тюбинг-горка — 50 000 сум за 2 спуска и 100 000 за 4, цена одна всю неделю. Вход на территорию бесплатный; парковка платная только для тюбинга — 50 000 и 100 000 сум за автомобиль. У каждого формата своя форма заявки на сайте — администратор перезвонит и подтвердит.",
      uz: "Ha, bir kunga uch xil kelish mumkin. Topchan — ish kunlari (Du–Pay) 150 000 so'm, dam olish kunlari (Ju–Yak) 300 000 so'm butun topchan uchun, 8 kishigacha. Basseyn — bir kishidan 100 000 va 200 000 so'm, 5–15 yosh ikki barobar arzon, 5 yoshgacha bepul. Tubing gorkasi — 2 marta uchish 50 000 so'm, 4 marta 100 000 so'm, narx butun hafta bir xil. Hududga kirish bepul; parkovka faqat tubing uchun to'lanadi — avtomobil uchun 50 000 va 100 000 so'm. Har bir formatning saytda o'z arizasi bor — administrator qo'ng'iroq qilib tasdiqlaydi.",
      en: "Yes, in three ways. A topchan costs 150 000 UZS Mon–Thu and 300 000 Fri–Sun for the whole platform, seating up to 8. The pool is 100 000 and 200 000 UZS per person, half price for ages 5–15 and free under five. The tubing hill is 50 000 UZS for 2 rides and 100 000 for 4, at one price all week. Entry to the grounds is free; parking is charged for tubing only, at 50 000 and 100 000 UZS per car. Each has its own request form on the site, and the administrator calls back to confirm.",
    },
  },
];
