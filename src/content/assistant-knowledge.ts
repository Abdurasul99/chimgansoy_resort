/**
 * Locally hosted FAQ knowledge base for the resort assistant.
 * No external API calls — all answers are matched by keyword overlap.
 */

import { contacts } from "./contacts";

export type AssistantAnswer = {
  ru: string;
  uz: string;
  en: string;
};

export type KnowledgeEntry = {
  /** Stable id for analytics / debugging */
  id: string;
  /** Keywords (lowercased, no diacritics) in all three languages — used by the matcher */
  keywords: string[];
  /** Localized answer */
  answer: AssistantAnswer;
};

export const knowledge: KnowledgeEntry[] = [
  // ── Greeting ────────────────────────────────────────────
  {
    id: "greeting",
    keywords: ["привет", "здравствуйте", "добрый", "hi", "hello", "hey", "salom", "assalomu", "ассалому"],
    answer: {
      ru: "Здравствуйте! 👋 Я подскажу про номера, цены, активности, бронирование или контакты. Просто спросите или выберите вопрос ниже 👇",
      uz: "Salom! 👋 Xonalar, narxlar, faoliyatlar, bron yoki aloqalar bo'yicha yordam beraman. So'rang yoki quyidan tanlang 👇",
      en: "Hello! 👋 Ask me anything about rooms, prices, activities, bookings, or contacts — or pick a question below 👇",
    },
  },

  // ── Accommodation: cottages ─────────────────────────────
  {
    id: "cottage",
    keywords: ["коттедж", "коттеджи", "дом", "домик", "kottej", "uy", "uycha", "cottage", "house", "cabin"],
    answer: {
      ru: "🏡 Коттеджи рассчитаны до 6 гостей, около 58 м². Две зоны для сна, гостиная, терраса и парковка у дома. Подойдут для семьи или компании друзей.",
      uz: "🏡 Kottejlar 6 mehmongacha mo'ljallangan, taxminan 58 m². Ikkita uxlash zonasi, mehmonxona, ayvon va uy yonida avtoturargoh. Oila yoki do'stlar uchun ajoyib.",
      en: "🏡 Cottages fit up to 6 guests, around 58 m². Two sleeping zones, a living area, terrace, and parking by the house. Perfect for families or groups of friends.",
    },
  },

  // ── Accommodation: glamping / A-frame ───────────────────
  {
    id: "glamping",
    keywords: ["глэмпинг", "глемпинг", "a-frame", "aframe", "афрейм", "палатка", "shator", "tent", "glamping"],
    answer: {
      ru: "⛺ A-frame глэмпинг: до 4 гостей, около 32 м², панорамное остекление, терраса, кондиционер и Wi-Fi. Идеально для пары или маленькой семьи.",
      uz: "⛺ A-frame glemping: 4 mehmongacha, taxminan 32 m², panoramali oyna, ayvon, konditsioner va Wi-Fi. Juftlik yoki kichik oila uchun ideal.",
      en: "⛺ A-frame glamping: up to 4 guests, about 32 m², panoramic glazing, terrace, air conditioning, and Wi-Fi. Perfect for couples or small families.",
    },
  },

  // ── Price (general) ─────────────────────────────────────
  {
    id: "price",
    keywords: ["цена", "цены", "стоимость", "сколько стоит", "прайс", "narx", "narxi", "qancha", "price", "cost", "how much", "rate"],
    answer: {
      ru: "💰 Цены зависят от типа размещения, дат и количества гостей. Точную стоимость подтвердит администратор за пару минут — напишите в WhatsApp или Telegram, или забронируйте на сайте.",
      uz: "💰 Narxlar turar joy turi, sanalar va mehmonlar soniga bog'liq. Aniq narxni administrator bir necha daqiqada tasdiqlaydi — WhatsApp yoki Telegramga yozing yoki saytda bron qiling.",
      en: "💰 Prices depend on accommodation type, dates and number of guests. The administrator will confirm the exact rate in a couple of minutes — message us on WhatsApp or Telegram, or book on the site.",
    },
  },

  // ── Booking ─────────────────────────────────────────────
  {
    id: "booking",
    keywords: ["бронир", "забронировать", "заказ", "бронь", "bron", "buyurtma", "book", "reserve", "reservation", "booking"],
    answer: {
      ru: "📅 Забронировать просто:\n• Выберите даты на странице «Бронирование»\n• Или напишите в WhatsApp / Telegram\n\nАдминистратор подтвердит бронь в ближайшее время.",
      uz: "📅 Bron qilish oson:\n• «Bron qilish» sahifasida sanalarni tanlang\n• Yoki WhatsApp / Telegramga yozing\n\nAdministrator bronni tez orada tasdiqlaydi.",
      en: "📅 Booking is easy:\n• Pick your dates on the «Booking» page\n• Or message us on WhatsApp / Telegram\n\nThe administrator will confirm your reservation shortly.",
    },
  },

  // ── Check-in / check-out ────────────────────────────────
  {
    id: "checkin",
    keywords: ["заезд", "выезд", "check-in", "checkin", "checkout", "kirish", "chiqish", "во сколько заезд", "когда заезд"],
    answer: {
      ru: "🕑 Заезд — после 14:00, выезд — до 12:00. Раннее заселение или поздний выезд возможны по согласованию с администратором (зависит от загрузки).",
      uz: "🕑 Kirish — 14:00 dan keyin, chiqish — 12:00 gacha. Erta kirish yoki kech chiqish administrator bilan kelishilgan holda mumkin (band bo'lishiga bog'liq).",
      en: "🕑 Check-in from 2:00 PM, check-out by 12:00 PM. Early check-in or late check-out can be arranged with the administrator (depending on availability).",
    },
  },

  // ── Cancellation ────────────────────────────────────────
  {
    id: "cancellation",
    keywords: ["отмен", "возврат", "вернуть", "bekor", "qaytarish", "cancel", "refund", "cancellation"],
    answer: {
      ru: "↩️ Бесплатная отмена возможна за 24 часа до заезда. Если отменяете позже — условия зависят от даты и типа бронирования, уточняйте у администратора.",
      uz: "↩️ Bepul bekor qilish kirishdan 24 soat oldin mumkin. Keyinroq bekor qilsangiz, shartlar sanalar va bron turiga bog'liq — administrator bilan aniqlashtiring.",
      en: "↩️ Free cancellation up to 24 hours before check-in. If you cancel later, terms depend on the date and booking type — please confirm with the administrator.",
    },
  },

  // ── Location / how to get there ─────────────────────────
  {
    id: "location",
    keywords: ["где", "адрес", "находится", "как добраться", "далеко", "ташкент", "qayer", "manzil", "toshkent", "where", "location", "address", "how to get", "tashkent", "directions"],
    answer: {
      ru: `📍 Курорт находится в горах Чимгана, Бостанлыкский район Ташкентской области. Дорога из Ташкента занимает около 45 минут на машине. Точку на карте откроем здесь: ${contacts.googleMapsUrl}`,
      uz: `📍 Kurort Chimgan tog'larida, Toshkent viloyati Bo'stonliq tumanida joylashgan. Toshkentdan yo'l mashinada 45 daqiqa atrofida oladi. Xaritada nuqta: ${contacts.googleMapsUrl}`,
      en: `📍 The resort is in the Chimgan mountains, Bostanlyk district of Tashkent region. The drive from Tashkent takes around 45 minutes by car. Point on the map: ${contacts.googleMapsUrl}`,
    },
  },

  // ── Pool ────────────────────────────────────────────────
  {
    id: "pool",
    keywords: ["бассейн", "купаться", "плавать", "basseyn", "suzish", "pool", "swimming", "swim"],
    answer: {
      ru: "Бассейна у нас нет. Зато есть топчаны с курпача в тени, мангал и казан, кухня с готовым меню и чистый горный воздух — отлично для жаркого дня.",
      uz: "Bizda basseyn yo'q. Lekin soyada kurpachali topchanlar, mangal va qozon, tayyor menyuli oshxona va toza tog' havosi bor — issiq kun uchun ajoyib.",
      en: "We don't have a pool. Instead there are shaded topchans with kurpacha, a BBQ and kazan, a kitchen menu, and clean mountain air — great for a hot day.",
    },
  },

  // ── Restaurant / food ───────────────────────────────────
  {
    id: "restaurant",
    keywords: ["ресторан", "еда", "питание", "кухня", "завтрак", "обед", "ужин", "restoran", "ovqat", "nonushta", "tushlik", "kechki", "restaurant", "food", "breakfast", "lunch", "dinner", "menu"],
    answer: {
      ru: "🍽️ На территории работает ресторан с уютной верандой и видом на горы. Подаются европейские и узбекские блюда. Завтрак — по запросу, ужин — по основному меню. Возможны банкеты для групп.",
      uz: "🍽️ Hududda tog'larga qarashli ayvonli qulay restoran ishlaydi. Yevropa va o'zbek taomlari beriladi. Nonushta — so'rov bo'yicha, kechki ovqat — asosiy menyu bo'yicha. Guruhlar uchun banketlar mumkin.",
      en: "🍽️ There's a restaurant on site with a cozy veranda and mountain views, serving European and Uzbek cuisine. Breakfast on request, dinner from the main menu. Banquets available for groups.",
    },
  },

  // ── Kids / family ───────────────────────────────────────
  {
    id: "kids",
    keywords: ["дети", "ребен", "детск", "семей", "семья", "bola", "bolalar", "oila", "kids", "child", "children", "family", "playground"],
    answer: {
      ru: "👨‍👩‍👧 Дневной формат отлично подходит для семей с детьми: безопасные прогулочные зоны, пикник-зоны под соснами, мягкие курпача на топчане, готовое меню от кухни. Можно приехать на день и спокойно разместиться компанией до 8 человек на топчан.",
      uz: "👨‍👩‍👧 Kunlik format bolali oilalar uchun ajoyib: xavfsiz sayr zonalari, qarag'aylar ostidagi piknik joylari, topchandagi yumshoq kurpacha, oshxonadan tayyor menyu. Bir kunga kelib, 8 kishigacha do'stlar davrasi bilan bemalol joylashishingiz mumkin.",
      en: "👨‍👩‍👧 The day-visit format is great for families: safe walking zones, picnic spots under the pines, soft kurpacha on the topchan, and a ready-made kitchen menu. Come for a day and settle in as a group of up to 8 per topchan.",
    },
  },

  // ── Pets ────────────────────────────────────────────────
  {
    id: "pets",
    keywords: ["собака", "кот", "кошка", "питомец", "животн", "it", "mushuk", "hayvon", "dog", "cat", "pet", "animal"],
    answer: {
      ru: "🐾 Питомцы на дневной визит — добро пожаловать, на поводке. Пожалуйста, напишите администратору в WhatsApp или Telegram заранее, чтобы согласовать дату и место.",
      uz: "🐾 Kunlik tashrifda uy hayvonlari — bog'ichli holatda xush kelibsiz. Sanani va joyni kelishish uchun administrator bilan WhatsApp yoki Telegram orqali oldindan bog'laning.",
      en: "🐾 Pets are welcome for a day visit, kept on a leash. Please message the administrator on WhatsApp or Telegram in advance to coordinate the date and spot.",
    },
  },

  // ── Activities / what to do ─────────────────────────────
  {
    id: "activities",
    keywords: ["активности", "развлечения", "что делать", "чем заняться", "досуг", "faoliyat", "ko'ngilochar", "nima qilish", "activities", "what to do", "entertainment", "things"],
    answer: {
      ru: "🎯 На территории — топчаны с курпача, мангал и казан в аренду, готовое меню от кухни, пикник-зоны под соснами и панорама Чимгана. Можно гулять по горным маршрутам рядом или попробовать конную прогулку и канатные дороги.",
      uz: "🎯 Hududda — kurpachali topchanlar, ijaraga mangal va qozon, oshxonadan tayyor menyu, qarag'aylar ostidagi piknik joylari va Chimgon panoramasi. Yaqindagi tog' marshrutlarida sayr qilish, ot minib ko'rish yoki kanat yo'liga borish mumkin.",
      en: "🎯 On the territory — topchans with kurpacha, BBQ grill and kazan to rent, a ready-made kitchen menu, picnic spots under the pines, and views of Chimgan. Nearby you can hike mountain routes, ride horses, or try the cable cars.",
    },
  },

  // ── Winter ──────────────────────────────────────────────
  {
    id: "winter",
    keywords: ["зим", "снег", "тюбинг", "лыж", "санки", "qish", "qor", "winter", "snow", "ski", "tubing", "sledding"],
    answer: {
      ru: "❄️ Зимой работаем как и летом — ежедневно с 08:00 до 18:00. Тёплые зоны на топчане, мангал и казан, готовое меню и горячий чай. Снежный сезон обычно с декабря по март — точные условия зависят от погоды, лучше уточнить заранее.",
      uz: "❄️ Qishda ham yozdek ishlaymiz — har kuni 08:00 dan 18:00 gacha. Topchandagi iliq zonalar, mangal va qozon, tayyor menyu va issiq choy. Qor mavsumi odatda dekabrdan martgacha — aniq sharoitlar ob-havoga bog'liq, oldindan aniqlashtirish yaxshiroq.",
      en: "❄️ Winter hours are the same as summer — daily 08:00–18:00. Warm topchan setups, BBQ grill and kazan, the kitchen menu, and hot tea. Snow season runs roughly December through March — exact conditions depend on the weather, best to check ahead.",
    },
  },

  // ── Events / banquets ───────────────────────────────────
  {
    id: "events",
    keywords: ["мероприят", "банкет", "праздник", "корпоратив", "свадьб", "tadbir", "bayram", "to'y", "korporativ", "event", "banquet", "party", "wedding", "corporate"],
    answer: {
      ru: "🎉 Небольшие семейные и корпоративные форматы возможны: ресторан, топчаны, гриль-зона и активности комбинируем под программу. Свяжитесь с администратором, обсудим детали.",
      uz: "🎉 Kichik oilaviy va korporativ formatlar mumkin: restoran, topchanlar, gril zonasi va faoliyatlar dasturga moslashtirilib birlashtiriladi. Administrator bilan bog'lanib, tafsilotlarni muhokama qiling.",
      en: "🎉 Small family and corporate events are possible — we combine the restaurant, tapchan zones, grill area, and activities to fit your program. Contact the administrator to discuss details.",
    },
  },

  // ── Day visit ───────────────────────────────────────────
  {
    id: "dayvisit",
    keywords: ["днем", "дневной", "на день", "без ночевки", "без проживания", "kunduzi", "kunlik", "yashamasdan", "day visit", "without stay", "without overnight", "just visit"],
    answer: {
      ru: "☀️ Да, сейчас мы работаем только в формате дневного отдыха — без ночёвок. Топчан с курпача до 8 человек, мангал и казан в аренду, дрова и уголь на месте, меню от кухни. Ежедневно с 08:00 до 18:00.",
      uz: "☀️ Ha, hozir biz faqat kunlik dam olish formatida ishlayapmiz — tunamasdan. 8 kishigacha kurpachali topchan, mangal va qozon ijarasi, joyda o'tin va ko'mir, oshxonadan menyu. Har kuni 08:00 dan 18:00 gacha.",
      en: "☀️ Yes, we currently run as a day-only venue — no overnight stays. A topchan with kurpacha for up to 8 guests, BBQ grill and kazan to rent, firewood and charcoal on site, and a kitchen menu. Open daily 08:00–18:00.",
    },
  },

  // ── Parking ─────────────────────────────────────────────
  {
    id: "parking",
    keywords: ["парковка", "машина", "стоянка", "avtoturargoh", "mashina", "parking", "car"],
    answer: {
      ru: "🅿️ На территории есть бесплатная парковка для гостей — у коттеджей и общая на въезде. Также доступны места для зарядки электромобилей.",
      uz: "🅿️ Hududda mehmonlar uchun bepul avtoturargoh bor — kottejlar yonida va kirishda umumiy. Elektromobillarni zaryadlash joylari ham mavjud.",
      en: "🅿️ Free guest parking is available — by the cottages and a shared lot at the entrance. EV charging spots are also available.",
    },
  },

  // ── Wi-Fi ───────────────────────────────────────────────
  {
    id: "wifi",
    keywords: ["wifi", "wi-fi", "вайфай", "интернет", "internet"],
    answer: {
      ru: "📶 Wi-Fi работает на территории. Подключение бесплатное для всех гостей.",
      uz: "📶 Wi-Fi hudud bo'ylab ishlaydi. Barcha mehmonlar uchun ulanish bepul.",
      en: "📶 Wi-Fi is available across the territory. Free for all guests.",
    },
  },

  // ── Contact ─────────────────────────────────────────────
  {
    id: "contact",
    keywords: ["контакт", "телефон", "номер", "позвонить", "связаться", "telefon", "raqam", "aloqa", "contact", "phone", "call", "number"],
    answer: {
      ru: `📞 Свяжитесь с нами:\n• Телефон: ${contacts.phone}\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Instagram: ${contacts.instagram}\n• Email: ${contacts.email}\n\nРаботаем ежедневно ${contacts.schedule.ru}.`,
      uz: `📞 Biz bilan bog'laning:\n• Telefon: ${contacts.phone}\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Instagram: ${contacts.instagram}\n• Email: ${contacts.email}\n\nHar kuni ishlaymiz, ${contacts.schedule.uz}.`,
      en: `📞 Get in touch:\n• Phone: ${contacts.phone}\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Instagram: ${contacts.instagram}\n• Email: ${contacts.email}\n\nOpen daily, ${contacts.schedule.en}.`,
    },
  },

  // ── Schedule ────────────────────────────────────────────
  {
    id: "schedule",
    keywords: ["график", "режим", "работа", "часы", "когда работает", "ish vaqti", "soat", "schedule", "hours", "open", "working hours"],
    answer: {
      ru: `🕒 Работаем круглый год, ${contacts.schedule.ru.toLowerCase()}. Высота 1700 м, в 45 минутах от Ташкента.`,
      uz: `🕒 Yil davomida ishlaymiz, ${contacts.schedule.uz.toLowerCase()}. Balandlik 1700 m, Toshkentdan 45 daqiqada.`,
      en: `🕒 Open year-round, ${contacts.schedule.en.toLowerCase()}. 1,700 m altitude, 45 minutes from Tashkent.`,
    },
  },

  // ── Thanks ──────────────────────────────────────────────
  {
    id: "thanks",
    keywords: ["спасибо", "благодарю", "rahmat", "tashakkur", "thank", "thanks", "cheers"],
    answer: {
      ru: "🙏 Пожалуйста! Если будут ещё вопросы — пишите, всегда рад помочь.",
      uz: "🙏 Arzimaydi! Yana savollar bo'lsa — yozing, har doim yordam berishdan xursandman.",
      en: "🙏 You're welcome! If you have more questions — just ask, happy to help.",
    },
  },
];

