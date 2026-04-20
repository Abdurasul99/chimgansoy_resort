import type { LocalizedString } from "./types";

export const googleMapsIntegration = {
  mapsUrl: "https://maps.app.goo.gl/AE7scBBU9DykP3st5",
  coordinates: {
    lat: 41.5193897,
    lng: 69.9904599,
  },
  placeName: {
    ru: "Surpa dam olish oromgohi",
    uz: "Surpa dam olish oromgohi",
    en: "Surpa dam olish oromgohi",
  } satisfies LocalizedString,
};

export const bnovoIntegration = {
  helpUrl: "https://help.bnovo.ru/knowledgebase/bookingengine-widget/",
  productUrl: "https://bnovo.ru/bnovo-mb/",
  env: {
    iframeUrl: "NEXT_PUBLIC_BNOVO_IFRAME_URL",
    uid: "NEXT_PUBLIC_BNOVO_UID",
  },
};
