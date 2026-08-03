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
    // No bath anywhere on the property — every unit has a shower. Stated
    // explicitly so nobody books expecting one.
    amenities: {
      ru: ["Двуспальная кровать 180×200", "Собственная терраса", "Санузел с душем", "Кондиционер", "Тёплый пол", "Телевизор", "Wi-Fi", "Бесплатная парковка"],
      uz: ["Ikki kishilik karavot 180×200", "Xususiy terrasa", "Dushli sanuzel", "Konditsioner", "Issiq pol", "Televizor", "Wi-Fi", "Bepul parking"],
      en: ["Double bed 180×200", "Private terrace", "Shower room", "Air conditioning", "Heated floor", "TV", "Wi-Fi", "Free parking"],
    },
    features: {
      ru: ["1 спальная комната, 28 м²", "Собственный санузел 3,6 м²", "Терраса 15 м²", "Заезд с 14:00, выезд до 12:00"],
      uz: ["1 yotoq xonasi, 28 m²", "Xususiy sanuzel 3,6 m²", "Terrasa 15 m²", "Kirish 14:00 dan, chiqish 12:00 gacha"],
      en: ["1 bedroom, 28 m²", "Private bathroom 3.6 m²", "Terrace 15 m²", "Check-in from 14:00, check-out by 12:00"],
    },
    // The tubing allowance differs by unit — 2 rides with a glamping cabin, 4
    // with a chalet — which is why it is stated here per room rather than as a
    // single site-wide perk.
    included: [
      {
        label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
        highlight: true,
      },
      {
        label: { ru: "Завтрак", uz: "Nonushta", en: "Breakfast" },
        highlight: true,
      },
      {
        label: {
          ru: "Тюбинг-горка: 2 прокатки",
          uz: "Tubing gorkasi: 2 marta uchish",
          en: "Tubing hill: 2 rides",
        },
        highlight: true,
      },
      { label: { ru: "Собственная терраса", uz: "Xususiy terrasa", en: "Private terrace" } },
      { label: { ru: "Кондиционер", uz: "Konditsioner", en: "Air conditioning" } },
      { label: { ru: "Тёплый пол", uz: "Issiq pol", en: "Heated floor" } },
      { label: { ru: "Телевизор", uz: "Televizor", en: "TV" } },
      { label: { ru: "Санузел с душем", uz: "Dushli sanuzel", en: "Shower room" } },
      { label: { ru: "Бесплатная парковка", uz: "Bepul parking", en: "Free parking" } },
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
    // The exterior leads: gallery[0] spans both columns on /nomera/[slug], and
    // a guest choosing a chalet wants to see the building before the sofa.
    gallery: ["chaletExterior", "chaletDining", "chaletBedroomDouble", "chaletBedroomTwin", "chaletBathroom", "chaletKitchen"],
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
      ru: "Шале подходит гостям, которым нужен полноценный приватный формат. Две отдельные спальни: в одной двуспальная кровать, в другой две раздельные. К каждой спальне — свой туалет и душ. Плюс кухня-зал и собственная терраса для вечернего отдыха. Всё, что есть в глэмпинге — кондиционер, тёплый пол, телевизор, Wi-Fi и бесплатная парковка, — есть и здесь.",
      uz: "Shale to'liq xususiy formatni istagan mehmonlar uchun. Ikkita alohida yotoqxona: birida ikki kishilik karavot, ikkinchisida ikkita alohida karavot. Har bir yotoqxonaga o'z hojatxonasi va dushi. Ustiga oshxona-zal va kechki dam olish uchun shaxsiy terrasa. Glempingdagi hamma narsa — konditsioner, issiq pol, televizor, Wi-Fi va bepul parking — bu yerda ham bor.",
      en: "The chalet is for guests who need a fully private format. Two separate bedrooms: a double bed in one, two single beds in the other, each bedroom with its own toilet and shower. Plus a kitchen-lounge and a private terrace for the evenings. Everything the glamping cabin has — air conditioning, heated floors, a TV, Wi-Fi and free parking — is here too.",
    },
    priceFrom: { ru: "Цена при бронировании", uz: "Bron qilishda narx", en: "Price at booking" },
    // 6, confirmed by the operator 2026-08-02. Booking.com and Exely still hold
    // 5 for this unit — they have to be raised there too or the channels will
    // reject the sixth guest the site just accepted.
    capacity: { ru: "до 6 гостей", uz: "6 mehmongacha", en: "up to 6 guests" },
    size: { ru: "3 комнаты + терраса 35 м²", uz: "3 xona + terrasa 35 m²", en: "3 rooms + 35 m² terrace" },
    amenities: {
      // Two ensuites, both with a shower — there is no bath anywhere on the
      // property, in any unit.
      ru: ["Туалет и душ в каждой спальне", "Собственная терраса", "Кондиционер", "Тёплый пол", "Телевизор", "Wi-Fi", "Бесплатная парковка", "Холодильник", "Электрическая плита", "Микроволновка", "Полный кухонный набор", "Минибар"],
      uz: ["Har bir yotoqxonada hojatxona va dush", "Xususiy terrasa", "Konditsioner", "Issiq pol", "Televizor", "Wi-Fi", "Bepul parking", "Muzlatkich", "Elektr plita", "Mikroto'lqinli pech", "To'liq oshxona to'plami", "Minibar"],
      en: ["Toilet and shower in each bedroom", "Private terrace", "Air conditioning", "Heated floor", "TV", "Wi-Fi", "Free parking", "Fridge", "Electric stove", "Microwave", "Full kitchen set", "Minibar"],
    },
    features: {
      ru: ["Спальня 1 (15.9 м²): двуспальная кровать 180×200", "Спальня 2 (15.6 м²): две односпальные 90×200", "Кухня-зал с диваном", "Отдельный санузел в каждой спальне (4.7 м²)", "Заезд с 14:00, выезд до 12:00"],
      uz: ["Yotoqxona 1 (15.9 m²): ikki kishilik karavot 180×200", "Yotoqxona 2 (15.6 m²): ikkita bir kishilik karavot 90×200", "Oshxona-zal divan bilan", "Har bir yotoqxonada alohida sanuzel (4.7 m²)", "Kirish 14:00 dan, chiqish 12:00 gacha"],
      en: ["Bedroom 1 (15.9 m²): double bed 180×200", "Bedroom 2 (15.6 m²): two single beds 90×200", "Kitchen-lounge with a sofa", "Ensuite bathroom in each bedroom (4.7 m²)", "Check-in from 14:00, check-out by 12:00"],
    },
    included: [
      {
        label: { ru: "Бассейн", uz: "Basseyn", en: "Pool" },
        highlight: true,
      },
      {
        label: { ru: "Завтрак", uz: "Nonushta", en: "Breakfast" },
        highlight: true,
      },
      {
        label: {
          ru: "Тюбинг-горка: 4 прокатки",
          uz: "Tubing gorkasi: 4 marta uchish",
          en: "Tubing hill: 4 rides",
        },
        highlight: true,
      },
      { label: { ru: "Тёплый пол", uz: "Issiq pol", en: "Heated floor" } },
      { label: { ru: "Полная кухня", uz: "To'liq oshxona", en: "Full kitchen" } },
      { label: { ru: "Терраса 35 м²", uz: "35 m² terrasa", en: "35 m² terrace" } },
      { label: { ru: "Санузел в каждой спальне", uz: "Har bir yotoqxonada sanuzel", en: "Ensuite in every bedroom" } },
      { label: { ru: "Парковка у домика", uz: "Uycha yonida parking", en: "Parking by the cabin" } },
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
      // The bands here used to read Пн–Пт / Сб–Вс, which put Friday on the
      // cheap tariff — the poster and the booking form both charge Friday at
      // the weekend rate, so the page was quoting a price the form would not
      // honour.
      ru: "Гостям глэмпинга и шале бассейн включён в стоимость проживания — отдельно бронировать не нужно. Приехать только на бассейн, без ночёвки, тоже можно, гостей без ограничения: 100 000 сум с человека в будни (Пн–Чт) и 200 000 сум в выходные (Пт–Вс), дети 5–15 лет вдвое дешевле, до 5 лет бесплатно. Оставьте заявку ниже — администратор перезвонит и подтвердит время. Рядом кухня и зона мангала.",
      uz: "Glemping va shale mehmonlari uchun basseyn yashash narxiga kiritilgan — alohida bron qilish shart emas. Faqat basseynga, tunamasdan kelish ham mumkin, mehmonlar soni cheklanmagan: ish kunlari (Du–Pay) bir kishidan 100 000 so'm, dam olish kunlari (Ju–Yak) 200 000 so'm, 5–15 yoshli bolalar ikki barobar arzon, 5 yoshgacha bepul. Quyida ariza qoldiring — administrator qo'ng'iroq qilib, vaqtni tasdiqlaydi. Yaqinida oshxona va mangal zonasi.",
      en: "For glamping and chalet guests the pool is included in the room rate — no separate booking needed. Coming just for the pool, without an overnight stay, also works, with no cap on group size: 100 000 UZS per person Mon–Thu and 200 000 UZS Fri–Sun, half price for children 5–15 and free under five. Send a request below and our administrator will call back to confirm the time. The kitchen and BBQ area are nearby.",
    },
    // Fixed tariff now — the engine no longer prices this one.
    priceFrom: { ru: "от 100 000 сум с человека", uz: "100 000 so'mdan bir kishidan", en: "from 100 000 UZS per person" },
    capacity: { ru: "без ограничения по гостям", uz: "mehmonlar soni cheklanmagan", en: "any group size" },
    size: { ru: "Открытый бассейн 680 м²", uz: "680 m² ochiq basseyn", en: "680 m² outdoor pool" },
    amenities: {
      ru: ["Открытый бассейн 680 м²", "Детский бассейн", "Пул-бар с посадочными местами", "Бунгало у воды", "Панорама гор"],
      uz: ["680 m² ochiq basseyn", "Bolalar basseyni", "O'tirish joylari bilan pul-bar", "Suv bo'yida bungalolar", "Tog' panoramasi"],
      en: ["680 m² outdoor pool", "Children's pool", "Pool bar with seating", "Bungalows by the water", "Mountain panorama"],
    },
    features: {
      // 8 small bungalows seat up to 4, 4 large seat up to 10 — see poolFacts.
      // The VIP/DJ deck above the bar is NOT built yet and is deliberately
      // absent from this list: a guest paying for a day pass on the strength of
      // it would arrive to scaffolding.
      ru: ["Включён в проживание в шале и глэмпинге", "Или бронь на день, гостей без лимита", "8 малых бунгало до 4 человек и 4 больших до 10", "Работает ежедневно 08:00–20:00"],
      uz: ["Shale va glempingda yashashga kiritilgan", "Yoki bir kunlik bron, mehmonlar soni cheklanmagan", "4 kishilik 8 ta kichik va 10 kishilik 4 ta katta bungalo", "Har kuni 08:00–20:00"],
      en: ["Included with chalet and glamping stays", "Or a day booking, any group size", "8 small bungalows for up to 4 and 4 large for up to 10", "Open daily 08:00–20:00"],
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
  // The pool is deliberately absent. It is no longer sold through the booking
  // engine: it has a fixed weekday/weekend tariff and is handled as a request
  // form on /nomera/pool that reaches the operator through @chimgandarbaza_bot.
  // Anything linking the pool to /bron would drop the guest into an engine that
  // no longer offers it.
  glamping: "5075760",
  cottage: "5075761",
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
