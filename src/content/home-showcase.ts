import { resortImages } from "./images";
import type { LocalizedString } from "./types";

export type HomeShowcaseItem = {
  image: keyof typeof resortImages;
  title: LocalizedString;
  copy: LocalizedString;
};

export const homeShowcase: HomeShowcaseItem[] = [
  {
    image: "galTerritoryPanorama",
    title: {
      ru: "Дневной отдых, где весь день складывается в одном месте",
      uz: "Butun kun bitta hududda jamlanadigan kunlik dam",
      en: "A day visit where everything comes together in one place",
    },
    copy: {
      ru: "Топчаны, мангал, казан, готовое меню, прогулки и виды на Чимган — всё на 6 гектарах в 45 минутах от Ташкента.",
      uz: "Topchanlar, mangal, qozon, tayyor menyu, sayrlar va Chimgon manzaralari — 6 gektar hududda, Toshkentdan 45 daqiqada.",
      en: "Topchans, BBQ, kazan, ready-made menu, walks, and Chimgan views — all on six hectares, 45 minutes from Tashkent.",
    },
  },
  {
    image: "galTopchanPeaks",
    title: {
      ru: "Топчан с курпача — для всей компании",
      uz: "Kurpachali topchan — butun do'stlar uchun",
      en: "A topchan with kurpacha — for your whole group",
    },
    copy: {
      ru: "Приватный топчан до 8 человек в тени сосен. Курпача в комплекте, мангал и казан — в аренду рядом.",
      uz: "Qarag'aylar soyasidagi 8 kishigacha xususiy topchan. Kurpacha to'plami bilan, mangal va qozon yaqinda ijaraga.",
      en: "A private topchan for up to 8 guests in the shade of the pines. Kurpacha included; BBQ and kazan available to rent nearby.",
    },
  },
  {
    image: "galMountainView",
    title: {
      ru: "Горы Чимгана за порогом топчана",
      uz: "Topchan ostonangizdayoq Chimgon tog'lari",
      en: "The Chimgan range right at your doorstep",
    },
    copy: {
      ru: "Лёгкие пешие маршруты, конные прогулки и канатные дороги — добавьте активность к спокойному дню на природе.",
      uz: "Yengil piyoda marshrutlar, ot minish va kanat yo'llari — sokin tabiatdagi kunga faollik qo'shing.",
      en: "Easy walking trails, horse rides, and cable cars nearby — add a layer of activity to a slow day in nature.",
    },
  },
];
