import { resortImages } from "./images";
import type { LocalizedString } from "./types";

export type HomeShowcaseItem = {
  image: keyof typeof resortImages;
  title: LocalizedString;
  copy: LocalizedString;
};

/**
 * The two full-bleed editorial frames under the numbers band, plus a third
 * used on inner pages. They carry the resort story now — the stay first, the
 * grounds second — rather than the day-use pitch they used to make. Frames
 * come from the finished-cabin shoots for the same reason: the homepage should
 * show the thing a guest actually books.
 */
export const homeShowcase: HomeShowcaseItem[] = [
  {
    image: "aframeLawnBanner",
    title: {
      ru: "Двадцать домиков на шести гектарах в горах",
      uz: "Tog'larda olti gektarda yigirma uycha",
      en: "Twenty cabins on six hectares in the mountains",
    },
    copy: {
      ru: "Десять A-frame для двоих-троих и десять шале с двумя спальнями. Каждый домик — отдельный, со своей террасой и видом на хребет. Бассейн включён в проживание.",
      uz: "Ikki-uch kishilik o'nta A-frame va ikki yotoqxonali o'nta shale. Har bir uycha alohida — o'z terrasasi va tizma manzarasi bilan. Basseyn narxga kiritilgan.",
      en: "Ten A-frames for two or three, and ten two-bedroom chalets. Each cabin stands alone, with its own terrace and a view of the ridge. The pool comes with the stay.",
    },
  },
  {
    image: "chaletLounge",
    title: {
      ru: "Шале с кухней-залом — для семьи и компании",
      uz: "Oshxona-zalli shale — oila va do'stlar uchun",
      en: "A chalet with a kitchen-lounge — for family and friends",
    },
    copy: {
      ru: "Две спальни с собственными санузлами, кухня-зал с диваном, тёплый пол и терраса 35 м². До 5 гостей.",
      uz: "Alohida sanuzelli ikkita yotoqxona, divanli oshxona-zal, issiq pol va 35 m² terrasa. 5 mehmongacha.",
      en: "Two bedrooms with ensuite bathrooms, a kitchen-lounge with a sofa, heated floors, and a 35 m² terrace. Up to 5 guests.",
    },
  },
  {
    image: "aframeTerraceView",
    title: {
      ru: "Горы Чимгана начинаются за террасой",
      uz: "Chimgon tog'lari terrasa ortidan boshlanadi",
      en: "The Chimgan range starts off your terrace",
    },
    copy: {
      ru: "Пешие маршруты, конные прогулки и канатные дороги — в нескольких минутах от домика. Администратор подскажет сезонные варианты.",
      uz: "Piyoda marshrutlar, ot minish va kanat yo'llari — uychadan bir necha daqiqa masofada. Administrator mavsumiy variantlarni aytadi.",
      en: "Walking trails, horse rides, and cable cars — minutes from your cabin. The team can suggest what's best this season.",
    },
  },
];
