import type { PageSeo } from "./types";

/**
 * Page titles here must NOT include the brand — the root layout applies the
 * template "%s | CHIMGAN DARBAZA", so putting the brand in the title too
 * produces a duplicate ("… CHIMGAN DARBAZA | CHIMGAN DARBAZA"). Keep titles
 * keyword-rich; the brand is appended automatically.
 *
 * Exception: `home` is rendered with an absolute title (no template) in
 * buildMetadata, so it carries the brand itself.
 */
export const pageSeo = {
  home: {
    title: {
      ru: "CHIMGAN DARBAZA — горный курорт и база отдыха в Чимгане",
      uz: "CHIMGAN DARBAZA — Chimg'ondagi tog' kurorti va dam olish maskani",
      en: "CHIMGAN DARBAZA — mountain resort near Tashkent",
    },
    description: {
      ru: "Глэмпинг, коттеджи и дневной отдых в 45 минутах от Ташкента: топчаны, мангал, казан, ресторан и панорама Чимгана на высоте 1700 м.",
      uz: "Toshkentdan 45 daqiqada glemping, kottejlar va kunlik dam: topchanlar, mangal, qozon, restoran va 1700 m balandlikdagi Chimg'on manzarasi.",
      en: "Glamping, cottages, and day visits 45 minutes from Tashkent: topchans, BBQ, kazan, restaurant, and Chimgan views at 1,700 m.",
    },
  },
  rooms: {
    title: {
      ru: "Номера: глэмпинг и коттеджи в горах",
      uz: "Xonalar: tog'lardagi glemping va kottejlar",
      en: "Rooms: glamping and cottages in the mountains",
    },
    description: {
      ru: "Глэмпинг на природе или просторный коттедж для компании — выберите формат и забронируйте ночь в горах Чимгана.",
      uz: "Tabiat qo'ynidagi glemping yoki keng kottej — formatni tanlang va Chimg'on tog'larida tunni bron qiling.",
      en: "Glamping in nature or a spacious cottage for your group — pick a format and book a night in the Chimgan mountains.",
    },
  },
  services: {
    title: {
      ru: "Сервисы и инфраструктура курорта",
      uz: "Kurort xizmatlari va infratuzilmasi",
      en: "Resort services and infrastructure",
    },
    description: {
      ru: "Ресторан, топчаны с курпача, мангал и казан, зоны пикника, детская площадка и активности на территории.",
      uz: "Restoran, kurpachali topchanlar, mangal va qozon, piknik zonalari, bolalar maydoni va faoliyatlar.",
      en: "Restaurant, kurpacha topchans, BBQ and kazan, picnic zones, kids playground, and on-site activities.",
    },
  },
  about: {
    title: {
      ru: "О курорте в горах Чимгана",
      uz: "Chimg'on tog'laridagi kurort haqida",
      en: "About the resort in the Chimgan mountains",
    },
    description: {
      ru: "Дневной отдых и проживание на высоте 1700 м в 45 минутах от Ташкента — природа, тишина и полная инфраструктура.",
      uz: "Toshkentdan 45 daqiqada 1700 m balandlikda kunlik dam va yashash — tabiat, osoyishtalik va to'liq infratuzilma.",
      en: "Day visits and stays at 1,700 m, 45 minutes from Tashkent — nature, quiet, and full infrastructure.",
    },
  },
  place: {
    title: {
      ru: "Места рядом: горы, маршруты, канатные дороги",
      uz: "Yaqindagi joylar: tog'lar, marshrutlar, kanat yo'llari",
      en: "Nearby: mountains, trails, cable cars",
    },
    description: {
      ru: "Горные маршруты, прогулки, канатные дороги и впечатления рядом с курортом в Чимгане.",
      uz: "Chimg'ondagi kurort yaqinidagi tog' marshrutlari, sayrlar, kanat yo'llari va taassurotlar.",
      en: "Mountain trails, walks, cable cars, and experiences near the resort in Chimgan.",
    },
  },
  contact: {
    title: {
      ru: "Контакты и как добраться",
      uz: "Aloqa va qanday borish",
      en: "Contacts and directions",
    },
    description: {
      ru: "Телефон, WhatsApp, Telegram, адрес и карта курорта CHIMGAN DARBAZA в Бостанлыкском районе.",
      uz: "CHIMGAN DARBAZA kurortining telefoni, WhatsApp, Telegram, manzili va xaritasi (Bo'stonliq tumani).",
      en: "Phone, WhatsApp, Telegram, address, and map of CHIMGAN DARBAZA resort in the Bostanlyk district.",
    },
  },
  booking: {
    title: {
      ru: "Бронирование топчанов и номеров",
      uz: "Topchan va xonalarni bron qilish",
      en: "Book topchans and rooms",
    },
    description: {
      ru: "Бронирование дневного отдыха и проживания: выберите даты — администратор подтвердит бронь в ближайшее время.",
      uz: "Kunlik dam va yashashni bron qilish: sanalarni tanlang — administrator bronni tez orada tasdiqlaydi.",
      en: "Book a day visit or a stay: pick the dates and our team will confirm shortly.",
    },
  },
} satisfies Record<string, PageSeo>;
