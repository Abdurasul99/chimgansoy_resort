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
      ru: "Зимняя активность",
      uz: "Qishki faoliyat",
      en: "Winter activity",
    },
    lead: {
      ru: "Спуск на ватрушке по укатанному склону — берётся пакетами прокаток, отдельно от проживания.",
      uz: "Qorli qiyalikdan tubingda uchish — uchishlar paketi bilan olinadi, yashashdan alohida.",
      en: "A ride down the packed slope on an inflatable tube — sold in packages of rides, separately from a stay.",
    },
    description: {
      ru: "Тюбинг берётся пакетами прокаток: 2 или 4 спуска. Цена одинаковая в будни и в выходные. Горка работает по снегу, поэтому конкретные даты заранее не обещаем — оставьте заявку, и администратор перезвонит и скажет, в каком состоянии трасса на выбранный вами день. Въезд на территорию оплачивается отдельно, за автомобиль.",
      uz: "Tubing uchishlar paketi bilan olinadi: 2 yoki 4 marta. Narx ish kunlari va dam olish kunlarida bir xil. Gorka qorga qarab ishlaydi, shuning uchun aniq sanalarni oldindan va'da qilmaymiz — ariza qoldiring, administrator qo'ng'iroq qilib, siz tanlagan kunda trassa qanday holatda ekanini aytadi. Hududga kirish alohida, avtomobil uchun to'lanadi.",
      en: "Tubing is sold in packages of rides: 2 or 4 descents, at the same price on weekdays and weekends. The hill runs on snow, so we do not promise specific dates in advance — send a request and the administrator will call back with the state of the track on your chosen day. Entry to the grounds is charged separately, per car.",
    },
    highlights: {
      ru: [
        "Пакеты: 2 или 4 прокатки",
        "Одна цена всю неделю",
        "Работает по снегу — дату подтверждает администратор",
        "Ватрушка выдаётся на месте",
      ],
      uz: [
        "Paketlar: 2 yoki 4 marta uchish",
        "Butun hafta bir xil narx",
        "Qorga qarab ishlaydi — sanani administrator tasdiqlaydi",
        "Tubing joyida beriladi",
      ],
      en: [
        "Packages: 2 or 4 rides",
        "One price all week",
        "Runs on snow — the administrator confirms your date",
        "Tubes provided on site",
      ],
    },
  },
];

export function getDayProduct(slug: string): DayProduct | undefined {
  return dayProducts.find((p) => p.slug === slug);
}
