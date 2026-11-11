import type { LocalizedList, LocalizedString } from "./types";
import type { resortImages } from "./images";

/** Ключ фото из реестра: опечатку в имени поймает проверка типов, а не гость. */
export type ResortImageKey = keyof typeof resortImages;

/**
 * Партнёрский раздел (B2B) — /<locale>/partners.
 *
 * Владелец, 11.11.2026: «партнёрские офферы, сегмент B2B, никак не пересекается
 * с B2C, но на сайте тоже должен иметь доступ» и «чтобы загружать только по
 * линку». Поэтому страница открывается только по прямой ссылке: её нет в меню,
 * подвале, карте сайта и поиске (noindex + X-Robots-Tag), и ИИ-консьерж гостям
 * о ней не рассказывает.
 *
 * Весь текст страницы — здесь, данными, а не в разметке: владелец правит его
 * сам (в том числе своей ИИ) и не трогает код. Правила для правки:
 *   • у каждой строки три языка — ru, uz, en; пустую строку тест не пропустит;
 *   • фото — только ключи из images.ts (реальная съёмка, рендеров нет);
 *   • цифры — только подтверждённые владельцем, с источником и датой;
 *   • строящееся — с пометкой «по готовности», без сроков.
 *
 * План целиком — docs/PARTNERS-PLAN.md.
 */

export type PartnerProgram = {
  id: string;
  title: LocalizedString;
  /** Кому из компаний подходит — для того, кто листает. */
  who: LocalizedString;
  /** Что получает гость: партнёрство продаётся через пользу гостю. */
  guest: LocalizedString;
  /** Права партнёра на территории. */
  rights: LocalizedList;
  /** Чем партнёр меряет результат — он выбирает сам. */
  measure: LocalizedString;
};

export type PartnerFact = { value: string; label: LocalizedString };