// Quick-reply chips shown above the input
export const quickReplies: Record<"ru" | "uz" | "en", { label: string; id: string }[]> = {
  ru: [
    { label: "🏡 Коттеджи", id: "cottage" },
    { label: "⛺ Глэмпинг", id: "glamping" },
    { label: "💰 Цены", id: "price" },
    { label: "📅 Как забронировать", id: "booking" },
    { label: "📍 Где находится", id: "location" },
    { label: "🎯 Активности", id: "activities" },
    { label: "🍽️ Ресторан", id: "restaurant" },
    { label: "📞 Контакты", id: "contact" },
  ],
  uz: [
    { label: "🏡 Kottejlar", id: "cottage" },
    { label: "⛺ Glemping", id: "glamping" },
    { label: "💰 Narxlar", id: "price" },
    { label: "📅 Bron qilish", id: "booking" },
    { label: "📍 Qayerda", id: "location" },
    { label: "🎯 Faoliyatlar", id: "activities" },
    { label: "🍽️ Restoran", id: "restaurant" },
    { label: "📞 Aloqa", id: "contact" },
  ],
  en: [
    { label: "🏡 Cottages", id: "cottage" },
    { label: "⛺ Glamping", id: "glamping" },
    { label: "💰 Prices", id: "price" },
    { label: "📅 How to book", id: "booking" },
    { label: "📍 Location", id: "location" },
    { label: "🎯 Activities", id: "activities" },
    { label: "🍽️ Restaurant", id: "restaurant" },
    { label: "📞 Contact", id: "contact" },
  ],
};

