import type { LocalizedString } from "./types";

export type Promotion = {
  title: LocalizedString;
  description: LocalizedString;
  badge: LocalizedString;
};

export const promotions: Promotion[] = [
  {
    badge: { ru: "Сезонное предложение", uz: "Mavsumiy taklif", en: "Seasonal offer" },
    title: {
      ru: "Раннее бронирование выходных",
      uz: "Dam olish kunlarini erta bron qilish",
      en: "Early weekend booking",
    },
    description: {
      ru: "Забронируйте проживание заранее и получите приоритетный выбор размещения и посадочных зон.",
      uz: "Joylashuvni oldindan bron qiling va turar joy hamda o'tirish zonalarini ustuvor tanlang.",
      en: "Book your stay in advance and get priority choice of accommodation and lounge zones.",
    },
  },
  {
    badge: { ru: "Для семей", uz: "Oilalar uchun", en: "For families" },
    title: {
      ru: "Шале + активности на день",
      uz: "Shale + bir kunlik faoliyatlar",
      en: "Chalet plus day activities",
    },
    description: {
      ru: "Соберите семейный маршрут с проживанием, рестораном, детской зоной и прогулкой.",
      uz: "Yashash, restoran, bolalar zonasi va sayr bilan oilaviy marshrut tuzing.",
      en: "Build a family itinerary with a stay, restaurant, kids zone, and a walk.",
    },
  },
  {
    badge: { ru: "Будни", uz: "Ish kunlari", en: "Weekdays" },
    title: {
      ru: "Тихий день на природе",
      uz: "Tabiat qo'ynida sokin kun",
      en: "A quiet day in nature",
    },
    description: {
      ru: "Идеально для топчана, ресторана и короткой перезагрузки без ночёвки.",
      uz: "Topchan, restoran va tunamasdan qisqa hordiq uchun ideal.",
      en: "Ideal for tapchan lounging, the restaurant, and a short reset without an overnight stay.",
    },
  },
];
