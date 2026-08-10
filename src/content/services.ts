import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type Service = {
  slug: string;
  category: "relax" | "food" | "activity";
  image: keyof typeof resortImages;
  /**
   * The frame beside the description, further down the page.
   *
   * Separate from image because the page renders both: the hero at the top
   * and a sticky portrait frame beside the text. They were the same photograph,
   * so every service page showed one picture twice on one scroll.
   */
  secondImage: keyof typeof resortImages;
  title: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  highlights: LocalizedList;
  bestFor: LocalizedString;
  ctaLabel?: LocalizedString;
  /**
   * Куда ведёт карточка, если у услуги уже есть своя страница.
   *
   * Бассейн и тюбинг продаются со своих страниц с формой заявки. Без этого поля
   * карточка вела бы на /services/<slug>, где пришлось бы держать второе
   * описание того же самого — и разошлось бы оно при первой правке.
   */
  href?: string;
};

/**
 * Order matters: this array drives both the /services page and the leisure grid
 * on the homepage, so the first card is what a visitor reads as "the main thing
 * here". It used to open on the topchan.
 *
 * The `tapchan-zone` entry is gone entirely — day visits are closed, so a
 * bookable topchan is no longer a service. Anything referencing that slug had
 * to go with it (rooms.ts relatedServices, the footer nav group), or it would
 * link to a page that no longer generates.
 */
