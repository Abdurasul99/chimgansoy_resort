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
    // Exely SEO recommendation: brand + city + "official website".
    title: {
      ru: "CHIMGAN DARBAZA, Ташкент — официальный сайт",
      uz: "CHIMGAN DARBAZA, Toshkent — rasmiy sayt",
      en: "CHIMGAN DARBAZA, Tashkent — Official website",
    },
    description: {
      ru: "Шале и A-frame глэмпинг на высоте 1700 м в 45 минутах от Ташкента: бассейн включён в проживание, кухня на территории, панорама Чимгана. Есть дневные визиты.",
      uz: "Toshkentdan 45 daqiqada, 1700 m balandlikda shale va A-frame glemping: basseyn narxga kiritilgan, hududda oshxona, Chimg'on panoramasi. Kunlik tashriflar ham bor.",
      en: "Chalets and A-frame glamping at 1,700 m, 45 minutes from Tashkent: pool included with every stay, kitchen on site, Chimgan views. Day visits available too.",
    },
  },
  rooms: {
    title: {
      ru: "Номера: глэмпинг и шале в горах",
      uz: "Xonalar: tog'lardagi glemping va shale",
      en: "Rooms: glamping and chalets in the mountains",
    },
    description: {
      ru: "Глэмпинг на природе или просторное шале для компании — выберите формат и забронируйте ночь в горах Чимгана.",
      uz: "Tabiat qo'ynidagi glemping yoki keng shale — formatni tanlang va Chimg'on tog'larida tunni bron qiling.",
      en: "Glamping in nature or a spacious chalet for your group — pick a format and book a night in the Chimgan mountains.",
    },
  },
  services: {
    title: {
      ru: "Сервисы и инфраструктура курорта",
      uz: "Kurort xizmatlari va infratuzilmasi",
      en: "Resort services and infrastructure",
    },
    description: {
      ru: "Кухня и ресторан, мангал и казан, зоны отдыха, детская площадка и горные маршруты рядом с курортом.",
      uz: "Oshxona va restoran, mangal va qozon, dam olish zonalari, bolalar maydoni va kurort yaqinidagi tog' marshrutlari.",
      en: "Kitchen and restaurant, BBQ and kazan, lounge areas, a kids playground, and mountain trails next to the resort.",
    },
  },
  about: {
    title: {
      ru: "О курорте в горах Чимгана",
      uz: "Chimg'on tog'laridagi kurort haqida",
      en: "About the resort in the Chimgan mountains",
    },
    description: {
      ru: "Проживание в шале и глэмпинге на высоте 1700 м в 45 минутах от Ташкента — 6 гектаров, бассейн, кухня и горы Чимгана.",
      uz: "Toshkentdan 45 daqiqada, 1700 m balandlikda shale va glempingda yashash — 6 gektar, basseyn, oshxona va Chimg'on tog'lari.",
      en: "Chalet and glamping stays at 1,700 m, 45 minutes from Tashkent — six hectares, a pool, a kitchen, and the Chimgan mountains.",
    },
  },
  place: {
    title: {
      ru: "Места рядом: горы и маршруты",
      uz: "Yaqindagi joylar: tog'lar va marshrutlar",
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
    // Exely SEO recommendation: "Booking - <brand>, <city> - Official website".
    title: {
      ru: "Бронирование — CHIMGAN DARBAZA, Ташкент — официальный сайт",
      uz: "Bron qilish — CHIMGAN DARBAZA, Toshkent — rasmiy sayt",
      en: "Booking — CHIMGAN DARBAZA, Tashkent — Official website",
    },
    description: {
      ru: "Бронирование шале, глэмпинга и дневных визитов: выберите даты — администратор подтвердит бронь в ближайшее время.",
      uz: "Shale, glemping va kunlik tashriflarni bron qilish: sanalarni tanlang — administrator bronni tez orada tasdiqlaydi.",
      en: "Book a chalet, a glamping cabin, or a day visit: pick the dates and our team will confirm shortly.",
    },
  },
} satisfies Record<string, PageSeo>;
