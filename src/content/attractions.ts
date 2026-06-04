import { resortImages } from "./images";
import type { LocalizedString } from "./types";

export type Attraction = {
  title: LocalizedString;
  distance: LocalizedString;
  description: LocalizedString;
  image: keyof typeof resortImages;
};

export const attractions: Attraction[] = [
  {
    title: { ru: "Горы Чимган", uz: "Chimyon tog'lari", en: "Chimgan mountains" },
    distance: { ru: "рядом с курортом", uz: "kurort yaqinida", en: "near the resort" },
    image: "chimganMountains",
    description: {
      ru: "Маршруты, виды и сезонные активности для гостей, которые хотят добавить к отдыху горный сценарий.",
      uz: "Dam olishga tog' ssenariysini qo'shishni istagan mehmonlar uchun marshrutlar, manzaralar va mavsumiy faoliyatlar.",
      en: "Routes, views, and seasonal activities for guests who want a mountain layer in their stay.",
    },
  },
  {
    title: { ru: "Канатные дороги", uz: "Kanat yo'llari", en: "Cable cars" },
    distance: { ru: "короткая поездка", uz: "qisqa yo'l", en: "short drive" },
    image: "cableCars",
    description: {
      ru: "Подходят для семейных прогулок и панорамных кадров в течение дня.",
      uz: "Oilaviy sayrlar va kun davomida panorama suratlar uchun mos.",
      en: "Good for family walks and panoramic photos during the day.",
    },
  },
  {
    title: { ru: "Горные прогулки", uz: "Tog' sayrlari", en: "Mountain walks" },
    distance: { ru: "от территории", uz: "hududdan", en: "from the territory" },
    image: "mountainWalks",
    description: {
      ru: "Легкие маршруты можно совместить с завтраком, топчаном или ужином в ресторане.",
      uz: "Yengil marshrutlarni nonushta, topchan yoki restorandagi kechki ovqat bilan birlashtirish mumkin.",
      en: "Gentle routes can be paired with breakfast, a tapchan lounge, or dinner at the restaurant.",
    },
  },
  {
    title: { ru: "Конные прогулки", uz: "Ot minish", en: "Horse riding" },
    distance: { ru: "по запросу", uz: "so'rov bo'yicha", en: "on request" },
    image: "horseRiding",
    description: {
      ru: "Сезонный формат для гостей, которым нужен более живой контакт с природой.",
      uz: "Tabiat bilan yanada jonli aloqa istagan mehmonlar uchun mavsumiy format.",
      en: "A seasonal format for guests who want closer contact with nature.",
    },
  },
];