// Fallback when nothing matched
export const fallback: AssistantAnswer = {
  ru: `🤔 Не уверен, что понял точно. Уточните вопрос или напишите администратору напрямую:\n\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Телефон: ${contacts.phone}\n\nАдминистратор ответит в ближайшее время.`,
  uz: `🤔 Aniq tushunganimga ishonchim yo'q. Savolingizni aniqlashtiring yoki administratorga to'g'ridan-to'g'ri yozing:\n\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Telefon: ${contacts.phone}\n\nAdministrator tez orada javob beradi.`,
  en: `🤔 I'm not sure I caught that. Try rephrasing or message the administrator directly:\n\n• WhatsApp: ${contacts.whatsapp}\n• Telegram: ${contacts.telegram}\n• Phone: ${contacts.phone}\n\nThe administrator will reply shortly.`,
};

/**
 * Normalize text for matching: lowercase, strip diacritics & punctuation.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-zа-яёўғҳқ0-9\s'-]/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the best matching knowledge entry for a user's question.
 * Simple keyword-overlap scoring; returns null if no keyword matches.
 */
export function matchKnowledge(userText: string): KnowledgeEntry | null {
  const normalized = normalize(userText);
  if (!normalized) return null;

  let best: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of knowledge) {
    let score = 0;
    for (const kw of entry.keywords) {
      const nk = normalize(kw);
      if (!nk) continue;
      if (normalized.includes(nk)) {
        // Longer keywords are more specific — weight them higher
        score += nk.length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  return best?.entry ?? null;
}

export function findById(id: string): KnowledgeEntry | null {
  return knowledge.find((e) => e.id === id) ?? null;
}
