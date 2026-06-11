import type { LocalizedString } from "./types";

export type FaqItem = {
  question: LocalizedString;
  answer: LocalizedString;
};

export const faqItems: FaqItem[] = [
  {
    question: {
      ru: "Можно приехать только на день?",
      uz: "Faqat bir kunga kelish mumkinmi?",
      en: "Can we come just for the day?",
    },
    answer: {
      ru: "Да, сейчас мы работаем только в формате дневного отдыха — ежедневно с 08:00 до 18:00. Доступны топчан с курпача до 8 человек, мангал и казан в аренду, дрова и уголь на месте, готовое меню от кухни.",
      uz: "Ha, hozir biz faqat kunlik dam olish formatida ishlayapmiz — har kuni 08:00 dan 18:00 gacha. 8 kishigacha kurpachali topchan, mangal va qozon ijarasi, joyda o'tin va ko'mir, oshxonadan tayyor menyu mavjud.",
      en: "Yes — we currently run as a day-only venue, open daily 08:00–18:00. Topchan with kurpacha for up to 8 guests, BBQ grill and kazan to rent, firewood and charcoal on site, plus a ready-made kitchen menu.",
    },
  },
  {
    question: {
      ru: "Как работает бронирование?",
      uz: "Bron qilish qanday ishlaydi?",
      en: "How does booking work?",
    },
    answer: {
      ru: "Забронируйте даты на странице «Бронирование» или напишите нам в WhatsApp / Telegram — администратор подтвердит бронь в ближайшее время.",
      uz: "«Bron qilish» sahifasida sanalarni bron qiling yoki WhatsApp / Telegram orqali yozing — administrator bronni tez orada tasdiqlaydi.",
      en: "Book your dates on the Booking page, or message us on WhatsApp / Telegram — the administrator will confirm your reservation shortly.",
    },
  },
  {
    question: {
      ru: "Подходит ли отдых для семей с детьми?",
      uz: "Bolali oilalar uchun mosmi?",
      en: "Is the venue family-friendly?",
    },
    answer: {
      ru: "Да. На территории 6 гектаров среди сосен — безопасные прогулочные зоны, пикник-зоны рядом с топчанами, мягкие курпача и готовое меню от кухни. Удобно приехать всей семьёй на день.",
      uz: "Ha. 6 gektarli qarag'aylar orasidagi hudud — xavfsiz sayr zonalari, topchanlar yonidagi piknik joylari, yumshoq kurpacha va oshxonadan tayyor menyu. Butun oila bilan kunga kelish qulay.",
      en: "Yes. Six hectares of pine forest — safe walking zones, picnic spots next to the topchans, soft kurpacha, and a ready-made kitchen menu. Easy to bring the whole family for the day.",
    },
  },
  {
    question: {
      ru: "Можно ли организовать корпоратив или праздник?",
      uz: "Korporativ yoki bayram tashkil qilish mumkinmi?",
      en: "Can we organize a corporate event or celebration?",
    },
    answer: {
      ru: "Да. Небольшие семейные и корпоративные форматы возможны по предварительному согласованию: несколько топчанов, аренда мангала и казана, предзаказ меню от кухни. Свяжитесь с администратором — обсудим детали.",
      uz: "Ha. Kichik oilaviy va korporativ formatlar oldindan kelishuv asosida mumkin: bir nechta topchan, mangal va qozon ijarasi, oshxonadan menyuni oldindan buyurtma qilish. Administrator bilan bog'lanib, tafsilotlarni muhokama qiling.",
      en: "Yes. Small family and corporate formats can be arranged in advance: several topchans, BBQ and kazan rentals, and pre-ordered menu items from the kitchen. Contact the administrator to discuss the details.",
    },
  },
  {
    question: {
      ru: "Что у вас зимой?",
      uz: "Qishda nimalar bor?",
      en: "What's open in winter?",
    },
    answer: {
      ru: "Зимой работаем так же — ежедневно с 08:00 до 18:00. Тёплые зоны на топчане, мангал и казан, готовое меню и горячий чай. Снежные виды бесплатно. Точные условия зависят от погоды — лучше уточнить заранее.",
      uz: "Qishda ham xuddi yozdek ishlaymiz — har kuni 08:00 dan 18:00 gacha. Topchandagi iliq zonalar, mangal va qozon, tayyor menyu va issiq choy. Qor manzaralari bepul. Aniq sharoitlar ob-havoga bog'liq — oldindan aniqlashtirish yaxshiroq.",
      en: "Winter hours are the same — daily 08:00–18:00. Warm topchan setups, BBQ grill and kazan, the kitchen menu, and hot tea. Snow views included. Exact conditions depend on the weather — best to confirm ahead.",
    },
  },
];
