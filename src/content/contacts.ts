import type { LocalizedString } from "./types";

export const contacts = {
  phone: "+998 90 000 00 00",
  email: "info@chimgansoy.uz",
  whatsapp: "https://wa.me/998900000000",
  telegram: "https://t.me/chimgansoy",
  address: {
    ru: "Ташкентская область, Бостанлыкский район, курортная территория Чимгансой",
    uz: "Toshkent viloyati, Bo'stonliq tumani, Chimgansoy kurort hududi",
    en: "Chimgansoy resort area, Bostanlyk district, Tashkent region",
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
  mapCoordinates: "41.54, 70.02",
};
