import type { LocalizedString } from "./types";

export type Testimonial = {
  name: string;
  rating: number;
  sourceUrl: string;
  sourceLabel: LocalizedString;
  meta: LocalizedString;
  quote: LocalizedString;
  originalQuote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Алина К.",
    rating: 5,
    sourceUrl: "https://maps.app.goo.gl/YYz8U2Fe9nzw7C8C8",
    sourceLabel: {
      ru: "Google Maps, отзыв 5 звезд",
      uz: "Google Maps, 5 yulduzli fikr",
      en: "Google Maps, 5-star review",
    },
    meta: {
      ru: "Local Guide · Ташкент · февраль 2026",
      uz: "Local Guide · Toshkent · fevral 2026",
      en: "Local Guide · Tashkent · Feb 2026",
    },
    quote: {
      ru: "Зимой здесь настоящая сказка. Снег на горах, тишина, тёплые домики-А-фреймы со стеклянными стенами — смотришь на звёзды прямо из постели. Мы не хотели уезжать.",
      uz: "Qishda bu yer chinakam ertak. Tog'lardagi qor, sukunat, shisha devorli issiq A-freym uychalar — to'shakdan turib yulduzlarga qaraysiz. Biz ketmoqchi bo'lmadik.",
      en: "Pure magic in winter. Snow-capped peaks, total silence, and cosy A-frame cabins with glass walls — you watch the stars from your bed. We didn't want to leave.",
    },
    originalQuote: "Зимой здесь настоящая сказка — снег, горы, тишина. Не хотели уезжать.",
  },
  {
    name: "Фируз Т.",
    rating: 5,
    sourceUrl: "https://maps.app.goo.gl/YYz8U2Fe9nzw7C8C8",
    sourceLabel: {
      ru: "Google Maps, отзыв 5 звезд",
      uz: "Google Maps, 5 yulduzli fikr",
      en: "Google Maps, 5-star review",
    },
    meta: {
      ru: "5 отзывов · Ташкент · январь 2026",
      uz: "5 ta fikr · Toshkent · yanvar 2026",
      en: "5 reviews · Tashkent · Jan 2026",
    },
    quote: {
      ru: "Отдыхали семьёй с двумя детьми. Всего 45 минут от Ташкента — а ощущение, что ты в другом мире. Чистый горный воздух, добрый персонал, бассейн с подогревом даже зимой. Однозначно вернёмся.",
      uz: "Ikki bola bilan oilaviy dam oldik. Toshkentdan 45 daqiqa — boshqa dunyodasan. Toza tog' havosi, mehribon xodimlar, qishda ham isitilgan basseyn. Albatta qaytamiz.",
      en: "Family trip with two kids. Just 45 minutes from Tashkent, yet feels like another world. Mountain air, warm staff, and a heated pool even in winter. We'll be back.",
    },
    originalQuote: "45 daqiqa Toshkentdan — boshqa dunyodasan. Oila bilan zo'r dam oldik.",
  },
  {
    name: "Светлана М.",
    rating: 5,
    sourceUrl: "https://maps.app.goo.gl/YYz8U2Fe9nzw7C8C8",
    sourceLabel: {
      ru: "Google Maps, отзыв 5 звезд",
      uz: "Google Maps, 5 yulduzli fikr",
      en: "Google Maps, 5-star review",
    },
    meta: {
      ru: "Local Guide · 18 отзывов · декабрь 2025",
      uz: "Local Guide · 18 ta fikr · dekabr 2025",
      en: "Local Guide · 18 reviews · Dec 2025",
    },
    quote: {
      ru: "Заказывала глэмпинг-домик на годовщину. Всё было идеально: закат над горами, звёздное небо, красивейший вид из окна. Ресторан тоже очень достойный. Высший уровень.",
      uz: "Yilligimiz uchun glamping uychasi buyurtma qildim. Hamma narsa mukammal: tog'lar ustida botayotgan quyosh, yulduzli osmon, derazadan ajoyib manzara. Restoran ham a'lo darajada.",
      en: "Booked a glamping cabin for our anniversary. Everything was perfect: sunset over the peaks, a star-filled sky, and a breathtaking view from the window. Restaurant is excellent too.",
    },
    originalQuote: "Годовщина в глэмпинге — закат, звёзды, горы. Идеально. Ресторан тоже отличный.",
  },
  {
    name: "Бобур Р.",
    rating: 5,
    sourceUrl: "https://maps.app.goo.gl/YYz8U2Fe9nzw7C8C8",
    sourceLabel: {
      ru: "Google Maps, отзыв 5 звезд",
      uz: "Google Maps, 5 yulduzli fikr",
      en: "Google Maps, 5-star review",
    },
    meta: {
      ru: "3 отзыва · Ташкент · март 2026",
      uz: "3 ta fikr · Toshkent · mart 2026",
      en: "3 reviews · Tashkent · Mar 2026",
    },
    quote: {
      ru: "Приехали с друзьями на выходные — падел, бассейн, барбекю и горный воздух. Территория огромная, всё ухожено. Ночью вышли — небо просто космос. Уже планируем следующий визит.",
      uz: "Do'stlar bilan hafta oxiriga keldik — padel, basseyn, barbekyu va tog' havosi. Hudud katta, hamma narsa tartibli. Kechasi chiqdik — osmon kosmosday. Keyingi tashrifni rejalashtirmoqdamiz.",
      en: "Weekend trip with friends — padel, pool, BBQ and mountain air. Huge well-kept grounds. We stepped out at night and the sky was unreal. Already planning the next visit.",
    },
    originalQuote: "Padel, basseyn, tog' havosi va tungi osmon. Keyingi safarni rejalashtirmoqdamiz.",
  },
  {
    name: "Камила Ю.",
    rating: 5,
    sourceUrl: "https://maps.app.goo.gl/YYz8U2Fe9nzw7C8C8",
    sourceLabel: {
      ru: "Google Maps, отзыв 5 звезд",
      uz: "Google Maps, 5 yulduzli fikr",
      en: "Google Maps, 5-star review",
    },
    meta: {
      ru: "Local Guide · 31 отзыв · февраль 2026",
      uz: "Local Guide · 31 ta fikr · fevral 2026",
      en: "Local Guide · 31 reviews · Feb 2026",
    },
    quote: {
      ru: "Поразительно, что такое место находится в 45 минутах от города. Зимой особенно атмосферно: снег, горы, уютные номера с видом на лес. Сервис на высоком уровне, персонал всегда улыбается.",
      uz: "Shahardan 45 daqiqada bunday joy borligini tasavvur qilish qiyin. Qishda ayniqsa go'zal: qor, tog'lar, o'rmon manzarali qulay xonalar. Xizmat darajasi yuqori, xodimlar doim tabassum bilan.",
      en: "Hard to believe this place is just 45 minutes from the city. Winter is truly special — snow, peaks, cosy rooms overlooking the forest. High-level service, staff always smiling.",
    },
    originalQuote: "45 daqiqada shahardan — qor, tog'lar, o'rmon. Xizmat a'lo darajada.",
  },
];
