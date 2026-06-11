import type { PageSeo } from "./types";

export const pageSeo = {
  home: {
    title: {
      ru: "CHIMGAN DARBAZA - горный resort в Ташкентской области",
      uz: "CHIMGAN DARBAZA - Toshkent viloyatidagi tog' resorti",
      en: "CHIMGAN DARBAZA - mountain resort in Tashkent region",
    },
    description: {
      ru: "Глэмпинг, коттеджи, ресторан, бассейн, активности и зоны отдыха в премиальном курортном формате.",
      uz: "Premium kurort formatida glemping, kottejlar, restoran, basseyn, faoliyatlar va dam olish zonalari.",
      en: "Glamping, cottages, restaurant, pool, activities, and lounge zones in a premium resort format.",
    },
  },
  rooms: {
    title: { ru: "Номера и размещение CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA xonalari va joylashuvi", en: "CHIMGAN DARBAZA rooms and stays" },
    description: {
      ru: "Выберите глэмпинг или коттедж для отдыха в Ташкентской области.",
      uz: "Toshkent viloyatida dam olish uchun glemping yoki kottejni tanlang.",
      en: "Choose glamping or a cottage for a resort stay in Tashkent region.",
    },
  },
  services: {
    title: { ru: "Сервисы и инфраструктура CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA xizmatlari va infratuzilmasi", en: "CHIMGAN DARBAZA services and infrastructure" },
    description: {
      ru: "Ресторан, бассейн, топчаны, пикник, спорт, детские зоны и активности.",
      uz: "Restoran, basseyn, topchanlar, piknik, sport, bolalar zonalari va faoliyatlar.",
      en: "Restaurant, pool, tapchan zones, picnic, sport, kids areas, and activities.",
    },
  },
  about: {
    title: { ru: "О курорте CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA kurorti haqida", en: "About CHIMGAN DARBAZA resort" },
    description: {
      ru: "Концепция премиального отдыха на природе в Ташкентской области.",
      uz: "Toshkent viloyatida tabiat qo'ynidagi premium dam olish konsepsiyasi.",
      en: "The concept of premium nature rest in Tashkent region.",
    },
  },
  place: {
    title: { ru: "Места рядом с CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA yaqinidagi joylar", en: "Attractions near CHIMGAN DARBAZA" },
    description: {
      ru: "Горы, маршруты, канатные дороги и впечатления рядом с курортом.",
      uz: "Kurort yaqinidagi tog'lar, marshrutlar, kanat yo'llari va taassurotlar.",
      en: "Mountains, routes, cable cars, and experiences near the resort.",
    },
  },
  contact: {
    title: { ru: "Контакты CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA aloqalari", en: "CHIMGAN DARBAZA contacts" },
    description: {
      ru: "Телефон, мессенджеры, адрес и форма связи курорта CHIMGAN DARBAZA.",
      uz: "CHIMGAN DARBAZA kurorti telefoni, messenjerlari, manzili va aloqa formasi.",
      en: "Phone, messengers, address, and contact form for CHIMGAN DARBAZA resort.",
    },
  },
  booking: {
    title: { ru: "Бронирование CHIMGAN DARBAZA", uz: "CHIMGAN DARBAZA bron qilish", en: "CHIMGAN DARBAZA booking" },
    description: {
      ru: "Бронирование топчанов и дневного отдыха: выберите даты — администратор подтвердит бронь в ближайшее время.",
      uz: "Topchan va kunlik dam olishni bron qilish: sanalarni tanlang — administrator bronni tez orada tasdiqlaydi.",
      en: "Book a topchan and your day in the mountains: pick the dates and our team will confirm shortly.",
    },
  },
} satisfies Record<string, PageSeo>;
