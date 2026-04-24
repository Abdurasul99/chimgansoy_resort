import type { LocalizedString } from "./types";

export type Testimonial = {
  name: string;
  meta: LocalizedString;
  quote: LocalizedString;
};

export const testimonials: Testimonial[] = [
  {
    name: "Dilnoza",
    meta: { ru: "семейный отдых · август 2025", uz: "oilaviy dam olish · avgust 2025", en: "family stay · August 2025" },
    quote: {
      ru: "Дети впервые увидели настоящие горы — и не хотели уезжать. Топчан, тишина, воздух. Мы вернёмся.",
      uz: "Bolalar haqiqiy tog'larni birinchi marta ko'rishdi — va ketishni xohlamadi. Topchan, jimjitlik, havo. Qaytib kelamiz.",
      en: "Our kids saw real mountains for the first time — and didn't want to leave. The tapchan, the silence, the air. We'll be back.",
    },
  },
  {
    name: "Азиз",
    meta: { ru: "выезд с командой · июль 2025", uz: "jamoa bilan sayohat · iyul 2025", en: "team outing · July 2025" },
    quote: {
      ru: "Двадцать человек, один день — и все в восторге. Гриль, бассейн, виды. Уже договорились вернуться с ночёвкой.",
      uz: "Yigirma kishi, bir kun — va hammasi hayratda. Gril, basseyn, manzaralar. Allaqachon tunab qolishga qaytishga kelishib oldik.",
      en: "Twenty people, one day — everyone loved it. BBQ, pool, views. We've already planned to come back for an overnight stay.",
    },
  },
  {
    name: "Марина",
    meta: { ru: "короткий отпуск · июнь 2025", uz: "qisqa ta'til · iyun 2025", en: "short break · June 2025" },
    quote: {
      ru: "Глэмпинг — это не палатка. Это кровать, душ и горы за окном. Именно то, что нужно уставшему городу.",
      uz: "Glemping — bu chodir emas. Bu karavot, dush va derazadan ko'rinadigan tog'lar. Charchagan shahar uchun aynan kerak narsa.",
      en: "Glamping isn't a tent. It's a real bed, a shower, and mountains outside the window. Exactly what a tired city needs.",
    },
  },
  {
    name: "Камола",
    meta: { ru: "романтическая поездка · май 2025", uz: "romantik sayohat · may 2025", en: "romantic trip · May 2025" },
    quote: {
      ru: "Ни телефона, ни суеты — только горы, закат и мы двое. Редкое ощущение, что время остановилось.",
      uz: "Na telefon, na shov-shuv — faqat tog'lar, sunset va ikkalamiz. Vaqt to'xtab qolganday — bu his kamdan-kam bo'ladi.",
      en: "No phone, no rush — just mountains, a sunset, and the two of us. A rare feeling that time has simply stopped.",
    },
  },
  {
    name: "Дмитрий",
    meta: { ru: "отдых с семьёй · апрель 2025", uz: "oila bilan dam olish · aprel 2025", en: "family retreat · April 2025" },
    quote: {
      ru: "45 минут от Ташкента — а ощущение, что на другой планете. Чистый воздух, пение птиц, никакого шума города.",
      uz: "Toshkentdan 45 daqiqa — lekin boshqa sayyoradagi his. Toza havo, qushlar sayrashi, shahar shovqini yo'q.",
      en: "45 minutes from Tashkent — yet it feels like another world. Clean air, birdsong, not a trace of city noise.",
    },
  },
  {
    name: "Нодира",
    meta: { ru: "день с детьми · сентябрь 2025", uz: "bolalar bilan kun · sentabr 2025", en: "day with kids · September 2025" },
    quote: {
      ru: "Место, где дети наконец оторвались от экранов. Пять часов на природе — и спят как убитые. Рекомендую всем родителям.",
      uz: "Bolalar nihoyat ekranlardan uzilgan joy. Tabiatda besh soat — va tosh qotib uxlaydi. Barcha ota-onalarga tavsiya qilaman.",
      en: "The place where kids finally put down their screens. Five hours outdoors — and they sleep like logs. Every parent should come here.",
    },
  },
];