export const services: Service[] = [
  {
    slug: "restaurant",
    category: "food",
    // Was galFoodServing — a hand carrying a plate of shashlik on bare ground —
    // and then chaletDining, the chalet's own dining room, which at card size
    // reads as a living room with a television rather than a kitchen. This is
    // the only stock image on the site; see the note on the key in images.ts
    // for why it is a plate of food and not a photograph of a dining room.
    image: "plovLyagan",
    secondImage: "chaletDining",
    title: { ru: "Кухня и меню", uz: "Oshxona va menyu", en: "Kitchen & menu" },
    shortDescription: {
      ru: "Готовое меню от кухни — завтрак, ужин и мангальные блюда на террасу.",
      uz: "Oshxonadan tayyor menyu — nonushta, kechki ovqat va mangal taomlari terrasaga.",
      en: "A ready-made kitchen menu — breakfast, dinner, and BBQ dishes to your terrace.",
    },
    description: {
      ru: "Кухня работает на территории: мангальные блюда, плов, узбекская классика и сезонные позиции по предзаказу. Подача на террасу домика или в зал — администратор примет заказ. Если хочется готовить самим, в шале есть полная кухня, а мангал и казан берутся в аренду.",
      uz: "Oshxona hududda ishlaydi: mangal taomlari, palov, o'zbek klassikasi va oldindan buyurtma asosida mavsumiy taomlar. Uycha terrasasiga yoki zalga xizmat — administrator buyurtmani qabul qiladi. O'zingiz pishirmoqchi bo'lsangiz, shalede to'liq oshxona bor, mangal va qozon ijaraga olinadi.",
      en: "The kitchen works on site: BBQ dishes, plov, Uzbek classics, and seasonal items by pre-order. Served to your cabin terrace or in the dining room. Prefer to cook? The chalet has a full kitchen, and a BBQ grill or kazan can be rented.",
    },
    highlights: {
      ru: ["Готовое меню", "Подача на террасу", "Предзаказ позиций", "Узбекская кухня"],
      uz: ["Tayyor menyu", "Terrasaga xizmat", "Oldindan buyurtma", "O'zbek oshxonasi"],
      en: ["Ready-made menu", "Served to your terrace", "Pre-order available", "Uzbek cuisine"],
    },
    bestFor: { ru: "Ужин без готовки", uz: "Pishirmasdan kechki ovqat", en: "Dinner without cooking" },
  },
  {
    slug: "experience",
    category: "activity",
    // Was galMountainView, which has a grey topchan tent on unlandscaped earth
    // filling the left third — the retired product, on a building site, selling
    // mountain walks. Then aframeTerraceView, which the editorial block higher
    // up the homepage also uses for the very same pitch ("горы начинаются за
    // террасой") — the same photo twice for the same idea. This is the walking
    // route itself, which is what the card is actually selling.
    image: "mountainWalks",
    secondImage: "chimganMountains",
    title: { ru: "Горные прогулки рядом", uz: "Atrofdagi tog' sayrlari", en: "Mountain walks nearby" },
    shortDescription: {
      ru: "Лёгкие пешие маршруты, конные прогулки и канатные дороги в районе Чимгана.",
      uz: "Yengil piyoda marshrutlar, ot minish va Chimgon hududidagi kanat yo'llari.",
      en: "Easy walking routes, horse rides, and cable cars in the Chimgan area.",
    },
    description: {
      ru: "Маршруты начинаются рядом с территорией: можно выйти после завтрака, добраться до канатной дороги или попробовать конную прогулку и вернуться к обеду. Администратор подскажет сезонные варианты и поможет с трансфером.",
      uz: "Marshrutlar hudud yaqinidan boshlanadi: nonushtadan keyin chiqib, kanat yo'liga borish yoki ot minib ko'rish va tushlikka qaytish mumkin. Administrator mavsumiy variantlarni aytadi va transferda yordam beradi.",
      en: "The trails start next to the grounds: head out after breakfast, ride the cable car or try a horse trek, and be back by lunch. The team can suggest seasonal options and help with the transfer.",
    },
    highlights: {
      ru: ["Пешие маршруты", "Конные прогулки", "Канатные дороги Чимгана", "Сезонные варианты"],
      uz: ["Piyoda marshrutlar", "Ot minish", "Chimgon kanat yo'llari", "Mavsumiy variantlar"],
      en: ["Hiking routes", "Horse riding", "Chimgan cable cars", "Seasonal options"],
    },
    bestFor: { ru: "Активная половина дня", uz: "Kunning faol yarmi", en: "An active half-day" },
  },
  {
    slug: "picnic-zone",
    category: "relax",
    // The grounds card should show the grounds. poolPanorama did that best —
    // pool, swim-up bar, bungalows, chalets and ridge in one shot — but it is
    // also the hero, so on the homepage this card was repeating the first
    // screen. This frame is the grounds at eye level instead: the topchans, the
    // stone paths between them, the pines, and Chimgan behind — which is nearer
    // to what the card promises ("дорожки, открытые площадки, детская зона")
    // than an aerial of the pool was.
    // Its earlier predecessors each showed a fragment or the wrong thing —
    // galGreenHills (an empty hillside with nothing of the resort in it), then
    // aframeLawnWide, which carries a tower crane in the sky.
    image: "galTerritoryPanorama",
    secondImage: "galTopchanSwing",
    title: { ru: "Пикник-зона и территория", uz: "Piknik zonasi va hudud", en: "Picnic area & grounds" },
    shortDescription: {
      ru: "Пикник-зона у тюбинг-горки и девять гектаров среди сосен: дорожки, открытые площадки и детская зона.",
      uz: "Tubing gorkasi yonidagi piknik zonasi va qarag'aylar orasida to'qqiz gektar: yo'lakchalar, ochiq maydonlar va bolalar zonasi.",
      en: "The picnic area by the tubing hill, and nine hectares among the pines: walking paths, open lawns and a kids area.",
    },
    description: {
      ru: "Пикник-зона находится у тюбинг-горки — это одно и то же место. Территория открыта для гостей на всё время проживания: прогулочные дорожки между домиками, открытые площадки с панорамой на Чимган, детская площадка и места для встреч на воздухе. Парковка — рядом с домиком, зона мангала — в нескольких шагах.",
      uz: "Piknik zonasi tubing gorkasi yonida — bu bir joy. Hudud yashash davomida mehmonlar uchun ochiq: uychalar orasidagi sayr yo'lakchalari, Chimgon panoramasi bilan ochiq maydonlar, bolalar maydonchasi va ochiq havoda uchrashuv joylari. Parking — uycha yonida, mangal zonasi — bir necha qadamda.",
      en: "The picnic area is by the tubing hill — they are the same place. The grounds are open to guests for the whole stay: walking paths between the cabins, open lawns with a view of the Chimgan range, a kids playground, and spots to gather outdoors. Parking sits by your cabin, the BBQ area a few steps away.",
    },
    highlights: {
      ru: ["Пикник-зона у горки", "9 гектаров территории", "Сосны и панорама гор", "Детская площадка", "Парковка у домика"],
      uz: ["Gorka yonida piknik zonasi", "9 gektar hudud", "Qarag'aylar va tog' panoramasi", "Bolalar maydonchasi", "Uycha yonida parking"],
      en: ["Picnic area by the hill", "Nine hectares of grounds", "Pines and mountain views", "Kids playground", "Parking by your cabin"],
    },
    bestFor: { ru: "Спокойный день на территории", uz: "Hududda sokin kun", en: "A slow day on the grounds" },
  },
  {
    slug: "outdoor-cooking",
    category: "food",
    image: "galMangalFire",
    secondImage: "galKazanStone",
    title: { ru: "Мангал и казан", uz: "Mangal va qozon", en: "BBQ grill & kazan" },
    shortDescription: {
      ru: "Аренда мангала, казана и место под костёр — готовите сами своё.",
      uz: "Mangal, qozon ijarasi va gulxan joyi — o'zingiz pishirasiz.",
      en: "BBQ grill, kazan, and a fire spot — cook your own food, your way.",
    },
    description: {
      ru: "Арендуете мангал или казан, готовите шашлык или плов на свежем воздухе — рядом с домиком или в зоне пикника. Дрова (1 пучок) и уголь (1 кг) докупаются на месте. Можно привозить свои продукты или заказать что-то готовое в кухне.",
      uz: "Mangal yoki qozonni ijaraga olasiz, uycha yonida yoki piknik zonasida ochiq havoda shashlik yoki palov pishirasiz. O'tin (1 dasta) va ko'mir (1 kg) joyida sotib olinadi. O'z mahsulotlaringizni olib kelsangiz yoki oshxonadan tayyor narsa buyurtma qilsangiz bo'ladi.",
      en: "Rent a BBQ grill or kazan and cook shashlik or plov in the open air — by your cabin or in the picnic zone. Firewood (per bundle) and charcoal (per kg) are sold on site. Bring your own ingredients, or order ready-made dishes from our kitchen.",
    },
    highlights: {
      ru: ["Мангал в аренду", "Казан в аренду", "Дрова и уголь на месте", "Свои продукты приветствуются"],
      uz: ["Mangal ijarasi", "Qozon ijarasi", "O'tin va ko'mir joyida", "O'z mahsulotlaringiz bilan keling"],
      en: ["BBQ grill rental", "Kazan rental", "Firewood and charcoal sold on site", "Bring your own food welcome"],
    },
    bestFor: { ru: "Шашлык на природе", uz: "Tabiatda shashlik", en: "Open-air BBQ" },
  },
  {
    slug: "pool",
    category: "relax",
    /**
     * Ведёт на собственную страницу бассейна, а не на /services/pool.
     * Там тариф по возрастам и дням, форма заявки и фотоархив — второе
     * описание того же самого разошлось бы с первым при первой же правке.
     */
    href: "/nomera/pool",
    image: "poolPanorama",
    secondImage: "poolCabanasValley",
    title: { ru: "Панорамный бассейн", uz: "Panoramali basseyn", en: "Panoramic pool" },
    shortDescription: {
      ru: "Открытый бассейн с видом на горы — бронируется отдельно, без ночёвки.",
      uz: "Tog' manzarali ochiq basseyn — alohida, tunamasdan bron qilinadi.",
      en: "An outdoor pool with mountain views — bookable separately, no overnight stay needed.",
    },
    description: {
      ru: "Бассейн 680 м² с детской зоной, пул-баром и бунгало вдоль воды: 8 Standard до 4 гостей и 4 Family до 10. Проживающим вход включён в стоимость; приехать только на бассейн, без ночёвки, тоже можно — тариф зависит от возраста и дня недели.",
      uz: "680 m² basseyn, bolalar zonasi, pul-bar va suv bo'yidagi bungalolar: 4 kishilik 8 ta Standard va 10 kishilik 4 ta Family. Yashovchilar uchun kirish narxga kiritilgan; tunamasdan faqat basseynga kelish ham mumkin — tarif yosh va hafta kuniga bog'liq.",
      en: "A 680 m² pool with a children's area, a pool bar and bungalows along the water: 8 Standard ones for up to 4 guests and 4 Family ones for up to 10. Included for staying guests; you can also come just for the pool, at a rate that depends on age and day of week.",
    },
    highlights: {
      ru: ["680 м² и детский бассейн", "Пул-бар у воды", "8 бунгало Standard и 4 Family", "Включён в проживание"],
      uz: ["680 m² va bolalar basseyni", "Suv bo'yida pul-bar", "8 ta Standard va 4 ta Family bungalo", "Yashash narxiga kiritilgan"],
      en: ["680 m² plus a children's pool", "Pool bar by the water", "8 Standard and 4 Family bungalows", "Included with a stay"],
    },
    bestFor: { ru: "Жаркий день в горах", uz: "Tog'dagi issiq kun", en: "A hot day in the mountains" },
  },
  {
    slug: "tubing",
    category: "activity",
    /** Своя страница с пакетами спусков, правилами и видео трассы. */
    href: "/tubing",
    /** Съёмка горки от 10.08.2026 — до неё карточка показывала Чимган. */
    image: "tubingTwoLanes",
    secondImage: "tubingTubeStart",
    title: { ru: "Тюбинг-горка", uz: "Tubing gorkasi", en: "Tubing hill" },
    shortDescription: {
      ru: "Всесезонная трасса 160 метров с автоматическим подъёмом — работает круглый год, не только по снегу.",
      uz: "Avtomatik ko'targichli 160 metrlik butun mavsumga mo'ljallangan trassa — faqat qorda emas, yil davomida ishlaydi.",
      en: "A 160-metre all-season track with a powered lift — open year-round, not just on snow.",
    },
    description: {
      ru: "Трасса 160 метров длиной и 6 метров шириной, всесезонная. Подъём автоматический — пешком в горку идти не нужно. Одновременно спускаются до 5 человек, внизу безопасная зона остановки. Берётся пакетами спусков, цена одинаковая всю неделю.",
      uz: "Uzunligi 160 metr, kengligi 6 metr, butun mavsumga mo'ljallangan trassa. Ko'tarilish avtomatik — tepalikka piyoda chiqish shart emas. Bir vaqtda 5 kishigacha tushadi, pastda xavfsiz to'xtash zonasi. Uchish paketlari bilan olinadi, narx butun hafta bir xil.",
      en: "A 160-metre track, 6 metres wide, running all year. The lift is powered, so nobody walks up. Up to 5 people descend at once, with a controlled stop at the bottom. Sold in ride packages at one price all week.",
    },
    highlights: {
      ru: ["Работает круглый год", "160 м трассы, автоматический подъём", "Пакеты 2 или 4 спуска", "Одна цена всю неделю"],
      uz: ["Yil davomida ishlaydi", "160 m trassa, avtomatik ko'targich", "2 yoki 4 marta uchish paketlari", "Butun hafta bir xil narx"],
      en: ["Open all year", "160 m track with a powered lift", "Packages of 2 or 4 rides", "One price all week"],
    },
    bestFor: { ru: "Компании и дети от 7 лет", uz: "Do'stlar va 7 yoshdan bolalar", en: "Groups and children from 7" },
  },
];

export const serviceCategories = [
  { id: "all", label: { ru: "Все", uz: "Barchasi", en: "All" } },
  { id: "relax", label: { ru: "Отдых", uz: "Dam olish", en: "Relax" } },
  { id: "food", label: { ru: "Еда", uz: "Taom", en: "Food" } },
  { id: "activity", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
] as const;
