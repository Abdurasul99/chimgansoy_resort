import type { LocalizedString } from "./types";

export type ResortPhotoPlanItem = {
  fileName: string;
  targetKey: string;
  placement: LocalizedString;
  notes: LocalizedString;
};

export const resortPhotoPlan: ResortPhotoPlanItem[] = [
  {
    fileName: "01-aerial-masterplan-day.jpg",
    targetKey: "hero",
    placement: {
      ru: "Главный hero, About, территория",
      uz: "Asosiy hero, About, hudud",
      en: "Main hero, About, territory",
    },
    notes: {
      ru: "Лучший общий вид: сразу показывает масштаб, бассейн, домики, дорогу и природу.",
      uz: "Eng yaxshi umumiy ko'rinish: masshtab, basseyn, uylar, yo'l va tabiatni ko'rsatadi.",
      en: "Best overall view: shows scale, pool, cabins, road, and nature.",
    },
  },
  {
    fileName: "02-aerial-full-territory.jpg",
    targetKey: "territory",
    placement: {
      ru: "Блок территории, галерея, страница О курорте",
      uz: "Hudud bloki, galereya, kurort haqida sahifa",
      en: "Territory block, gallery, About page",
    },
    notes: {
      ru: "Подходит для объяснения логики территории и инфраструктуры.",
      uz: "Hudud va infratuzilma mantiqini tushuntirish uchun mos.",
      en: "Works for explaining the territory and infrastructure layout.",
    },
  },
  {
    fileName: "03-reception-restaurant-day.jpg",
    targetKey: "restaurant",
    placement: {
      ru: "Ресторан, контакты, ресепшен",
      uz: "Restoran, aloqa, resepshn",
      en: "Restaurant, contacts, reception",
    },
    notes: {
      ru: "Дневной экстерьер основного здания и посадочной зоны.",
      uz: "Asosiy bino va o'tirish hududining kunduzgi eksteryeri.",
      en: "Day exterior of the main building and seating area.",
    },
  },
  {
    fileName: "04-tapchan-zone-aerial.jpg",
    targetKey: "tapchan",
    placement: {
      ru: "Топчаны, пикник, дневной визит",
      uz: "Topchanlar, piknik, kunlik tashrif",
      en: "Tapchan zones, picnic, day visit",
    },
    notes: {
      ru: "Хорошо показывает повторяемые посадочные зоны и приватность.",
      uz: "Takroriy o'tirish zonalari va xususiylikni yaxshi ko'rsatadi.",
      en: "Shows repeated seating zones and privacy well.",
    },
  },
  {
    fileName: "05-sport-parking-aerial.jpg",
    targetKey: "sport",
    placement: {
      ru: "Падел, мини-футбол, workout, парковка",
      uz: "Padel, mini futbol, workout, parking",
      en: "Padel, mini football, workout, parking",
    },
    notes: {
      ru: "Лучше всего для спортивной инфраструктуры и удобства заезда.",
      uz: "Sport infratuzilmasi va kirish qulayligi uchun eng mos.",
      en: "Best for sport infrastructure and arrival convenience.",
    },
  },
  {
    fileName: "06-pool-evening-lifestyle.jpg",
    targetKey: "poolNight",
    placement: {
      ru: "Бассейн, промо, вечерний отдых",
      uz: "Basseyn, promo, kechki dam olish",
      en: "Pool, promo, evening resort mood",
    },
    notes: {
      ru: "Эмоциональный кадр для conversion-блоков и сезонных офферов.",
      uz: "Conversion bloklar va mavsumiy takliflar uchun hissiy kadr.",
      en: "Emotional image for conversion blocks and seasonal offers.",
    },
  },
  {
    fileName: "07-aframe-glamping-evening.jpg",
    targetKey: "glamping",
    placement: {
      ru: "Глэмпинг, карточка и детальная страница",
      uz: "Glemping, karta va detal sahifa",
      en: "Glamping card and detail page",
    },
    notes: {
      ru: "A-frame домики, вечерний свет и премиальная атмосфера.",
      uz: "A-frame uylar, kechki yorug'lik va premium muhit.",
      en: "A-frame cabins, evening light, and premium atmosphere.",
    },
  },
  {
    fileName: "08-cottage-evening-mountains.jpg",
    targetKey: "cottage",
    placement: {
      ru: "Коттедж, семейное размещение",
      uz: "Kottej, oilaviy joylashuv",
      en: "Cottage, family stay",
    },
    notes: {
      ru: "Лучший кадр для приватного проживания с видом на горы.",
      uz: "Tog' manzarali xususiy yashash uchun eng yaxshi kadr.",
      en: "Best frame for private stays with mountain views.",
    },
  },
  {
    fileName: "09-aerial-night-masterplan.jpg",
    targetKey: "nightHero",
    placement: {
      ru: "Вечерний hero, финальный CTA, галерея",
      uz: "Kechki hero, yakuniy CTA, galereya",
      en: "Evening hero, final CTA, gallery",
    },
    notes: {
      ru: "Показывает ночную подсветку, бассейн и маршрут заезда.",
      uz: "Tungi yoritish, basseyn va kirish yo'lini ko'rsatadi.",
      en: "Shows night lighting, pool, and arrival route.",
    },
  },
  {
    fileName: "10-entrance-night-surpa.jpg",
    targetKey: "entranceNight",
    placement: {
      ru: "Контакты, как добраться, ресторан",
      uz: "Aloqa, qanday borish, restoran",
      en: "Contacts, how to get there, restaurant",
    },
    notes: {
      ru: "Сильный кадр въезда и основного здания в вечернем свете.",
      uz: "Kirish va asosiy binoning kechki kuchli kadri.",
      en: "Strong arrival and main building image in evening light.",
    },
  },
  {
    fileName: "11-ev-parking-day.jpg",
    targetKey: "parking",
    placement: {
      ru: "Как добраться, парковка, инфраструктура",
      uz: "Qanday borish, parking, infratuzilma",
      en: "How to get there, parking, infrastructure",
    },
    notes: {
      ru: "Кадр для практической информации и страницы маршрута.",
      uz: "Amaliy ma'lumot va marshrut sahifasi uchun kadr.",
      en: "Image for practical info and route page.",
    },
  },
  {
    fileName: "12-entrance-day-surpa.jpg",
    targetKey: "entranceDay",
    placement: {
      ru: "Контакты, первый экран внутренней страницы",
      uz: "Aloqa, ichki sahifa birinchi ekrani",
      en: "Contacts, inner page hero",
    },
    notes: {
      ru: "Четкий дневной въезд с вывеской и главным зданием.",
      uz: "Peshlavha va asosiy bino bilan aniq kunduzgi kirish.",
      en: "Clear daytime arrival with signage and main building.",
    },
  },
  {
    fileName: "13-reception-day.jpg",
    targetKey: "reception",
    placement: {
      ru: "О курорте, контакты, ресепшен",
      uz: "Kurort haqida, aloqa, resepshn",
      en: "About, contacts, reception",
    },
    notes: {
      ru: "Подходит для доверия: ресепшен, транспорт внутри территории, ухоженный ландшафт.",
      uz: "Ishonch uchun mos: resepshn, hudud transporti, obodonlashtirilgan landshaft.",
      en: "Works for trust: reception, internal transport, maintained landscape.",
    },
  },
  {
    fileName: "14-aframe-glamping-day.jpg",
    targetKey: "glampingDay",
    placement: {
      ru: "Галерея глэмпинга, карточка, about",
      uz: "Glemping galereyasi, karta, about",
      en: "Glamping gallery, card, about",
    },
    notes: {
      ru: "Дневная версия глэмпинга, лучше для светлых карточек.",
      uz: "Glempingning kunduzgi versiyasi, yorug' kartalar uchun mos.",
      en: "Day version of glamping, better for bright cards.",
    },
  },
  {
    fileName: "15-pool-aerial.jpg",
    targetKey: "pool",
    placement: {
      ru: "Бассейн, галерея, услуги",
      uz: "Basseyn, galereya, xizmatlar",
      en: "Pool, gallery, services",
    },
    notes: {
      ru: "Лучший продуктовый кадр бассейна и cabana-зон.",
      uz: "Basseyn va cabana zonalarining eng yaxshi mahsulot kadri.",
      en: "Best product image of the pool and cabana zones.",
    },
  },
  {
    fileName: "16-pool-day-lifestyle.jpg",
    targetKey: "poolLifestyle",
    placement: {
      ru: "Летний отдых, промо, бассейн",
      uz: "Yozgi dam olish, promo, basseyn",
      en: "Summer rest, promo, pool",
    },
    notes: {
      ru: "Живой кадр для летнего предложения и домашнего блока услуг.",
      uz: "Yozgi taklif va bosh sahifa xizmatlar bloki uchun jonli kadr.",
      en: "Lifestyle image for summer offer and home services block.",
    },
  },
  {
    fileName: "17-workout-padel-zone.jpg",
    targetKey: "workout",
    placement: {
      ru: "Workout, падел, спорт",
      uz: "Workout, padel, sport",
      en: "Workout, padel, sport",
    },
    notes: {
      ru: "Показывает спортивную зону на фоне гор.",
      uz: "Tog'lar fonidagi sport zonasini ko'rsatadi.",
      en: "Shows the sport area against the mountains.",
    },
  },
  {
    fileName: "18-cottage-day-mountains.jpg",
    targetKey: "cottageDay",
    placement: {
      ru: "Коттедж, галерея, семейное размещение",
      uz: "Kottej, galereya, oilaviy joylashuv",
      en: "Cottage, gallery, family stay",
    },
    notes: {
      ru: "Дневной кадр коттеджей для карточек и галереи.",
      uz: "Kartalar va galereya uchun kottejlarning kunduzgi kadri.",
      en: "Day cottage image for cards and gallery.",
    },
  },
];
