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
      ru: "20 домиков на 9 гектарах в горах",
      uz: "Tog'larda 9 gektarda 20 uycha",
      en: "20 cabins on nine hectares in the mountains",
    },
    copy: {
      ru: "Десять глэмпингов A-frame и десять шале с двумя спальнями. На территории — бассейн 680 м², летний ресторан, пикник-зона и тюбинг-горка. Бассейн включён в проживание, тюбинг — 2 прокатки гостям глэмпинга и 4 гостям шале.",
      uz: "O'nta A-frame glemping va ikki yotoqxonali o'nta shale. Hududda — 680 m² basseyn, yozgi restoran, piknik zonasi va tubing gorkasi. Basseyn yashash narxiga kiritilgan, tubing — glemping mehmonlariga 2, shale mehmonlariga 4 marta uchish.",
      en: "Ten A-frame glamping cabins and ten two-bedroom chalets. On the grounds: a 680 m² pool, a summer restaurant, a picnic area and the tubing hill. The pool comes with every stay, and tubing is included — 2 rides with glamping, 4 with a chalet.",
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
