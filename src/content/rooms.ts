import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type RoomCategory = "glamping" | "cottage";

export type Room = {
  slug: RoomCategory;
  category: RoomCategory;
  image: keyof typeof resortImages;
  gallery: (keyof typeof resortImages)[];
  title: LocalizedString;
  eyebrow: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  priceFrom: LocalizedString;
  capacity: LocalizedString;
  size: LocalizedString;
  amenities: LocalizedList;
  features: LocalizedList;
  relatedServices: string[];
};

export const rooms: Room[] = [
  {
    slug: "glamping",
    category: "glamping",
    image: "glamping",
    gallery: ["glamping", "glampingDay", "poolLifestyle", "territoryAerial"],
    title: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" },
    eyebrow: {
      ru: "Проживание на природе",
      uz: "Tabiat qo'ynida yashash",
      en: "Nature stay",
    },
    shortDescription: {
      ru: "Приватные шатры с гостиничным комфортом, панорамным видом и быстрым доступом к активностям.",
      uz: "Mehmonxona qulayligi, panorama manzarasi va faoliyatlarga yaqin xususiy chodirlar.",
      en: "Private tents with hotel-level comfort, panoramic views, and quick access to resort activities.",
    },
    description: {
      ru: "Глэмпинг создан для гостей, которым важны тишина, воздух и ощущение природы без отказа от удобств. Формат подходит для романтического отдыха, коротких перезагрузок и камерных семейных поездок.",
      uz: "Glemping sokinlik, toza havo va qulaylikdan voz kechmasdan tabiatni his qilishni istagan mehmonlar uchun. U romantik dam olish, qisqa hordiq va kichik oilaviy safarlar uchun mos.",
      en: "Glamping is designed for guests who want quiet air and a close-to-nature stay without giving up comfort. It fits romantic escapes, short resets, and intimate family trips.",
    },
    priceFrom: { ru: "от 1 200 000 сум", uz: "1 200 000 so'mdan", en: "from UZS 1,200,000" },
    capacity: { ru: "2-4 гостя", uz: "2-4 mehmon", en: "2-4 guests" },
    size: { ru: "до 32 м2", uz: "32 m2 gacha", en: "up to 32 m2" },
    amenities: {
      ru: ["Большая кровать", "Собственная терраса", "Душевая зона", "Кондиционер", "Wi-Fi", "Завтрак по запросу"],
      uz: ["Katta karavot", "Xususiy terrasa", "Dush zonasi", "Konditsioner", "Wi-Fi", "So'rov bo'yicha nonushta"],
      en: ["Large bed", "Private terrace", "Shower area", "Air conditioning", "Wi-Fi", "Breakfast on request"],
    },
    features: {
      ru: ["Панорамное остекление", "Быстрый выход к прогулочным маршрутам", "Приватная посадка у входа", "Уютное вечернее освещение"],
      uz: ["Panorama oynalar", "Sayr yo'llariga tez chiqish", "Kirish yonida xususiy o'tirish joyi", "Shinam kechki yoritish"],
      en: ["Panoramic glazing", "Quick access to walking routes", "Private seating at the entrance", "Warm evening lighting"],
    },
    relatedServices: ["restaurant", "tapchan-zone", "experience"],
  },
  {
    slug: "cottage",
    category: "cottage",
    image: "cottage",
    gallery: ["cottage", "cottageDay", "grill", "kids"],
    title: { ru: "Коттедж", uz: "Kottej", en: "Cottage" },
    eyebrow: {
      ru: "Для семьи и компании",
      uz: "Oila va do'stlar uchun",
      en: "For families and groups",
    },
    shortDescription: {
      ru: "Просторный домик для семейного отдыха, дружеских выходных и длительных заездов.",
      uz: "Oilaviy dam olish, do'stlar bilan hafta oxiri va uzoq muddatli turish uchun keng uycha.",
      en: "A spacious house for family stays, weekends with friends, and longer visits.",
    },
    description: {
      ru: "Коттедж подходит гостям, которым нужен полноценный приватный формат: отдельные зоны отдыха, больше места для детей и возможность провести вечер на собственной террасе.",
      uz: "Kottej to'liq xususiy formatni istagan mehmonlar uchun: alohida dam olish zonalari, bolalar uchun kengroq joy va shaxsiy terrasada kechki vaqt.",
      en: "The cottage is for guests who need a fully private format: separate lounge zones, extra room for kids, and relaxed evenings on a private terrace.",
    },
    priceFrom: { ru: "от 1 800 000 сум", uz: "1 800 000 so'mdan", en: "from UZS 1,800,000" },
    capacity: { ru: "4-6 гостей", uz: "4-6 mehmon", en: "4-6 guests" },
    size: { ru: "до 58 м2", uz: "58 m2 gacha", en: "up to 58 m2" },
    amenities: {
      ru: ["Две спальные зоны", "Гостиная", "Терраса", "Мини-холодильник", "Санузел", "Парковка рядом"],
      uz: ["Ikki yotoq zonasi", "Mehmonxona", "Terrasa", "Mini muzlatkich", "Sanuzel", "Yaqin parking"],
      en: ["Two sleeping zones", "Living room", "Terrace", "Mini fridge", "Bathroom", "Nearby parking"],
    },
    features: {
      ru: ["Комфорт для детей", "Место для долгого проживания", "Удобно для праздников в узком кругу", "Близко к зонам гриля"],
      uz: ["Bolalar uchun qulay", "Uzoq turish uchun joy", "Kichik davradagi bayramlarga mos", "Gril zonalariga yaqin"],
      en: ["Comfortable for children", "Space for longer stays", "Works for private celebrations", "Close to grill zones"],
    },
    relatedServices: ["kids-playground", "outdoor-cooking", "mini-football"],
  },
];

export const roomCategories = [
  {
    id: "all",
    label: { ru: "Все", uz: "Barchasi", en: "All" },
  },
  {
    id: "glamping",
    label: { ru: "Глэмпинг", uz: "Glemping", en: "Glamping" },
  },
  {
    id: "cottage",
    label: { ru: "Коттеджи", uz: "Kottejlar", en: "Cottages" },
  },
] as const;
