import type { PageSeo } from "./types";

export const pageSeo = {
  home: {
    title: {
      ru: "CHIMGANSOY - горный resort в Ташкентской области",
      uz: "CHIMGANSOY - Toshkent viloyatidagi tog' resorti",
      en: "CHIMGANSOY - mountain resort in Tashkent region",
    },
    description: {
      ru: "Глэмпинг, коттеджи, ресторан, бассейн, активности и зоны отдыха в премиальном курортном формате.",
      uz: "Premium kurort formatida glemping, kottejlar, restoran, basseyn, faoliyatlar va dam olish zonalari.",
      en: "Glamping, cottages, restaurant, pool, activities, and lounge zones in a premium resort format.",
    },
  },
  rooms: {
    title: { ru: "Номера и размещение CHIMGANSOY", uz: "CHIMGANSOY xonalari va joylashuvi", en: "CHIMGANSOY rooms and stays" },
    description: {
      ru: "Выберите глэмпинг или коттедж для отдыха в Ташкентской области.",
      uz: "Toshkent viloyatida dam olish uchun glemping yoki kottejni tanlang.",
      en: "Choose glamping or a cottage for a resort stay in Tashkent region.",
    },
  },
  services: {
    title: { ru: "Сервисы и инфраструктура CHIMGANSOY", uz: "CHIMGANSOY xizmatlari va infratuzilmasi", en: "CHIMGANSOY services and infrastructure" },
    description: {
      ru: "Ресторан, бассейн, топчаны, пикник, спорт, детские зоны и активности.",
      uz: "Restoran, basseyn, topchanlar, piknik, sport, bolalar zonalari va faoliyatlar.",
      en: "Restaurant, pool, tapchan zones, picnic, sport, kids areas, and activities.",
    },
  },
  about: {
    title: { ru: "О курорте CHIMGANSOY", uz: "CHIMGANSOY kurorti haqida", en: "About CHIMGANSOY resort" },
    description: {
      ru: "Концепция премиального отдыха на природе в Ташкентской области.",
      uz: "Toshkent viloyatida tabiat qo'ynidagi premium dam olish konsepsiyasi.",
      en: "The concept of premium nature rest in Tashkent region.",
    },
  },
  place: {
    title: { ru: "Места рядом с CHIMGANSOY", uz: "CHIMGANSOY yaqinidagi joylar", en: "Attractions near CHIMGANSOY" },
    description: {
      ru: "Горы, маршруты, канатные дороги и впечатления рядом с курортом.",
      uz: "Kurort yaqinidagi tog'lar, marshrutlar, kanat yo'llari va taassurotlar.",
      en: "Mountains, routes, cable cars, and experiences near the resort.",
    },
  },
  contact: {
    title: { ru: "Контакты CHIMGANSOY", uz: "CHIMGANSOY aloqalari", en: "CHIMGANSOY contacts" },
    description: {
      ru: "Телефон, мессенджеры, адрес и форма связи курорта CHIMGANSOY.",
      uz: "CHIMGANSOY kurorti telefoni, messenjerlari, manzili va aloqa formasi.",
      en: "Phone, messengers, address, and contact form for CHIMGANSOY resort.",
    },
  },
  booking: {
    title: { ru: "Бронирование CHIMGANSOY", uz: "CHIMGANSOY bron qilish", en: "CHIMGANSOY booking" },
    description: {
      ru: "Страница бронирования с готовым местом для интеграции Bnovo.",
      uz: "Bnovo integratsiyasi uchun tayyor joyga ega bron sahifasi.",
      en: "Booking page with a prepared Bnovo integration area.",
    },
  },
} satisfies Record<string, PageSeo>;
