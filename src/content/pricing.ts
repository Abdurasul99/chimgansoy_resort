import type { LocalizedString } from "./types";

export type PriceItem = {
  key: string;
  icon: "car" | "topchan" | "kurpacha" | "kazan" | "mangal" | "firewood" | "charcoal";
  title: LocalizedString;
  subtitle?: LocalizedString;
  weekday: number;
  weekend: number;
};

export const priceList: PriceItem[] = [
  {
    key: "entry",
    icon: "car",
    title: { ru: "Въезд", uz: "Kirish", en: "Entry fee" },
    subtitle: { ru: "1 автомобиль", uz: "1 avtomobil", en: "per car" },
    weekday: 50_000,
    weekend: 100_000,
  },
  {
    key: "topchan",
    icon: "topchan",
    title: { ru: "Топчан", uz: "Topchan", en: "Topchan" },
    subtitle: { ru: "аренда, до 8 чел.", uz: "ijara, 8 kishigacha", en: "rental, up to 8 people" },
    weekday: 150_000,
    weekend: 300_000,
  },
  {
    key: "kazan",
    icon: "kazan",
    title: { ru: "Аренда казана", uz: "Qozon ijarasi", en: "Kazan rental" },
    weekday: 50_000,
    weekend: 100_000,
  },
  {
    key: "mangal",
    icon: "mangal",
    title: { ru: "Аренда мангала", uz: "Mangal ijarasi", en: "BBQ grill rental" },
    weekday: 50_000,
    weekend: 50_000,
  },
  {
    key: "firewood",
    icon: "firewood",
    title: { ru: "Дрова", uz: "O'tin", en: "Firewood" },
    subtitle: { ru: "1 пучок", uz: "1 dasta", en: "1 bundle" },
    weekday: 50_000,
    weekend: 50_000,
  },
  {
    key: "charcoal",
    icon: "charcoal",
    title: { ru: "Уголь", uz: "Ko'mir", en: "Charcoal" },
    subtitle: { ru: "1 кг", uz: "1 kg", en: "1 kg" },
    weekday: 30_000,
    weekend: 30_000,
  },
];

export const dayUseInfo = {
  hours: "08:00–18:00",
  altitude: "1700 м",
  altitudeShort: { ru: "1700 м над уровнем моря", uz: "1700 m balandlikda", en: "1,700 m above sea level" } satisfies LocalizedString,
  weekdaysLabel: { ru: "Пн–Чт", uz: "Du–Pay", en: "Mon–Thu" } satisfies LocalizedString,
  weekendLabel: { ru: "Пт–Вс", uz: "Ju–Yak", en: "Fri–Sun" } satisfies LocalizedString,
  currencyShort: { ru: "сум", uz: "so'm", en: "UZS" } satisfies LocalizedString,
};

export const whatToBring: LocalizedString[] = [
  { ru: "Продукты для шашлыка / казан-кебаба", uz: "Shashlik / qozon-kabob uchun mahsulotlar", en: "Food for BBQ / kazan-kebab" },
  { ru: "Тёплая одежда — вечером в горах прохладно", uz: "Iliq kiyim — kechqurun tog'da salqin", en: "Warm clothes — evenings are cool in the mountains" },
  { ru: "Удобная обувь для прогулок", uz: "Sayr uchun qulay poyabzal", en: "Comfortable shoes for walks" },
  { ru: "Солнцезащитный крем и кепка", uz: "Quyoshdan himoya kremi va kepka", en: "Sunscreen and a cap" },
  { ru: "Хорошее настроение и компанию", uz: "Yaxshi kayfiyat va do'stlar", en: "Good mood and good company" },
];

export const includedPerks: LocalizedString[] = [
  { ru: "Готовое место для мангала и казана", uz: "Mangal va qozon uchun tayyor joy", en: "Ready-to-use BBQ and kazan spot" },
  { ru: "Горный воздух и панорамы", uz: "Tog' havosi va panoramalar", en: "Mountain air and views" },
  { ru: "Парковка на территории", uz: "Hududda parking", en: "On-site parking" },
  { ru: "Чистая зона отдыха", uz: "Toza dam olish zonasi", en: "Clean recreation area" },
  { ru: "Готовое меню от кухни", uz: "Oshxonadan tayyor menyu", en: "Ready-made menu from our kitchen" },
];