export const partnersPage = {
  seo: {
    title: {
      ru: "Партнёрство с Chimgan Darbaza Resort",
      uz: "Chimgan Darbaza Resort bilan hamkorlik",
      en: "Partnership with Chimgan Darbaza Resort",
    },
    description: {
      ru: "Горный курорт в 45 минутах от Ташкента: поток гостей круглый год и форматы партнёрства для брендов.",
      uz: "Toshkentdan 45 daqiqalik tog' kurorti: yil bo'yi mehmonlar oqimi va brendlar uchun hamkorlik formatlari.",
      en: "A mountain resort 45 minutes from Tashkent: guests all year round and partnership formats for brands.",
    },
  },

  hero: {
    image: "tubingDuskTrack" as ResortImageKey,
    eyebrow: { ru: "Для партнёров", uz: "Hamkorlar uchun", en: "For partners" },
    title: {
      ru: "Chimgan Darbaza Resort — площадка для вашего бренда в горах",
      uz: "Chimgan Darbaza Resort — tog'larda brendingiz uchun maydon",
      en: "Chimgan Darbaza Resort — a stage for your brand in the mountains",
    },
    lead: {
      ru: "Семейный горный отдых на несколько часов или с ночёвкой — в 45 минутах от Ташкента. Тысячи гостей в день проходят один и тот же маршрут: дорога, въезд, катание, обед. На каждом шаге есть место для партнёра.",
      uz: "Toshkentdan 45 daqiqada — oila bilan tog'da bir necha soat yoki tunab dam olish. Kuniga minglab mehmonlar bir xil marshrutni bosib o'tadi: yo'l, kirish, uchish, tushlik. Har bir qadamda hamkor uchun joy bor.",
      en: "Family mountain leisure for a few hours or overnight — 45 minutes from Tashkent. Thousands of guests a day follow the same route: the drive, the entrance, the ride, lunch. Every step has room for a partner.",
    },
    cta: { ru: "Партнёрские программы", uz: "Hamkorlik dasturlari", en: "Partnership programmes" },
    ctaSecondary: { ru: "Обсудить партнёрство", uz: "Hamkorlikni muhokama qilish", en: "Discuss a partnership" },
  },

  /**
   * Цифры — со слов владельца, голосовые 11.11.2026. Выручку и себестоимость
   * сюда не выносим: это не для чужих глаз, даже по закрытой ссылке.
   */
  facts: {
    note: {
      ru: "По данным курорта, ноябрь 2026",
      uz: "Kurort ma'lumotlari, 2026-yil noyabr",
      en: "Resort data, November 2026",
    },
    items: [
      { value: "3 000", label: { ru: "посещений тюбинг-зоны в пиковый день", uz: "eng gavjum kunda tubing zonasiga tashrif", en: "tubing-zone visits on a peak day" } },
      { value: "2 000", label: { ru: "посещений в день в среднем за месяц", uz: "oy davomida kuniga o'rtacha tashrif", en: "visits a day, monthly average" } },
      { value: "45", label: { ru: "минут от Ташкента, высота 1 700 м", uz: "daqiqa — Toshkentgacha, balandlik 1 700 m", en: "minutes from Tashkent, at 1,700 m" } },
      { value: "9", label: { ru: "гектаров: 20 домиков, тюбинг, ресторан", uz: "gektar: 20 ta uycha, tubing, restoran", en: "hectares: 20 cabins, tubing, a restaurant" } },
    ] satisfies PartnerFact[],
  },

  location: {
    image: "chimganMountains" as ResortImageKey,
    title: { ru: "Локация", uz: "Joylashuv", en: "Location" },
    text: {
      ru: "Курорт стоит на дороге к Чимгану, Амирсою и Бельдерсаю — главному горному направлению выходного дня из Ташкента. Для гостя это и самостоятельная цель поездки, и удобная остановка по пути: поесть, прокатиться, переночевать.",
      uz: "Kurort Chimyon, Amirsoy va Beldersoyga boradigan yo'lda — Toshkentdan dam olish kunlarining asosiy tog' yo'nalishida joylashgan. Mehmon uchun bu ham alohida sayohat maqsadi, ham yo'l ustidagi qulay to'xtash joyi: ovqatlanish, uchish, tunash.",
      en: "The resort sits on the road to Chimgan, Amirsoy and Beldersay — the main weekend mountain route out of Tashkent. For guests it is both a destination in itself and a convenient stop on the way: a meal, a ride, a night's stay.",
    },
  },

  territory: {
    title: { ru: "Территория", uz: "Hudud", en: "The grounds" },
    lead: {
      ru: "Показываем только то, что работает сейчас, — на реальных фотографиях.",
      uz: "Faqat hozir ishlayotgan narsalarni — haqiqiy suratlarda ko'rsatamiz.",
      en: "We only show what is operating today — in real photographs.",
    },
    items: [
      {
        image: "tubingDuskFamily" as ResortImageKey,
        title: { ru: "Тюбинг-горка", uz: "Tubing tepaligi", en: "Tubing hill" },
        text: {
          ru: "Всесезонная трасса 160 м с автоматическим подъёмом и вечерней подсветкой. Работает круглый год, не только по снегу.",
          uz: "Avtomatik ko'targichli, kechqurun yoritiladigan 160 metrlik trassa. Faqat qorda emas, yil bo'yi ishlaydi.",
          en: "An all-season 160 m track with a powered lift and evening lighting. Open all year, not only in snow.",
        },
      },
      {
        image: "galWaiterPlov" as ResortImageKey,
        title: { ru: "Ресторан «Сазанчик»", uz: "«Sazanchik» restorani", en: "Sazanchik restaurant" },
        text: {
          ru: "Узбекская и европейская кухня, рыба и шашлык на мангале. Сюда приходит большая часть гостей дня.",
          uz: "O'zbek va Yevropa taomlari, baliq va mangalda kabob. Kunlik mehmonlarning katta qismi shu yerga keladi.",
          en: "Uzbek and European cuisine, fish and grilled kebabs. Most day visitors end up here.",
        },
      },
      {
        image: "chaletRowMountains" as ResortImageKey,
        title: { ru: "Шале и A-frame", uz: "Shale va A-frame", en: "Chalets and A-frames" },
        text: {
          ru: "20 отдельных домиков: 10 шале и 10 глэмпингов A-frame. Гости с ночёвкой остаются на территории дольше всех.",
          uz: "20 ta alohida uycha: 10 ta shale va 10 ta A-frame glemping. Tunab qolgan mehmonlar hududda eng uzoq qoladi.",
          en: "20 standalone cabins: 10 chalets and 10 A-frame glamping cabins. Overnight guests stay on the grounds longest.",
        },
      },
    ],
    planned: {
      title: { ru: "По готовности", uz: "Tayyor bo'lganda", en: "When ready" },
      text: {
        ru: "Трасса 250 м, саночная зона, прокат и торговые корнеры. Показываем как план развития — без сроков, пока объекты не готовы.",
        uz: "250 metrlik trassa, chana zonasi, jihozlar ijarasi va savdo nuqtalari. Obyektlar tayyor bo'lmaguncha — muddatsiz, rivojlanish rejasi sifatida ko'rsatamiz.",
        en: "A 250 m track, a sledging zone, rentals and retail corners. Shown as a development plan — with no dates until they are ready.",
      },
    },
  },

  seasons: {
    title: { ru: "Сезоны", uz: "Fasllar", en: "Seasons" },
    items: [
      { title: { ru: "Зима", uz: "Qish", en: "Winter" }, text: { ru: "Пик посещаемости: снег, тюбинг, новогодние выходные.", uz: "Tashriflar cho'qqisi: qor, tubing, Yangi yil bayrami kunlari.", en: "Peak season: snow, tubing, the New Year holidays." } },
      { title: { ru: "Весна", uz: "Bahor", en: "Spring" }, text: { ru: "Зелёные склоны, семейные поездки на выходные и праздники.", uz: "Yashil yonbag'irlar, dam olish va bayram kunlaridagi oilaviy sayohatlar.", en: "Green slopes, family trips at weekends and holidays." } },
      { title: { ru: "Лето", uz: "Yoz", en: "Summer" }, text: { ru: "Прохлада гор вместо городской жары, бассейн, отдых с ночёвкой.", uz: "Shahar issig'i o'rniga tog' salqini, basseyn, tunab dam olish.", en: "Cool mountain air instead of city heat, the pool, overnight stays." } },
      { title: { ru: "Осень", uz: "Kuz", en: "Autumn" }, text: { ru: "Краски гор, тюбинг круглый год, ресторан и домики.", uz: "Tog' ranglari, yil bo'yi tubing, restoran va uychalar.", en: "Mountain colours, year-round tubing, the restaurant and cabins." } },
    ],
  },

  journey: {
    title: { ru: "Путь гостя", uz: "Mehmon yo'li", en: "The guest journey" },
    lead: {
      ru: "Один маршрут — пять точек контакта. На каждой видно, какой партнёр здесь полезен гостю.",
      uz: "Bitta yo'l — beshta aloqa nuqtasi. Har birida qaysi hamkor mehmonga foydali ekani ko'rinadi.",
      en: "One route, five touchpoints. Each shows which partner is useful to the guest there.",
    },
    steps: [
      { title: { ru: "Дорога", uz: "Yo'l", en: "The drive" }, partner: { ru: "Транспорт, такси, навигация", uz: "Transport, taksi, navigatsiya", en: "Transport, taxis, navigation" } },
      { title: { ru: "Въезд", uz: "Kirish", en: "Arrival" }, partner: { ru: "Парковка, связь, Wi-Fi", uz: "Avtoturargoh, aloqa, Wi-Fi", en: "Parking, mobile network, Wi-Fi" } },
      { title: { ru: "Катание", uz: "Uchish", en: "The ride" }, partner: { ru: "Бренд зоны, фотозона, оплата билетов", uz: "Zona brendi, fotozona, chipta to'lovi", en: "Zone branding, photo spot, ticket payment" } },
      { title: { ru: "Обед", uz: "Tushlik", en: "Lunch" }, partner: { ru: "Оплата, напитки, корнеры", uz: "To'lov, ichimliklar, savdo nuqtalari", en: "Payment, drinks, corners" } },
      { title: { ru: "Повторный визит", uz: "Qayta tashrif", en: "The return visit" }, partner: { ru: "Кешбэк, промокоды, программы лояльности", uz: "Keshbek, promokodlar, sodiqlik dasturlari", en: "Cashback, promo codes, loyalty programmes" } },
    ],
  },

  programs: {
    title: { ru: "Партнёрские программы", uz: "Hamkorlik dasturlari", en: "Partnership programmes" },
    lead: {
      ru: "Условия и цены — в персональном предложении для вашей компании.",
      uz: "Shartlar va narxlar — kompaniyangiz uchun shaxsiy taklifda.",
      en: "Terms and prices are in a personal proposal for your company.",
    },
    rightsLabel: { ru: "Права партнёра", uz: "Hamkor huquqlari", en: "Partner rights" },
    guestLabel: { ru: "Польза гостю", uz: "Mehmonga foyda", en: "For the guest" },
    measureLabel: { ru: "Результат", uz: "Natija", en: "Result" },
    items: [
      {
        id: "payments",
        title: { ru: "Покупки и оплата", uz: "Xaridlar va to'lov", en: "Purchases and payments" },
        who: { ru: "Банки, платёжные системы, маркетплейсы", uz: "Banklar, to'lov tizimlari, marketpleyslar", en: "Banks, payment systems, marketplaces" },
        guest: { ru: "Быстрая оплата билетов, еды и проживания; кешбэк и бонусы за поездку.", uz: "Chipta, ovqat va yashash uchun tez to'lov; sayohat uchun keshbek va bonuslar.", en: "Fast payment for tickets, food and stays; cashback and rewards for the trip." },
        rights: {
          ru: ["Брендированные кассы и точки оплаты", "Приоритетный способ оплаты на территории", "Акции для держателей карт"],
          uz: ["Brendlangan kassalar va to'lov nuqtalari", "Hududdagi ustuvor to'lov usuli", "Karta egalari uchun aksiyalar"],
          en: ["Branded tills and payment points", "Preferred payment method on site", "Offers for cardholders"],
        },
        measure: { ru: "Подтверждённые чеки", uz: "Tasdiqlangan cheklar", en: "Confirmed receipts" },
      },
      {
        id: "transport",
        title: { ru: "Поездки", uz: "Safarlar", en: "Trips" },
        who: { ru: "Такси, каршеринг, автобусы, навигация", uz: "Taksi, karshering, avtobuslar, navigatsiya", en: "Taxis, car sharing, buses, navigation" },
        guest: { ru: "Удобная дорога в горы и обратно без своей машины.", uz: "Shaxsiy mashinasiz ham tog'ga qulay borib-kelish.", en: "An easy trip to the mountains and back without a car of your own." },
        rights: {
          ru: ["Точка посадки и указатели у въезда", "Промокод «поездка в Чимган»", "Упоминание в маршруте на сайте"],
          uz: ["Kirish yonida taksiga chiqish joyi va yo'nalish ko'rsatkichlari", "«Chimyonga safar» promokodi", "Saytdagi yo'nalish sahifasida tilga olinish"],
          en: ["Pick-up point and signs at the entrance", "A “trip to Chimgan” promo code", "A mention in the route on the website"],
        },
        measure: { ru: "Завершённые поездки", uz: "Yakunlangan safarlar", en: "Completed trips" },
      },
      {
        id: "telecom",
        title: { ru: "Мобильная связь", uz: "Mobil aloqa", en: "Mobile network" },
        who: { ru: "Операторы связи и интернет-провайдеры", uz: "Aloqa operatorlari va internet-provayderlar", en: "Mobile operators and internet providers" },
        guest: { ru: "Стабильная связь и Wi-Fi в горах — чтобы делиться фото сразу.", uz: "Tog'larda barqaror aloqa va Wi-Fi — suratlarni darhol ulashish uchun.", en: "Reliable signal and Wi-Fi in the mountains — to share photos right away." },
        rights: {
          ru: ["Брендированный Wi-Fi на территории", "Акция на пакет для гостей", "Размещение у зон отдыха"],
          uz: ["Hududda brendlangan Wi-Fi", "Mehmonlar uchun paket aksiyasi", "Dam olish zonalari yonida joylashtirish"],
          en: ["Branded Wi-Fi on the grounds", "A bundle offer for guests", "Placement by the rest areas"],
        },
        measure: { ru: "Подключения и активации", uz: "Ulanishlar va faollashtirishlar", en: "Connections and activations" },
      },
      {
        id: "zones",
        title: { ru: "Зоны и события", uz: "Zonalar va tadbirlar", en: "Zones and events" },
        who: { ru: "Бренды напитков, еды, одежды, техники", uz: "Ichimlik, oziq-ovqat, kiyim, texnika brendlari", en: "Drinks, food, apparel and electronics brands" },
        guest: { ru: "Фотозоны, подарки, праздники — повод приехать ещё раз.", uz: "Fotozonalar, sovg'alar, bayramlar — yana kelish uchun sabab.", en: "Photo spots, gifts, celebrations — a reason to come back." },
        rights: {
          ru: ["Название зоны или трассы", "Фотозона, корнер, сэмплинг", "Спонсорство Нового года и сезонных событий"],
          uz: ["Zona yoki trassaga nom berish", "Fotozona, savdo nuqtasi, sempling", "Yangi yil va mavsumiy tadbirlar homiyligi"],
          en: ["Naming of a zone or the track", "Photo spot, corner, sampling", "Sponsorship of New Year and seasonal events"],
        },
        measure: { ru: "Охват, продажи в корнере, упоминания", uz: "Qamrov, savdo nuqtasidagi sotuv, tilga olinishlar", en: "Reach, corner sales, mentions" },
      },
    ] satisfies PartnerProgram[],
  },

  start: {
    title: { ru: "Как начать", uz: "Qanday boshlash kerak", en: "How to start" },
    steps: {
      ru: ["Выберите программу или опишите свою идею", "Получите персональное предложение с условиями и ценой", "Приезжайте на осмотр территории", "Договор и запуск"],
      uz: ["Dasturni tanlang yoki o'z g'oyangizni yozing", "Shartlar va narx bilan shaxsiy taklif oling", "Hududni ko'rish uchun keling", "Shartnoma va ishga tushirish"],
      en: ["Choose a programme or describe your own idea", "Receive a personal proposal with terms and price", "Visit the grounds", "Contract and launch"],
    },
    note: {
      ru: "Chimgan Darbaza Resort предоставляет площадку и согласованные права. Производство, монтаж и обслуживание партнёр организует и оплачивает сам.",
      uz: "Chimgan Darbaza Resort maydon va kelishilgan huquqlarni beradi. Ishlab chiqarish, o'rnatish va xizmat ko'rsatishni hamkor o'zi tashkil qiladi va to'laydi.",
      en: "Chimgan Darbaza Resort provides the venue and the agreed rights. The partner organises and pays for production, installation and upkeep.",
    },
  },

  /** Подписи персональной страницы /partners/o/<ключ>; содержимое — из админки. */
  offer: {
    eyebrow: { ru: "Персональное предложение", uz: "Shaxsiy taklif", en: "Personal proposal" },
    for: { ru: "для", uz: "uchun", en: "for" },
    programs: { ru: "Программы в предложении", uz: "Taklifdagi dasturlar", en: "Programmes in this proposal" },
    packages: { ru: "Пакеты", uz: "Paketlar", en: "Packages" },
    noVat: { ru: "сум без НДС", uz: "so'm, QQSsiz", en: "UZS excl. VAT" },
    onRequest: { ru: "Цена по запросу", uz: "Narx so'rov bo'yicha", en: "Price on request" },
    /** {date} — дата: по-узбекски она в середине фразы и с -gacha. */
    validUntil: { ru: "Предложение действует до {date}", uz: "Taklif {date}gacha amal qiladi", en: "Valid until {date}" },
    expired: {
      ru: "Срок этого предложения истёк. Свяжитесь с нами — обновим условия.",
      uz: "Ushbu taklif muddati tugagan. Biz bilan bog'laning — shartlarni yangilaymiz.",
      en: "This proposal has expired. Get in touch and we will update the terms.",
    },
    request: { ru: "Запросить договор", uz: "Shartnoma so'rash", en: "Request a contract" },
    requesting: { ru: "Отправляем…", uz: "Yuborilmoqda…", en: "Sending…" },
    requested: {
      ru: "Запрос отправлен — менеджер свяжется с вами.",
      uz: "So'rov yuborildi — menejer siz bilan bog'lanadi.",
      en: "Request sent — our manager will be in touch.",
    },
    about: { ru: "О курорте и всех программах", uz: "Kurort va barcha dasturlar haqida", en: "About the resort and all programmes" },
    contact: { ru: "Вопросы по предложению", uz: "Taklif bo'yicha savollar", en: "Questions about the proposal" },
  },

  form: {
    title: { ru: "Обсудить партнёрство", uz: "Hamkorlikni muhokama qilish", en: "Discuss a partnership" },
    lead: {
      ru: "Оставьте контакты — пришлём персональное предложение.",
      uz: "Kontaktlaringizni qoldiring — shaxsiy taklif yuboramiz.",
      en: "Leave your details and we will send a personal proposal.",
    },
    org: { ru: "Компания", uz: "Kompaniya", en: "Company" },
    name: { ru: "Ваше имя", uz: "Ismingiz", en: "Your name" },
    phone: { ru: "Телефон", uz: "Telefon", en: "Phone" },
    email: { ru: "Рабочая почта", uz: "Ish pochtasi", en: "Work email" },
    program: { ru: "Интересует", uz: "Qiziqtirgan dastur", en: "Interested in" },
    other: { ru: "Своя идея", uz: "O'z g'oyam", en: "Own idea" },
    message: { ru: "Коротко о задаче", uz: "Vazifa haqida qisqacha", en: "A few words about your goal" },
    privacy: {
      ru: "Согласен на обработку персональных данных",
      uz: "Shaxsiy ma'lumotlarimni qayta ishlashga roziman",
      en: "I agree to the processing of my personal data",
    },
    send: { ru: "Отправить", uz: "Yuborish", en: "Send" },
    sending: { ru: "Отправляем…", uz: "Yuborilmoqda…", en: "Sending…" },
    success: {
      ru: "Спасибо! Мы свяжемся с вами и пришлём предложение.",
      uz: "Rahmat! Siz bilan bog'lanamiz va taklif yuboramiz.",
      en: "Thank you! We will be in touch with a proposal.",
    },
  },
};
