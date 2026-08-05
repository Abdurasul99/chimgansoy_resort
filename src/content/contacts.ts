import type { LocalizedString } from "./types";

export const contacts = {
  phone: "+998 70 176 00 11",
  email: "info@chimgandarbaza.uz",
  whatsapp: "https://wa.me/998701760011",
  telegram: "https://t.me/+998701760011",
  instagram: "https://www.instagram.com/chimgandarbaza/",
  googleMapsUrl: "https://maps.app.goo.gl/x2WWhzho3Pob6oD46",
  // Yandex is the default navigator for most guests arriving from Tashkent, so
  // the concierge offers both. Built from mapCoordinates below — Yandex takes
  // longitude first, which is the easy thing to get backwards here.
  yandexMapsUrl: "https://yandex.uz/maps/?pt=69.9904599,41.5193897&z=17&l=map",
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
  // Was "Ежедневно, 08:00–18:00" — the day-visit window, and day visits are
  // closed. Reception is staffed round the clock (three administrators on a
  // 6/1 rota: two on 09:00–21:00, one on 21:00–09:00), which is why the site
  // can promise a 24-hour desk and why Booking's check-in window runs late.
  schedule: {
    ru: "Ресепшн круглосуточно · заезд с 15:00, выезд до 12:00",
    uz: "Resepshn 24 soat · kirish 15:00 dan, chiqish 12:00 gacha",
    en: "Reception open 24/7 · check-in from 15:00, check-out by 12:00",
  } satisfies LocalizedString,
  mapCoordinates: "41.5193897, 69.9904599",
};
