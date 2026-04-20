import type { ImageAsset } from "./types";

export const resortImages = {
  hero: {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85",
    alt: {
      ru: "Горный курорт среди зелени",
      uz: "Yashillik orasidagi tog' kurorti",
      en: "Mountain resort surrounded by greenery",
    },
  },
  glamping: {
    src: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Глэмпинг у леса",
      uz: "O'rmon yonidagi glemping",
      en: "Glamping stay by the forest",
    },
  },
  cottage: {
    src: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Уютный коттедж на природе",
      uz: "Tabiat qo'ynidagi shinam kottej",
      en: "Cozy nature cottage",
    },
  },
  pool: {
    src: "https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Открытый бассейн курорта",
      uz: "Kurortdagi ochiq basseyn",
      en: "Outdoor resort pool",
    },
  },
  tapchan: {
    src: "https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Зона отдыха с топчанами",
      uz: "Topchanli dam olish hududi",
      en: "Relaxing tapchan lounge area",
    },
  },
  picnic: {
    src: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Пикник на природе",
      uz: "Tabiat qo'ynidagi piknik",
      en: "Picnic in nature",
    },
  },
  restaurant: {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Ресторан с теплой атмосферой",
      uz: "Iliq muhitdagi restoran",
      en: "Restaurant with warm atmosphere",
    },
  },
  activity: {
    src: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Горная прогулка",
      uz: "Tog' sayri",
      en: "Mountain activity",
    },
  },
  tubing: {
    src: "https://images.unsplash.com/photo-1489674267075-cee793167910?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Зимняя трасса для тюбинга",
      uz: "Qishki tubing trassasi",
      en: "Winter tubing track",
    },
  },
  sport: {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Спортивная зона на свежем воздухе",
      uz: "Ochiq havodagi sport hududi",
      en: "Outdoor workout zone",
    },
  },
  padel: {
    src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Падел корт",
      uz: "Padel korti",
      en: "Padel court",
    },
  },
  kids: {
    src: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Детская площадка",
      uz: "Bolalar maydonchasi",
      en: "Kids playground",
    },
  },
  football: {
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Мини-футбольное поле",
      uz: "Mini futbol maydoni",
      en: "Mini football field",
    },
  },
  grill: {
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=85",
    alt: {
      ru: "Зона гриля и казана",
      uz: "Gril va qozon hududi",
      en: "Grill and kazan cooking zone",
    },
  },
  nature: {
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=85",
    alt: {
      ru: "Лесная территория курорта",
      uz: "Kurortning o'rmon hududi",
      en: "Forest resort territory",
    },
  },
  mountains: {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85",
    alt: {
      ru: "Горный пейзаж Ташкентской области",
      uz: "Toshkent viloyatining tog' manzarasi",
      en: "Mountain landscape of Tashkent region",
    },
  },
} satisfies Record<string, ImageAsset>;

export const galleryImages = [
  resortImages.hero,
  resortImages.nature,
  resortImages.glamping,
  resortImages.cottage,
  resortImages.pool,
  resortImages.restaurant,
  resortImages.activity,
  resortImages.mountains,
];
