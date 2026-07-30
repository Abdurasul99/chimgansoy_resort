import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type Service = {
  slug: string;
  category: "relax" | "food" | "activity";
  image: keyof typeof resortImages;
  title: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  highlights: LocalizedList;
  bestFor: LocalizedString;
  ctaLabel?: LocalizedString;
};

/**
 * Order matters: this array drives both the /services page and the leisure grid
 * on the homepage, so the first card is what a visitor reads as "the main thing
 * here". It used to open on the topchan; the site sells nights now, so the
 * services that support a stay — kitchen, trails, cooking — come first and the
 * topchan sits last as the day-visit product it is.
 */
export const services: Service[] = [
  {
    slug: "restaurant",
    category: "food",
    image: "galFoodServing",
    title: { ru: "Кухня и меню", uz: "Oshxona va menyu", en: "Kitchen & menu" },
    shortDescription: {
      ru: "Готовое меню от кухни — завтрак, ужин и мангальные блюда на террасу.",
      uz: "Oshxonadan tayyor menyu — nonushta, kechki ovqat va mangal taomlari terrasaga.",
      en: "A ready-made kitchen menu — breakfast, dinner, and BBQ dishes to your terrace.",
    },
    description: {
      ru: "Кухня работает на территории: мангальные блюда, плов, узбекская классика и сезонные позиции по предзаказу. Подача на террасу домика, к топчану или в зал — администратор примет заказ. Если хочется готовить самим, в шале есть полная кухня, а мангал и казан берутся в аренду.",
      uz: "Oshxona hududda ishlaydi: mangal taomlari, palov, o'zbek klassikasi va oldindan buyurtma asosida mavsumiy taomlar. Uycha terrasasiga, topchanga yoki zalga xizmat — administrator buyurtmani qabul qiladi. O'zingiz pishirmoqchi bo'lsangiz, shalede to'liq oshxona bor, mangal va qozon ijaraga olinadi.",
      en: "The kitchen works on site: BBQ dishes, plov, Uzbek classics, and seasonal items by pre-order. Served to your cabin terrace, to a topchan, or in the dining room. Prefer to cook? The chalet has a full kitchen, and a BBQ grill or kazan can be rented.",
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
    image: "galMountainView",
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
    slug: "outdoor-cooking",
    category: "food",
    image: "galMangalFire",
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
    slug: "picnic-zone",
    category: "relax",
    image: "galTopchanRow",
    title: { ru: "Зона пикника", uz: "Piknik zonasi", en: "Picnic zone" },
    shortDescription: {
      ru: "Открытые площадки среди сосен для семейного дня и встреч на природе.",
      uz: "Qarag'aylar orasidagi ochiq maydonlar — oilaviy kun va tabiatdagi uchrashuvlar uchun.",
      en: "Open spots among the pines for a family day or a gathering in nature.",
    },
    description: {
      ru: "Открытая часть территории среди сосен с панорамой на Чимган. Подходит для семейных встреч, корпоративных выездов и спокойного дня вдали от города. Парковка и зона мангала — рядом.",
      uz: "Qarag'aylar orasidagi hududning ochiq qismi, Chimgon panoramasi bilan. Oilaviy uchrashuvlar, korporativ sayohatlar va shahar shovqinidan uzoq sokin kun uchun mos. Avtoturargoh va mangal hududi yaqin.",
      en: "Open territory among the pines with views of the Chimgan range. Works for family gatherings, corporate outings, and a calm day away from the city — parking and the BBQ area are close by.",
    },
    highlights: {
      ru: ["Просторная территория", "Сосны и панорама гор", "Парковка рядом", "Можно с детьми"],
      uz: ["Keng hudud", "Qarag'aylar va tog' panoramasi", "Avtoturargoh yaqin", "Bolalar bilan mumkin"],
      en: ["Spacious grounds", "Pines and mountain views", "Parking nearby", "Family-friendly"],
    },
    bestFor: { ru: "Семейный выезд на природу", uz: "Oilaviy tabiatga chiqish", en: "A family outing in nature" },
  },
  {
    slug: "tapchan-zone",
    category: "relax",
    image: "galTopchanSwing",
    title: { ru: "Топчан и курпача", uz: "Topchan va kurpacha", en: "Topchan & kurpacha" },
    shortDescription: {
      ru: "Приватный топчан с курпача — для дневного визита, до 8 гостей.",
      uz: "Kurpachali xususiy topchan — kunlik tashrif uchun, 8 mehmongacha.",
      en: "A private topchan with kurpacha cushions — for a day visit, up to 8 guests.",
    },
    description: {
      ru: "Топчан — традиционная открытая платформа в тени деревьев с набором курпача, местом под мангал и казан рядом. Основной формат для гостей, которые приезжают на день без ночёвки; арендуется отдельно по фиксированному прайсу.",
      uz: "Topchan — daraxtlar soyasidagi an'anaviy ochiq supa: kurpacha to'plami, yonida mangal va qozon joyi. Tunamasdan bir kunga keladigan mehmonlar uchun asosiy format; fiksirlangan narx bo'yicha alohida ijaraga olinadi.",
      en: "A topchan is a traditional open platform under the tree canopy, with a kurpacha cushion set and a BBQ / kazan spot at hand. It's the main format for guests who come for the day without an overnight stay, rented separately at a fixed price.",
    },
    highlights: {
      ru: ["До 8 человек на топчан", "Включены курпача", "Тень и горный воздух", "Формат дневного визита"],
      uz: ["Topchan uchun 8 kishigacha", "Kurpacha to'plami", "Soya va tog' havosi", "Kunlik tashrif formati"],
      en: ["Up to 8 guests per topchan", "Kurpacha set included", "Shade and mountain air", "Day-visit format"],
    },
    bestFor: { ru: "День на природе без ночёвки", uz: "Tunamasdan tabiatda kun", en: "A day in nature, no overnight" },
  },
];

export const serviceCategories = [
  { id: "all", label: { ru: "Все", uz: "Barchasi", en: "All" } },
  { id: "relax", label: { ru: "Отдых", uz: "Dam olish", en: "Relax" } },
  { id: "food", label: { ru: "Еда", uz: "Taom", en: "Food" } },
  { id: "activity", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
] as const;
