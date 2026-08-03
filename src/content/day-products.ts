import type { resortImages } from "./images";
import type { LocalizedList, LocalizedString } from "./types";

/** Same key type the room catalogue uses, so a typo fails the build. */
export type ImageKey = keyof typeof resortImages;

/**
 * A video for the archive under a request form.
 *
 * `url` must be an embed URL on an external host (YouTube, Vimeo, Mux). Video
 * files are far too heavy to live in the repository, and Vercel would serve
 * them uncached from the function edge.
 */
export type VideoAsset = {
  url: string;
  title: LocalizedString;
};

export type DayProduct = {
  slug: "topchan" | "tubing";
  /** Key into content/images.ts for the page hero. */
  image: ImageKey;
  /** Keys into content/images.ts for the archive under the form. */
  gallery: ImageKey[];
  videos: VideoAsset[];
  title: LocalizedString;
  eyebrow: LocalizedString;
  lead: LocalizedString;
  description: LocalizedString;
  highlights: LocalizedList;
  /**
   * Sub-sections under the description, in the operator's own grouping.
   *
   * The topchan copy arrived as a leaflet with its own headings ("Что есть на
   * локации", "Для кого подходит"). Flattening that into one paragraph would
   * lose the structure a guest scans for, so the headings are kept as data.
   */
  sections?: { title: LocalizedString; body: LocalizedString }[];
};

