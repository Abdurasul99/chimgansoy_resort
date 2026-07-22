import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type RoomCategory = "glamping" | "cottage" | "pool";

export type Room = {
  slug: RoomCategory;
  category: RoomCategory;
  /** false = not built yet → shown only in the Master Plan section, not bookable */
  available?: boolean;
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
    image: "galAframeTrio",
    gallery: ["galAframeTrio", "galMountainView", "galTopchanPeaks", "galTerritoryPanorama"],
    title: { ru: "Глэмпинг A-frame", uz: "Glemping A-frame", en: "A-frame Glamping" },
    eyebrow: {
      ru: "A-frame · проживание на природе",
      uz: "A-frame · tabiat qo'ynida",
      en: "A-frame · nature stay",
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
    priceFrom: { ru: "Цена при бронировании", uz: "Bron qilishda narx", en: "Price at booking" },
    capacity: { ru: "до 3 гостей", uz: "3 mehmongacha", en: "up to 3 guests" },
    size: { ru: "28 м² + терраса 15 м²", uz: "28 m² + terrasa 15 m²", en: "28 m² + 15 m² terrace" },
    amenities: {
      ru: ["Двуспальная кровать 180×200", "Собственная терраса", "Санузел с душем", "Кондиционер", "Wi-Fi"],
      uz: ["Ikki kishilik karavot 180×200", "Xususiy terrasa", "Dushli sanuzel", "Konditsioner", "Wi-Fi"],
      en: ["Double bed 180×200", "Private terrace", "Ensuite shower room", "Air conditioning", "Wi-Fi"],
    },
    features: {
      ru: ["1 спальная комната, 28 м²", "Собственный санузел", "Заезд с 15:00, выезд до 12:00", "Быстрый выход к прогулочным маршрутам"],
      uz: ["1 yotoq xonasi, 28 m²", "Xususiy sanuzel", "Kirish 15:00 dan, chiqish 12:00 gacha", "Sayr yo'llariga tez chiqish"],
      en: ["1 bedroom, 28 m²", "Private bathroom", "Check-in from 15:00, check-out by 12:00", "Quick access to walking routes"],
    },
    relatedServices: ["restaurant", "tapchan-zone", "experience"],
  },
  {
    slug: "cottage",
    category: "cottage",
    image: "receptionDay",
    gallery: ["receptionDay", "restaurantBuilding", "galTopchanInside", "galKidsSwing"],
    title: { ru: "Шале", uz: "Shale", en: "Chalet" },
    eyebrow: {
      ru: "Для семьи и компании",
      uz: "Oila va do'stlar uchun",
      en: "For families and groups",
    },
    shortDescription: {
      ru: "Просторное шале с двумя спальнями и кухней-залом — для семейного отдыха, дружеских выходных и длительных заездов.",
      uz: "Ikki yotoqxona va oshxona-zalli keng shale — oilaviy dam olish, do'stlar bilan hafta oxiri va uzoq muddatli turish uchun.",
      en: "A spacious chalet with two bedrooms and a kitchen-lounge — for family stays, weekends with friends, and longer visits.",
    },
    description: {
      ru: "Шале подходит гостям, которым нужен полноценный приватный формат: две отдельные спальни со своими санузлами, кухня-зал и собственная терраса для вечернего отдыха.",
      uz: "Shale to'liq xususiy formatni istagan mehmonlar uchun: o'z sanuzeliga ega ikkita alohida yotoqxona, oshxona-zal va kechki dam olish uchun shaxsiy terrasa.",
      en: "The chalet is for guests who need a fully private format: two separate bedrooms each with its own bathroom, a kitchen-lounge, and a private terrace for the evenings.",
    },
    priceFrom: { ru: "Цена при бронировании", uz: "Bron qilishda narx", en: "Price at booking" },
    capacity: { ru: "до 5 гостей", uz: "5 mehmongacha", en: "up to 5 guests" },
    size: { ru: "3 комнаты + терраса 35 м²", uz: "3 xona + terrasa 35 m²", en: "3 rooms + 35 m² terrace" },
    amenities: {
      ru: ["Душевая комната", "Кондиционер", "Тёплый пол", "Wi-Fi", "Телевизор", "Холодильник", "Электрическая плита", "Микроволновка", "Полный кухонный набор", "Минибар"],
      uz: ["Dush xonasi", "Konditsioner", "Issiq pol", "Wi-Fi", "Televizor", "Muzlatkich", "Elektr plita", "Mikroto'lqinli pech", "To'liq oshxona to'plami", "Minibar"],
      en: ["Shower room", "Air conditioning", "Heated floor", "Wi-Fi", "TV", "Fridge", "Electric stove", "Microwave", "Full kitchen set", "Minibar"],
    },
    features: {
      ru: ["Спальня 1 (15.9 м²): двуспальная кровать 180×200", "Спальня 2 (15.6 м²): две односпальные 90×200", "Кухня-зал с диваном", "Отдельный санузел в каждой спальне (4.7 м²)", "Заезд с 15:00, выезд до 12:00"],
      uz: ["Yotoqxona 1 (15.9 m²): ikki kishilik karavot 180×200", "Yotoqxona 2 (15.6 m²): ikkita bir kishilik karavot 90×200", "Oshxona-zal divan bilan", "Har bir yotoqxonada alohida sanuzel (4.7 m²)", "Kirish 15:00 dan, chiqish 12:00 gacha"],
      en: ["Bedroom 1 (15.9 m²): double bed 180×200", "Bedroom 2 (15.6 m²): two single beds 90×200", "Kitchen-lounge with a sofa", "Ensuite bathroom in each bedroom (4.7 m²)", "Check-in from 15:00, check-out by 12:00"],
    },
    relatedServices: ["kids-playground", "outdoor-cooking", "mini-football"],
  },
  {
    slug: "pool",
    category: "pool",
    image: "poolEvening",
    gallery: ["poolEvening", "galMountainView", "galTerritoryPanorama"],
    title: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
    eyebrow: {
      ru: "Летний отдых у воды",
      uz: "Suv bo'yida yozgi dam",
      en: "Summer by the water",
    },
    shortDescription: {
      ru: "Открытый бассейн с видом на горы — бронируется отдельно, без ночёвки.",
      uz: "Tog' manzarali ochiq basseyn — alohida, tunamasdan bron qilinadi.",
      en: "An outdoor pool with mountain views — bookable separately, no overnight stay needed.",
    },
    description: {
      ru: "Летний бассейн для дневного отдыха: приезжайте на день, бронируйте бассейн отдельно и совмещайте с топчаном, мангалом и кухней. Одно бронирование — до 4 гостей.",
      uz: "Kunlik dam olish uchun yozgi basseyn: bir kunga keling, basseynni alohida bron qiling va topchan, mangal hamda oshxona bilan birga rejalashtiring. Bitta bron — 4 mehmongacha.",
      en: "A summer pool for day visits: come for the day, book the pool separately, and pair it with a topchan, BBQ, and the kitchen. One booking covers up to 4 guests.",
    },
    priceFrom: { ru: "Цена при бронировании", uz: "Bron qilishda narx", en: "Price at booking" },
    capacity: { ru: "до 4 гостей", uz: "4 mehmongacha", en: "up to 4 guests" },
    size: { ru: "Открытый бассейн", uz: "Ochiq basseyn", en: "Outdoor pool" },
    amenities: {
      ru: ["Открытый летний бассейн", "Панорама гор", "Зона дневного отдыха рядом", "Отдельное бронирование"],
      uz: ["Ochiq yozgi basseyn", "Tog' panoramasi", "Yaqinida kunlik dam olish zonasi", "Alohida bron"],
      en: ["Outdoor summer pool", "Mountain panorama", "Day-lounge area nearby", "Booked separately"],
    },
    features: {
      ru: ["Бронь на день, без проживания", "До 4 гостей на одно бронирование", "Работает в летний сезон", "Рядом топчаны, мангал и кухня"],
      uz: ["Bir kunlik bron, yashashsiz", "Bitta bronga 4 mehmongacha", "Yozgi mavsumda ishlaydi", "Yaqinida topchan, mangal va oshxona"],
      en: ["Day booking, no overnight stay", "Up to 4 guests per booking", "Open in the summer season", "Topchans, BBQ, and kitchen nearby"],
    },
    relatedServices: ["tapchan-zone", "outdoor-cooking", "restaurant"],
  },
];

/**
 * Exely Suite room-type ids per stay option — used on every booking link
 * (/bron?room-type=<id>) so the engine opens straight on the chosen item.
 * Full list is in the Exely package's links_room.html.
 */
export const EXELY_ROOM_TYPE: Record<string, string> = {
  day: "5075762", // Topchan / day visit
  glamping: "5075760",
  cottage: "5075761",
  pool: "5076232",
};

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
    label: { ru: "Шале", uz: "Shale", en: "Chalet" },
  },
  {
    id: "pool",
    label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
  },
] as const;
