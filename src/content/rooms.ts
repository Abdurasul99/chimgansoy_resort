import { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

export type RoomCategory = "glamping" | "cottage" | "pool";

/** A perk covered by the room rate, shown as a chip on the card and room page. */
export type RoomPerk = {
  label: LocalizedString;
  /** Draws the eye — used for the pool, the headline inclusion. */
  highlight?: boolean;
};

/** Heading above the perk chips. Kept here so both render sites share one source. */
export const INCLUDED_LABEL: LocalizedString = {
  ru: "Включено в стоимость",
  uz: "Narxga kiritilgan",
  en: "Included in the rate",
};

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
  /**
   * What the rate covers, as chips. The pool is the point of this: it is sold
   * as a standalone day product AND comes free with every overnight stay, and
   * nothing on the site said so.
   */
  included?: RoomPerk[];
  relatedServices: string[];
};

export const rooms: Room[] = [
  {
    slug: "glamping",
    category: "glamping",
    // Real interior shoot of the finished cabin. The previous set led with
    // the June A-frame landscape, which had them still as open shells — so the
    // page never actually showed the room a guest books.
    // Order matters: gallery[0] spans both columns on /nomera/[slug], so the
    // wide exterior goes first and the rest sit in a clean 2×2 below it.
    image: "aframeRoom",
    gallery: ["aframeLawnWide", "aframeBed", "aframeLounge", "aframeBathroom", "aframeMinibar"],
    title: { ru: "Глэмпинг A-frame", uz: "Glemping A-frame", en: "A-frame Glamping" },
    eyebrow: {
      ru: "A-frame · проживание на природе",
      uz: "A-frame · tabiat qo'ynida",
      en: "A-frame · nature stay",
    },
    shortDescription: {
      // "Шатры/tents/chodirlar" contradicted the photos: these are solid timber
      // A-frame cabins with tiled floors, AC and an ensuite — not tents.
      ru: "Отдельные домики A-frame с гостиничным комфортом, панорамным окном и быстрым доступом к активностям.",
      uz: "Mehmonxona qulayligi, panoramali deraza va faoliyatlarga tez chiqish imkoni bo'lgan alohida A-frame uychalari.",
      en: "Standalone A-frame cabins with hotel-level comfort, a panoramic window, and quick access to resort activities.",
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
      ru: ["1 спальная комната, 28 м²", "Собственный санузел 3,6 м²", "Терраса 15 м²", "Заезд с 15:00, выезд до 12:00"],
      uz: ["1 yotoq xonasi, 28 m²", "Xususiy sanuzel 3,6 m²", "Terrasa 15 m²", "Kirish 15:00 dan, chiqish 12:00 gacha"],
      en: ["1 bedroom, 28 m²", "Private bathroom 3.6 m²", "Terrace 15 m²", "Check-in from 15:00, check-out by 12:00"],
    },
    included: [
      {
        label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
        highlight: true,
      },
      { label: { ru: "Собственная терраса", uz: "Xususiy terrasa", en: "Private terrace" } },
      { label: { ru: "Кондиционер", uz: "Konditsioner", en: "Air conditioning" } },
      { label: { ru: "Wi-Fi", uz: "Wi-Fi", en: "Wi-Fi" } },
    ],
    relatedServices: ["restaurant", "picnic-zone", "experience"],
  },
  {
    slug: "cottage",
    category: "cottage",
    // Real interior shoot of the finished chalet. Previously receptionDay +
    // restaurantBuilding — i.e. the reception block and the restaurant, not the
    // chalet at all, so anyone booking a Шале was looking at another building.
    // gallery[0] spans both columns, so the wide lounge shot leads.
    image: "chaletLounge",
    gallery: ["chaletDining", "chaletBedroomDouble", "chaletBedroomTwin", "chaletBathroom", "chaletKitchen"],
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
    included: [
      {
        label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
        highlight: true,
      },
      { label: { ru: "Тёплый пол", uz: "Issiq pol", en: "Heated floor" } },
      { label: { ru: "Полная кухня", uz: "To'liq oshxona", en: "Full kitchen" } },
      { label: { ru: "Wi-Fi", uz: "Wi-Fi", en: "Wi-Fi" } },
    ],
    relatedServices: ["kids-playground", "outdoor-cooking", "mini-football"],
  },
  {
    slug: "pool",
    category: "pool",
    // All three are genuine pool frames now. The gallery used to be
    // [pool, poolEvening, galTerritoryPanorama], where poolEvening resolved to
    // the entrance gate — so the Бассейн page showed a building.
    image: "pool",
    gallery: ["poolAerial", "poolLifestyle", "poolEvening"],
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
      ru: "Гостям глэмпинга и шале бассейн включён в стоимость проживания — отдельно бронировать не нужно. Приехать только на бассейн, без ночёвки, тоже можно: это отдельное бронирование до 4 гостей, цена за человека и зависит от даты. Рядом кухня и зона мангала.",
      uz: "Glemping va shale mehmonlari uchun basseyn yashash narxiga kiritilgan — alohida bron qilish shart emas. Faqat basseynga, tunamasdan kelish ham mumkin: bu alohida bron, 4 mehmongacha, narx bir kishi uchun va sanaga bog'liq. Yaqinida oshxona va mangal zonasi.",
      en: "For glamping and chalet guests the pool is included in the room rate — no separate booking needed. Coming just for the pool, without an overnight stay, also works: that's a separate booking for up to 4 guests, priced per person and depending on the date. The kitchen and BBQ area are nearby.",
    },
    priceFrom: { ru: "Цена при бронировании", uz: "Bron qilishda narx", en: "Price at booking" },
    capacity: { ru: "до 4 гостей", uz: "4 mehmongacha", en: "up to 4 guests" },
    size: { ru: "Открытый бассейн", uz: "Ochiq basseyn", en: "Outdoor pool" },
    amenities: {
      ru: ["Открытый летний бассейн", "Панорама гор", "Включён в проживание", "Или отдельное бронирование"],
      uz: ["Ochiq yozgi basseyn", "Tog' panoramasi", "Yashashga kiritilgan", "Yoki alohida bron"],
      en: ["Outdoor summer pool", "Mountain panorama", "Day-lounge area nearby", "Booked separately"],
    },
    features: {
      ru: ["Включён в проживание в шале и глэмпинге", "Или бронь на день, до 4 гостей", "Работает в летний сезон", "Рядом мангал и кухня"],
      uz: ["Shale va glempingda yashashga kiritilgan", "Yoki bir kunlik bron, 4 mehmongacha", "Yozgi mavsumda ishlaydi", "Yaqinida mangal va oshxona"],
      en: ["Included with chalet and glamping stays", "Or a day booking for up to 4 guests", "Open in the summer season", "BBQ and kitchen nearby"],
    },
    relatedServices: ["outdoor-cooking", "restaurant", "picnic-zone"],
  },
];

/**
 * Exely Suite room-type ids per stay option — used on every booking link
 * (/bron?room-type=<id>) so the engine opens straight on the chosen item.
 * Full list is in the Exely package's links_room.html.
 */
export const EXELY_ROOM_TYPE: Record<string, string> = {
  // The day-visit / topchan type (5075762) is deliberately not listed: day
  // visits are closed, so nothing on the site should be able to open the engine
  // on it. NOTE: the tariff itself still exists inside Exely — it has to be
  // switched off in the Exely extranet, which can't be done from here.
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
