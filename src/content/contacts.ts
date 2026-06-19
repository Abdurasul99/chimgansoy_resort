import type { LocalizedString } from "./types";

export const contacts = {
  phone: "+998 70 176 00 11",
  email: "info@chimgandarbaza.uz",
  whatsapp: "https://wa.me/998701760011",
  telegram: "https://t.me/+998701760011",
  instagram: "https://www.instagram.com/chimgandarbaza/",
  googleMapsUrl: "https://maps.app.goo.gl/x2WWhzho3Pob6oD46",
  address: {
    ru: "Chimgan Darbaza, Бостанлыкский район, Ташкентская область",
    uz: "Chimgan Darbaza, Bo'stonliq tumani, Toshkent viloyati",
    en: "Chimgan Darbaza, Bostanlyk district, Tashkent region",
  } satisfies LocalizedString,
  shortAddress: {
    ru: "Ташкентская область",
    uz: "Toshkent viloyati",
    en: "Tashkent region",
  } satisfies LocalizedString,
  schedule: {
    ru: "Ежедневно, 08:00–18:00",
    uz: "Har kuni, 08:00–18:00",
    en: "Daily, 08:00–18:00",
  } satisfies LocalizedString,
  mapCoordinates: "41.5193897, 69.9904599",
};
