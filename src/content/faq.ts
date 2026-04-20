import type { LocalizedString } from "./types";

export type FaqItem = {
  question: LocalizedString;
  answer: LocalizedString;
};

export const faqItems: FaqItem[] = [
  {
    question: {
      ru: "Можно ли приехать без проживания?",
      uz: "Yashamasdan kunlik tashrif qilish mumkinmi?",
      en: "Can we visit without staying overnight?",
    },
    answer: {
      ru: "Да, часть зон рассчитана на дневные визиты. Доступность топчанов, бассейна, ресторана и активностей лучше уточнить заранее.",
      uz: "Ha, ayrim hududlar kunlik tashriflar uchun mo'ljallangan. Topchan, basseyn, restoran va faoliyatlar mavjudligini oldindan aniqlashtirish kerak.",
      en: "Yes. Some areas are designed for day visits. Availability for tapchan zones, pool, restaurant, and activities should be confirmed in advance.",
    },
  },
  {
    question: {
      ru: "Как работает бронирование?",
      uz: "Bron qilish qanday ishlaydi?",
      en: "How does booking work?",
    },
    answer: {
      ru: "Сайт подготовлен к подключению Bnovo. На первом этапе заявки можно направлять через телефон, WhatsApp, Telegram или форму.",
      uz: "Sayt Bnovo ulanishiga tayyorlangan. Birinchi bosqichda so'rovlarni telefon, WhatsApp, Telegram yoki forma orqali yuborish mumkin.",
      en: "The site is prepared for Bnovo integration. At launch, requests can be sent by phone, WhatsApp, Telegram, or form.",
    },
  },
  {
    question: {
      ru: "Есть ли семейные условия?",
      uz: "Oilalar uchun sharoit bormi?",
      en: "Is the resort family-friendly?",
    },
    answer: {
      ru: "Да. Для семей предусмотрены коттеджи, детская площадка, ресторан, пикник зона и спокойные маршруты на территории.",
      uz: "Ha. Oilalar uchun kottejlar, bolalar maydonchasi, restoran, piknik zonasi va hududdagi sokin marshrutlar bor.",
      en: "Yes. Families can use cottages, a playground, restaurant, picnic zone, and calm walking routes on the territory.",
    },
  },
  {
    question: {
      ru: "Можно ли организовать мероприятие?",
      uz: "Tadbir tashkil qilish mumkinmi?",
      en: "Can we organize an event?",
    },
    answer: {
      ru: "Небольшие семейные и корпоративные форматы возможны по предварительному согласованию: ресторан, топчаны, гриль зона и активности комбинируются под программу.",
      uz: "Kichik oilaviy va korporativ formatlar oldindan kelishuv asosida mumkin: restoran, topchanlar, gril zonasi va faoliyatlar dasturga mos birlashtiriladi.",
      en: "Small family and corporate formats can be coordinated in advance, combining the restaurant, tapchan zones, grill area, and activities.",
    },
  },
  {
    question: {
      ru: "Что работает зимой?",
      uz: "Qishda nimalar ishlaydi?",
      en: "What is available in winter?",
    },
    answer: {
      ru: "Зимний сценарий зависит от сезона и погоды. Тюбинг, теплые зоны, ресторан и проживание можно уточнить перед поездкой.",
      uz: "Qishki ssenariy mavsum va ob-havoga bog'liq. Tubing, iliq zonalar, restoran va yashash bo'yicha safardan oldin aniqlashtiring.",
      en: "The winter scenario depends on season and weather. Tubing, warm zones, restaurant service, and stays should be confirmed before the trip.",
    },
  },
];
