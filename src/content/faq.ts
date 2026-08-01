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
      ru: "Два формата. Глэмпинг A-frame — до 3 гостей, 28 м² плюс терраса 15 м², двуспальная кровать 180×200, собственный санузел с душем, кондиционер и Wi-Fi. Шале — до 5 гостей, две спальни (двуспальная 180×200 и две односпальные 90×200), кухня-зал с диваном, отдельный санузел у каждой спальни, тёплый пол и терраса 35 м². Заезд с 14:00, выезд до 12:00.",
      uz: "Ikki format. A-frame glemping — 3 mehmongacha, 28 m² va 15 m² terrasa, 180×200 ikki kishilik karavot, dushli xususiy sanuzel, konditsioner va Wi-Fi. Shale — 5 mehmongacha, ikkita yotoqxona (180×200 ikki kishilik va ikkita 90×200 bir kishilik), divanli oshxona-zal, har bir yotoqxonada alohida sanuzel, issiq pol va 35 m² terrasa. Kirish 14:00 dan, chiqish 12:00 gacha.",
      en: "Two formats. A-frame glamping — up to 3 guests, 28 m² plus a 15 m² terrace, a 180×200 double bed, an ensuite shower room, air conditioning, and Wi-Fi. The chalet — up to 5 guests, two bedrooms (one 180×200 double, one with two 90×200 singles), a kitchen-lounge with a sofa, an ensuite bathroom per bedroom, heated floors, and a 35 m² terrace. Check-in from 14:00, check-out by 12:00.",
    },
  },
  {
    question: {
      ru: "Бассейн входит в стоимость проживания?",
      uz: "Basseyn yashash narxiga kiradimi?",
      en: "Is the pool included in the room rate?",
    },
    answer: {
      ru: "Да. Гостям шале и глэмпинга бассейн включён в стоимость — отдельно бронировать не нужно. Без проживания — на день, без ограничения по числу гостей: 100 000 сум с человека в будни (Пн–Пт) и 200 000 сум в выходные (Сб–Вс). Заявка оставляется формой на странице бассейна, администратор перезвонит и подтвердит время. Работает в летний сезон.",
      uz: "Ha. Shale va glemping mehmonlari uchun basseyn narxga kiritilgan — alohida bron qilish shart emas. Yashashsiz — bir kunga, mehmonlar soni cheklanmagan: ish kunlari (Du–Ju) bir kishidan 100 000 so'm, dam olish kunlari (Sha–Yak) 200 000 so'm. Ariza basseyn sahifasidagi shakl orqali qoldiriladi, administrator qo'ng'iroq qilib vaqtni tasdiqlaydi. Yozgi mavsumda ishlaydi.",
      en: "Yes. For chalet and glamping guests the pool is included in the rate — no separate booking needed. Without a stay — for the day, any group size: 100 000 UZS per person on weekdays (Mon–Fri) and 200 000 UZS at weekends (Sat–Sun). Requests go through the form on the pool page and the administrator calls back to confirm the time. Open in the summer season.",
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
      ru: "Да. Шале рассчитано на 5 гостей: две отдельные спальни и кухня-зал — удобно с детьми или с друзьями. На 6 гектарах есть детская площадка, прогулочные зоны и кухня с готовым меню. Для компании можно взять несколько домиков — напишите администратору, поможем собрать бронь. Питомцев, к сожалению, на территорию не допускаем.",
      uz: "Ha. Shale 5 mehmonga mo'ljallangan: ikkita alohida yotoqxona va oshxona-zal — bolalar yoki do'stlar bilan qulay. 6 gektar hududda bolalar maydonchasi, sayr zonalari va tayyor menyuli oshxona bor. Katta guruh uchun bir nechta uycha olish mumkin — administratorga yozing, bronni yig'ishga yordam beramiz. Afsuski, hayvonlarni hududga kirita olmaymiz.",
      en: "Yes. The chalet sleeps five in two separate bedrooms plus a kitchen-lounge — comfortable with kids or with friends. The six hectares include a kids playground, walking areas, and a kitchen with a ready-made menu. For a larger group you can take several cabins — message the administrator and we'll put the booking together. Pets, unfortunately, are not allowed on the grounds.",
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
      ru: "Дневной отдых с арендой топчана мы больше не проводим — комплекс работает как курорт с проживанием. Единственный вариант без ночёвки — бассейн на день в летний сезон, без ограничения по числу гостей: 100 000 сум с человека в будни (Пн–Пт) и 200 000 сум в выходные (Сб–Вс). Заявка оставляется формой на странице бассейна. Всё остальное на территории доступно гостям, которые останавливаются в шале или глэмпинге.",
      uz: "Topchan ijarasi bilan kunlik dam olishni biz endi o'tkazmaymiz — majmua yashash bilan kurort sifatida ishlaydi. Tunamasdan yagona variant — yozgi mavsumda bir kunga basseyn, mehmonlar soni cheklanmagan: ish kunlari (Du–Ju) bir kishidan 100 000 so'm, dam olish kunlari (Sha–Yak) 200 000 so'm. Ariza basseyn sahifasidagi shakl orqali. Hududdagi qolgan hamma narsa shale yoki glempingda to'xtagan mehmonlar uchun.",
      en: "We no longer run day visits with topchan rental — the property operates as a resort with overnight stays. The one option without staying over is the pool for a day in the summer season, any group size: 100 000 UZS per person on weekdays (Mon–Fri) and 200 000 UZS at weekends (Sat–Sun), requested through the form on the pool page. Everything else on the grounds is for guests staying in a chalet or a glamping cabin.",
    },
  },
];
