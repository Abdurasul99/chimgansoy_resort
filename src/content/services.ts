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

export const services: Service[] = [
  {
    slug: "tapchan-zone",
    category: "relax",
    image: "galTopchanSwing",
    title: { ru: "Топчан и курпача", uz: "Topchan va kurpacha", en: "Topchan & kurpacha" },
    shortDescription: {
      ru: "Приватный топчан с курпача — до 8 гостей на один топчан.",
      uz: "Kurpachali xususiy topchan — bir topchan uchun 8 kishigacha.",
      en: "A private topchan with kurpacha cushions — up to 8 guests per topchan.",
    },
    description: {
      ru: "Топчан — традиционная открытая платформа в тени деревьев. Внутри набор курпача, рядом место для мангала и казана, удобный доступ к воде. Идеальная база для дневного отдыха с семьёй или компанией.",
      uz: "Topchan — daraxtlar soyasidagi an'anaviy ochiq supa. Ichida kurpacha to'plami, yonida mangal va qozon joyi, suvga qulay yo'l. Oila yoki do'stlar bilan kunlik dam olish uchun ideal asos.",
      en: "A topchan is a traditional open platform under the tree canopy. Each one comes with a kurpacha cushion set, a fire-pit spot nearby, and easy access to water — the perfect base for a day with family or friends.",
    },
    highlights: {
      ru: ["До 8 человек на топчан", "Включены курпача", "Тень и горный воздух", "Близко к мангалу"],
      uz: ["Topchan uchun 8 kishigacha", "Kurpacha to'plami", "Soya va tog' havosi", "Mangalga yaqin"],
      en: ["Up to 8 guests per topchan", "Kurpacha set included", "Shade and mountain air", "Close to BBQ spot"],
    },
    bestFor: { ru: "Семья или компания на дневной отдых", uz: "Oila yoki do'stlar uchun kunlik dam", en: "A family or group on a day visit" },
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
      ru: "Арендуете мангал или казан, готовите шашлык или плов на свежем воздухе. Дрова (1 пучок) и уголь (1 кг) докупаются на месте. Можно привозить свои продукты или заказать что-то готовое в кухне.",
      uz: "Mangal yoki qozonni ijaraga olasiz, ochiq havoda shashlik yoki palov pishirasiz. O'tin (1 dasta) va ko'mir (1 kg) joyida sotib olinadi. O'z mahsulotlaringizni olib kelsangiz yoki oshxonadan tayyor narsa buyurtma qilsangiz bo'ladi.",
      en: "Rent a BBQ grill or kazan and cook shashlik or plov in the open air. Firewood (per bundle) and charcoal (per kg) are sold on site. Bring your own ingredients, or order ready-made dishes from our kitchen.",
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
    slug: "restaurant",
    category: "food",
    image: "galFoodServing",
    title: { ru: "Меню кухни", uz: "Oshxona menyusi", en: "Kitchen menu" },
    shortDescription: {
      ru: "Готовое меню от кухни — закажите блюда прямо на свой топчан.",
      uz: "Oshxonadan tayyor menyu — taomlarni to'g'ridan-to'g'ri topchaningizga buyurtma qiling.",
      en: "Ready-made menu from our kitchen — ordered straight to your topchan.",
    },
    description: {
      ru: "Если не хочется готовить самим — закажите готовое меню. Мангальные блюда, плов, узбекская кухня и сезонные позиции по предзаказу. Сервис на топчан или к мангалу — администратор примет заказ.",
      uz: "Agar o'zingiz pishirishni xohlamasangiz — tayyor menyuni buyurtma qiling. Mangal taomlari, palov, o'zbek oshxonasi va oldindan buyurtma asosida mavsumiy taomlar. Topchanga yoki mangalga xizmat — administrator buyurtmani qabul qiladi.",
      en: "Don't feel like cooking? Order from our kitchen. BBQ dishes, plov, Uzbek classics, and seasonal items by pre-order. Service straight to your topchan or BBQ spot — the admin will take the order.",
    },
    highlights: {
      ru: ["Готовое меню", "Предзаказ позиций", "Сервис к топчану", "Узбекская кухня"],
      uz: ["Tayyor menyu", "Oldindan buyurtma", "Topchanga xizmat", "O'zbek oshxonasi"],
      en: ["Ready-made menu", "Pre-order available", "Service to your topchan", "Uzbek cuisine"],
    },
    bestFor: { ru: "Когда хочется не готовить", uz: "Pishirishni istamaganda", en: "When you'd rather not cook" },
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
      ru: "После отдыха на топчане можно прогуляться по горным маршрутам, добраться до канатной дороги или попробовать конную прогулку. Администратор подскажет сезонные варианты и поможет с трансфером.",
      uz: "Topchanda dam olgandan keyin tog' marshrutlarida sayr qilish, kanat yo'liga borish yoki ot minib ko'rish mumkin. Administrator mavsumiy variantlarni aytadi va transferda yordam beradi.",
      en: "After a rest on the topchan, take a walk on the mountain trails, ride the cable car, or try a horse trek. The admin can suggest seasonal options and help with the transfer.",
    },
    highlights: {
      ru: ["Пешие маршруты", "Конные прогулки", "Канатные дороги Чимгана", "Сезонные варианты"],
      uz: ["Piyoda marshrutlar", "Ot minish", "Chimgon kanat yo'llari", "Mavsumiy variantlar"],
      en: ["Hiking routes", "Horse riding", "Chimgan cable cars", "Seasonal options"],
    },
    bestFor: { ru: "Активный участок дня", uz: "Kunning faol qismi", en: "An active part of the day" },
  },
];

export const serviceCategories = [
  { id: "all", label: { ru: "Все", uz: "Barchasi", en: "All" } },
  { id: "relax", label: { ru: "Отдых", uz: "Dam olish", en: "Relax" } },
  { id: "food", label: { ru: "Еда", uz: "Taom", en: "Food" } },
  { id: "activity", label: { ru: "Активности", uz: "Faoliyatlar", en: "Activities" } },
] as const;
