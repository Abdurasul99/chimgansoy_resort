import type { Locale } from "@/i18n/config";
import type { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

const NEWS_MONTHS: Record<Locale, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** Format an ISO date (YYYY-MM-DD) into a localized human string. */
export function formatNewsDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = NEWS_MONTHS[locale]?.[m - 1] ?? "";
  if (locale === "en") return `${month} ${d}, ${y}`;
  if (locale === "uz") return `${d} ${month} ${y}-yil`;
  return `${d} ${month} ${y} г.`;
}

export type NewsItem = {
  slug: string;
  /** ISO date YYYY-MM-DD — used for sorting (newest first) and display. */
  date: string;
  image: keyof typeof resortImages;
  category: LocalizedString;
  title: LocalizedString;
  excerpt: LocalizedString;
  /** Article body as a list of paragraphs per locale. */
  body: LocalizedList;
};

// HOW TO PUBLISH NEWS
// ───────────────────
// There is no CMS — news live here as data. To publish a post, add an object
// to the top of this array (newest first is handled automatically by date).
// Keep it factual. Replace/extend these seed posts with real announcements
// (events, seasonal offers, new services). Send the dev the text + a photo,
// or edit this file directly.
export const news: NewsItem[] = [
  {
    slug: "booking-open",
    date: "2026-06-20",
    image: "glampingDay",
    category: { ru: "Бронирование", uz: "Bron", en: "Booking" },
    title: {
      ru: "Открыто бронирование глэмпинга и коттеджа",
      uz: "Glemping va kottej bron qilish ochildi",
      en: "Glamping and cottage booking is open",
    },
    excerpt: {
      ru: "Теперь номера можно забронировать прямо на сайте — выберите формат, даты и число гостей.",
      uz: "Endi xonalarni to'g'ridan-to'g'ri saytda bron qilish mumkin — format, sana va mehmonlar sonini tanlang.",
      en: "Rooms can now be booked right on the site — pick the format, dates, and number of guests.",
    },
    body: {
      ru: [
        "На странице бронирования можно выбрать, что бронируете: дневной отдых на топчане, глэмпинг (A-frame) или просторный коттедж.",
        "Укажите даты и число гостей, оставьте контакты — администратор подтвердит бронь в ближайшее время. Скоро добавим онлайн-бронирование с мгновенным подтверждением.",
      ],
      uz: [
        "Bron sahifasida nimani bron qilishni tanlashingiz mumkin: topchanda kunlik dam, glemping (A-frame) yoki keng kottej.",
        "Sana va mehmonlar sonini ko'rsating, kontaktlaringizni qoldiring — administrator bronni tez orada tasdiqlaydi. Tez orada darhol tasdiqlovchi onlayn-bron qo'shamiz.",
      ],
      en: [
        "On the booking page you can choose what to book: a day visit on a topchan, glamping (A-frame), or a spacious cottage.",
        "Set the dates and guest count, leave your contacts — our team confirms shortly. Instant online booking is coming soon.",
      ],
    },
  },
  {
    slug: "summer-season-open",
    date: "2026-05-15",
    image: "nature",
    category: { ru: "Сезон", uz: "Mavsum", en: "Season" },
    title: {
      ru: "Летний сезон открыт — ждём в горах",
      uz: "Yozgi mavsum ochildi — tog'larda kutamiz",
      en: "Summer season is open — see you in the mountains",
    },
    excerpt: {
      ru: "Комплекс работает ежедневно с 08:00 до 18:00: топчаны, мангал, казан, дрова и кухня с готовым меню.",
      uz: "Majmua har kuni 08:00 dan 18:00 gacha ishlaydi: topchanlar, mangal, qozon, o'tin va tayyor menyuli oshxona.",
      en: "Open daily 08:00–18:00: topchans, BBQ, kazan, firewood, and a kitchen with a ready-made menu.",
    },
    body: {
      ru: [
        "Чистый горный воздух на высоте 1700 м и всего 45 минут от Ташкента. Арендуйте топчан с курпачами на компанию до 8 человек, готовьте на мангале или закажите блюда из кухни.",
        "Дрова и уголь — на месте. Парковка рядом. Приезжайте семьёй или с друзьями на целый день.",
      ],
      uz: [
        "1700 m balandlikdagi toza tog' havosi va Toshkentdan atigi 45 daqiqa. 8 kishigacha bo'lgan davra uchun kurpachali topchan ijaraga oling, mangalda pishiring yoki oshxonadan taom buyurtma qiling.",
        "O'tin va ko'mir joyida. Yaqin atrofda parking. Oila yoki do'stlar bilan butun kunga keling.",
      ],
      en: [
        "Clean mountain air at 1,700 m, just 45 minutes from Tashkent. Rent a topchan with kurpacha cushions for a group of up to 8, cook on the BBQ, or order from the kitchen.",
        "Firewood and charcoal on site. Parking nearby. Come with family or friends for the whole day.",
      ],
    },
  },
  {
    slug: "what-to-do",
    date: "2026-06-01",
    image: "cottage",
    category: { ru: "Отдых", uz: "Dam olish", en: "Leisure" },
    title: {
      ru: "Виды отдыха на территории",
      uz: "Hududdagi dam olish turlari",
      en: "Types of rest on the grounds",
    },
    excerpt: {
      ru: "Топчаны, зоны барбекю, казан, пикник, кухня и активности — собрали всё, чем можно заняться за день.",
      uz: "Topchanlar, barbekyu zonalari, qozon, piknik, oshxona va faoliyatlar — bir kunda nima qilish mumkinligini jamladik.",
      en: "Topchans, BBQ zones, kazan, picnic, kitchen, and activities — everything to do in a day.",
    },
    body: {
      ru: [
        "Дневной отдых: топчан с курпачами, мангал и казан, зона пикника, готовое меню из кухни и ресторан.",
        "Для ночёвки — глэмпинг с панорамным остеклением и коттедж для семьи или компании. Рядом — горные маршруты, прогулки и виды на Чимган.",
      ],
      uz: [
        "Kunlik dam: kurpachali topchan, mangal va qozon, piknik zonasi, oshxonadan tayyor menyu va restoran.",
        "Tunash uchun — panorama oynali glemping va oila yoki davra uchun kottej. Yaqin atrofda tog' marshrutlari, sayrlar va Chimg'on manzaralari.",
      ],
      en: [
        "Day visit: a topchan with kurpacha, BBQ and kazan, a picnic zone, a ready-made kitchen menu, and a restaurant.",
        "For overnight — glamping with panoramic glazing and a cottage for a family or group. Nearby: mountain trails, walks, and Chimgan views.",
      ],
    },
  },
];
