import { resortImages } from "./images";
import type { LocalizedString } from "./types";

export type HomeShowcaseItem = {
  image: keyof typeof resortImages;
  title: LocalizedString;
  copy: LocalizedString;
};

export const homeShowcase: HomeShowcaseItem[] = [
  {
    image: "territoryAerial",
    title: {
      ru: "Территория, где весь день собирается в одном месте",
      uz: "Butun kun bir hududda jamlanadigan maskan",
      en: "A territory where the whole day comes together",
    },
    copy: {
      ru: "Проживание, бассейн, ресторан, спорт, прогулки и зоны отдыха связаны короткими маршрутами.",
      uz: "Yashash, basseyn, restoran, sport, sayr va dam olish zonalari qisqa yo'llar bilan bog'langan.",
      en: "Stays, pool, restaurant, sport, walks, and lounge zones are connected by short routes.",
    },
  },
  {
    image: "poolLifestyle",
    title: {
      ru: "Бассейн как центр летнего отдыха",
      uz: "Yozgi dam olish markazi sifatida basseyn",
      en: "The pool as the center of summer rest",
    },
    copy: {
      ru: "Шезлонги, тень, ресторан рядом и мягкий вечерний сценарий для гостей.",
      uz: "Shezlonglar, soya, yaqin restoran va mehmonlar uchun sokin kechki ssenariy.",
      en: "Loungers, shade, restaurant nearby, and a relaxed evening scenario for guests.",
    },
  },
  {
    image: "glampingDay",
    title: {
      ru: "A-frame глэмпинг и коттеджи с приватностью",
      uz: "Maxfiylikka ega A-frame glemping va kottejlar",
      en: "Private A-frame glamping and cottages",
    },
    copy: {
      ru: "Форматы размещения выглядят как отдельный продукт с собственным настроением и CTA.",
      uz: "Joylashuv formatlari o'z kayfiyati va CTA bilan alohida mahsulot sifatida ko'rinadi.",
      en: "Accommodation formats feel like distinct products with their own mood and CTA.",
    },
  },
];