export const dayProducts: DayProduct[] = [
  {
    slug: "topchan",
    // Real photography, unlike most of the pool set — these are the property's
    // own topchans, shot against the ridge.
    image: "galTopchanPeaks",
    gallery: [
      "galTopchanPeaks",
      "galTopchanRow",
      "galTopchanInside",
      "galTopchanSwing",
      "galTopchanRidge",
      "tapchanAerial",
    ],
    videos: [],
    title: { ru: "Топчан", uz: "Topchan", en: "Topchan" },
    eyebrow: {
      ru: "Отдых на день, без ночёвки",
      uz: "Bir kunlik dam, tunamasdan",
      en: "A day out, no overnight stay",
    },
    lead: {
      ru: "Свой топчан с курпачами на весь день — с видом на Чимганский хребет, мангалом рядом и кухней в двух шагах.",
      uz: "Kun bo'yi o'z topchaningiz kurpachalar bilan — Chimgon tizmasi manzarasi, yonida mangal va ikki qadamda oshxona.",
      en: "Your own topchan with kurpacha cushions for the whole day — facing the Chimgan ridge, a grill beside it and the kitchen two steps away.",
    },
    /**
     * The operator's own leaflet copy, supplied 2026-08-02 in Russian and
     * Uzbek; the English is a translation of the same text. Its own headings
     * are kept below in `sections` rather than merged into this paragraph.
     */
    description: {
      ru: "CHIMGAN DARBAZA — это место для комфортного отдыха в горах на высоте 1700 м. Гостей принимают ежедневно с 08:00 до 18:00. Топчан — традиционная деревянная платформа с курпачами: один рассчитан до 8 гостей и оплачивается целиком, а не с человека. Если вас больше, администратор соберёт рядом несколько. К топчану можно добавить доступ в бассейн.",
      uz: "CHIMGAN DARBAZA — 1700 metr balandlikdagi tog' dam olish maskani. Mehmonlar har kuni 08:00 dan 18:00 gacha qabul qilinadi. Topchan — kurpachali an'anaviy yog'och maydoncha: bittasi 8 kishigacha mo'ljallangan va bir kishidan emas, butunlay to'lanadi. Agar ko'proq bo'lsangiz, administrator yonma-yon bir nechtasini yig'adi. Topchanga basseynga kirishni qo'shish mumkin.",
      en: "CHIMGAN DARBAZA is a place for a comfortable day in the mountains at 1,700 m, receiving guests daily from 08:00 to 18:00. A topchan is a traditional raised wooden platform spread with kurpacha cushions: one seats up to 8 guests and is charged as a whole rather than per person. For a larger group the administrator puts several side by side. Pool access can be added to a topchan booking.",
    },
    highlights: {
      ru: [
        "До 8 гостей на один топчан",
        "Гостей принимают ежедневно с 08:00 до 18:00",
        "Мангал и казан в аренду, дрова и уголь на месте",
        "Свои продукты и свой мангал привозить можно",
      ],
      uz: [
        "Bitta topchanga 8 kishigacha",
        "Mehmonlar har kuni 08:00 dan 18:00 gacha qabul qilinadi",
        "Mangal va qozon ijaraga, o'tin va ko'mir joyida",
        "O'z mahsulotlaringiz va mangalingizni olib kelish mumkin",
      ],
      en: [
        "Up to 8 guests per topchan",
        "Guests received daily from 08:00 to 18:00",
        "Mangal and kazan to rent, firewood and charcoal on site",
        "You may bring your own food and your own grill",
      ],
    },
    sections: [
      {
        title: { ru: "Что есть на локации", uz: "Maskanda nimalar bor", en: "What's on site" },
        body: {
          ru: "Здесь можно заказать готовые блюда по меню и некоторые позиции по предзаказу. Для самостоятельного отдыха доступны аренда казана и мангала, а также продажа дров и угля. На территории также есть глэмпинг и шале для комфортного ночлега в горах.",
          uz: "Bu yerda menyu bo'yicha tayyor taomlar va oldindan buyurtma asosidagi ayrim taomlarni buyurtma qilish mumkin. Mustaqil ovqat tayyorlash uchun qozon va mangal ijarasi mavjud, shuningdek o'tin va ko'mir ham sotiladi. Hududda tog'larda qulay tunash uchun glamping va shale ham bor.",
          en: "You can order ready dishes from the menu, and some items by pre-order. For cooking your own, a kazan and a mangal are available to rent, and firewood and charcoal are sold on site. The grounds also have glamping cabins and chalets for a comfortable night in the mountains.",
        },
      },
      {
        title: { ru: "Для кого подходит", uz: "Kimlar uchun mos", en: "Who it suits" },
        body: {
          ru: "Локация подходит для семейного отдыха, дружеских встреч и корпоративных выездов. Разрешено привозить свои продукты и свой мангал, если соблюдаются нормы безопасности.",
          uz: "Maskan oilalar, do'stlar davrasi va korporativ tadbirlar uchun mos. Xavfsizlik qoidalariga amal qilgan holda o'z mahsulotlaringiz va o'z mangalingizni olib kelish mumkin.",
          en: "The location suits family days out, gatherings with friends and corporate outings. You are welcome to bring your own food and your own grill, provided safety rules are observed.",
        },
      },
    ],
  },
  {
    slug: "tubing",
    /**
     * NO TUBING PHOTOGRAPHY EXISTS.
     *
     * The `tubing` key in images.ts resolves to a night render of the master
     * plan, not a track — using it here would show guests a computer image of a
     * place they are paying to visit. Until the operator shoots the hill, the
     * archive carries the real surroundings instead, and the copy promises only
     * what those photos actually show.
     */
    image: "chimganMountains",
    gallery: ["chimganMountains", "mountainRidge", "galMountainView"],
    videos: [],
    title: { ru: "Тюбинг-горка", uz: "Tubing gorkasi", en: "Tubing hill" },
    eyebrow: {
      ru: "Круглый год",
      uz: "Yil davomida",
      en: "All year round",
    },
    lead: {
      ru: "Всесезонная трасса 150 метров с автоматическим подъёмом — работает круглый год, не только по снегу.",
      uz: "Avtomatik ko'targichli 150 metrlik butun mavsumga mo'ljallangan trassa — faqat qorda emas, yil davomida ishlaydi.",
      en: "A 150-metre all-season track with a powered lift — open year-round, not just on snow.",
    },
    description: {
      ru: "Трасса длиной 150 метров и шириной 6 метров, всесезонная — кататься можно круглый год. Подъём автоматический: наверх тюбинг поднимает обратной тягой, идти пешком в горку не нужно. Одновременно спускаться могут до 5 человек, внизу предусмотрена безопасная остановка. Все правила безопасности учтены в конструкции трассы. Тюбинг берётся пакетами: 2 или 4 прокатки, цена одинаковая в будни и в выходные. Вход на территорию бесплатный; для гостей тюбинга отдельно оплачивается парковочное место — за автомобиль.",
      uz: "Trassa uzunligi 150 metr, kengligi 6 metr, butun mavsumga mo'ljallangan — yil davomida uchish mumkin. Ko'tarilish avtomatik: tubingni yuqoriga teskari tortish ko'taradi, tepalikka piyoda chiqish shart emas. Bir vaqtning o'zida 5 kishigacha tusha oladi, pastda xavfsiz to'xtash joyi bor. Barcha xavfsizlik qoidalari trassa konstruksiyasida hisobga olingan. Tubing paketlar bilan olinadi: 2 yoki 4 marta uchish, narx ish kunlari va dam olish kunlarida bir xil. Hududga kirish bepul; tubing mehmonlari uchun parkovka joyi alohida — avtomobil uchun to'lanadi.",
      en: "The track is 150 metres long and 6 metres wide, and runs all year — not only in snow. The lift is powered: the tube is pulled back to the top, so nobody walks up. Up to 5 people can descend at once, and there is a controlled stop at the bottom. Safety requirements are built into the track itself. Tubing is sold in packages of 2 or 4 rides, at the same price on weekdays and weekends. Entry to the grounds is free; tubing visitors pay separately for a parking space, per car.",
    },
    highlights: {
      ru: [
        "Всесезонная трасса: 150 м длиной, 6 м шириной",
        "Автоматический подъём — пешком наверх идти не нужно",
        "До 5 человек спускаются одновременно",
        "Безопасная остановка внизу",
        "Пакеты: 2 или 4 прокатки, одна цена всю неделю",
        "Ватрушка выдаётся на месте",
      ],
      uz: [
        "Butun mavsumga trassa: 150 m uzunlik, 6 m kenglik",
        "Avtomatik ko'targich — piyoda chiqish shart emas",
        "Bir vaqtda 5 kishigacha tushadi",
        "Pastda xavfsiz to'xtash joyi",
        "Paketlar: 2 yoki 4 marta, butun hafta bir xil narx",
        "Tubing joyida beriladi",
      ],
      en: [
        "All-season track: 150 m long, 6 m wide",
        "Powered lift — nobody walks back up",
        "Up to 5 people descend at once",
        "Controlled stop at the bottom",
        "Packages of 2 or 4 rides, one price all week",
        "Tubes provided on site",
      ],
    },
  },
];

export function getDayProduct(slug: string): DayProduct | undefined {
  return dayProducts.find((p) => p.slug === slug);
}
