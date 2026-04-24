import type { LocalizedString } from "./types";

export const contacts = {
  phone: "+998 90 000 00 00",
  email: "info@chimgansoy.uz",
  whatsapp: "https://wa.me/998900000000",
  telegram: "https://t.me/BayanShirinCMO",
  googleMapsUrl: "https://maps.app.goo.gl/AE7scBBU9DykP3st5",
  address: {
    ru: "База отдыха Сурпа, Бостанлыкский район, Ташкентская область",
    uz: "Surpa dam olish oromgohi, Bo'stonliq tumani, Toshkent viloyati",
    en: "Surpa dam olish oromgohi, Bostanlyk district, Tashkent region",
  } satisfies LocalizedString,
  shortAddress: {
    ru: "Ташкентская область",
    uz: "Toshkent viloyati",
    en: "Tashkent region",
  } satisfies LocalizedString,
  schedule: {
    ru: "Ежедневно, 09:00-22:00",
    uz: "Har kuni, 09:00-22:00",
    en: "Daily, 09:00-22:00",
  } satisfies LocalizedString,
  mapCoordinates: "41.5193897, 69.9904599",
};
